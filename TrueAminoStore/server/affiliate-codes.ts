/**
 * Affiliate Code Management
 * Validates discount codes and returns discount percentages
 */

import fetch from 'node-fetch';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
const AIRTABLE_BASE_ID = "app3XDDBbU0ZZDBiY";
const AFFILIATE_CODES_TABLE_ID = "tblbQbjX0RQbguX5e";

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
  if (!code || code.trim() === '') {
    return {
      id: '',
      code: '',
      discount: 0,
      name: '',
      valid: false
    };
  }

  try {
    // Format the code for URL safe querying (uppercase and trim)
    const formattedCode = code.trim().toUpperCase();
    
    // Query Airtable for the code
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AFFILIATE_CODES_TABLE_ID}?filterByFormula=UPPER({Code})="${formattedCode}"`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      console.error(`Airtable API error: ${response.status} ${response.statusText}`);
      return {
        id: '',
        code: formattedCode,
        discount: 0,
        name: '',
        valid: false
      };
    }
    
    const data = await response.json() as any;
    
    // Check if we got any records back
    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      const discount = record.fields.discount || 0;
      const name = record.fields.name || 'Affiliate';
      
      console.log(`Valid affiliate code found: ${formattedCode}, Discount: ${discount}%`);
      
      return {
        id: record.id,
        code: formattedCode,
        discount: discount,
        name: name,
        valid: true
      };
    } else {
      console.log(`Invalid affiliate code: ${formattedCode}`);
      return {
        id: '',
        code: formattedCode,
        discount: 0,
        name: '',
        valid: false
      };
    }
  } catch (error) {
    console.error('Error validating affiliate code:', error);
    return {
      id: '',
      code: code,
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
  if (!sessionId || !affiliateCode) {
    return false;
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/tblhjfzTX2zjf22s1/${sessionId}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          affiliatecode: affiliateCode
        }
      })
    });
    
    if (!response.ok) {
      console.error(`Error updating cart session with affiliate code: ${response.status} ${response.statusText}`);
      return false;
    }
    
    console.log(`Successfully added affiliate code ${affiliateCode} to session ${sessionId}`);
    return true;
  } catch (error) {
    console.error('Error adding affiliate code to session:', error);
    return false;
  }
}