/**
 * Script to test Airtable order creation directly,
 * to help diagnose issues with orders not being recorded.
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
  console.log('😀 Starting direct Airtable test...');
  
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `TA-TEST-${timestamp}-${randomChars}`;
    
    // Prepare the data for Airtable with all requested fields
    const airtableData = {
      fields: {
        "Order ID": orderId,
        "First Name": "Test",
        "Last Name": "Customer",
        "Address": "123 Test Ave",
        "City": "Test City",
        "State": "TX",
        "Zip": "12345",
        "MG": "5mg",
        "Sales Price": 129.99,
        "Quantity": 1,
        "Product ID": 999,
        "Product": "Test Product",
        "Shipping": "standard",
        "Payment": JSON.stringify({id: "pi_test", amount: 129.99}),
        "Email": "test@example.com",
        "Phone": "555-123-4567",
        "Affiliate Code": "TEST"
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
    console.log('✨ This proves your Airtable API key is working correctly!');
    
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
    console.log('If the site is not recording orders, the issue is likely in the checkout process.');
  } else {
    console.log('\n❌ Airtable integration test failed!');
    console.log('Please check the error messages above and fix the issues before continuing.');
  }
});