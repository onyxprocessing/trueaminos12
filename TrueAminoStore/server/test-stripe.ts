import Stripe from 'stripe';
import express from 'express';
import bodyParser from 'body-parser';

// Create a simple test endpoint to verify Stripe integration
export function setupStripeTest(app: express.Express) {
  // Test endpoint for creating a minimal payment intent
  app.post('/api/test-payment-intent', async (req, res) => {
    try {
      console.log('🧪 Testing minimal payment intent creation');
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
        return res.status(500).json({ error: 'Missing Stripe API key' });
      }
      
      // Simple amount from request or default to $10
      const amount = req.body.amount ? parseFloat(req.body.amount) : 10.00;
      console.log(`Creating test payment intent for $${amount.toFixed(2)}`);
      
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
      
      console.log(`✅ Test payment intent created successfully: ${paymentIntent.id}`);
      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('❌ Test payment intent failed:', error);
      res.status(500).json({
        error: error.message,
        type: error.type || 'unknown_error',
      });
    }
  });
  
  // Add a simple test route to check if the Stripe API key is working
  app.get('/api/test-stripe-connection', async (req, res) => {
    try {
      console.log('🧪 Testing Stripe API connection');
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
        return res.status(500).json({ error: 'Missing Stripe API key' });
      }
      
      // Create a minimal Stripe instance
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16' as any,
      });
      
      // Make a simple API call to verify the key works
      const paymentMethods = await stripe.paymentMethods.list({ limit: 1 });
      
      console.log('✅ Stripe API connection test successful');
      res.json({
        success: true,
        message: 'Stripe API connection is working correctly',
      });
    } catch (error: any) {
      console.error('❌ Stripe API connection test failed:', error);
      res.status(500).json({
        error: error.message,
        type: error.type || 'unknown_error',
      });
    }
  });
  
  console.log('🔌 Stripe test endpoints registered');
}