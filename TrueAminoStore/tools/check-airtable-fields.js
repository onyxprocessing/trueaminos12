import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fetch from 'node-fetch';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = "app3XDDBbU0ZZDBiY";
const ORDERS_TABLE_ID = "tblI5N0Xn65DB5L5s";

async function checkAirtableFields() {
  try {
    console.log('Checking Airtable Orders table structure...');
    
    // First, check if the API key is available
    if (!AIRTABLE_API_KEY) {
      console.error('AIRTABLE_API_KEY is not set. Please set this environment variable.');
      return;
    }
    
    // Get table metadata to see available fields
    const url = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
    
    console.log(`Fetching table metadata from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API error: ${response.status} ${response.statusText}`, errorText);
      return;
    }
    
    const data = await response.json();
    
    // Find the Orders table
    const ordersTable = data.tables.find(table => table.id === ORDERS_TABLE_ID);
    
    if (!ordersTable) {
      console.error(`Could not find table with ID: ${ORDERS_TABLE_ID}`);
      
      // List available tables
      console.log('Available tables:');
      data.tables.forEach(table => {
        console.log(`- ${table.name} (${table.id})`);
      });
      
      return;
    }
    
    console.log(`\nFound table: ${ordersTable.name} (${ordersTable.id})`);
    console.log('\nAvailable fields:');
    
    // Print all fields in the table
    ordersTable.fields.forEach(field => {
      console.log(`- ${field.name} (${field.type})`);
    });
    
    // Try a test API call to get record
    const recordsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}?maxRecords=1`;
    
    console.log(`\nFetching a sample record from: ${recordsUrl}`);
    
    const recordsResponse = await fetch(recordsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!recordsResponse.ok) {
      const errorText = await recordsResponse.text();
      console.error(`Airtable API error: ${recordsResponse.status} ${recordsResponse.statusText}`, errorText);
      return;
    }
    
    const recordsData = await recordsResponse.json();
    
    if (recordsData.records && recordsData.records.length > 0) {
      console.log('\nSample record fields:');
      const record = recordsData.records[0];
      console.log(JSON.stringify(record.fields, null, 2));
    } else {
      console.log('\nNo records found in the table.');
      
      // Try creating a test record with minimal fields
      console.log('\nTrying to create a test record...');
      
      const testData = {
        fields: {
          'Order ID': 'TEST-ORDER-123',
          'First Name': 'Test',
          'Last Name': 'User'
        }
      };
      
      const createUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
      
      console.log(`Creating test record at: ${createUrl}`);
      console.log('Data:', JSON.stringify(testData, null, 2));
      
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`Error creating test record: ${createResponse.status} ${createResponse.statusText}`, errorText);
        
        // Try with simple field names
        console.log('\nTrying with lowercase field names...');
        
        const simpleTestData = {
          fields: {
            'orderId': 'TEST-ORDER-123',
            'firstName': 'Test',
            'lastName': 'User'
          }
        };
        
        console.log('Data:', JSON.stringify(simpleTestData, null, 2));
        
        const simpleCreateResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(simpleTestData)
        });
        
        if (!simpleCreateResponse.ok) {
          const simpleErrorText = await simpleCreateResponse.text();
          console.error(`Error creating test record with simple fields: ${simpleCreateResponse.status} ${simpleCreateResponse.statusText}`, simpleErrorText);
        } else {
          const simpleCreateData = await simpleCreateResponse.json();
          console.log('\nTest record created with simple fields!');
          console.log(JSON.stringify(simpleCreateData, null, 2));
        }
      } else {
        const createData = await createResponse.json();
        console.log('\nTest record created!');
        console.log(JSON.stringify(createData, null, 2));
      }
    }
  } catch (error) {
    console.error('Error checking Airtable fields:', error);
  }
}

checkAirtableFields();