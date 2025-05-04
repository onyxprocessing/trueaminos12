/**
 * Stripe webhook tester
 * This script sends a mock webhook payload to the local webhook endpoint
 * It simulates a successful payment event to test webhook handling
 */

// Create a mock payment intent succeeded event
const mockPaymentIntent = {
  id: 'pi_test_' + Date.now(),
  object: 'payment_intent',
  amount: 3999, // $39.99
  currency: 'usd',
  status: 'succeeded',
  created: Math.floor(Date.now() / 1000),
  payment_method_types: ['card'],
  metadata: {
    session_id: 'test_session_' + Date.now(),
    orderSummary: JSON.stringify({
      customer: 'John Smith',
      email: 'john@example.com',
      items: [
        { id: 1, name: 'BPC-157', qty: 1, weight: '5mg' }
      ]
    })
  },
  shipping: {
    name: 'John Smith',
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94103',
      country: 'US'
    },
    phone: '555-123-4567'
  }
};

// Create a mock webhook event
const mockEvent = {
  id: 'evt_test_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  type: 'payment_intent.succeeded',
  data: {
    object: mockPaymentIntent
  }
};

// Function to test the webhook
async function testWebhook() {
  try {
    console.log('Sending test webhook event for payment_intent.succeeded');
    console.log('Payment intent ID:', mockPaymentIntent.id);
    
    // Send to webhook endpoint
    const response = await fetch('http://localhost:5000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockEvent)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Response:', data);
    console.log('Test completed. Check server logs for detailed processing information.');
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

// Run the test
testWebhook();