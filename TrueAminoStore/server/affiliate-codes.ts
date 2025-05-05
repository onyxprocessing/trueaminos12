/**
 * Affiliate Code Management
 * Validates discount codes and returns discount percentages
 */

import fetch from "node-fetch";

interface AirtableAffiliateCode {
  id: string;
  fields: {
    code?: string;
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
      // Use type casting to access fields with various potential names
      const fields = record.fields as Record<string, any>;
      
      // Check multiple potential field names due to inconsistency in Airtable
      // Based on direct API inspection, the correct field name is "Code" with capital C
      const recordCode = (
        fields.Code || // This is the actual field name in Airtable (capital C)
        fields.code || 
        fields['Affiliate Code'] || 
        fields['affiliate code'] || 
        fields.affiliateCode || 
        fields.affiliatecode || 
        ''
      )?.toUpperCase().trim();
      
      console.log(`Comparing code: "${formattedCode}" with Airtable record code: "${recordCode}"`);
      
      const isActive = fields.active !== false; // undefined or true means active
      return recordCode === formattedCode && isActive;
    });
    
    if (matchingCode) {
      // Cast fields to any type to handle various field names
      const fields = matchingCode.fields as Record<string, any>;
      
      // Get the code and discount with appropriate fallbacks
      const codeValue = fields.code || 
                        fields.Code || 
                        fields['Affiliate Code'] || 
                        fields['affiliate code'] || 
                        fields.affiliateCode || 
                        fields.affiliatecode || 
                        formattedCode;
      
      const discountValue = fields.discount || 
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
    // Note: Correct the formula syntax for Airtable
    const existingRecordResponse = await fetch(`${airtableUrl}?filterByFormula=%7BsessionId%7D%3D%22${encodeURIComponent(sessionId)}%22`, {
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
      const affiliateCodeFieldName = fieldNames.find(
        name => name.toLowerCase() === 'code' || name.toLowerCase() === 'affiliatecode' || 
        name.toLowerCase() === 'affiliate_code' || name.toLowerCase() === 'affiliatediscount' || 
        name.toLowerCase() === 'affiliate code'
      );
      
      console.log('Found field name for affiliate code:', affiliateCodeFieldName || 'Not found, using default "affiliatecode"');
      
      // Based on direct API inspection, the field name in Airtable is "Code" with capital C
      // Always use explicit field names that match exactly what's in Airtable
      const updateFields = {
        fields: {
          Code: affiliateCode // Use "Code" (with capital C) as the field name
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
            "code": affiliateCode, // Based on our latest information
            "affiliatecode": affiliateCode, // Original field name
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
      // Create a new record
      console.log(`No existing record found, creating new record with sessionId: ${sessionId}, affiliateCode: ${affiliateCode}`);
      
      // Create a payload with the field name "Code" with capital C
      const createPayload = {
        records: [{
          fields: {
            'sessionId': sessionId,
            'Code': affiliateCode  // Use "Code" (with capital C) as the field name
          }
        }]
      };
      
      console.log('Creating new record with payload:', JSON.stringify(createPayload, null, 2));
      
      const createResponse = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('Error creating new session record with affiliate code:', errorText);
        return false;
      }
      
      const createResult = await createResponse.json();
      console.log('Successfully created new record with affiliate code:', createResult);
      return true;
    }
  } catch (error) {
    console.error('Error adding affiliate code to session:', error);
    return false;
  }
}