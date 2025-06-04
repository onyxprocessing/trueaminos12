/**
 * Airtable checkout tracking
 * This module handles saving checkout information to Airtable for tracking abandoned carts
 */

import fetch from 'node-fetch';
import { randomBytes } from 'crypto';

// Define checkout data interface
export interface CheckoutData {
  checkoutId: string;
  sessionId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  shippingMethod?: string;
  shippingDetails?: {
    method: string;
    price: number;
    estimatedDelivery?: string;
    notes?: string;
    addressValidated?: boolean;
    addressClassification?: string;
  };
  paymentDetails?: {
    method: string;
    status: string;
    timestamp: string;
    cardDetails?: {
      lastFour: string;
      expiryMonth: string;
      expiryYear: string;
      nameOnCard: string;
    } | null;
    bankDetails?: {
      accountName: string;
      accountNumber: string;
      routingNumber: string;
      bankName: string;
    } | null;
    cryptoDetails?: {
      currency: string;
      walletAddress: string;
      transactionReference: string;
    } | null;
  };
  status: 'started' | 'personal_info' | 'shipping_info' | 'payment_selection' | 'payment_processing' | 'completed' | 'abandoned';
  cartItems?: any[];
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// Airtable constants
// Use hardcoded fallback values if environment variables are not available
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app3XDDBbU0ZZDBiY';
const AIRTABLE_CARTS_TABLE = 'tblhjfzTX2zjf22s1'; // Table for abandoned carts

console.log('Airtable integration configured with:');
console.log('AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? 'Present (length: ' + AIRTABLE_API_KEY.length + ')' : 'Missing');
console.log('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID ? 'Present (value: ' + AIRTABLE_BASE_ID + ')' : 'Missing');

/**
 * Generate a unique checkout ID
 * Format: CHK-[timestamp]-[random chars]
 */
export function generateCheckoutId(): string {
  const timestamp = Date.now();
  const randomStr = randomBytes(3).toString('hex').toUpperCase();
  return `CHK-${timestamp}-${randomStr}`;
}

/**
 * Create a new checkout record in Airtable
 * @param sessionId Session ID from the client
 * @returns The created checkout ID
 */
export async function createCheckoutInAirtable(sessionId: string): Promise<string> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable credentials missing. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID');
    console.error('AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? 'Present (length: ' + AIRTABLE_API_KEY.length + ')' : 'Missing');
    console.error('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID ? 'Present (value: ' + AIRTABLE_BASE_ID + ')' : 'Missing');
    return '';
  }

  const checkoutId = generateCheckoutId();
  const now = new Date().toISOString();

  const checkoutData: CheckoutData = {
    checkoutId,
    sessionId,
    status: 'started',
    createdAt: now,
    updatedAt: now
  };

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CARTS_TABLE}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          // Use correct Airtable field names - lowercased and without spaces
          "checkoutid": checkoutData.checkoutId,
          "session id": checkoutData.sessionId,  // Correct field name with space
          "status": checkoutData.status,
          "createdat": checkoutData.createdAt,  // Removed space in field name
          "firstname": "",
          "lastname": "",
          "email": "",
          "phone": ""
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to create checkout in Airtable:', await response.text());
      return '';
    }

    const data = await response.json();
    console.log('✅ Checkout created in Airtable:', checkoutId);
    return checkoutId;
  } catch (error) {
    console.error('Error creating checkout in Airtable:', error);
    return '';
  }
}

/**
 * Update an existing checkout record in Airtable
 * @param checkoutId Checkout ID to update
 * @param updateData New data to update
 * @returns True if update was successful
 */
export async function updateCheckoutInAirtable(checkoutId: string, updateData: Partial<CheckoutData>): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Airtable credentials missing. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID');
    console.error('AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? 'Present (length: ' + AIRTABLE_API_KEY.length + ')' : 'Missing');
    console.error('AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID ? 'Present (value: ' + AIRTABLE_BASE_ID + ')' : 'Missing');
    return false;
  }

  try {
    // First, find the record ID by checkout ID
    const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CARTS_TABLE}?filterByFormula={checkoutid}="${checkoutId}"`;
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      console.error('Failed to find checkout in Airtable:', await searchResponse.text());
      return false;
    }

    const searchData = await searchResponse.json() as any;
    if (!searchData.records || searchData.records.length === 0) {
      console.error('Checkout not found in Airtable:', checkoutId);
      return false;
    }

    const recordId = searchData.records[0].id;

    // Update the record with new data
    const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_CARTS_TABLE}/${recordId}`;
    
    // Convert updateData to Airtable fields format
    const fields: any = {};
    
    // Only include fields that are present in updateData
    console.log('Updating checkout with data:', JSON.stringify(updateData, null, 2));
    
    if (updateData.firstName) {
      fields["firstname"] = updateData.firstName;
      console.log('Setting firstName:', updateData.firstName);
    }
    if (updateData.lastName) {
      fields["lastname"] = updateData.lastName;
      console.log('Setting lastName:', updateData.lastName);
    }
    if (updateData.email) {
      fields["email"] = updateData.email;
      console.log('Setting email:', updateData.email);
    }
    if (updateData.phone) {
      fields["phone"] = updateData.phone;
      console.log('Setting phone:', updateData.phone);
    }
    if (updateData.address) {
      fields["address"] = updateData.address;
      console.log('Setting address:', updateData.address);
    }
    if (updateData.city) {
      fields["city"] = updateData.city;
      console.log('Setting city:', updateData.city);
    }
    if (updateData.state) {
      fields["state"] = updateData.state;
      console.log('Setting state:', updateData.state);
    }
    if (updateData.zip) {
      fields["zip"] = updateData.zip;
      console.log('Setting zip:', updateData.zip);
    }
    if (updateData.shippingMethod) {
      fields["shippingmethod"] = updateData.shippingMethod;
      console.log('Setting shippingMethod:', updateData.shippingMethod);
    }
    
    // Handle the shippingDetails JSON field
    if (updateData.shippingDetails) {
      // Convert the shipping details object to a JSON string for Airtable
      fields["shippingdetails"] = JSON.stringify(updateData.shippingDetails);
      console.log('Setting shippingDetails:', JSON.stringify(updateData.shippingDetails));
    }
    
    // Handle the paymentDetails JSON field
    if (updateData.paymentDetails) {
      // Convert the payment details object to a JSON string for Airtable
      fields["paymentdetails"] = JSON.stringify(updateData.paymentDetails);
      console.log('Setting paymentDetails:', JSON.stringify(updateData.paymentDetails));
    }
    if (updateData.status) {
      fields["status"] = updateData.status;
      console.log('Setting status:', updateData.status);
    }
    if (updateData.totalAmount) {
      fields["total"] = updateData.totalAmount;
      console.log('Setting totalAmount:', updateData.totalAmount);
    }
    
    // Always update updatedAt
    fields["updatedat"] = new Date().toISOString();
    
    // If cart items are provided, stringify them
    if (updateData.cartItems) {
      fields["cartitems"] = JSON.stringify(updateData.cartItems);
    }

    // Log the request data
    console.log('Sending update to Airtable URL:', updateUrl);
    console.log('Update fields:', JSON.stringify(fields, null, 2));
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update checkout in Airtable:', errorText);
      console.error('Status code:', updateResponse.status);
      console.error('Status text:', updateResponse.statusText);
      return false;
    }
    
    // Log the response
    const responseData = await updateResponse.json();
    console.log('Airtable update response:', JSON.stringify(responseData, null, 2));

    console.log('✅ Checkout updated in Airtable:', checkoutId);
    return true;
  } catch (error) {
    console.error('Error updating checkout in Airtable:', error);
    return false;
  }
}

/**
 * Mark a checkout as completed
 * @param checkoutId Checkout ID to mark as completed
 * @returns True if update was successful
 */
export async function markCheckoutCompleted(checkoutId: string): Promise<boolean> {
  return updateCheckoutInAirtable(checkoutId, { 
    status: 'completed',
    updatedAt: new Date().toISOString()
  });
}

/**
 * Mark a checkout as abandoned
 * @param checkoutId Checkout ID to mark as abandoned
 * @returns True if update was successful
 */
export async function markCheckoutAbandoned(checkoutId: string): Promise<boolean> {
  return updateCheckoutInAirtable(checkoutId, { 
    status: 'abandoned',
    updatedAt: new Date().toISOString()
  });
}