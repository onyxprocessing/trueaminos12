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
  
  let affiliateCount = 0;
  data.records.forEach((record) => {
    const fields = record.fields || {};
    const hasAffiliate = fields.affiliatecode || fields.affiliateCode || fields['affiliate code'] || fields.code;
    
    if (hasAffiliate) {
      affiliateCount++;
    }
  });
  
  return `Found ${affiliateCount} records with affiliate codes out of ${data.records.length} total records`;
}

checkAffiliateRecords().then(console.log).catch(console.error);