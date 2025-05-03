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
    if (!paymentIntent) {
      console.error('Invalid payment intent received - payment intent is null or undefined');
      return false;
    }

    if (!paymentIntent.id) {
      console.error('Invalid payment intent received - missing ID');
      return false;
    }

    console.log(`🛢️ Processing payment ${paymentIntent.id} for database storage`);
    console.log(`🛢️ Payment amount: ${paymentIntent.amount ? (paymentIntent.amount / 100) : 'unknown'} ${paymentIntent.currency || 'unknown'}`);
    
    // Create a unique order ID that will be shared by all items in this order
    const orderUniqueId = generateUniqueOrderId();
    console.log(`🛢️ Generated unique order ID: ${orderUniqueId}`);
    
    // Extract and normalize customer data
    const customerData = extractCustomerData(paymentIntent);
    console.log(`🛢️ Extracted customer data:`, JSON.stringify(customerData, null, 2));
    
    // Format payment details as JSON
    const paymentDetails = JSON.stringify({
      id: paymentIntent.id,
      amount: paymentIntent.amount ? (paymentIntent.amount / 100) : 0, // Convert from cents
      currency: paymentIntent.currency || 'usd',
      status: paymentIntent.status || 'succeeded',
      created: new Date().toISOString()
    });
    
    // Default shipping method
    let shipping = 'standard';
    
    // Try to get shipping method from metadata
    if (paymentIntent.metadata) {
      if (paymentIntent.metadata.shipping_method) {
        shipping = paymentIntent.metadata.shipping_method;
      }
    }
    
    // Array to collect all order IDs created
    const orderIds: number[] = [];
    
    // Try all possible formats for order items, starting with the newest format
    
    // 1. First try with orderSummary format (newest)
    if (paymentIntent.metadata?.orderSummary) {
      try {
        console.log(`🛢️ Found orderSummary format`);
        const orderSummary = JSON.parse(paymentIntent.metadata.orderSummary);
        
        if (orderSummary.shipping) {
          shipping = orderSummary.shipping;
        }
        
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
            productId: item.id || 0,
            productName: item.name || 'Unknown Product',
            quantity: item.qty || 1,
            selectedWeight: item.weight || null,
            salesPrice: perItemPrice.toFixed(2),
            shipping,
            paymentIntentId: paymentIntent.id,
            paymentDetails
          };
          
          const newOrderId = await createOrderInDatabase(orderData);
          if (newOrderId) {
            orderIds.push(newOrderId);
            console.log(`🛢️ DB order record created for product ${item.name} (${item.id})`);
          }
        }
        
        if (orderIds.length > 0) {
          console.log(`🛢️ Successfully created ${orderIds.length} order records using orderSummary format`);
          return true;
        }
      } catch (error) {
        console.error(`❌ Error processing orderSummary format:`, error);
      }
    }
    
    // 2. Next, try with products format (older format)
    if (paymentIntent.metadata?.products) {
      try {
        console.log(`🛢️ Found products format`);
        const products = JSON.parse(paymentIntent.metadata.products);
        
        if (paymentIntent.metadata.shipping_method) {
          shipping = paymentIntent.metadata.shipping_method;
        }
        
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
            productId: product.id || 0,
            productName: product.name || 'Unknown Product',
            quantity: product.quantity || 1,
            selectedWeight: product.weight || null,
            salesPrice: (product.price || 0).toString(),
            shipping,
            paymentIntentId: paymentIntent.id,
            paymentDetails
          };
          
          const newOrderId = await createOrderInDatabase(orderData);
          if (newOrderId) {
            orderIds.push(newOrderId);
            console.log(`🛢️ DB order record created for product ${product.name} (${product.id})`);
          }
        }
        
        if (orderIds.length > 0) {
          console.log(`🛢️ Successfully created ${orderIds.length} order records using products format`);
          return true;
        }
      } catch (error) {
        console.error(`❌ Error processing products format:`, error);
      }
    }
    
    // 3. Last resort: For real Stripe payments without proper metadata, create a minimal order record
    // This ensures real orders are always captured in the database
    if (paymentIntent.status === 'succeeded' && !orderIds.length) {
      try {
        console.log(`🛢️ Creating minimal order record for payment ${paymentIntent.id}`);
        
        // Get a timestamp for the order
        const orderDate = paymentIntent.created 
          ? new Date(paymentIntent.created * 1000).toISOString() 
          : new Date().toISOString();
        
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
          productId: 0, // Unknown product
          productName: `Order from ${orderDate}`,
          quantity: 1,
          selectedWeight: null,
          salesPrice: (paymentIntent.amount ? (paymentIntent.amount / 100).toString() : "0"),
          shipping,
          paymentIntentId: paymentIntent.id,
          paymentDetails
        };
        
        const newOrderId = await createOrderInDatabase(orderData);
        if (newOrderId) {
          console.log(`🛢️ Created minimal order record with ID ${newOrderId}`);
          return true;
        }
      } catch (error) {
        console.error(`❌ Error creating minimal order record:`, error);
      }
    }
    
    console.error(`❌ Failed to create any order records for payment ${paymentIntent.id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error recording payment to database:`, error);
    return false;
  }
}

/**
 * Extract and normalize customer data from payment intent
 */
function extractCustomerData(paymentIntent: any): any {
  // Default empty customer data
  const customerData = {
    firstName: 'Unknown',
    lastName: 'Customer',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  };
  
  try {
    // Try to get customer data from orderSummary if available
    if (paymentIntent.metadata?.orderSummary) {
      try {
        const orderSummary = JSON.parse(paymentIntent.metadata.orderSummary);
        
        // Extract customer name from orderSummary
        if (orderSummary.customer) {
          const nameParts = orderSummary.customer.split(' ');
          customerData.firstName = nameParts[0] || 'Unknown';
          customerData.lastName = nameParts.slice(1).join(' ') || 'Customer';
        }
        
        // Extract email from orderSummary
        if (orderSummary.email) {
          customerData.email = orderSummary.email;
        }
      } catch (error) {
        console.error('Error parsing orderSummary:', error);
      }
    }
    
    // If name wasn't extracted from orderSummary, try other sources
    if (customerData.firstName === 'Unknown') {
      // Try customer_name in metadata
      if (paymentIntent.metadata?.customer_name) {
        const nameParts = paymentIntent.metadata.customer_name.split(' ');
        customerData.firstName = nameParts[0] || 'Unknown';
        customerData.lastName = nameParts.slice(1).join(' ') || 'Customer';
      }
      // Try shipping name
      else if (paymentIntent.shipping?.name) {
        const nameParts = paymentIntent.shipping.name.split(' ');
        customerData.firstName = nameParts[0] || 'Unknown';
        customerData.lastName = nameParts.slice(1).join(' ') || 'Customer';
      }
      // Try customer details from checkout session
      else if (paymentIntent.customer_details?.name) {
        const nameParts = paymentIntent.customer_details.name.split(' ');
        customerData.firstName = nameParts[0] || 'Unknown';
        customerData.lastName = nameParts.slice(1).join(' ') || 'Customer';
      }
    }
    
    // Get email from various possible sources if not already set
    if (!customerData.email) {
      customerData.email = paymentIntent.metadata?.customer_email || 
                          paymentIntent.receipt_email || 
                          paymentIntent.customer_details?.email || '';
    }
    
    // Get phone from various possible sources
    customerData.phone = paymentIntent.shipping?.phone || 
                        paymentIntent.metadata?.customer_phone || 
                        paymentIntent.customer_details?.phone || '';
    
    // Get address from shipping info
    if (paymentIntent.shipping?.address) {
      customerData.address = paymentIntent.shipping.address.line1 || '';
      customerData.city = paymentIntent.shipping.address.city || '';
      customerData.state = paymentIntent.shipping.address.state || '';
      customerData.zipCode = paymentIntent.shipping.address.postal_code || '';
    }
    // Try customer_details address if shipping isn't available
    else if (paymentIntent.customer_details?.address) {
      customerData.address = paymentIntent.customer_details.address.line1 || '';
      customerData.city = paymentIntent.customer_details.address.city || '';
      customerData.state = paymentIntent.customer_details.address.state || '';
      customerData.zipCode = paymentIntent.customer_details.address.postal_code || '';
    }
  } catch (error) {
    console.error('Error extracting customer data:', error);
  }
  
  return customerData;
}