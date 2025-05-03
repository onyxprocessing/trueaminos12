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
  const orderUniqueId = generateUniqueOrderId();
  
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
        orderId: orderUniqueId,
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
        salesPrice: price.toString(),
        shipping,
        paymentIntentId,
        paymentDetails: JSON.stringify({
          paymentIntentId,
          amount: price * item.quantity,
          date: new Date().toISOString(),
          items: [{ id: product.id, name: product.name, quantity: item.quantity }]
        })
      };
      
      const newOrderId = await createOrderInDatabase(orderData);
      if (newOrderId) {
        orderIds.push(newOrderId);
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

    console.log('Processing payment for database storage:', paymentIntent.id);
    
    // Check if we have the new orderSummary format
    if (paymentIntent.metadata.orderSummary) {
      try {
        const orderSummary = JSON.parse(paymentIntent.metadata.orderSummary);
        const shipping = orderSummary.shipping || 'standard';
        
        // Create a unique order ID
        const orderUniqueId = generateUniqueOrderId();
        const orderIds: number[] = [];
        
        // Extract customer data from the payment intent
        const customerData = {
          firstName: paymentIntent.shipping?.name?.split(' ')[0] || orderSummary.customer?.split(' ')[0] || 'Unknown',
          lastName: (paymentIntent.shipping?.name?.split(' ').slice(1).join(' ') || 
                     orderSummary.customer?.split(' ').slice(1).join(' ') || 'Customer'),
          email: orderSummary.email || paymentIntent.receipt_email || '',
          phone: paymentIntent.shipping?.phone || paymentIntent.metadata?.customer_phone || '',
          address: paymentIntent.shipping?.address?.line1 || '',
          city: paymentIntent.shipping?.address?.city || '',
          state: paymentIntent.shipping?.address?.state || '',
          zipCode: paymentIntent.shipping?.address?.postal_code || ''
        };
        
        // Format payment details as JSON
        const paymentDetails = JSON.stringify({
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          created: new Date(paymentIntent.created * 1000).toISOString()
        });
        
        // Calculate total items to distribute price
        let totalItems = 0;
        orderSummary.items.forEach((item: any) => {
          totalItems += item.qty || 1;
        });
        
        // Calculate per-item price (approximate)
        const perItemPrice = (paymentIntent.amount / 100) / Math.max(totalItems, 1);
        
        // Process each item in the order
        for (const item of orderSummary.items) {
          const orderData: InsertOrder = {
            orderId: orderUniqueId,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            city: customerData.city,
            state: customerData.state,
            zip: customerData.zipCode,
            productId: item.id,
            productName: item.name,
            quantity: item.qty || 1,
            selectedWeight: item.weight,
            salesPrice: perItemPrice.toFixed(2),
            shipping,
            paymentIntentId: paymentIntent.id,
            paymentDetails
          };
          
          const newOrderId = await createOrderInDatabase(orderData);
          if (newOrderId) {
            orderIds.push(newOrderId);
            console.log(`DB order record created for product ${item.name} (${item.id})`);
          }
        }
        
        return orderIds.length > 0;
      } catch (error) {
        console.error('Error processing orderSummary from metadata:', error);
      }
    }
    
    // Fall back to legacy format if the new format isn't available
    try {
      // Try with products format
      if (paymentIntent.metadata.products) {
        const products = JSON.parse(paymentIntent.metadata.products || '[]');
        const shipping = paymentIntent.metadata.shipping_method || 'standard';
        
        if (products.length > 0) {
          // Create a unique order ID
          const orderUniqueId = generateUniqueOrderId();
          const orderIds: number[] = [];
          
          // Extract customer data from the payment intent
          const customerData = {
            firstName: paymentIntent.shipping?.name?.split(' ')[0] || 'Unknown',
            lastName: paymentIntent.shipping?.name?.split(' ').slice(1).join(' ') || 'Customer',
            email: paymentIntent.receipt_email || '',
            phone: paymentIntent.shipping?.phone || paymentIntent.metadata?.customer_phone || '',
            address: paymentIntent.shipping?.address?.line1 || '',
            city: paymentIntent.shipping?.address?.city || '',
            state: paymentIntent.shipping?.address?.state || '',
            zipCode: paymentIntent.shipping?.address?.postal_code || ''
          };
          
          // Process each product
          for (const product of products) {
            const orderData: InsertOrder = {
              orderId: orderUniqueId,
              firstName: customerData.firstName,
              lastName: customerData.lastName,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.address,
              city: customerData.city,
              state: customerData.state,
              zip: customerData.zipCode,
              productId: product.id,
              productName: product.name,
              quantity: product.quantity || 1,
              selectedWeight: product.weight,
              salesPrice: product.price.toString(),
              shipping,
              paymentIntentId: paymentIntent.id,
              paymentDetails: JSON.stringify({
                id: paymentIntent.id,
                amount: product.price * (product.quantity || 1),
                currency: paymentIntent.currency,
                status: paymentIntent.status,
                created: new Date(paymentIntent.created * 1000).toISOString()
              })
            };
            
            const newOrderId = await createOrderInDatabase(orderData);
            if (newOrderId) {
              orderIds.push(newOrderId);
            }
          }
          
          return orderIds.length > 0;
        }
      }
      
      // If all else fails, try the orderDetails (very old format, may not be available)
      const { customerInfo, cartItems, shipping } = JSON.parse(paymentIntent.metadata.orderDetails || '{}');
      
      if (!customerInfo || !cartItems || !shipping) {
        console.error('Missing required data in all metadata formats');
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
      console.error('Error processing payment intent metadata:', error);
      return false;
    }
  } catch (error) {
    console.error('Error recording payment to database:', error);
    return false;
  }
}