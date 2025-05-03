import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, Product } from "@shared/schema";
import { z } from "zod";
import session from 'express-session';
import MemoryStore from 'memorystore';
import fetch from 'node-fetch';
import Stripe from 'stripe';

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

// Helper function to proxy image requests to avoid CORS issues
async function proxyImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Stripe
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
  
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
  });
  // Set up session middleware for cart management
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: 'trueaminos-secret-key',
    resave: false,
    saveUninitialized: true,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  }));

  // Image proxy endpoint to resolve CORS issues with Airtable images
  app.get("/api/image-proxy", async (req: Request, res: Response) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Missing image URL parameter" });
      }
      
      // Validate URL to ensure it's from Airtable (security measure)
      if (!imageUrl.includes('airtableusercontent.com')) {
        return res.status(403).json({ message: "Invalid image source" });
      }
      
      console.log("Proxying image:", imageUrl);
      const imageBuffer = await proxyImage(imageUrl);
      
      if (!imageBuffer) {
        return res.status(404).json({ message: "Failed to fetch image" });
      }
      
      // Set appropriate headers
      res.set({
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Type': 'image/png', // Default to PNG
      });
      
      // Send the image data
      res.send(imageBuffer);
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

  // Stripe Payment Endpoints
  
  // Create Payment Intent API
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const sessionId = req.session.id;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Your cart is empty" });
      }
      
      // Calculate the total amount from cart
      let amount = cartItems.reduce((sum, item) => 
        sum + getPriceByWeight(item.product, item.selectedWeight) * item.quantity, 0);
      
      // Allow override of amount from client (e.g., when shipping is included)
      if (req.body && req.body.amount) {
        console.log('Using client-provided amount:', req.body.amount);
        amount = parseFloat(req.body.amount);
      }
      
      // Create description containing the items ordered
      const description = `Order from TrueAminos: ${cartItems.map(item => 
        `${item.product.name} (${item.selectedWeight || ''}) x${item.quantity}`
      ).join(', ')}`;
      
      console.log('Creating payment intent for amount:', amount);
      
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        currency: "usd",
        description,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          session_id: sessionId,
          shipping_method: req.body.shipping_method || 'standard'
        },
      });
      
      // Save the payment intent ID to the session
      req.session.paymentIntentId = paymentIntent.id;
      
      // Send publishable key and PaymentIntent details to client
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        itemCount: cartItems.length
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message 
      });
    }
  });
  
  // Endpoint to update an existing payment intent amount (without requiring a new form)
  app.post("/api/update-payment-intent", async (req: Request, res: Response) => {
    try {
      const sessionId = req.session.id;
      const paymentIntentId = req.session.paymentIntentId;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "No payment intent to update. Please go back to cart and try again." });
      }
      
      // Get amount from request body
      let amount = req.body.amount;
      if (!amount) {
        // Fallback to calculate from cart if no amount provided
        const cartItems = await storage.getCartItems(sessionId);
        amount = cartItems.reduce((sum, item) => 
          sum + getPriceByWeight(item.product, item.selectedWeight) * item.quantity, 0);
      }
      
      console.log('Updating payment intent amount:', amount);
      
      // Update the existing payment intent with the new amount
      await stripe.paymentIntents.update(paymentIntentId, {
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        metadata: {
          session_id: sessionId,
          shipping_method: req.body.shipping_method || 'standard'
        }
      });
      
      res.json({ success: true, amount });
    } catch (error: any) {
      console.error('Error updating payment intent:', error);
      res.status(500).json({ 
        message: "Error updating payment intent", 
        error: error.message 
      });
    }
  });
  
  // Stripe webhook handling for completed payments
  app.post('/api/webhook', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
      if (endpointSecret) {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          endpointSecret
        );
      } else {
        // No signature verification if webhook secret is not set
        event = req.body;
        console.warn('⚠️ Webhook signature verification disabled! Set STRIPE_WEBHOOK_SECRET to enable.');
      }
      
      // Handle specific event types
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
        
        // Here we would typically:
        // 1. Record the order in a database
        // 2. Send confirmation email
        // 3. Clear the user's cart
        const sessionId = paymentIntent.metadata.session_id;
        if (sessionId) {
          // Clear the cart associated with this session
          await storage.clearCart(sessionId);
        }
      } else {
        console.log(`Unhandled event type: ${event.type}`);
      }
      
      // Return a response to acknowledge receipt of the event
      res.json({ received: true });
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Initialize HTTP server
  const httpServer = createServer(app);
  return httpServer;
}