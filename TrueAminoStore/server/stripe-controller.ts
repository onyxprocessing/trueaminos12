/**
 * Stripe payment controller
 * This module handles creating and managing Stripe payment intents and processing payments
 */

import Stripe from 'stripe';
import { storage } from './storage';

// Initialize Stripe with API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a payment intent for a transaction
 * @param sessionId Session ID from the client
 * @param amount Amount to charge in USD
 * @param customerData Customer information
 * @param metadata Additional metadata to store with the payment
 * @returns The client secret for the payment intent
 */
export async function createPaymentIntent(
  sessionId: string,
  amount: number,
  customerData: {
    firstName: string;
    lastName: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone?: string;
  },
  metadata: Record<string, string> = {}
): Promise<string> {
  try {
    console.log(`Creating payment intent for $${amount.toFixed(2)}`);
    
    // Calculate amount in cents (Stripe uses cents)
    const amountInCents = Math.round(amount * 100);
    
    // Get cart items to include in metadata
    const cartItems = await storage.getCartItems(sessionId);
    
    // Format cart for compact storage in metadata
    const orderSummary = {
      customer: `${customerData.firstName} ${customerData.lastName}`,
      email: customerData.email || '',
      items: cartItems.map(item => ({
        id: item.product.id,
        name: item.product.name,
        qty: item.quantity,
        weight: item.selectedWeight || null,
      }))
    };
    
    // Create a payment intent with customer information
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        ...metadata,
        session_id: sessionId,
        orderSummary: JSON.stringify(orderSummary),
        customer_name: `${customerData.firstName} ${customerData.lastName}`,
        customer_email: customerData.email || '',
        customer_phone: customerData.phone || '',
      },
      shipping: {
        name: `${customerData.firstName} ${customerData.lastName}`,
        address: {
          line1: customerData.address,
          city: customerData.city,
          state: customerData.state,
          postal_code: customerData.zip,
          country: 'US',
        },
        phone: customerData.phone || '',
      },
      receipt_email: customerData.email || undefined,
    });
    
    console.log(`Payment intent created: ${paymentIntent.id}`);
    return paymentIntent.client_secret as string;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Confirm a payment intent has been successful
 * @param paymentIntentId The ID of the payment intent to confirm
 * @returns The updated payment intent
 */
export async function confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment is not successful. Status: ${paymentIntent.status}`);
    }
    
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw error;
  }
}

/**
 * Process a payment intent confirmation from the client
 * This is called when the client has confirmed a payment
 * @param paymentIntentId The ID of the payment intent to process
 * @returns True if processing was successful
 */
export async function processPaymentConfirmation(paymentIntentId: string): Promise<boolean> {
  try {
    // Get the payment intent details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      console.error(`Payment not successful. Status: ${paymentIntent.status}`);
      return false;
    }
    
    console.log(`Processing successful payment: ${paymentIntentId}`);
    
    // Record the order in Airtable
    try {
      const { recordPaymentToAirtable } = await import('./airtable-orders');
      await recordPaymentToAirtable(paymentIntent);
    } catch (error) {
      console.error('Error recording payment to Airtable:', error);
      // Continue even if Airtable recording fails - payment was successful
    }
    
    return true;
  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    return false;
  }
}