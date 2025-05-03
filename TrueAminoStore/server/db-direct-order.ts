/**
 * Database direct order processing
 * This module handles order processing for all payment methods (card, bank, crypto)
 */
import { db } from './db';
import { orders, InsertOrder, Order } from '@shared/schema';
// Import Drizzle transformers for type safety
import { eq } from 'drizzle-orm';
import { getCustomerBySessionId } from './db-customer';
import { storage } from './storage';
import { createOrderInAirtable } from './airtable-orders';
import { generateUniqueOrderId } from './airtable-orders';

/**
 * Create an order using data from various payment methods
 * @param sessionId The session ID for the order
 * @param paymentMethod The payment method (card, bank, crypto)
 * @param paymentDetails Optional payment details object
 * @returns An array of created order IDs
 */
export async function createOrderWithPaymentMethod(
  sessionId: string,
  paymentMethod: string,
  paymentDetails?: any
): Promise<number[]> {
  try {
    // 1. Get customer information
    const customer = await getCustomerBySessionId(sessionId);
    if (!customer) {
      throw new Error('Customer information not found');
    }

    // 2. Get cart items
    const cartItems = await storage.getCartItems(sessionId);
    if (!cartItems || cartItems.length === 0) {
      throw new Error('No items in cart');
    }

    // 3. Create orders for each cart item
    const orderIds: number[] = [];
    const paymentDetailsString = paymentDetails ? JSON.stringify(paymentDetails) : '';

    for (const item of cartItems) {
      // Generate a unique order ID
      const orderId = generateUniqueOrderId();
      
      // Create order record
      const orderData: InsertOrder = {
        orderId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        selectedWeight: item.selectedWeight || '',
        // Convert to string for database storage (numeric fields are stored as strings)
        salesPrice: String(getPriceByWeight(item.product, item.selectedWeight)),
        shipping: customer.shipping,
        paymentMethod,
        paymentIntentId: paymentDetails?.id || '',
        paymentDetails: paymentDetailsString,
        paymentStatus: 'completed',
        id: 0, // Placeholder, will be set by database
        createdAt: new Date()
      };

      // Save to database
      const [order] = await db.insert(orders).values(orderData).returning();
      orderIds.push(order.id);

      // Also save to Airtable for compatibility
      await createOrderInAirtable({
        orderId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        mg: item.selectedWeight || '',
        salesPrice: String(getPriceByWeight(item.product, item.selectedWeight)),
        quantity: item.quantity,
        productId: item.productId,
        shipping: customer.shipping,
        payment: paymentDetailsString,
        email: customer.email || '',
        phone: customer.phone || '',
        product: item.product.name
      });
    }

    // 4. Clear cart
    await storage.clearCart(sessionId);

    return orderIds;
  } catch (error) {
    console.error('Error creating order with payment method:', error);
    throw error;
  }
}

/**
 * Helper function to get price based on selected weight
 */
function getPriceByWeight(product: any, selectedWeight: string | null): number {
  if (!selectedWeight) {
    const price = product.price || 0;
    return typeof price === 'string' ? parseFloat(price) : price;
  }

  const priceField = `price${selectedWeight.toLowerCase()}`;
  const price = product[priceField] || product.price || 0;
  return typeof price === 'string' ? parseFloat(price) : price;
}