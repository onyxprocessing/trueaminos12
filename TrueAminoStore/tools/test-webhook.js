import fetch from 'node-fetch';

// A simple script to test the webhook endpoint
async function testWebhook() {
  try {
    // Create a test payment intent object
    const testPaymentIntent = {
      id: 'pi_test_' + Date.now(),
      amount: 3999, // $39.99
      currency: 'usd',
      status: 'succeeded',
      created: Math.floor(Date.now() / 1000),
      payment_method_types: ['card'],
      receipt_email: 'test@example.com',
      metadata: {
        orderSummary: JSON.stringify({
          customer: 'John Doe',
          email: 'john.doe@example.com',
          items: [
            {
              id: 1,
              name: 'Test Product',
              qty: 2,
              weight: '5mg'
            }
          ],
          shipping: 'express'
        }),
        session_id: 'test_session_' + Date.now(),
        shipping_method: 'express',
        customer_name: 'John Doe',
        customer_email: 'john.doe@example.com',
        customer_phone: '555-123-4567'
      },
      shipping: {
        name: 'John Doe',
        phone: '555-123-4567',
        address: {
          line1: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          postal_code: '12345',
          country: 'US'
        }
      }
    };

    // Create a mock Stripe event
    const mockEvent = {
      id: 'evt_test_' + Date.now(),
      object: 'event',
      api_version: '2023-10-16',
      type: 'payment_intent.succeeded',
      data: {
        object: testPaymentIntent
      }
    };

    // Send to webhook endpoint
    const response = await fetch('http://localhost:5000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockEvent)
    });

    const data = await response.json();
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhook();