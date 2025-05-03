/**
 * Debug webhook test that outputs more verbosely what's happening.
 * This will help us diagnose if Airtable integration is working.
 */

import fetch from 'node-fetch';

// Create a test payment intent event
const createTestEvent = (id) => ({
  id: `evt_test_${Date.now()}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: id || `pi_test_debug_${Date.now()}`,
      object: 'payment_intent',
      amount: 5000, // $50.00
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
      metadata: {
        session_id: 'test_session',
        shipping_method: 'standard',
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        affiliate_code: 'DEBUG',
        orderSummary: JSON.stringify({
          customer: 'Test User',
          email: 'test@example.com',
          items: [
            {
              id: 123,
              name: 'Test Product',
              qty: 1,
              weight: '5mg'
            },
            {
              id: 456,
              name: 'Another Product',
              qty: 2,
              weight: '10mg'
            }
          ]
        })
      },
      shipping: {
        name: 'Test User',
        address: {
          line1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postal_code: '12345',
          country: 'US'
        }
      },
      payment_method_types: ['card']
    }
  }
});

async function sendDetailedWebhook() {
  console.log('Sending detailed webhook test to server...');
  try {
    // Create a unique ID for tracking
    const requestId = `pi_test_${Date.now()}`;
    const endpoint = 'http://localhost:5000/api/webhook';
    
    console.log(`Request ID: ${requestId}`);
    console.log(`Endpoint: ${endpoint}`);
    
    const webhook = createTestEvent(requestId);
    console.log('Webhook event details:');
    console.log(`- Type: ${webhook.type}`);
    console.log(`- Payment ID: ${webhook.data.object.id}`);
    console.log(`- Customer: ${webhook.data.object.metadata.customer_name}`);
    console.log(`- Items: ${webhook.data.object.metadata.orderSummary}`);
    console.log(`- Shipping: ${webhook.data.object.metadata.shipping_method}`);
    
    console.log('\nSending request to server...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature'
      },
      body: JSON.stringify(webhook)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    console.log('\nTest completed. Check server logs for detailed processing information.');
    console.log('If the test was successful, there should be an order record in Airtable');
    console.log('with these details:');
    console.log('- Name: Test User');
    console.log('- Email: test@example.com');
    console.log('- Products: Test Product (5mg), Another Product (10mg)');
    console.log('- Affiliate Code: DEBUG');
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

sendDetailedWebhook();