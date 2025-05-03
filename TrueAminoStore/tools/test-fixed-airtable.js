/**
 * Script to test Airtable order creation with the fixed lowercase field names.
 */

import fetch from 'node-fetch';

// Get the Airtable API key from environment
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = "app3XDDBbU0ZZDBiY";
const ORDERS_TABLE_ID = "tblI5N0Xn65DB5L5s";

if (!AIRTABLE_API_KEY) {
  console.error('❌ ERROR: AIRTABLE_API_KEY environment variable is not set!');
  console.error('Please make sure this is set before running the test.');
  process.exit(1);
}

async function createTestOrder() {
  console.log('😀 Starting direct Airtable test with fixed field names...');
  
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `TA-TEST-${timestamp}-${randomChars}`;
    
    // Prepare the data for Airtable with all requested fields
    const airtableData = {
      fields: {
        "order id": orderId,
        "first name": "Test",
        "last name": "Customer",
        "address": "123 Test Ave",
        "city": "Test City",
        "state": "TX",
        "zip": "12345",
        "mg": "5mg",
        "saleprice": 129.99,
        "quantity": 1,
        "productid": "999",
        "product": "Test Product",
        "shipping": "standard",
        "payment": JSON.stringify({id: "pi_test", amount: 129.99}),
        "email": "test@example.com",
        "phone": "555-123-4567",
        "affiliate code": "TEST"
      }
    };
    
    console.log('📦 Creating test order record with data:');
    console.log(JSON.stringify(airtableData, null, 2));
    
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
      console.error(`❌ Airtable API error: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      console.error('\nPossible issues:');
      console.error('1. Invalid Airtable API key');
      console.error('2. Incorrect Base ID or Table ID');
      console.error('3. Field names do not match the Airtable schema');
      console.error('4. API rate limits exceeded');
      return false;
    }
    
    const data = await response.json();
    console.log('✅ SUCCESS! Order created in Airtable with ID:', data.id);
    console.log('✨ This proves your Airtable API key and field names are working correctly!');
    
    // Get the record to verify
    console.log('\n📋 Fetching the record to verify it exists...');
    const getResponse = await fetch(`${url}/${data.id}`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    });
    
    if (!getResponse.ok) {
      console.error('❌ Could not verify record - it may still exist');
      return true;
    }
    
    const record = await getResponse.json();
    console.log('✅ Successfully verified the record exists!');
    console.log('Record fields:');
    console.log(JSON.stringify(record.fields, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Error creating test order in Airtable:', error);
    return false;
  }
}

// Run the test
createTestOrder().then(success => {
  if (success) {
    console.log('\n🎉 Airtable integration test successful!');
    console.log('This confirms your Airtable API key is valid and working.');
    console.log('The checkout process should now be able to record orders in Airtable.');
  } else {
    console.log('\n❌ Airtable integration test failed!');
    console.log('Please check the error messages above and fix the issues before continuing.');
  }
});