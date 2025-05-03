/**
 * Checkout flow handler
 * This module manages the multi-step checkout process
 * Step 1: Personal information (first name, last name, email, phone)
 * Step 2: Shipping information (address, city, state, zip, shipping method)
 * Step 3: Payment method selection (card, bank, crypto)
 * Step 4: Payment processing
 */

import { Request as ExpressRequest, Response } from 'express';
import { storage } from './storage';
import { 
  createCheckoutInAirtable, 
  updateCheckoutInAirtable, 
  markCheckoutCompleted 
} from './airtable-checkout';
import { createOrderWithPaymentMethod } from './db-direct-order';

// Define custom Request type with session
interface Request extends ExpressRequest {
  session: {
    id: string;
    checkoutId?: string;
    checkoutStep?: string;
    personalInfo?: any;
    shippingInfo?: any;
    cookie: any;
    regenerate: (callback: (err?: any) => void) => void;
    destroy: (callback: (err?: any) => void) => void;
    reload: (callback: (err?: any) => void) => void;
    save: (callback?: (err?: any) => void) => void;
    touch: (callback?: (err?: any) => void) => void;
  };
}

export async function initializeCheckout(req: Request): Promise<string> {
  // Create a checkout ID if one doesn't exist
  if (!req.session.checkoutId) {
    // Get the cart items and convert to a string representation
    const cartItems = await storage.getCartItems(req.session.id);
    
    // Create initial checkout entry with cart information
    const checkoutId = await createCheckoutInAirtable(req.session.id);
    
    if (checkoutId) {
      // Update with cart items right away
      await updateCheckoutInAirtable(checkoutId, {
        cartItems: cartItems,
        totalAmount: calculateCartTotal(cartItems),
        status: 'started',
        updatedAt: new Date().toISOString()
      });
      
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
    
    // Get cart items for updating Airtable
    const cartItems = await storage.getCartItems(req.session.id);
    
    // Create formatted cart item string (e.g., "BPC 157 10mg x2")
    const formattedCartItems = cartItems.map(item => {
      const productName = item.product.name;
      const weight = item.selectedWeight || '';
      const quantity = item.quantity;
      return `${productName} ${weight} x${quantity}`;
    });
    
    // Update in Airtable with all customer info and cart data
    await updateCheckoutInAirtable(checkoutId, {
      firstName,
      lastName,
      email: email || '',
      phone: phone || '',
      status: 'personal_info',
      cartItems: cartItems,
      updatedAt: new Date().toISOString()
    });
    
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
    
    // Get cart items for updating Airtable
    const cartItems = await storage.getCartItems(req.session.id);
    
    // Create formatted cart item string (e.g., "BPC 157 10mg x2")
    const formattedCartItems = cartItems.map(item => {
      const productName = item.product.name;
      const weight = item.selectedWeight || '';
      const quantity = item.quantity;
      return `${productName} ${weight} x${quantity}`;
    });
    
    // Calculate total
    const cartTotal = calculateCartTotal(cartItems);
    
    // Update in Airtable with all customer info and cart data
    if (req.session.checkoutId) {
      await updateCheckoutInAirtable(req.session.checkoutId, {
        address,
        city,
        state,
        zip: zipCode,
        shippingMethod,
        status: 'shipping_info',
        cartItems: cartItems,
        totalAmount: cartTotal,
        updatedAt: new Date().toISOString()
      });
    }
    
    // We already have the cart items and total from above
    
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
    
    // For card payments, just return the amount and next step
    if (paymentMethod === 'card') {
      res.json({
        paymentMethod: 'card',
        amount: amount,
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
 * Handle payment confirmation (step 4 for all payment methods)
 */
export async function handlePaymentConfirmation(req: Request, res: Response) {
  try {
    // Check if previous steps are completed
    if (!req.session.personalInfo || !req.session.shippingInfo || !req.session.checkoutStep) {
      return res.status(400).json({ 
        message: "Please complete all previous checkout steps first" 
      });
    }
    
    const { paymentMethod, transactionId, cardDetails } = req.body;
    
    // Validate payment method
    if (!paymentMethod || !['card', 'bank', 'crypto'].includes(paymentMethod)) {
      return res.status(400).json({ 
        message: "Invalid payment method for confirmation" 
      });
    }
    
    // For card payments, validate card details
    if (paymentMethod === 'card') {
      if (!cardDetails || !cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
        return res.status(400).json({ 
          message: "Missing card details. Please provide name, number, expiry, and cvv." 
        });
      }
      
      // Basic card validation (just for demonstration purposes)
      if (cardDetails.number.length < 13 || cardDetails.number.length > 19) {
        return res.status(400).json({ 
          message: "Invalid card number length. Card number should be between 13 and 19 digits." 
        });
      }
      
      if (cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
        return res.status(400).json({ 
          message: "Invalid CVV. CVV should be 3 or 4 digits." 
        });
      }
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