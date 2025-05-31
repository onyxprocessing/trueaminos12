import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function checkAffiliateRecords() {
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID || "app3XDDBbU0ZZDBiY";
  const tableId = "tblhjfzTX2zjf22s1";

  const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${tableId}?maxRecords=50`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Total records:', data.records.length);
  
  let affiliateCount = 0;
  data.records.forEach((record, index) => {
    const fields = record.fields || {};
    const hasAffiliate = fields.affiliatecode || fields.affiliateCode || fields['affiliate code'] || fields.code;
    
    if (hasAffiliate) {
      affiliateCount++;
      console.log(`\nRecord ${index + 1} HAS affiliate code:`);
      console.log('  ID:', record.id);
      console.log('  Session ID:', fields['session id']);
      console.log('  Affiliate Code:', fields.affiliatecode || fields.affiliateCode || fields['affiliate code'] || fields.code);
      console.log('  Created:', fields.createdat);
    }
  });
  
  console.log(`\nFound ${affiliateCount} records with affiliate codes out of ${data.records.length} total records`);
}

checkAffiliateRecords().catch(console.error);