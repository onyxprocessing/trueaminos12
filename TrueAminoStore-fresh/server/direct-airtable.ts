/**
 * Direct Airtable API interaction module
 * This is a standalone module to directly interact with Airtable API
 * for debugging and special use cases
 */

import fetch from 'node-fetch';

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d';
const AIRTABLE_BASE_ID = 'app3XDDBbU0ZZDBiY';
const ORDERS_TABLE_ID = 'tblI5N0Xn65DB5L5s';

/**
 * Create a record directly in the orders table with just the test field
 * @param data Any data to store in the test field
 * @returns Record ID if successful, null otherwise
 */
export async function createOrderWithTestData(data: any): Promise<string | null> {
  try {
    console.log('🔍 Creating direct order record with test data');
    
    // Format a unique order ID
    const timestamp = Math.floor(Date.now() / 1000);
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `TA-${timestamp}-${randomChars}`;
    
    // Prepare the request
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
    
    // Create a minimal valid record with the test field containing our data
    const recordData = {
      fields: {
        // Required fields with minimal data
        "order id": orderId,
        "first name": "Test",
        "last name": "User",
        "address": "123 Test Street",
        "city": "Test City", 
        "state": "TS",
        "zip": "12345",
        "saleprice": "0",
        "quantity": 1,
        "productid": 0,
        "shipping": "test",
        "payment": "test",
        // The actual test field containing our JSON data
        "test": JSON.stringify(data)
      }
    };
    
    console.log('📤 Sending data to Airtable:', JSON.stringify(recordData.fields, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚠️ Airtable API error (${response.status}): ${errorText}`);
      return null;
    }
    
    const result = await response.json() as { id: string };
    console.log('✅ Successfully created order record with ID:', result.id);
    return result.id;
  } catch (error) {
    console.error('❌ Error creating direct order record:', error);
    return null;
  }
}