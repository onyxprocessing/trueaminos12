import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, Product } from "@shared/schema";
import { z } from "zod";
import session from 'express-session';
import MemoryStore from 'memorystore';
import fetch from 'node-fetch';
import Stripe from 'stripe';
import { recordPaymentToAirtable } from './airtable-orders';
import { recordPaymentToDatabase } from './db-orders';
import { setupStripeTest } from './test-stripe';

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
  // Initialize Stripe
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
  
  console.log('Initializing Stripe with key starting with:', stripeSecretKey.substring(0, 8) + '...');
  
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
  });
  
  // Register Stripe test endpoints
  setupStripeTest(app);
  console.log('✅ Stripe test endpoints registered successfully');
  
  // Test Stripe connection
  try {
    // Make a test API call to verify the API key is working
    stripe.paymentMethods.list({ limit: 1 })
      .then(() => {
        console.log('✅ Stripe API key is valid and working!');
      })
      .catch(err => {
        console.error('❌ Stripe API key validation failed:', err.message);
      });
  } catch (err: any) {
    console.error('Error testing Stripe connection:', err.message);
  }
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
        return res.status(400).json({ message: "Missing image URL parameter" });
      }
      
      // Validate URL to ensure it's from Airtable (security measure)
      if (!imageUrl.includes('airtableusercontent.com')) {
        return res.status(403).json({ message: "Invalid image source" });
      }
      
      console.log("Proxying image:", imageUrl.substring(0, 100) + '...');
      
      try {
        // Use node-fetch directly for more control
        const fetchResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
        });
        
        if (!fetchResponse.ok) {
          console.error(`Image fetch failed with status: ${fetchResponse.status}`);
          return res.status(fetchResponse.status).json({ 
            message: `Failed to fetch image: ${fetchResponse.statusText}` 
          });
        }
        
        // Get the image data
        const imageBuffer = await fetchResponse.arrayBuffer();
        
        // Get content type from response or use a default
        const contentType = fetchResponse.headers.get('content-type') || 'image/jpeg';
        
        // Set appropriate headers
        res.set({
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Content-Type': contentType,
        });
        
        // Send the image data
        res.send(Buffer.from(imageBuffer));
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

  // Stripe Payment Endpoints
  
  // Create Payment Intent API
  app.post("/api/create-payment-intent", async (req: Request, res: Response) => {
    try {
      console.log('💳 Creating payment intent - request received');
      console.log('  Request cookies:', req.headers.cookie);
      console.log('  Request content-type:', req.headers['content-type']);
      console.log('  Origin:', req.headers.origin);
      
      // Make sure session is saved before proceeding
      if (!req.session.id) {
        console.log('⚠️ No session ID available, generating a new session');
      }
      
      const sessionId = req.session.id;
      console.log('  Session ID:', sessionId);
      
      // Force session to be saved
      await new Promise<void>((resolve) => {
        req.session.save(() => {
          console.log('  Session saved with ID:', sessionId);
          resolve();
        });
      });
      
      // Handle case where body includes cart items directly
      let cartItems;
      if (req.body && req.body.cartItems && Array.isArray(req.body.cartItems) && req.body.cartItems.length > 0) {
        console.log('  Using cart items from request body instead of session');
        cartItems = req.body.cartItems;
      } else {
        // Get cart items from storage based on session ID
        cartItems = await storage.getCartItems(sessionId);
      }
      
      console.log(`  Cart has ${cartItems.length} items`);
      console.log('  Cart items:', JSON.stringify(cartItems.map(item => ({
        id: item.id,
        product_id: item.productId,
        product_name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        weight: item.selectedWeight || 'standard'
      })), null, 2));
      
      if (cartItems.length === 0) {
        console.log('❌ Cannot create payment intent: Cart is empty');
        return res.status(400).json({ message: "Your cart is empty" });
      }
      
      // Calculate the total amount from cart
      let amount = cartItems.reduce((sum, item) => {
        const price = item.product ? 
          getPriceByWeight(item.product, item.selectedWeight) : 
          (item.price || 0);
        return sum + price * item.quantity;
      }, 0);
      
      console.log(`  Calculated cart amount: $${amount.toFixed(2)}`);
      
      // Allow override of amount from client (e.g., when shipping is included)
      if (req.body && req.body.amount) {
        console.log('  Using client-provided amount:', req.body.amount);
        amount = parseFloat(req.body.amount);
      }
      
      // Create description containing the items ordered
      const description = `Order from TrueAminos: ${cartItems.map(item => 
        `${item.product.name} (${item.selectedWeight || ''}) x${item.quantity}`
      ).join(', ')}`;
      
      console.log(`  Creating payment intent for amount: $${amount.toFixed(2)}`);
      console.log(`  Description: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`);
      
      // Extract customer data from request body if available
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        shipping_method
      } = req.body;
      
      if (firstName || lastName || email) {
        console.log(`  Customer: ${firstName || ''} ${lastName || ''} (${email || 'no email'})`);
      }
      
      // Create a payment intent creation params object
      const params: any = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        description,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          session_id: sessionId,
          shipping_method: shipping_method || 'standard'
        }
      };
      
      // Create a compact order summary for metadata (Stripe limit is 500 characters)
      const orderSummary = {
        customer: `${firstName || ''} ${lastName || ''}`.trim(),
        email: email || '',
        items: cartItems.map(item => ({
          id: item.product.id,
          name: item.product.name.substring(0, 20), // Limit name length
          qty: item.quantity,
          weight: item.selectedWeight || null
        })),
        shipping: shipping_method || 'standard'
      };
      
      // Store this compact order summary
      params.metadata.orderSummary = JSON.stringify(orderSummary);
      
      // Add customer info to metadata if provided
      if (firstName || lastName) {
        params.metadata.customer_name = `${firstName || ''} ${lastName || ''}`.trim();
      }
      
      if (email) {
        params.metadata.customer_email = email;
        
        // Only add receipt_email for valid emails
        if (email.trim() !== '' && email.includes('@')) {
          params.receipt_email = email;
        }
      }
      
      if (phone) {
        params.metadata.customer_phone = phone;
      }
      
      // Add shipping information if possible
      if (firstName && address) {
        params.shipping = {
          name: `${firstName} ${lastName || ''}`.trim(),
          address: {
            line1: address || '',
            city: city || '',
            state: state || '',
            postal_code: zipCode || '',
            country: 'US',
          }
        };
        
        if (phone) {
          params.shipping.phone = phone;
        }
      }
      
      // Log the parameters we're sending to Stripe (with sensitive data redacted)
      const paramsForLogging = { ...params };
      if (paramsForLogging.receipt_email) paramsForLogging.receipt_email = '[REDACTED]';
      if (paramsForLogging.shipping?.phone) paramsForLogging.shipping.phone = '[REDACTED]';
      console.log('  Payment intent params:', JSON.stringify(paramsForLogging, null, 2));
      
      console.log('  Calling stripe.paymentIntents.create()...');
      // Create the payment intent
      const paymentIntent = await stripe.paymentIntents.create(params);
      console.log(`  ✅ Payment intent created: ${paymentIntent.id}`);
      
      // Save the payment intent ID to the session
      req.session.paymentIntentId = paymentIntent.id;
      console.log(`  Payment intent ID saved to session: ${paymentIntent.id}`);
      
      // Send details to client
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        itemCount: cartItems.length
      });
      console.log(`  Response sent to client with client_secret: ${paymentIntent.client_secret ? 'present' : 'missing!'}`);
      console.log('💳 Payment intent creation completed successfully');
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      // Log more detailed error information
      if (error.type) {
        console.error('Stripe error type:', error.type);
      }
      if (error.raw) {
        console.error('Stripe raw error:', error.raw);
      }
      
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message,
        details: error.type || 'Unknown error type'
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
      
      // Extract customer data from request body if available
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        shipping_method
      } = req.body;
      
      // Get the cart items for this session
      const cartItems = await storage.getCartItems(sessionId);
      
      // Build the update options
      const updateOptions: any = {
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        metadata: {
          session_id: sessionId,
          shipping_method: shipping_method || req.body.shipping_method || 'standard'
        }
      };
      
      // Only add receipt_email for valid emails
      if (email && email.trim() !== '' && email.includes('@')) {
        updateOptions.receipt_email = email;
      }
      
      // Add shipping information if provided
      if (firstName && address) {
        updateOptions.shipping = {
          name: `${firstName} ${lastName || ''}`.trim(),
          address: {
            line1: address || '',
            city: city || '',
            state: state || '',
            postal_code: zipCode || '',
            country: 'US',
          },
          phone: phone || '',
        };
      }
      
      // Create customer info object for order processing
      const customerInfo = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || ''
      };
      
      // Store minimal order details in metadata (Stripe has a 500 character limit)
      // Save only essential information for order processing
      const orderSummary = {
        customer: `${firstName || ''} ${lastName || ''}`.trim(),
        email: email || '',
        items: cartItems.map(item => ({
          id: item.productId,
          name: item.product.name.substring(0, 20), // Limit length
          qty: item.quantity,
          weight: item.selectedWeight || null
        })),
        shipping: shipping_method || 'standard'
      };
      
      // Store this compact order summary
      updateOptions.metadata.orderSummary = JSON.stringify(orderSummary);
      
      // Add customer metadata if provided
      if (firstName || lastName || email || phone) {
        updateOptions.metadata.customer_name = firstName && lastName ? `${firstName} ${lastName}` : '';
        updateOptions.metadata.customer_email = email || '';
        updateOptions.metadata.customer_phone = phone || '';
      }
      
      // Update the existing payment intent with the new data
      await stripe.paymentIntents.update(paymentIntentId, updateOptions);
      
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
    let rawBody = '';
    
    // For raw body parsing
    if (req.body instanceof Buffer) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }
    
    try {
      console.log('📡 Received webhook from Stripe', { hasSignature: !!sig });
      
      if (endpointSecret && sig) {
        // Verify webhook signature
        try {
          event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            endpointSecret
          );
          console.log('✅ Webhook signature verified');
        } catch (err: any) {
          console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        // No signature verification if webhook secret is not set
        event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
        console.warn('⚠️ Webhook signature verification disabled! Set STRIPE_WEBHOOK_SECRET to enable.');
      }
      
      // Print detailed event information for debugging
      console.log(`📌 Processing Stripe event: ${event.type}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   API Version: ${event.api_version}`);
      
      // Handle specific event types
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
        console.log(`   Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
        console.log(`   Metadata: ${JSON.stringify(paymentIntent.metadata)}`);
        
        // Manually process the payment success
        await processPaymentSuccess(paymentIntent);
        
        // Return a response to acknowledge receipt of the event
        return res.json({ received: true, processed: true });
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const error = paymentIntent.last_payment_error;
        
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        if (error) {
          console.log(`   Error type: ${error.type}`);
          console.log(`   Error code: ${error.code}`);
          console.log(`   Error message: ${error.message}`);
        }
        
        // Record failed payment for analytics purposes
        // In the future, we might want to implement recovery emails or retry workflows
      } else if (event.type === 'charge.succeeded') {
        const charge = event.data.object;
        console.log(`💳 Charge succeeded: ${charge.id} for payment ${charge.payment_intent}`);
        
        if (charge.payment_intent) {
          // Get the payment intent details
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
            console.log(`💳 Retrieved payment intent: ${paymentIntent.id}`);
            
            // Process the payment success for the charge too
            await processPaymentSuccess(paymentIntent);
          } catch (error) {
            console.error(`Error retrieving payment intent for charge ${charge.id}:`, error);
          }
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
  
  // Function to process successful payments
  async function processPaymentSuccess(paymentIntent: any) {
    console.log(`🔄 Processing payment success: ${paymentIntent.id}`);
    
    // 1. Record the order in Airtable and Database
    try {
      // Store in Airtable
      console.log(`📝 Storing order in Airtable for payment: ${paymentIntent.id}`);
      const successAirtable = await recordPaymentToAirtable(paymentIntent);
      if (successAirtable) {
        console.log(`✅ Order recorded in Airtable for payment: ${paymentIntent.id}`);
      } else {
        console.error(`❌ Failed to record order in Airtable for payment: ${paymentIntent.id}`);
      }
      
      // Store in Database
      console.log(`📝 Storing order in Database for payment: ${paymentIntent.id}`);
      const successDatabase = await recordPaymentToDatabase(paymentIntent);
      if (successDatabase) {
        console.log(`✅ Order recorded in Database for payment: ${paymentIntent.id}`);
      } else {
        console.error(`❌ Failed to record order in Database for payment: ${paymentIntent.id}`);
      }
    } catch (error) {
      console.error(`Error recording order for payment ${paymentIntent.id}:`, error);
    }
    
    // 2. Clear the user's cart if session ID is available
    const sessionId = paymentIntent.metadata?.session_id;
    if (sessionId) {
      try {
        console.log(`🧹 Clearing cart for session: ${sessionId}`);
        await storage.clearCart(sessionId);
        console.log(`✅ Cart cleared for session: ${sessionId}`);
      } catch (error) {
        console.error(`Error clearing cart for session ${sessionId}:`, error);
      }
    } else {
      console.log(`⚠️ No session ID found in payment intent metadata`);
    }
    
    return true;
  }

  // Register test Stripe endpoints for debugging
  try {
    // Import dynamically since this is a TypeScript module
    import('./test-stripe').then(module => {
      module.setupStripeTest(app);
      console.log('✅ Stripe test endpoints registered successfully');
    }).catch(error => {
      console.error('Failed to import test-stripe module:', error);
    });
  } catch (error) {
    console.error('Failed to register Stripe test endpoints:', error);
  }
  
  // Initialize HTTP server
  const httpServer = createServer(app);
  return httpServer;
}