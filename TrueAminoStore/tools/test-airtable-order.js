// Test script for creating an Airtable order with the correct field structure
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fetch from 'node-fetch';

// Airtable API key from environment variable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = "app3XDDBbU0ZZDBiY";
const ORDERS_TABLE_ID = "tblI5N0Xn65DB5L5s";

// Function to generate a unique order ID (copied from airtable-orders.ts)
function generateUniqueOrderId() {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TA-${timestamp}-${randomChars}`;
}

// Function to create an order in Airtable (implementation similar to airtable-orders.ts)
async function createOrderInAirtable(orderData) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
    
    // Prepare the data for Airtable using the exact field names from the CSV
    const airtableData = {
      fields: {
        "order id": orderData.orderId,
        "product": orderData.product || '',
        "saleprice": orderData.salesPrice,
        "productid": String(orderData.productId),
        "first name": orderData.firstName,
        "last name": orderData.lastName,
        "address": orderData.address,
        "city": orderData.city,
        "zip": orderData.zip,
        "mg": orderData.mg || '',
        "quantity": orderData.quantity,
        "shipping": orderData.shipping,
        "payment": orderData.payment,
        "affiliatecode": '',
        "state": orderData.state
      }
    };
    
    console.log('Creating order record in Airtable:', JSON.stringify(airtableData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('Order created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating order in Airtable:', error);
    return null;
  }
}

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