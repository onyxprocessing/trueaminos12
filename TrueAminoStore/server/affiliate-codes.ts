/**
 * Affiliate Code Management
 * Validates discount codes and returns discount percentages
 */

import fetch from "node-fetch";

interface AirtableAffiliateCode {
  id: string;
  fields: {
    Code?: string;
    discount?: number;
    name?: string;
    active?: boolean;
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

/**
 * Validates an affiliate code against the Airtable database
 * @param code The affiliate code to validate
 * @returns AffiliateCodeResponse with discount percentage if valid
 */
export async function validateAffiliateCode(code: string): Promise<AffiliateCodeResponse> {
  try {
    const airtableApiKey = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
    const airtableBaseId = "app3XDDBbU0ZZDBiY";
    const tableId = "tblbQbjX0RQbguX5e"; // Affiliate codes table ID
    
    // Format code for comparison (uppercase and trim)
    const formattedCode = code.toUpperCase().trim();
    
    // Base Airtable API URL
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableId}`;
    
    // Fetch all affiliate codes (filtering by code in query isn't reliable for exact matches)
    const response = await fetch(`${airtableUrl}?maxRecords=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      return {
        id: '',
        code: formattedCode,
        discount: 0,
        name: '',
        valid: false
      };
    }
    
    const data = await response.json() as AirtableResponse;
    
    // Find the matching code from the results
    const matchingCode = data.records.find(record => {
      const recordCode = record.fields.Code?.toUpperCase().trim();
      const isActive = record.fields.active !== false; // undefined or true means active
      return recordCode === formattedCode && isActive;
    });
    
    if (matchingCode) {
      return {
        id: matchingCode.id,
        code: matchingCode.fields.Code || formattedCode,
        discount: matchingCode.fields.discount || 0,
        name: matchingCode.fields.name || '',
        valid: true
      };
    }
    
    return {
      id: '',
      code: formattedCode,
      discount: 0,
      name: '',
      valid: false
    };
  } catch (error) {
    console.error('Error validating affiliate code:', error);
    return {
      id: '',
      code: code.toUpperCase().trim(),
      discount: 0,
      name: '',
      valid: false
    };
  }
}

/**
 * Add affiliate code to cart session in Airtable
 * @param sessionId The cart session ID
 * @param affiliateCode The validated affiliate code
 * @returns Whether the update was successful
 */
export async function addAffiliateCodeToSession(sessionId: string, affiliateCode: string): Promise<boolean> {
  try {
    const airtableApiKey = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
    const airtableBaseId = "app3XDDBbU0ZZDBiY";
    const tableId = "tblhjfzTX2zjf22s1"; // Cart sessions table ID
    
    // Base Airtable API URL
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableId}`;
    
    // First, check if a record for this session already exists
    const existingRecordResponse = await fetch(`${airtableUrl}?filterByFormula={sessionId}="${sessionId}"`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!existingRecordResponse.ok) {
      console.error('Error checking for existing session record:', existingRecordResponse.statusText);
      return false;
    }
    
    const existingRecordData = await existingRecordResponse.json() as AirtableResponse;
    
    if (existingRecordData.records && existingRecordData.records.length > 0) {
      // Update existing record
      const recordId = existingRecordData.records[0].id;
      
      const updateResponse = await fetch(`${airtableUrl}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            affiliatecode: affiliateCode
          }
        })
      });
      
      if (!updateResponse.ok) {
        console.error('Error updating affiliate code in session:', updateResponse.statusText);
        return false;
      }
      
      return true;
    } else {
      // Create a new record
      const createResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              sessionId: sessionId,
              affiliatecode: affiliateCode
            }
          }]
        })
      });
      
      if (!createResponse.ok) {
        console.error('Error creating new session record with affiliate code:', createResponse.statusText);
        return false;
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error adding affiliate code to session:', error);
    return false;
  }
}