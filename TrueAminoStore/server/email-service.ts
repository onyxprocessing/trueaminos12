/**
 * Email service
 * This module handles sending order confirmation emails with tracking info
 */

import { OrderData } from './airtable-orders';

/**
 * Mock function to send an order confirmation email with tracking information
 * In a production environment, this would connect to a real email service
 * For our purposes, we'll just log the email details
 * 
 * @param orderData Order data with customer and product information
 * @param trackingCode The shipping tracking code (mock value for now)
 * @returns True if the email was "sent" successfully
 */
export async function sendOrderConfirmationEmail(
  orderData: OrderData,
  trackingCode: string = generateMockTrackingCode()
): Promise<boolean> {
  if (!orderData.email) {
    console.warn('Cannot send order confirmation - no email address provided');
    return false;
  }
  
  try {
    const emailSubject = `TrueAminos Order Confirmation - Order #${orderData.orderId}`;
    
    // Create a simple HTML email body
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #2c3e50;">Your TrueAminos Order is Confirmed</h1>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin-top: 0;">Order Details</h2>
              <p><strong>Order Number:</strong> ${orderData.orderId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Shipping Address:</strong><br>
              ${orderData.firstName} ${orderData.lastName}<br>
              ${orderData.address}<br>
              ${orderData.city}, ${orderData.state} ${orderData.zip}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h2>Product Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Quantity</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Price</th>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">${orderData.product || `Product #${orderData.productId}`} (${orderData.mg || 'Standard'})</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">${orderData.quantity}</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">$${Number(orderData.salesPrice).toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin-top: 0;">Tracking Information</h2>
              <p>Your order has been shipped via ${orderData.shipping || 'USPS (1-2 business days)'}.</p>
              <p><strong>Tracking Number:</strong> <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingCode}" style="color: #3498db;">${trackingCode}</a></p>
              <p>You can track your package by clicking the tracking number above or visiting the USPS website.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 14px;">
              <p>Thank you for shopping with TrueAminos!</p>
              <p>If you have any questions about your order, please contact us at support@trueaminos.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // In a real application, this would connect to an email service like SendGrid, Mailgun, etc.
    // For this example, we'll just log the email details
    console.log(`✅ Would send email to: ${orderData.email}`);
    console.log(`✅ Email subject: ${emailSubject}`);
    console.log(`✅ Email tracking code: ${trackingCode}`);
    console.log('✅ Email notification queued for delivery');
    
    return true;
  } catch (error: any) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

/**
 * Generate a mock USPS tracking code for demonstration purposes
 * Format: 9400 1000 0000 0000 0000 00
 * @returns Mock tracking code string
 */
function generateMockTrackingCode(): string {
  const generateRandomDigits = (length: number): string => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  };
  
  // Generate a mock USPS tracking number (format: 9400 1000 0000 0000 0000 00)
  const trackingCode = `9400 ${generateRandomDigits(4)} ${generateRandomDigits(4)} ${generateRandomDigits(4)} ${generateRandomDigits(2)}`;
  
  return trackingCode;
}