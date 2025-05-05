/**
 * Debug script to check Cart Sessions field names in Airtable
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
    
    // Get the first record to examine field structure
    const response = await fetch(`${airtableUrl}?maxRecords=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('❌ Error fetching records:', await response.text());
      return;
    }
    
    const data = await response.json() as any;
    
    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      console.log('✅ Found record ID:', record.id);
      console.log('📋 Field names found in record:', Object.keys(record.fields));
      
      // Try to create a test record with our own field names
      console.log('🧪 Creating test record with various field names...');
      
      // Test many variations of field names
      const testResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              'session id': 'test-session-' + Date.now(),
              'name': 'Test Record',
              'affiliatecode': 'TEST-CODE', 
              'status': 'test'
            }
          }]
        })
      });
      
      if (!testResponse.ok) {
        console.error('❌ Error creating test record:', await testResponse.text());
        
        // Try again with only known fields
        console.log('🧪 Trying with only known fields...');
        const knownFieldsResponse = await fetch(airtableUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            records: [{
              fields: {
                'session id': 'test-session-' + Date.now(),
                'status': 'test'
              }
            }]
          })
        });
        
        if (!knownFieldsResponse.ok) {
          console.error('❌ Error creating test record with known fields:', await knownFieldsResponse.text());
        } else {
          const knownFieldsResult = await knownFieldsResponse.json() as any;
          console.log('✅ Created test record with known fields:', knownFieldsResult);
          
          // Get the record to see field structure
          const recordId = knownFieldsResult.records[0].id;
          
          // Delete the test record
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
      } else {
        const testResult = await testResponse.json() as any;
        console.log('✅ Created test record:', testResult);
        
        // Get the test record with all fields
        const recordId = testResult.records[0].id;
        
        // Delete the test record
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
    } else {
      console.log('⚠️ No records found in Cart Sessions table');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();