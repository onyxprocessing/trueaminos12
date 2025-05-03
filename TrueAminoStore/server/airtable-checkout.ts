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
  status: 'started' | 'personal_info' | 'shipping_info' | 'payment_selection' | 'payment_processing' | 'completed' | 'abandoned';
  cartItems?: any[];
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// Airtable constants
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_CARTS_TABLE = 'tblhjfzTX2zjf22s1'; // Table for abandoned carts

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
          // Use correct Airtable field names - lowercased and with spaces
          "checkoutid": checkoutData.checkoutId,
          "sessionid": checkoutData.sessionId,
          "status": checkoutData.status,
          "created at": checkoutData.createdAt
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
    if (updateData.firstName) fields["first name"] = updateData.firstName;
    if (updateData.lastName) fields["last name"] = updateData.lastName;
    if (updateData.email) fields["email"] = updateData.email;
    if (updateData.phone) fields["phone"] = updateData.phone;
    if (updateData.address) fields["address"] = updateData.address;
    if (updateData.city) fields["city"] = updateData.city;
    if (updateData.state) fields["state"] = updateData.state;
    if (updateData.zip) fields["zip"] = updateData.zip;
    if (updateData.shippingMethod) fields["shippingmethod"] = updateData.shippingMethod;
    if (updateData.status) fields["status"] = updateData.status;
    if (updateData.totalAmount) fields["totalamount"] = updateData.totalAmount;
    
    // Always update updatedAt
    fields["updated at"] = new Date().toISOString();
    
    // If cart items are provided, stringify them
    if (updateData.cartItems) {
      fields["cartitems"] = JSON.stringify(updateData.cartItems);
    }

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
      console.error('Failed to update checkout in Airtable:', await updateResponse.text());
      return false;
    }

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