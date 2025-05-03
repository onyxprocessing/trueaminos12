import { CartItemWithProduct } from "@shared/schema";
import fetch from 'node-fetch';

// Airtable API key from environment variable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d";
const AIRTABLE_BASE_ID = "app3XDDBbU0ZZDBiY";
const ORDERS_TABLE_ID = "tblI5N0Xn65DB5L5s";

// Define interface for order data to be stored in Airtable
interface OrderData {
  orderId: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  mg?: string;
  salesPrice: number;
  quantity: number;
  productId: number;
  shipping: string;
  payment: string;
  email?: string;
  phone?: string;
  product?: string; // Product name
  affiliateCode?: string;
}

/**
 * Generate a unique order ID combining timestamp and random values
 * Format: TA-[timestamp]-[6 random characters]
 * Example: TA-1746230679-8F4J2P
 */
export function generateUniqueOrderId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TA-${timestamp}-${randomChars}`;
}

/**
 * Create an order record in Airtable
 * @param orderData Order data to be stored
 * @returns The created order record ID or null if failed
 */
export async function createOrderInAirtable(orderData: OrderData): Promise<string | null> {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ORDERS_TABLE_ID}`;
    
    // Prepare the data for Airtable with all requested fields
    const airtableData = {
      fields: {
        "Order ID": orderData.orderId,
        "First Name": orderData.firstName,
        "Last Name": orderData.lastName,
        "Address": orderData.address,
        "City": orderData.city,
        "State": orderData.state,
        "Zip": orderData.zip,
        "MG": orderData.mg || '',
        "Sales Price": orderData.salesPrice,
        "Quantity": orderData.quantity,
        "Product ID": orderData.productId,
        "Product": orderData.product || '', // Product name
        "Shipping": orderData.shipping,
        "Payment": orderData.payment,
        "Email": orderData.email || '',
        "Phone": orderData.phone || '',
        "Affiliate Code": orderData.affiliateCode || ''
      }
    };
    
    console.log('Creating order record in Airtable:', JSON.stringify(airtableData, null, 2));
    
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
      console.error(`Airtable API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }
    
    const data = await response.json() as { id: string };
    console.log('Order created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error creating order in Airtable:', error);
    return null;
  }
}

/**
 * Create order records for all items in a cart
 * @param cartItems Cart items with product details
 * @param customerInfo Customer information
 * @param shipping Shipping method selected
 * @param paymentDetails Payment details as a JSON string
 * @returns Array of created order record IDs
 */
export async function createOrdersFromCart(
  cartItems: CartItemWithProduct[],
  customerInfo: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    email?: string;
    phone?: string;
  },
  shipping: string,
  paymentDetails: string
): Promise<string[]> {
  const orderIds: string[] = [];
  const orderId = generateUniqueOrderId(); // Generate one unique order ID for all items
  
  for (const item of cartItems) {
    try {
      const orderData: OrderData = {
        orderId,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip,
        email: customerInfo.email,
        phone: customerInfo.phone,
        mg: item.selectedWeight || '',
        salesPrice: parseFloat(item.product.price),
        quantity: item.quantity,
        productId: item.product.id,
        product: item.product.name,
        shipping,
        payment: paymentDetails,
        affiliateCode: ''
      };
      
      const recordId = await createOrderInAirtable(orderData);
      if (recordId) {
        orderIds.push(recordId);
      }
    } catch (error) {
      console.error(`Error creating order for item ${item.product.id}:`, error);
    }
  }
  
  return orderIds;
}

/**
 * Record payment information to Airtable when a payment is successful
 * @param paymentIntent The Stripe payment intent object
 * @returns True if order was recorded successfully, false otherwise
 */
export async function recordPaymentToAirtable(paymentIntent: any): Promise<boolean> {
  try {
    console.log('🔴 Recording payment to Airtable:', paymentIntent.id);
    console.log('Payment intent metadata:', JSON.stringify(paymentIntent.metadata, null, 2));
    
    // If no metadata, we can't record the order
    if (!paymentIntent || !paymentIntent.metadata) {
      console.error('❌ Missing metadata in payment intent');
      return false;
    }
    
    // Extract shipping method from metadata
    const shippingMethod = paymentIntent.metadata.shipping_method || 'standard';
    
    // Extract customer data from the payment intent
    // First check if we have a customer in orderSummary
    let firstName = '';
    let lastName = '';
    let customerEmail = '';
    
    // Try to get customer info from orderSummary first
    if (paymentIntent.metadata.orderSummary) {
      try {
        const orderSummary = JSON.parse(paymentIntent.metadata.orderSummary);
        if (orderSummary.customer) {
          const nameParts = orderSummary.customer.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        customerEmail = orderSummary.email || '';
      } catch (e) {
        console.warn('⚠️ Failed to parse customer from orderSummary:', e);
      }
    }
    
    // Fall back to other metadata fields or shipping info
    if (!firstName && paymentIntent.metadata.customer_name) {
      const nameParts = paymentIntent.metadata.customer_name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    } else if (!firstName && paymentIntent.shipping?.name) {
      const nameParts = paymentIntent.shipping.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // If still no name, use defaults
    if (!firstName) firstName = 'Unknown';
    if (!lastName) lastName = 'Customer';
    
    // Get email from various possible sources
    if (!customerEmail) {
      customerEmail = paymentIntent.metadata.customer_email || 
                      paymentIntent.receipt_email || 
                      '';
    }
    
    // Build complete customer data object
    const customerData = {
      firstName,
      lastName,
      address: paymentIntent.shipping?.address?.line1 || '',
      city: paymentIntent.shipping?.address?.city || '',
      state: paymentIntent.shipping?.address?.state || '',
      zip: paymentIntent.shipping?.address?.postal_code || '',
      email: customerEmail,
      phone: paymentIntent.shipping?.phone || paymentIntent.metadata?.customer_phone || ''
    };
    
    console.log('📋 Customer data for order:', JSON.stringify(customerData, null, 2));
    
    // Format payment details as JSON
    const paymentDetails = JSON.stringify({
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      created: new Date(paymentIntent.created * 1000).toISOString(),
      paymentMethod: paymentIntent.payment_method_types?.join(', ') || 'unknown'
    });
    
    // Create one record for each item in the cart
    const orderId = generateUniqueOrderId();
    console.log('🏷️ Generated order ID:', orderId);
    
    // If we have cart items for the session, create order records
    try {
      console.log('📦 Creating order records for payment:', paymentIntent.id);
      
      // Try to extract product information from metadata if available
      let products = [];
      
      // First check for new compact orderSummary format
      if (paymentIntent.metadata.orderSummary) {
        try {
          const orderSummary = JSON.parse(paymentIntent.metadata.orderSummary);
          console.log('📦 Found orderSummary:', JSON.stringify(orderSummary, null, 2));
          
          if (orderSummary && orderSummary.items) {
            // Calculate per-item price (approximate)
            const totalItems = orderSummary.items.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
            const perItemPrice = (paymentIntent.amount / 100) / Math.max(totalItems, 1);
            
            products = orderSummary.items.map((item: { id: number; name: string; qty: number; weight: string | null }) => ({
              id: item.id,
              name: item.name,
              quantity: item.qty,
              weight: item.weight,
              price: perItemPrice // Approximate price based on total
            }));
            console.log('📦 Found product details in orderSummary metadata:', products.length);
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse orderSummary JSON from metadata:', e);
        }
      } 
      // Fall back to legacy products format
      else if (paymentIntent.metadata.products) {
        try {
          products = JSON.parse(paymentIntent.metadata.products);
          console.log('📦 Found product details in products metadata:', products.length);
        } catch (e) {
          console.warn('⚠️ Failed to parse products JSON from metadata:', e);
        }
      }
      
      if (products && products.length > 0) {
        // Create one record for each product in the order
        for (const product of products) {
          const orderData: OrderData = {
            orderId,
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            address: customerData.address,
            city: customerData.city,
            state: customerData.state,
            zip: customerData.zip,
            email: customerData.email,
            phone: customerData.phone,
            salesPrice: product.price || 0,
            quantity: product.quantity || 1,
            productId: product.id || 0,
            product: product.name || '',
            mg: product.weight || '',
            shipping: shippingMethod,
            payment: paymentDetails,
            affiliateCode: paymentIntent.metadata.affiliate_code || ''
          };
          
          await createOrderInAirtable(orderData);
          console.log(`Order record created for product ${product.name} (${product.id})`);
        }
      } else {
        // Create at least one record even if we don't have detailed product data
        const orderData: OrderData = {
          orderId,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          zip: customerData.zip,
          email: customerData.email,
          phone: customerData.phone,
          salesPrice: paymentIntent.amount / 100, // Convert from cents
          quantity: 1,
          productId: 0, // Unknown product
          product: "Unknown Product", // Default product name
          shipping: shippingMethod,
          payment: paymentDetails,
          affiliateCode: paymentIntent.metadata.affiliate_code || ''
        };
        
        await createOrderInAirtable(orderData);
        console.log('Order record created with general payment data');
      }
      
      console.log('Order recorded successfully for payment:', paymentIntent.id);
      return true;
    } catch (error) {
      console.error('Error recording order for payment:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in recordPaymentToAirtable:', error);
    return false;
  }
}