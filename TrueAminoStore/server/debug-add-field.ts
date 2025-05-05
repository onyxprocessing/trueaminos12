/**
 * Debug script to add affiliatecode field to a record in cart sessions
 */

import fetch from 'node-fetch';
import "dotenv/config";

// Hardcoded variables to avoid .env issues
const airtableApiKey = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
const airtableBaseId = "app3XDDBbU0ZZDBiY";
const tableId = "tblhjfzTX2zjf22s1"; // Cart sessions table ID

async function main() {
  try {
    console.log('🔑 Using Airtable API Key:', airtableApiKey.substring(0, 10) + '...[redacted]');
    console.log('📊 Base ID:', airtableBaseId);
    console.log('📋 Table ID:', tableId);
    
    // Base Airtable API URL for the Cart Sessions table
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableId}`;
    console.log('🌐 API URL:', airtableUrl);
    
    // Try all combinations to see which works for storing the affiliate code
    const testFieldNames = [
      'affiliatecode',
      'Affiliatecode',
      'AffiliateCode',
      'Affiliate Code',
      'affiliate code',
      'discount code',
      'Discount Code',
      'coupon',
      'Coupon'
    ];
    
    // Create a test record with the session id field
    console.log('🧪 Creating test record with different affiliate code field names...');
    
    for(const fieldName of testFieldNames) {
      const testResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              'session id': 'test-session-' + fieldName,
              'status': 'test',
              [fieldName]: 'TEST-CODE'
            }
          }]
        })
      });
      
      if (testResponse.ok) {
        const testResult = await testResponse.json() as any;
        console.log(`✅ Success with field name "${fieldName}"! Record ID:`, testResult.records[0].id);
        
        // Delete the test record
        const deleteResponse = await fetch(`${airtableUrl}/${testResult.records[0].id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Test record deleted');
        }
      } else {
        const errorText = await testResponse.text();
        console.log(`❌ Failed with field name "${fieldName}":`, errorText);
      }
    }
    
    console.log('🔎 Testing completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();