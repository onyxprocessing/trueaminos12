import { CartItemWithProduct } from "@shared/schema";

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
    
    // Prepare the data for Airtable
    const airtableData = {
      fields: {
        orderId: orderData.orderId,
        firstName: orderData.firstName,
        lastName: orderData.lastName,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        zip: orderData.zip,
        mg: orderData.mg || '',
        salesPrice: orderData.salesPrice,
        quantity: orderData.quantity,
        productId: orderData.productId,
        shipping: orderData.shipping,
        payment: orderData.payment,
        email: orderData.email || '',
        phone: orderData.phone || ''
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
    
    const data = await response.json();
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
        shipping,
        payment: paymentDetails
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