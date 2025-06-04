/**
 * Checkout success data handling
 * This module provides functions to save checkout success data in Airtable
 */

import { Request, Response } from 'express';
import { generateUniqueOrderId, createOrderInAirtable } from './airtable-orders';
import fetch from 'node-fetch';

// Direct Airtable insertion for debugging
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d';
const AIRTABLE_BASE_ID = 'app3XDDBbU0ZZDBiY';
const ORDERS_TABLE_ID = 'tblI5N0Xn65DB5L5s';

/**
 * Directly insert into Airtable for debugging
 */
async function insertDirectToAirtable(data: any): Promise<boolean> {
  try {
    console.log('🔍 Attempting direct Airtable insertion for debugging');
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
    
    // Create a simplified record just to test the test field
    const airtableData = {
      fields: {
        "order id": `DEBUG-${Date.now()}`,
        "first name": "Debug",
        "last name": "Test",
        "address": "Test Address",
        "city": "Test City",
        "state": "TS",
        "zip": "12345",
        "mg": "",
        "saleprice": 1,
        "quantity": 1,
        "productid": "0",
        "product": "Debug Product",
        "shipping": "test",
        "payment": "test",
        "test": JSON.stringify(data) // This is what we're testing
      }
    };
    
    console.log('📝 Direct Airtable data:', JSON.stringify(airtableData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`⚠️ Direct Airtable API error: ${response.status} ${response.statusText}`, errorText);
      return false;
    }
    
    const data2 = await response.json() as { id: string };
    console.log('✅ Direct Airtable insert successful with ID:', data2.id);
    return true;
  } catch (error) {
    console.error('❌ Error in direct Airtable insertion:', error);
    return false;
  }
}

/**
 * Handle checkout success data submission
 * @param req Express request
 * @param res Express response
 */
export async function handleCheckoutSuccessData(req: Request, res: Response) {
  try {
    console.log('📦 Received checkout success data on endpoint /api/checkout/success-data');
    
    const checkoutData = req.body;
    
    if (!checkoutData) {
      console.error('❌ No checkout data provided in request body');
      return res.status(400).json({
        success: false,
        message: 'No checkout data provided'
      });
    }

    console.log('Checkout success data:', JSON.stringify(checkoutData, null, 2));
    
    // First try direct insertion for debugging
    const directSuccess = await insertDirectToAirtable(checkoutData);
    console.log('Direct insert result:', directSuccess);
    
    // Generate a new order ID if one doesn't exist
    const orderId = checkoutData.orderId || generateUniqueOrderId();
    console.log('Using order ID:', orderId);
    
    // Create a minimal order record with the success data in the "test" field
    const result = await createOrderInAirtable({
      orderId,
      firstName: checkoutData.firstName || 'Success',
      lastName: checkoutData.lastName || 'Data',
      address: checkoutData.address || '',
      city: checkoutData.city || '',
      state: checkoutData.state || '',
      zip: checkoutData.zip || '',
      salesPrice: checkoutData.amount || 0,
      quantity: 1,
      productId: 0,
      shipping: checkoutData.shippingMethod || 'standard',
      payment: checkoutData.paymentDetails || '',
      // Store the complete checkout data as a JSON string in the "test" field
      test: JSON.stringify(checkoutData)
    });
    
    if (result) {
      console.log('✅ Checkout success data saved to Airtable with record ID:', result);
      return res.json({
        success: true,
        message: 'Checkout success data saved to Airtable',
        recordId: result
      });
    } else {
      console.error('❌ Failed to save checkout success data to Airtable');
      return res.status(500).json({
        success: false,
        message: 'Failed to save checkout success data to Airtable'
      });
    }
  } catch (error) {
    console.error('Error handling checkout success data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error handling checkout success data'
    });
  }
}