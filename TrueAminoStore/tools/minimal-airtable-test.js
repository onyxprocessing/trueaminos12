/**
 * Minimal test with only fields we know exist
 */

import fetch from 'node-fetch';

// Get the Airtable API key from environment
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = "app3XDDBbU0ZZDBiY";
const ORDERS_TABLE_ID = "tblI5N0Xn65DB5L5s";

async function minimalTest() {
  console.log('🔍 Testing with minimal fields we know exist...');
  
  const timestamp = Math.floor(Date.now() / 1000);
  const orderId = `TA-TEST-${timestamp}`;
  
  // Only include fields we know exist from our API query response
  const airtableData = {
    fields: {
      "order id": orderId,
      "product": "Test Product",
      "saleprice": 99.99,
      "productid": "999",
      "first name": "Test",
      "last name": "Customer",
      "address": "123 Test St",
      "city": "Test City",
      "state": "TX",
      "zip": "12345",
      "mg": "5mg",
      "quantity": 1,
      "shipping": "standard",
      "payment": JSON.stringify({id: "pi_test"})
    }
  };
  
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
    console.log('📤 Sending data:', JSON.stringify(airtableData, null, 2));
    
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
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error(errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Success! Record created:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

minimalTest()
  .then(success => {
    if (success) {
      console.log('🎉 Minimal test successful! Airtable connection is working.');
    } else {
      console.log('❌ Test failed. Check errors above.');
    }
  });