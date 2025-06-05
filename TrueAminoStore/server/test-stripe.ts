import Stripe from 'stripe';
import express from 'express';
import bodyParser from 'body-parser';

// Create a simple test endpoint to verify Stripe integration
export function setupStripeTest(app: express.Express) {
  // Add CORS preflight handling for the test endpoint
  app.options('/api/test-payment-intent', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
  });
  // Test endpoint for creating a minimal payment intent
  app.post('/api/test-payment-intent', async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: 'Missing Stripe API key' });
      }
      
      // Simple amount from request or default to $10
      const amount = req.body && req.body.amount ? parseFloat(req.body.amount) : 10.00;
      
      // Create a minimal Stripe instance
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16' as any,
      });
      
      // Create a minimal payment intent with only required parameters
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert dollars to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      // Send the response with CORS headers to ensure browser compatibility
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        type: error.type || 'unknown_error',
      });
    }
  });
  
  // Add a simple test route to check if the Stripe API key is working
  app.get('/api/test-stripe-connection', async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: 'Missing Stripe API key' });
      }
      
      // Create a minimal Stripe instance
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16' as any,
      });
      
      // Make a simple API call to verify the key works
      const paymentMethods = await stripe.paymentMethods.list({ limit: 1 });
      
      res.json({
        success: true,
        message: 'Stripe API connection is working correctly',
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        type: error.type || 'unknown_error',
      });
    }
  });
}