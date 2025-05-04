/**
 * Checkout success data handling
 * This module provides functions to save checkout success data in Airtable
 */

import { Request, Response } from 'express';
import { generateUniqueOrderId, createOrderInAirtable } from './airtable-orders';

/**
 * Handle checkout success data submission
 * @param req Express request
 * @param res Express response
 */
export async function handleCheckoutSuccessData(req: Request, res: Response) {
  try {
    console.log('📦 Received checkout success data');
    
    const checkoutData = req.body;
    
    if (!checkoutData) {
      return res.status(400).json({
        success: false,
        message: 'No checkout data provided'
      });
    }

    console.log('Checkout success data:', JSON.stringify(checkoutData, null, 2));
    
    // Generate a new order ID if one doesn't exist
    const orderId = checkoutData.orderId || generateUniqueOrderId();
    
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