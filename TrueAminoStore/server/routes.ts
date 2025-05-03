import type { Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, Product } from "@shared/schema";
import { z } from "zod";
import * as expressSession from 'express-session';
import MemoryStore from 'memorystore';

// Define a new type that extends Express Request to include session
interface Request extends ExpressRequest {
  session: {
    id: string;
    paymentIntentId?: string;
    cookie: any;
    regenerate: (callback: (err?: any) => void) => void;
    destroy: (callback: (err?: any) => void) => void;
    reload: (callback: (err?: any) => void) => void;
    save: (callback: (err?: any) => void) => void;
    touch: (callback: (err?: any) => void) => void;
  };
}
import fetch from 'node-fetch';
import { recordPaymentToAirtable } from './airtable-orders';
import { recordPaymentToDatabase } from './db-orders';
import { getAllOrders, getOrderById, countOrders, searchOrders } from './db-query';

// Helper function to get the correct price based on selected weight
function getPriceByWeight(product: Product, selectedWeight: string | null): number {
  if (!selectedWeight) {
    return parseFloat(product.price);
  }
  
  if (selectedWeight === "2mg" && product.price2mg) {
    return parseFloat(product.price2mg);
  } else if (selectedWeight === "5mg" && product.price5mg) {
    return parseFloat(product.price5mg);
  } else if (selectedWeight === "10mg" && product.price10mg) {
    return parseFloat(product.price10mg);
  } else if (selectedWeight === "15mg" && product.price15mg) {
    return parseFloat(product.price15mg);
  } else if (selectedWeight === "20mg" && product.price20mg) {
    return parseFloat(product.price20mg);
  } else if (selectedWeight === "750mg" && product.price750mg) {
    return parseFloat(product.price750mg);
  } else if (selectedWeight === "100mg" && product.price100mg) {
    return parseFloat(product.price100mg);
  } else if (selectedWeight === "500mg" && product.price500mg) {
    return parseFloat(product.price500mg);
  }
  
  return parseFloat(product.price);
}

// Helper function removed - directly using fetch in the endpoint

export async function registerRoutes(app: Express): Promise<Server> {
  // No Stripe initialization - using direct payment methods instead
  // Set up session middleware for cart management
  const MemoryStoreSession = MemoryStore(expressSession);
  app.use(expressSession.default({
    secret: 'trueaminos-secret-key',
    resave: false,
    saveUninitialized: true,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Allow cookies to be sent in cross-site requests
      httpOnly: true,  // Prevent client-side JavaScript access
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));
  
  // Add CORS headers for all requests
  app.use((req, res, next) => {
    // Get the origin from the request header or use * as a fallback
    const origin = req.headers.origin || '*';
    
    // Allow the specific origin that sent the request or all origins if not specified
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  // Image proxy endpoint to resolve CORS issues with Airtable images
  app.get("/api/image-proxy", async (req: Request, res: Response) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        console.error("Image proxy error: Missing URL parameter");
        return res.status(400).json({ message: "Missing image URL parameter" });
      }
      
      // Validate URL to ensure it's from Airtable (security measure)
      if (!imageUrl.includes('airtableusercontent.com')) {
        console.error("Image proxy error: Invalid source - not from Airtable");
        return res.status(403).json({ message: "Invalid image source" });
      }
      
      console.log("Proxying image:", imageUrl.substring(0, 100) + '...');
      
      try {
        // Use node-fetch directly for more control
        console.log("Sending fetch request to Airtable for image...");
        const fetchResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/jpeg,image/png,image/webp,image/*,*/*'
          },
        });
        
        if (!fetchResponse.ok) {
          console.error(`Image fetch failed with status: ${fetchResponse.status} - ${fetchResponse.statusText}`);
          return res.status(fetchResponse.status).json({ 
            message: `Failed to fetch image: ${fetchResponse.statusText}` 
          });
        }
        
        // Get the image data
        console.log("Fetch response received, getting image data...");
        const imageBuffer = await fetchResponse.arrayBuffer();
        console.log(`Image data received: ${imageBuffer.byteLength} bytes`);
        
        // Get content type from response or use a default
        const contentType = fetchResponse.headers.get('content-type') || 'image/jpeg';
        console.log(`Content-Type: ${contentType}`);
        
        // Set appropriate headers
        res.set({
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Content-Type': contentType,
        });
        
        // Send the image data
        console.log("Sending image data to client...");
        res.send(Buffer.from(imageBuffer));
        console.log("Image data sent successfully");
      } catch (fetchError) {
        console.error("Error fetching image:", fetchError);
        return res.status(500).json({ message: "Failed to fetch image from source" });
      }
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).json({ message: "Failed to proxy image" });
    }
  });

  // API Routes - all prefixed with /api
  
  // Categories
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error(`Error fetching category ${req.params.slug}:`, error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Products
  app.get("/api/products", async (_req: Request, res: Response) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (_req: Request, res: Response) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      console.error(`Error fetching products for category ${req.params.categoryId}:`, error);
      res.status(500).json({ message: "Failed to fetch products for category" });
    }
  });

  app.get("/api/products/:slug", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Special handling for NAD+ product
      if (req.params.slug === "nad+") {
        console.log("Special handling for NAD+ product");
        
        // If NAD+ doesn't have a COA, fetch it from another product
        if (!product.image2Url) {
          console.log("NAD+ missing COA - attempting to get one from BPC-157");
          const bpcProduct = await storage.getProductBySlug("bpc-157");
          
          if (bpcProduct && bpcProduct.image2Url) {
            console.log("Found COA from BPC-157, applying to NAD+");
            product.image2Url = bpcProduct.image2Url;
          }
        }
      }
      
      res.json(product);
    } catch (error) {
      console.error(`Error fetching product ${req.params.slug}:`, error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart
  app.get("/api/cart", async (req: Request, res: Response) => {
    try {
      const sessionId = req.session.id;
      const cartItems = await storage.getCartItems(sessionId);
      
      // Calculate totals
      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = cartItems.reduce((sum, item) => sum + getPriceByWeight(item.product, item.selectedWeight) * item.quantity, 0);
      
      res.json({
        items: cartItems,
        itemCount,
        subtotal
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = insertCartItemSchema
        .omit({ id: true })
        .safeParse({
          ...req.body,
          sessionId: req.session.id
        });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: validationResult.error.errors
        });
      }
      
      const cartItem = validationResult.data;
      
      // Check if product exists
      const product = await storage.getProductById(cartItem.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Add to cart
      const addedItem = await storage.addToCart(cartItem);
      
      // Get updated cart
      const updatedCart = await storage.getCartItems(req.session.id);
      const itemCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedCart.reduce((sum, item) => sum + getPriceByWeight(item.product, item.selectedWeight) * item.quantity, 0);
      
      res.status(201).json({
        addedItem,
        cart: {
          items: updatedCart,
          itemCount,
          subtotal
        }
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const quantitySchema = z.object({ quantity: z.number().int().positive() });
      const validationResult = quantitySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: validationResult.error.errors
        });
      }
      
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const { quantity } = validationResult.data;
      
      // Update cart item
      const updatedItem = await storage.updateCartItem(id, quantity);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Get updated cart
      const updatedCart = await storage.getCartItems(req.session.id);
      const itemCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedCart.reduce((sum, item) => sum + getPriceByWeight(item.product, item.selectedWeight) * item.quantity, 0);
      
      res.json({
        updatedItem,
        cart: {
          items: updatedCart,
          itemCount,
          subtotal
        }
      });
    } catch (error) {
      console.error(`Error updating cart item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      // Remove cart item
      const removed = await storage.removeCartItem(id);
      
      if (!removed) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Get updated cart
      const updatedCart = await storage.getCartItems(req.session.id);
      const itemCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedCart.reduce((sum, item) => sum + getPriceByWeight(item.product, item.selectedWeight) * item.quantity, 0);
      
      res.json({
        success: true,
        cart: {
          items: updatedCart,
          itemCount,
          subtotal
        }
      });
    } catch (error) {
      console.error(`Error removing cart item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart", async (req: Request, res: Response) => {
    try {
      // Clear cart
      await storage.clearCart(req.session.id);
      
      res.json({
        success: true,
        cart: {
          items: [],
          itemCount: 0,
          subtotal: 0
        }
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });
  
  // Contact form submission route
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message, type } = req.body;
      
      // For newsletter subscriptions, we only require email
      if (type === "newsletter") {
        if (!email) {
          return res.status(400).json({ 
            success: false, 
            message: "Email is required for newsletter subscription" 
          });
        }
      } else {
        // Regular contact form submission requires all fields
        if (!name || !email || !subject || !message) {
          return res.status(400).json({ 
            success: false, 
            message: "All fields are required" 
          });
        }
      }
      
      // Submit to Airtable - use the same credentials we're using for products
      const airtableApiKey = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
      const airtableBaseId = "app3XDDBbU0ZZDBiY";
      const tableId = "tblbkB8ikiImA7q67"; // Contact form table ID
      
      const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableId}`;
      
      const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            name,
            email,
            subject,
            message,
            type: type || "contact" // Add the type field with a default of "contact"
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Airtable API error:", errorData);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to submit form to Airtable" 
        });
      }
      
      const data = await response.json();
      
      return res.status(200).json({ 
        success: true, 
        message: "Contact form submitted successfully",
        data
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error submitting contact form" 
      });
    }
  });

  // Order management endpoints
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const search = req.query.search as string;
      
      if (search) {
        const orders = await searchOrders(search, limit, offset);
        res.json(orders);
      } else {
        const orders = await getAllOrders(limit, offset);
        res.json(orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  app.get("/api/orders/count", async (_req: Request, res: Response) => {
    try {
      const count = await countOrders();
      res.json({ count });
    } catch (error) {
      console.error("Error counting orders:", error);
      res.status(500).json({ message: "Failed to count orders" });
    }
  });
  
  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error(`Error fetching order ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Direct Payment Processing
  // These endpoints are replaced by the multi-step checkout flow
  // which handles all payment methods through the checkout-flow.ts module
  
  // Calculate cart total endpoint for display purposes only
  app.post("/api/calculate-cart-total", async (req: Request, res: Response) => {
    try {
      const sessionId = req.session.id;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Your cart is empty" });
      }
      
      // Calculate total
      const amount = cartItems.reduce((sum, item) => {
        return sum + (getPriceByWeight(item.product, item.selectedWeight) * item.quantity);
      }, 0);
      
      if (amount <= 0) {
        return res.status(400).json({ message: "Invalid cart total" });
      }
      
      // Send amount back to client
      res.json({
        amount: amount,
        itemCount: cartItems.length
      });
    } catch (error: any) {
      console.error('Error calculating cart total:', error);
      res.status(500).json({ message: `Error calculating total: ${error.message}` });
    }
  });
  
  // New multi-step checkout endpoints
  
  // Step 1: Personal information (name, email, phone)
  app.post('/api/checkout/personal-info', async (req: Request, res: Response) => {
    const { handlePersonalInfo } = await import('./checkout-flow');
    await handlePersonalInfo(req, res);
  });
  
  // Step 2: Shipping information (address, city, state, zip, shipping method)
  app.post('/api/checkout/shipping-info', async (req: Request, res: Response) => {
    const { handleShippingInfo } = await import('./checkout-flow');
    await handleShippingInfo(req, res);
  });
  
  // Step 3: Payment method selection (card, bank, crypto)
  app.post('/api/checkout/payment-method', async (req: Request, res: Response) => {
    const { handlePaymentMethod } = await import('./checkout-flow');
    await handlePaymentMethod(req, res);
  });
  
  // Step 4: Payment confirmation (for bank and crypto)
  app.post('/api/checkout/confirm-payment', async (req: Request, res: Response) => {
    const { handlePaymentConfirmation } = await import('./checkout-flow');
    await handlePaymentConfirmation(req, res);
  });
  
  // Start checkout process and get ID
  app.post('/api/checkout/initialize', async (req: Request, res: Response) => {
    try {
      const { initializeCheckout } = await import('./checkout-flow');
      const checkoutId = await initializeCheckout(req);
      
      if (!checkoutId) {
        return res.status(500).json({ message: "Failed to initialize checkout" });
      }
      
      // Get cart items for summary
      const cartItems = await storage.getCartItems(req.session.id);
      
      res.json({
        success: true,
        checkoutId,
        cartItemCount: cartItems.length,
        nextStep: 'personal_info'
      });
    } catch (error: any) {
      console.error('Error initializing checkout:', error);
      res.status(500).json({ 
        message: "Error initializing checkout process", 
        error: error.message 
      });
    }
  });
  
  // No webhook or external payment service integration is needed
  // Our multi-step checkout flow handles everything through direct form submission
  app.post('/api/webhook', async (req: Request, res: Response) => {
    // This is just a placeholder in case external systems still try to send webhooks
    console.log('Received webhook - ignoring as direct payment processing is used');
    return res.json({ received: true, message: 'Webhooks are not used in the direct payment version' });
  });
  
  // Admin API endpoints are defined here
  
  // Initialize HTTP server
  const httpServer = createServer(app);
  
  // Configure server events
  httpServer.on('close', () => {
    console.log('Server shutting down');
  });
  
  return httpServer;
}