import Stripe from 'stripe';
import express from 'express';
import bodyParser from 'body-parser';

// Create a simple test endpoint to verify Stripe integration
export function setupStripeTest(app: express.Express) {
  // Add CORS preflight handling for the test endpoint
  app.options('/api/test-payment-intent', (req, res) => {
    console.log('Received OPTIONS preflight request for /api/test-payment-intent');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
  });
  // Test endpoint for creating a minimal payment intent
  app.post('/api/test-payment-intent', async (req, res) => {
    console.log('🧪 TEST ENDPOINT: Received request to /api/test-payment-intent');
    console.log('Request headers:', JSON.stringify(req.headers));
    console.log('Request body:', JSON.stringify(req.body));
    
    try {
      console.log('🧪 Testing minimal payment intent creation');
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        console.error('Missing required Stripe secret: STRIPE_SECRET_KEY');
        return res.status(500).json({ error: 'Missing Stripe API key' });
      }
      
      // Simple amount from request or default to $10
      const amount = req.body && req.body.amount ? parseFloat(req.body.amount) : 10.00;
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
      
      // Send the response with CORS headers to ensure browser compatibility
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
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
  
  // Add a comprehensive test endpoint for creating test orders directly
  app.post('/api/test-stripe/test-order-process', async (req, res) => {
    try {
      console.log('🧪 TEST ENDPOINT: Testing complete order process flow');
      
      // Create a fake payment intent that resembles a real one
      const fakePaymentIntent = {
        id: `pi_test_${Date.now()}`,
        amount: 2995, // $29.95 in cents
        currency: 'usd',
        status: 'succeeded',
        created: Math.floor(Date.now() / 1000),
        metadata: {
          orderSummary: JSON.stringify({
            customer: 'Test Customer',
            email: 'test@example.com',
            items: [
              {
                id: 1,
                name: 'BPC-157',
                qty: 1,
                weight: '5mg'
              }
            ],
            shipping: 'standard'
          }),
          session_id: 'test_session_123'
        },
        shipping: {
          name: 'Test Customer',
          address: {
            line1: '123 Test St',
            city: 'Testville',
            state: 'TN',
            postal_code: '37027',
            country: 'US'
          }
        }
      };
      
      console.log('🔄 Importing processPaymentSuccess function');
      
      // Import dynamically from routes to avoid circular dependencies
      const { processPaymentSuccess } = await import('./routes');
      
      if (!processPaymentSuccess) {
        throw new Error('processPaymentSuccess function not found');
      }
      
      console.log('📦 Processing test payment with processPaymentSuccess');
      
      // Process the fake payment intent
      const result = await processPaymentSuccess(fakePaymentIntent);
      
      console.log('✅ Test order process completed with result:', result);
      
      // Return the results
      res.json({
        success: true,
        paymentIntent: fakePaymentIntent.id,
        results: result
      });
    } catch (error: any) {
      console.error('❌ Test order process failed:', error);
      res.status(500).json({
        error: error.message,
        stack: error.stack,
        type: error.type || 'unknown_error'
      });
    }
  });
  
  console.log('🔌 Stripe test endpoints registered');
}