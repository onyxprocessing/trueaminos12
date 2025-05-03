import { db } from './db';
import { orders, type InsertOrder } from '../shared/schema';
import { CartItemWithProduct } from "@shared/schema";
import { generateUniqueOrderId } from './airtable-orders';

/**
 * Create an order record in the database
 * @param orderData Order data to be stored
 * @returns The created order ID or null if failed
 */
export async function createOrderInDatabase(orderData: InsertOrder): Promise<number | null> {
  try {
    const [result] = await db.insert(orders).values(orderData).returning({ id: orders.id });
    
    if (!result) {
      console.error('Failed to insert order into database');
      return null;
    }
    
    return result.id;
  } catch (error) {
    console.error('Error creating order in database:', error);
    return null;
  }
}

/**
 * Create order records for all items in a cart in the database
 * @param cartItems Cart items with product details
 * @param customerInfo Customer information
 * @param shipping Shipping method selected
 * @param paymentIntentId Payment intent ID from Stripe
 * @returns Array of created order record IDs
 */
export async function createOrdersFromCart(
  cartItems: CartItemWithProduct[],
  customerInfo: any,
  shipping: string,
  paymentIntentId: string
): Promise<number[]> {
  const orderIds: number[] = [];
  const orderId = generateUniqueOrderId();
  
  try {
    for (const item of cartItems) {
      const product = item.product;
      const selectedWeight = item.selectedWeight || null;
      
      // Convert price to number
      let price = typeof product.price === 'string' ? parseFloat(product.price) : 0;
      
      // If weight-specific price exists, use it
      if (selectedWeight) {
        const priceKey = `price${selectedWeight}` as keyof typeof product;
        if (product[priceKey] && typeof product[priceKey] === 'string') {
          price = parseFloat(product[priceKey] as string);
        }
      }
      
      const orderData: InsertOrder = {
        orderId,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zipCode,
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        selectedWeight,
        salesPrice: price,
        shipping,
        paymentIntentId,
        paymentDetails: JSON.stringify({
          paymentIntentId,
          amount: price * item.quantity,
          date: new Date().toISOString(),
          items: [{ id: product.id, name: product.name, quantity: item.quantity }]
        })
      };
      
      const orderId = await createOrderInDatabase(orderData);
      if (orderId) {
        orderIds.push(orderId);
      }
    }
    
    return orderIds;
  } catch (error) {
    console.error('Error creating orders from cart:', error);
    return [];
  }
}

/**
 * Record payment information to database when a payment is successful
 * @param paymentIntent The Stripe payment intent object
 * @returns True if order was recorded successfully, false otherwise
 */
export async function recordPaymentToDatabase(paymentIntent: any): Promise<boolean> {
  try {
    if (!paymentIntent || !paymentIntent.metadata) {
      console.error('Invalid payment intent received');
      return false;
    }

    const { customerInfo, cartItems, shipping } = JSON.parse(paymentIntent.metadata.orderDetails || '{}');
    
    if (!customerInfo || !cartItems || !shipping) {
      console.error('Missing required data in payment intent metadata');
      return false;
    }
    
    const parsedCartItems = JSON.parse(cartItems);
    
    const orderIds = await createOrdersFromCart(
      parsedCartItems,
      customerInfo,
      shipping,
      paymentIntent.id
    );
    
    return orderIds.length > 0;
  } catch (error) {
    console.error('Error recording payment to database:', error);
    return false;
  }
}