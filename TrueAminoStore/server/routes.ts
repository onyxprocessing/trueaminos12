import type { Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, Product } from "@shared/schema";
import { z } from "zod";
// Import as ESM modules
import session from 'express-session';
import createMemoryStore from 'memorystore';
import fetch from 'node-fetch';
import path from 'path';
import { recordPaymentToAirtable } from './airtable-orders';
import { recordPaymentToDatabase } from './db-orders';
import { getAllOrders, getOrderById, countOrders, searchOrders } from './db-query';
import { createPaymentIntent, confirmPaymentIntent } from './stripe-controller';

// Define a new type that extends Express Request to include session
interface Request extends ExpressRequest {
  session: {
    id: string;
    cookie: any;
    regenerate: (callback: (err?: any) => void) => void;
    destroy: (callback: (err?: any) => void) => void;
    reload: (callback: (err?: any) => void) => void;
    save: (callback: (err?: any) => void) => void;
    touch: (callback: (err?: any) => void) => void;
  };
}

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
  const MemoryStoreSession = createMemoryStore(session);
  app.use(session({
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

  // Image proxy and optimization endpoint
  app.get("/api/image-proxy", async (req: Request, res: Response) => {
    // Forward to the image optimizer service
    const { optimizeAndServeImage } = await import('./image-optimizer');
    await optimizeAndServeImage(req, res);
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
  
  // Stripe payment routes
  app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
    try {
      const { amount, customerInfo, metadata } = req.body;
      
      if (!amount || !customerInfo) {
        return res.status(400).json({ message: "Amount and customer information are required" });
      }
      
      // Create a payment intent
      const clientSecret = await createPaymentIntent(
        req.session.id,
        amount,
        customerInfo,
        metadata || {}
      );
      
      res.json({ clientSecret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message
      });
    }
  });
  app.post('/api/confirm-payment', async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      // Confirm payment with Stripe
      const paymentIntent = await confirmPaymentIntent(paymentIntentId);
      
      res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        }
      });
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ 
        message: "Error confirming payment", 
        error: error.message
      });
    }
  });
  
  // FedEx address validation endpoint
  app.post('/api/validate-address', async (req: Request, res: Response) => {
    try {
      const { validateAddress } = await import('./fedex-address-validation');
      
      const { 
        streetLine1, 
        streetLine2, 
        city, 
        state, 
        zipCode, 
        country = 'US' 
      } = req.body;
      
      // Validate address using FedEx API
      const validationResult = await validateAddress({
        streetLine1,
        streetLine2,
        city,
        state,
        zipCode,
        country
      });
      
      if (!validationResult) {
        return res.status(500).json({ 
          success: false, 
          message: "Address validation service unavailable" 
        });
      }
      
      res.json({
        success: true,
        validation: validationResult
      });
    } catch (error: any) {
      console.error('Error validating address:', error);
      res.status(500).json({ 
        success: false, 
        message: `Error validating address: ${error.message}` 
      });
    }
  });
  
  // Flat rate shipping API endpoint
  app.post('/api/shipping-rates', async (req: Request, res: Response) => {
    try {
      // Get cart items to determine the shipping rate
      const sessionId = req.session.id;
      const cartItems = await storage.getCartItems(sessionId);
      console.log(`Found ${cartItems?.length || 0} cart items for session ${sessionId}`);
      
      if (!cartItems || cartItems.length === 0) {
        console.warn('Cart is empty for shipping rate request');
        return res.status(400).json({ 
          success: false, 
          message: 'Your cart is empty'
        });
      }
      
      // Calculate total item quantity
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      console.log(`Total item quantity: ${totalQuantity}`);
      
      // Determine flat rate shipping based on item quantity
      // $15 for 1-5 items, $25 for more than 5 items
      const shippingPrice = totalQuantity > 5 ? 25.00 : 15.00;
      
      // Create a single flat rate shipping option
      const flatRateShipping = {
        serviceType: 'USPS_FLAT_RATE',
        serviceName: 'Standard Shipping via USPS',
        transitTime: '1-2 business days',
        price: shippingPrice,
        currency: 'USD',
        isFlatRate: true
      };
      
      console.log(`Using flat rate shipping: $${shippingPrice.toFixed(2)}`);
      
      res.json({
        success: true,
        rates: [flatRateShipping],
        isFlatRate: true
      });
    } catch (error: any) {
      console.error('Error getting shipping rates:', error);
      res.status(500).json({ 
        success: false,
        message: `Error retrieving shipping rates: ${error.message}`
      });
    }
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
  
  // Stripe webhook endpoint to handle successful payments and record orders in Airtable
  app.post('/api/webhook', async (req: Request, res: Response) => {
    const event = req.body;
    
    // Verify this is a payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      console.log('📦 Received payment_intent.succeeded webhook');
      try {
        const paymentIntent = event.data.object;
        console.log('Payment intent ID:', paymentIntent.id);
        
        // Record the payment to Airtable with the specified fields
        const { recordPaymentToAirtable } = await import('./airtable-orders');
        const success = await recordPaymentToAirtable(paymentIntent);
        
        if (success) {
          console.log('✅ Successfully recorded order in Airtable');
          return res.json({ received: true, success: true });
        } else {
          console.error('❌ Failed to record order in Airtable');
          return res.json({ received: true, success: false, error: 'Failed to record order' });
        }
      } catch (error) {
        console.error('Error processing payment webhook:', error);
        return res.status(500).json({ received: true, success: false, error: 'Internal server error' });
      }
    } else {
      // For other event types, just acknowledge receipt
      console.log(`Received webhook event: ${event.type} - not processing`);
      return res.json({ received: true });
    }
  });
  
  // Admin API endpoints are defined here
  
  // Optimized image proxy endpoint for better performance
  app.get('/api/image-optimize', async (req, res) => {
    try {
      // Using dynamic import instead of require since we're in an ESM context
      const imageOptimizer = await import('./image-optimizer');
      return imageOptimizer.optimizeAndServeImage(req, res);
    } catch (error) {
      console.error('Error loading image optimizer:', error);
      return res.status(500).json({ message: 'Image optimization failed' });
    }
  });
  
  // Robots.txt route with proper content type
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
  });
  
  // Sitemap.xml route with proper content type
  app.get('/sitemap.xml', (_req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
  });
  
  // Initialize HTTP server
  const httpServer = createServer(app);
  
  // Configure server events
  httpServer.on('close', () => {
    console.log('Server shutting down');
  });
  
  return httpServer;
}