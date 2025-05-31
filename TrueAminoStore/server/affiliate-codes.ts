/**
 * Affiliate Code Management
 * Validates discount codes and returns discount percentages
 */

import fetch from "node-fetch";

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

/**
 * Validates an affiliate code against the Airtable database
 * @param code The affiliate code to validate
 * @returns AffiliateCodeResponse with discount percentage if valid
 */
export async function validateAffiliateCode(code: string): Promise<AffiliateCodeResponse> {
  try {
    // Format code for comparison (uppercase and trim)
    const formattedCode = code.toUpperCase().trim();
    
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    
    if (!airtableApiKey || !airtableBaseId) {
      console.error('Missing Airtable credentials');
      return {
        id: '',
        code: formattedCode,
        discount: 0,
        name: '',
        valid: false
      };
    }
    
    const tableId = "Affiliates"; // Affiliate codes table name
    
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
      // Use type casting to access fields with various potential names
      const fields = record.fields as Record<string, any>;
      
      // Check multiple potential field names due to inconsistency in Airtable
      // Based on direct API inspection, the correct field name is "Code" with capital C
      const recordCodeLower = fields.code?.toUpperCase().trim();
      const recordCodeUpper = fields.Code?.toUpperCase().trim();  // This is the actual field name in Airtable (capital C)
      
      // Use either the lowercase or uppercase version, prioritizing "Code" (with capital C)
      const recordCode = recordCodeUpper || recordCodeLower || '';
      
      console.log(`Comparing code: "${formattedCode}" with Airtable record code: "${recordCode}" (from Code: "${recordCodeUpper}" or code: "${recordCodeLower}")`);
      
      const isActive = fields.active !== false; // undefined or true means active
      return recordCode === formattedCode && isActive;
    });
    
    if (matchingCode) {
      // Cast fields to any type to handle various field names
      const fields = matchingCode.fields as Record<string, any>;
      
      // Get the code and discount with appropriate fallbacks
      // Prioritize the "Code" field with capital C since it's the correct field name in Airtable
      const codeValue = fields.Code || 
                        fields.code || 
                        fields['Affiliate Code'] || 
                        fields['affiliate code'] || 
                        fields.affiliateCode || 
                        fields.affiliatecode || 
                        formattedCode;
      
      // Looking at the debug output, it appears the field name is "discount" (lowercase)
      // but let's check all variations to be safe
      const discountValue = fields.discount || // This appears to be the correct field name
                           fields.Discount || 
                           fields['Discount Percentage'] || 
                           fields['discount percentage'] || 
                           0;
      
      const nameValue = fields.name || 
                       fields.Name || 
                       fields['Affiliate Name'] || 
                       fields['affiliate name'] || 
                       '';
      
      console.log(`Found matching code: "${codeValue}" with discount: ${discountValue}%`);
      
      return {
        id: matchingCode.id,
        code: codeValue,
        discount: discountValue,
        name: nameValue,
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
    console.log(`Adding affiliate code ${affiliateCode} to session ${sessionId}`);
    
    const airtableApiKey = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
    const airtableBaseId = "app3XDDBbU0ZZDBiY";
    const tableId = "tblhjfzTX2zjf22s1"; // Cart sessions table ID
    
    // Base Airtable API URL
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tableId}`;
    
    // First, check if a record for this session already exists
    // Note: Correct the formula syntax for Airtable with proper field name "session id" with space
    const existingRecordResponse = await fetch(`${airtableUrl}?filterByFormula=%7Bsession+id%7D%3D%22${encodeURIComponent(sessionId)}%22`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!existingRecordResponse.ok) {
      console.error('Error checking for existing session record:', await existingRecordResponse.text());
      return false;
    }
    
    const existingRecordData = await existingRecordResponse.json() as any;
    console.log('Existing record search results:', JSON.stringify(existingRecordData, null, 2));
    
    if (existingRecordData.records && existingRecordData.records.length > 0) {
      // Update existing record
      const recordId = existingRecordData.records[0].id;
      console.log(`Found existing record with ID: ${recordId}, updating with affiliate code: ${affiliateCode}`);
      
      // First, get the record to see the exact field name structure
      const getFieldsResponse = await fetch(`${airtableUrl}/${recordId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!getFieldsResponse.ok) {
        console.error('Error getting record fields:', await getFieldsResponse.text());
        return false;
      }
      
      const recordData = await getFieldsResponse.json() as { id: string; fields: Record<string, any> };
      console.log('Record fields:', JSON.stringify(recordData.fields, null, 2));
      
      // Determine field names available in this table
      const fieldNames = Object.keys(recordData.fields || {});
      console.log('Available field names:', fieldNames);
      
      // Look for affiliate code field name (case insensitive)
      // Prioritize the field "Code" (with capital C) as it's the correct field name in Airtable
      const affiliateCodeFieldName = fieldNames.find(name => name === 'Code') || 
        fieldNames.find(
          name => name.toLowerCase() === 'code' || name.toLowerCase() === 'affiliatecode' || 
          name.toLowerCase() === 'affiliate_code' || name.toLowerCase() === 'affiliatediscount' || 
          name.toLowerCase() === 'affiliate code'
        );
      
      console.log('Found field name for affiliate code:', affiliateCodeFieldName || 'Not found, using default "Code"');
      
      // Based on direct API inspection and debugging, the field name in Airtable is "affiliatecode" (lowercase)
      // Always use explicit field names that match exactly what's in Airtable
      const updateFields = {
        fields: {
          affiliatecode: affiliateCode // Use "affiliatecode" (lowercase) as the field name
        }
      };
      
      console.log('Updating record with payload:', JSON.stringify(updateFields, null, 2));
      
      const updateResponse = await fetch(`${airtableUrl}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateFields)
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Error updating affiliate code in session:', errorText);
        
        // Try with multiple variations to cover all possibilities
        const updateFieldsAllVariations = {
          fields: {
            "affiliatecode": affiliateCode, // Correct field name (lowercase)
            "code": affiliateCode, // Lowercase version
            "Code": affiliateCode, // Capital C version
            "affiliate code": affiliateCode, // With space
            "affiliateCode": affiliateCode, // CamelCase
            "affiliate_code": affiliateCode // With underscore
          }
        };
        
        console.log('Trying again with multiple field variations:', JSON.stringify(updateFieldsAllVariations, null, 2));
        
        const updateResponse2 = await fetch(`${airtableUrl}/${recordId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateFieldsAllVariations)
        });
        
        if (!updateResponse2.ok) {
          console.error('Second attempt failed too:', await updateResponse2.text());
          return false;
        }
        
        console.log('Successfully updated affiliate code (second attempt)');
        return true;
      }
      
      console.log('Successfully updated affiliate code');
      return true;
    } else {
      // Don't automatically create new records - only store affiliate code in session
      console.log(`No existing cart record found for session ${sessionId}. Affiliate code will be stored in session only.`);
      console.log(`Affiliate code ${affiliateCode} will be applied when user adds items to cart.`);
      return false; // Return false to indicate no Airtable record was created
    }
  } catch (error) {
    console.error('Error adding affiliate code to session:', error);
    return false;
  }
}