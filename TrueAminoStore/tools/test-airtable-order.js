// Test script for creating an Airtable order with the correct field structure
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { generateUniqueOrderId, createOrderInAirtable } from '../server/airtable-orders.js';

async function testAirtableOrder() {
  console.log('Testing Airtable order creation with correct field structure...');
  
  // Generate a unique test order ID
  const orderId = generateUniqueOrderId();
  console.log(`Generated order ID: ${orderId}`);
  
  // Create a test order with all the required fields
  const testOrderData = {
    orderId,
    product: 'Test Product',
    firstName: 'Test',
    lastName: 'Customer',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    email: 'test@example.com',
    phone: '555-123-4567',
    mg: '5mg',
    salesPrice: 25.99,
    quantity: 1,
    productId: 999,
    shipping: 'standard',
    payment: JSON.stringify({
      id: 'test_payment_123',
      amount: 25.99,
      status: 'succeeded'
    })
  };
  
  console.log('Creating test order with data:', JSON.stringify(testOrderData, null, 2));
  
  try {
    const recordId = await createOrderInAirtable(testOrderData);
    
    if (recordId) {
      console.log('✅ Test order created successfully with ID:', recordId);
      console.log('Check your Airtable to verify the field structure is correct.');
    } else {
      console.error('❌ Failed to create test order.');
    }
  } catch (error) {
    console.error('Error creating test order:', error);
  }
}

testAirtableOrder();