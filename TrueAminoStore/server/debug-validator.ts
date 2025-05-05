/**
 * Enhanced debug version of the affiliate code validator
 */

import fetch from "node-fetch";
import "dotenv/config";

interface AirtableAffiliateCode {
  id: string;
  fields: {
    code?: string;
    Code?: string;  // Added capital C version
    discount?: number;
    name?: string;
    active?: boolean;
    Email?: string;  // Added other fields found in Airtable
    "First Name"?: string;
    "Last Name"?: string;
    Password?: string;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableAffiliateCode[];
}

interface AffiliateCodeResponse {
  id: string;
  code: string;
  discount: number;
  name: string;
  valid: boolean;
}

export async function debugValidateAffiliateCode(code: string): Promise<AffiliateCodeResponse> {
  try {
    // Get API key from environment
    const airtableApiKey = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
    const airtableBaseId = "app3XDDBbU0ZZDBiY";
    const tableId = "tblbQbjX0RQbguX5e"; // Affiliate codes table ID
    
    console.log('🔑 Using Airtable API Key:', airtableApiKey.substring(0, 10) + '...[redacted]');
    console.log('📊 Base ID:', airtableBaseId);
    console.log('📋 Table ID:', tableId);
    
    // Format code for comparison (uppercase and trim)
    const formattedCode = code.toUpperCase().trim();
    console.log('🔍 Formatted code for search:', formattedCode);
    
    // Base Airtable API URL
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableId}`;
    console.log('🌐 API URL:', airtableUrl);
    
    // Fetch all affiliate codes
    console.log('📡 Fetching affiliate codes from Airtable...');
    const response = await fetch(`${airtableUrl}?maxRecords=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Airtable API error:', errorData);
      return {
        id: '',
        code: formattedCode,
        discount: 0,
        name: '',
        valid: false
      };
    }
    
    const data = await response.json() as AirtableResponse;
    console.log(`✅ Received ${data.records.length} affiliate codes from Airtable`);
    
    // Log all codes from Airtable for debugging
    console.log('\n📋 All codes in Airtable:');
    data.records.forEach(record => {
      // Cast to any to avoid type errors
      const fields = record.fields as any;
      
      console.log(`- ID: ${record.id}`);
      console.log(`  code (lowercase): "${fields.code || 'UNDEFINED'}"`);
      console.log(`  Code (capital): "${fields.Code || 'UNDEFINED'}"`);
      console.log(`  Email: "${fields.Email || 'UNDEFINED'}"`);
      console.log(`  First Name: "${fields["First Name"] || 'UNDEFINED'}"`);
      console.log(`  Last Name: "${fields["Last Name"] || 'UNDEFINED'}"`);
      console.log(`  Discount: ${fields.discount || 0}%`);
      console.log(`  Name: ${fields.name || 'UNNAMED'}`);
      console.log(`  Active: ${fields.active !== false ? 'YES' : 'NO'}`);
      console.log('---');
    });
    
    // Find the matching code from the results
    console.log(`\n🔍 Searching for code: "${formattedCode}"`);
    const matchingCode = data.records.find(record => {
      // Cast to any to access all possible field names
      const fields = record.fields as any;
      
      // Check for code in multiple field variations (lowercase and capital C)
      const recordCodeLower = fields.code?.toUpperCase().trim();
      const recordCodeUpper = fields.Code?.toUpperCase().trim();
      
      // Use either the lowercase or uppercase version
      const recordCode = recordCodeUpper || recordCodeLower;
      
      const isActive = fields.active !== false; // undefined or true means active
      
      console.log(`Comparing with lowercase: "${recordCodeLower}" or capital: "${recordCodeUpper}" (Active: ${isActive ? 'YES' : 'NO'})`);
      const isMatch = (recordCode === formattedCode) && isActive;
      
      if (recordCode === formattedCode) {
        console.log(`✅ Found code match! Active status: ${isActive ? 'YES' : 'NO'}`);
      }
      
      return isMatch;
    });
    
    if (matchingCode) {
      console.log('✅ Matching affiliate code found!');
      console.log('Details:', matchingCode);
      
      // Cast fields to any to access all possible field names
      const fields = matchingCode.fields as any;
      
      // Get the code with appropriate fallbacks
      const codeValue = fields.Code || fields.code || formattedCode;
      
      return {
        id: matchingCode.id,
        code: codeValue,
        discount: fields.discount || 0,
        name: fields.name || '',
        valid: true
      };
    }
    
    console.log('❌ No matching affiliate code found');
    return {
      id: '',
      code: formattedCode,
      discount: 0,
      name: '',
      valid: false
    };
  } catch (error) {
    console.error('❌ Error validating affiliate code:', error);
    return {
      id: '',
      code: code.toUpperCase().trim(),
      discount: 0,
      name: '',
      valid: false
    };
  }
}

// Direct module execution is handled by debug-affiliate-code.ts