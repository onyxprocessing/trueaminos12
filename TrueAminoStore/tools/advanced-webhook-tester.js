import fetch from 'node-fetch';

// Test different webhook scenarios
async function testWebhooks() {
  try {
    console.log('====== WEBHOOK TESTER ======');
    console.log('Testing different webhook scenarios');
    
    // Run different test scenarios
    await testOrderSummaryFormat();
    await testProductsFormat();
    await testPaymentFailed();
    
    console.log('All webhook tests completed');
  } catch (error) {
    console.error('Error in webhook tests:', error);
  }
}

// Test the orderSummary format
async function testOrderSummaryFormat() {
  console.log('\n===== Testing orderSummary Format =====');
  
  // Customer info
  const customer = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-987-6543',
    address: '456 Sample Ave',
    city: 'Test City',
    state: 'TX',
    zipCode: '54321'
  };
  
  // Products
  const products = [
    { id: 2, name: 'NAD+', price: 23, weight: '100mg', quantity: 1 },
    { id: 3, name: 'MK-677', price: 55, weight: '750mg', quantity: 2 }
  ];
  
  // Create metadata with orderSummary format
  const metadata = {
    orderSummary: JSON.stringify({
      customer: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      items: products.map(product => ({
        id: product.id,
        name: product.name.substring(0, 20),
        qty: product.quantity,
        weight: product.weight
      })),
      shipping: 'express'
    }),
    session_id: 'test_session_' + Date.now(),
    shipping_method: 'express',
    customer_name: `${customer.firstName} ${customer.lastName}`,
    customer_email: customer.email,
    customer_phone: customer.phone
  };
  
  // Create payment intent
  const paymentIntent = {
    id: 'pi_test_summary_' + Date.now(),
    amount: 13300, // $133.00 (23 + 55*2)
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
    payment_method_types: ['card'],
    receipt_email: customer.email,
    metadata,
    shipping: {
      name: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phone,
      address: {
        line1: customer.address,
        city: customer.city,
        state: customer.state,
        postal_code: customer.zipCode,
        country: 'US'
      }
    }
  };
  
  // Create Stripe event
  const event = {
    id: 'evt_test_summary_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    type: 'payment_intent.succeeded',
    data: {
      object: paymentIntent
    }
  };
  
  // Send webhook
  return sendWebhook(event);
}

// Test the products format
async function testProductsFormat() {
  console.log('\n===== Testing products Format =====');
  
  // Customer info
  const customer = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Test Street',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345'
  };
  
  // Products
  const products = [
    { id: 1, name: 'BPC-157', price: 25, weight: '5mg', quantity: 1 }
  ];
  
  // Create metadata with products format
  const metadata = {
    products: JSON.stringify(products.map(product => ({
      id: product.id,
      name: product.name,
      weight: product.weight,
      quantity: product.quantity,
      price: product.price
    }))),
    session_id: 'test_session_' + Date.now(),
    shipping_method: 'standard',
    customer_name: `${customer.firstName} ${customer.lastName}`,
    customer_email: customer.email,
    customer_phone: customer.phone
  };
  
  // Create payment intent
  const paymentIntent = {
    id: 'pi_test_products_' + Date.now(),
    amount: 2500, // $25.00
    currency: 'usd',
    status: 'succeeded',
    created: Math.floor(Date.now() / 1000),
    payment_method_types: ['card'],
    receipt_email: customer.email,
    metadata,
    shipping: {
      name: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phone,
      address: {
        line1: customer.address,
        city: customer.city,
        state: customer.state,
        postal_code: customer.zipCode,
        country: 'US'
      }
    }
  };
  
  // Create Stripe event
  const event = {
    id: 'evt_test_products_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    type: 'payment_intent.succeeded',
    data: {
      object: paymentIntent
    }
  };
  
  // Send webhook
  return sendWebhook(event);
}

// Test payment failed event
async function testPaymentFailed() {
  console.log('\n===== Testing Payment Failed =====');
  
  // Create payment intent with failure
  const paymentIntent = {
    id: 'pi_test_failed_' + Date.now(),
    amount: 3999,
    currency: 'usd',
    status: 'requires_payment_method',
    created: Math.floor(Date.now() / 1000),
    payment_method_types: ['card'],
    last_payment_error: {
      type: 'card_error',
      code: 'card_declined',
      message: 'Your card was declined.'
    },
    metadata: {
      session_id: 'test_session_' + Date.now()
    }
  };
  
  // Create Stripe event
  const event = {
    id: 'evt_test_failed_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    type: 'payment_intent.payment_failed',
    data: {
      object: paymentIntent
    }
  };
  
  // Send webhook
  return sendWebhook(event);
}

// Helper function to send a webhook
async function sendWebhook(event) {
  try {
    console.log(`Sending webhook event: ${event.type}`);
    console.log(`Payment ID: ${event.data.object.id}`);
    
    // Send to webhook endpoint
    const response = await fetch('http://localhost:5000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Response:', data);
    
    return response;
  } catch (error) {
    console.error('Error sending webhook:', error);
    throw error;
  }
}

// Run all tests
testWebhooks();