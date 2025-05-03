/**
 * Test script to verify Stripe API connection and validate API keys
 */

// No need to import dotenv, environment variables are already set in the workflow
import Stripe from 'stripe';

async function testStripeConnection() {
  console.log('Testing Stripe connection...');
  
  // Check if Stripe secret key exists
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY is missing!');
    console.log('Please set your Stripe secret key in the .env file or environment variables.');
    return;
  }
  
  // Initialize Stripe client
  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    console.log('✅ Successfully initialized Stripe client');
    
    // Test creating a small payment intent to verify API key works
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00 in cents
        currency: 'usd',
        description: 'Stripe connection test'
      });
      
      console.log(`✅ Successfully created payment intent: ${paymentIntent.id}`);
      console.log(`✅ Client secret: ${paymentIntent.client_secret}`);
      
      // Verify we can retrieve the payment intent
      const retrievedIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
      console.log(`✅ Successfully retrieved payment intent: ${retrievedIntent.id}`);
      
      // Cancel the test payment intent
      const canceled = await stripe.paymentIntents.cancel(paymentIntent.id);
      console.log(`✅ Successfully canceled test payment intent: ${canceled.id}`);
      
      console.log('🎉 All Stripe API tests passed!');
    } catch (error) {
      console.error('❌ Failed to create payment intent:');
      console.error('Error type:', error.type);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'authentication_required' || error.type === 'invalid_request_error') {
        console.log('\n⚠️ Your Stripe API key appears to be invalid or unauthorized.');
        console.log('Please check if you\'re using the correct Stripe environment (test/live)');
        console.log('and that your API key has the necessary permissions.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Stripe client:');
    console.error(error);
  }
}

testStripeConnection().catch(console.error);