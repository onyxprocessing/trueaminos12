/**
 * Debug script to check Airtable table schema
 */

import fetch from 'node-fetch';
import "dotenv/config";

async function checkAirtableSchema() {
  try {
    const airtableApiKey = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
    const airtableBaseId = "app3XDDBbU0ZZDBiY";
    const tableId = "tblhjfzTX2zjf22s1"; // Cart sessions table ID
    
    console.log('🔑 Using Airtable API Key:', airtableApiKey.substring(0, 10) + '...[redacted]');
    console.log('📊 Base ID:', airtableBaseId);
    console.log('📋 Table ID:', tableId);
    
    // Base Airtable API URL
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableId}`;
    console.log('🌐 API URL:', airtableUrl);
    
    // First, get existing records to check schema
    const listResponse = await fetch(`${airtableUrl}?maxRecords=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!listResponse.ok) {
      console.error('❌ Error getting records:', await listResponse.text());
      return;
    }
    
    const listData = await listResponse.json();
    console.log('✅ Found records:', listData.records.length);
    
    if (listData.records.length > 0) {
      console.log('Example record fields:', JSON.stringify(listData.records[0].fields, null, 2));
      console.log('Available field names in first record:', Object.keys(listData.records[0].fields));
      
      // Check all records for unique field names
      const allFieldNames = new Set();
      listData.records.forEach(record => {
        Object.keys(record.fields).forEach(fieldName => {
          allFieldNames.add(fieldName);
        });
      });
      
      console.log('All field names found in records:', Array.from(allFieldNames));
    } else {
      console.log('No records found. Creating a test record...');
      
      // Try some common field names
      const testResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              "Name": "Test Session " + Date.now(),
              "Code": "TEST-CODE"
            }
          }]
        })
      });
      
      if (!testResponse.ok) {
        console.error('❌ Error creating test record:', await testResponse.text());
        return;
      }
      
      const testData = await testResponse.json();
      console.log('✅ Test record created:', JSON.stringify(testData, null, 2));
      
      // Delete the test record
      const recordId = testData.records[0].id;
      const deleteResponse = await fetch(`${airtableUrl}/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!deleteResponse.ok) {
        console.error('❌ Error deleting test record:', await deleteResponse.text());
      } else {
        console.log('✅ Test record deleted');
      }
    }
  } catch (error) {
    console.error('❌ Error checking Airtable schema:', error);
  }
}

// Run the check
checkAirtableSchema();