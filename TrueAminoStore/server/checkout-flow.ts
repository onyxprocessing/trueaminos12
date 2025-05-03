/**
 * Checkout flow handler
 * This module manages the multi-step checkout process
 * Step 1: Personal information (first name, last name, email, phone)
 * Step 2: Shipping information (address, city, state, zip, shipping method)
 * Step 3: Payment method selection (card, bank, crypto)
 * Step 4: Payment processing
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';
import { 
  createCheckoutInAirtable, 
  updateCheckoutInAirtable, 
  markCheckoutCompleted 
} from './airtable-checkout';
import { createOrderWithPaymentMethod } from './db-direct-order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function initializeCheckout(req: Request): Promise<string> {
  // Create a checkout ID if one doesn't exist
  if (!req.session.checkoutId) {
    const checkoutId = await createCheckoutInAirtable(req.session.id);
    if (checkoutId) {
      req.session.checkoutId = checkoutId;
      req.session.checkoutStep = 'started';
      await req.session.save();
    }
    return checkoutId;
  }
  return req.session.checkoutId;
}

/**
 * Handle personal information submission (step 1)
 */
export async function handlePersonalInfo(req: Request, res: Response) {
  try {
    // Initialize checkout if needed
    const checkoutId = await initializeCheckout(req);
    if (!checkoutId) {
      return res.status(500).json({ message: "Failed to initialize checkout" });
    }

    // Extract personal data from request body
    const {
      firstName,
      lastName,
      email,
      phone,
    } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "Missing required fields: first name and last name are required" });
    }
    
    // Store in session for later use
    req.session.personalInfo = {
      firstName,
      lastName,
      email: email || '',
      phone: phone || '',
    };
    
    // Update checkout step
    req.session.checkoutStep = 'personal_info';
    await req.session.save();
    
    // Update in Airtable
    await updateCheckoutInAirtable(checkoutId, {
      firstName,
      lastName,
      email: email || '',
      phone: phone || '',
      status: 'personal_info',
      updatedAt: new Date().toISOString()
    });
    
    // Get cart items for cart summary
    const cartItems = await storage.getCartItems(req.session.id);
    
    res.json({
      success: true,
      checkoutId,
      step: 'personal_info',
      nextStep: 'shipping_info',
      cartItemCount: cartItems.length,
    });
  } catch (error: any) {
    console.error('Error processing personal information:', error);
    res.status(500).json({ 
      message: "Error saving personal information", 
      error: error.message 
    });
  }
}

/**
 * Handle shipping information submission (step 2)
 */
export async function handleShippingInfo(req: Request, res: Response) {
  try {
    // Check if personal info step is completed
    if (!req.session.personalInfo) {
      return res.status(400).json({ message: "Please complete personal information first" });
    }
    
    // Extract shipping data from request body
    const {
      address,
      city,
      state,
      zipCode,
      shippingMethod
    } = req.body;
    
    // Validate required fields
    if (!address || !city || !state || !zipCode || !shippingMethod) {
      return res.status(400).json({ message: "Missing required shipping fields" });
    }
    
    // Store in session for later use
    req.session.shippingInfo = {
      address,
      city,
      state,
      zip: zipCode,
      shippingMethod
    };
    
    // Update checkout step
    req.session.checkoutStep = 'shipping_info';
    await req.session.save();
    
    // Update in Airtable
    if (req.session.checkoutId) {
      await updateCheckoutInAirtable(req.session.checkoutId, {
        address,
        city,
        state,
        zip: zipCode,
        shippingMethod,
        status: 'shipping_info',
        updatedAt: new Date().toISOString()
      });
    }
    
    // Calculate cart total for next step
    const cartItems = await storage.getCartItems(req.session.id);
    
    // Calculate total amount using the helper function
    const cartTotal = calculateCartTotal(cartItems);
    
    res.json({
      success: true,
      step: 'shipping_info',
      nextStep: 'payment_method',
      cartTotal,
      itemCount: cartItems.length,
    });
  } catch (error: any) {
    console.error('Error processing shipping information:', error);
    res.status(500).json({ 
      message: "Error saving shipping information", 
      error: error.message 
    });
  }
}

/**
 * Handle payment method selection (step 3)
 */
export async function handlePaymentMethod(req: Request, res: Response) {
  try {
    // Check if previous steps are completed
    if (!req.session.personalInfo || !req.session.shippingInfo) {
      return res.status(400).json({ 
        message: "Please complete personal and shipping information first" 
      });
    }
    
    const { paymentMethod } = req.body;
    
    // Validate payment method
    if (!paymentMethod || !['card', 'bank', 'crypto'].includes(paymentMethod)) {
      return res.status(400).json({ 
        message: "Invalid payment method. Please choose card, bank, or crypto." 
      });
    }
    
    // Update checkout step
    req.session.checkoutStep = 'payment_selection';
    await req.session.save();
    
    // Update in Airtable
    if (req.session.checkoutId) {
      await updateCheckoutInAirtable(req.session.checkoutId, {
        status: 'payment_selection',
        updatedAt: new Date().toISOString()
      });
    }
    
    // Get cart items and calculate amount
    const cartItems = await storage.getCartItems(req.session.id);
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }
    
    const amount = calculateCartTotal(cartItems);
    
    // Return different responses based on payment method
    if (paymentMethod === 'card') {
      // For card payments, create a payment intent with Stripe
      const params: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          session_id: req.session.id,
          checkout_id: req.session.checkoutId || '',
          shipping_method: req.session.shippingInfo.shippingMethod
        }
      };
      
      // Create a compact order summary
      const orderSummary = {
        customer: `${req.session.personalInfo.firstName} ${req.session.personalInfo.lastName}`,
        email: req.session.personalInfo.email || '',
        items: cartItems.map(item => ({
          id: item.productId,
          name: item.product.name.substring(0, 20), // Limit length
          qty: item.quantity,
          weight: item.selectedWeight || null
        })),
        shipping: req.session.shippingInfo.shippingMethod
      };
      
      // Store order summary in metadata
      if (params.metadata) {
        params.metadata.orderSummary = JSON.stringify(orderSummary);
        
        // Add customer info to metadata
        params.metadata.customer_name = `${req.session.personalInfo.firstName} ${req.session.personalInfo.lastName}`;
        params.metadata.customer_email = req.session.personalInfo.email || '';
        params.metadata.customer_phone = req.session.personalInfo.phone || '';
      }
      
      // Only add receipt_email for valid emails
      if (req.session.personalInfo.email && 
          req.session.personalInfo.email.trim() !== '' && 
          req.session.personalInfo.email.includes('@')) {
        params.receipt_email = req.session.personalInfo.email;
      }
      
      // Add shipping information
      params.shipping = {
        name: `${req.session.personalInfo.firstName} ${req.session.personalInfo.lastName}`,
        address: {
          line1: req.session.shippingInfo.address,
          city: req.session.shippingInfo.city,
          state: req.session.shippingInfo.state,
          postal_code: req.session.shippingInfo.zip,
          country: 'US',
        }
      };
      
      if (req.session.personalInfo.phone) {
        params.shipping.phone = req.session.personalInfo.phone;
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create(params);
      
      // Save to session
      req.session.paymentIntentId = paymentIntent.id;
      await req.session.save();
      
      // Return client secret for Stripe integration
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: amount,
        paymentMethod: 'card',
        nextStep: 'card_payment'
      });
    } else if (paymentMethod === 'bank') {
      // For bank payments, provide bank transfer instructions
      res.json({
        paymentMethod: 'bank',
        amount: amount,
        bankInfo: {
          accountName: 'TrueAminos LLC',
          accountNumber: '123456789',
          routingNumber: '987654321',
          bankName: 'First National Bank',
          instructions: 'Please include your name and email in the transfer memo'
        },
        nextStep: 'confirm_payment'
      });
    } else if (paymentMethod === 'crypto') {
      // For crypto payments, provide wallet address
      res.json({
        paymentMethod: 'crypto',
        amount: amount,
        cryptoInfo: {
          bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          instructions: 'After sending payment, click the confirm button to complete your order'
        },
        nextStep: 'confirm_payment'
      });
    }
  } catch (error: any) {
    console.error('Error processing payment method selection:', error);
    res.status(500).json({ 
      message: "Error processing payment method", 
      error: error.message 
    });
  }
}

/**
 * Handle non-card payment confirmation (step 4 for bank and crypto)
 */
export async function handlePaymentConfirmation(req: Request, res: Response) {
  try {
    // Check if previous steps are completed
    if (!req.session.personalInfo || !req.session.shippingInfo || !req.session.checkoutStep) {
      return res.status(400).json({ 
        message: "Please complete all previous checkout steps first" 
      });
    }
    
    const { paymentMethod, transactionId } = req.body;
    
    // Validate payment method
    if (!paymentMethod || !['bank', 'crypto'].includes(paymentMethod)) {
      return res.status(400).json({ 
        message: "Invalid payment method for confirmation" 
      });
    }
    
    // Update checkout step
    req.session.checkoutStep = 'payment_processing';
    await req.session.save();
    
    // Update in Airtable
    if (req.session.checkoutId) {
      await updateCheckoutInAirtable(req.session.checkoutId, {
        status: 'payment_processing',
        updatedAt: new Date().toISOString()
      });
    }
    
    // Create payment details object
    const paymentDetails = {
      method: paymentMethod,
      transactionId: transactionId || `manual-${Date.now()}`,
      status: 'pending',
      amount: 0, // Will be calculated from cart
      currency: 'usd',
      created: new Date().toISOString(),
      personalInfo: req.session.personalInfo,
      shippingInfo: req.session.shippingInfo
    };
    
    // Create orders in the database
    const orderIds = await createOrderWithPaymentMethod(
      req.session.id, 
      paymentMethod, 
      paymentDetails
    );
    
    // Mark checkout as completed
    if (req.session.checkoutId) {
      await markCheckoutCompleted(req.session.checkoutId);
      
      // Clear checkout data from session
      req.session.checkoutStep = 'completed';
      await req.session.save();
    }
    
    res.json({
      success: true,
      paymentMethod,
      orderIds,
      message: `Your ${paymentMethod} payment is being processed. Your order has been placed.`
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      message: "Error confirming payment", 
      error: error.message 
    });
  }
}

/**
 * Calculate total price of cart items
 */
function calculateCartTotal(cartItems: any[]): number {
  return cartItems.reduce((sum, item) => {
    const price = item.product[`price${item.selectedWeight}`] || 
                 item.product.price || 
                 0;
    return sum + parseFloat(price) * item.quantity;
  }, 0);
}