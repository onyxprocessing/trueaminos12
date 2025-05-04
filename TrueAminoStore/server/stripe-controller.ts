import { Request, Response } from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing required environment variable: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create a payment intent with Stripe
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      // Add receipt email if available
      ...(req.body.email ? { receipt_email: req.body.email } : {}),
      payment_method_types: ['card'],
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
    });
  }
}

// Confirm payment after successful card payment
export async function confirmPayment(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required',
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${paymentIntent.status}`,
      });
    }

    return res.json({
      success: true,
      paymentIntent,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment',
    });
  }
}