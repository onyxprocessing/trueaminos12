/**
 * Debug script to check actual field names in Airtable
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function checkFieldNames() {
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID || "app3XDDBbU0ZZDBiY";
  const tableId = "tblhjfzTX2zjf22s1"; // Cart sessions table ID
  
  console.log('Checking field names in cart sessions table...');
  console.log('Base ID:', airtableBaseId);
  console.log('Table ID:', tableId);
  
  try {
    // Get a few records to see the field structure
    const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${tableId}?maxRecords=3`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error:', await response.text());
      return;
    }
    
    const data = await response.json();
    console.log('\nTotal records:', data.records?.length || 0);
    
    if (data.records && data.records.length > 0) {
      console.log('\nField names found in first record:');
      const fieldNames = Object.keys(data.records[0].fields || {});
      fieldNames.forEach(name => {
        console.log(`- "${name}"`);
      });
      
      console.log('\nAll records with their fields:');
      data.records.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        Object.entries(record.fields || {}).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    } else {
      console.log('No records found in table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFieldNames();