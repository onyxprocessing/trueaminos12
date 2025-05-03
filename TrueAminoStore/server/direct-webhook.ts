import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { createOrderInAirtable, generateUniqueOrderId } from './airtable-orders';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a router to mount the webhook endpoints
const router = express.Router();

// This is the main webhook endpoint that Stripe will call
router.post('/airtable-webhook', async (req: Request, res: Response) => {
  // Verify the webhook signature
  const signature = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    // Parse and validate the webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '' // You'll need to set this in your environment variables
    );
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    // We only care about successful payments
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
      
      // Process the payment and send to Airtable
      await processPaymentForAirtable(paymentIntent);
      
      // Return a 200 success response
      return res.json({ success: true, message: 'Payment processed successfully' });
    } 
    else if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;
      console.log(`💳 Charge succeeded: ${charge.id} for payment ${charge.payment_intent}`);
      
      if (charge.payment_intent) {
        // Get the payment intent details
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
          console.log(`💳 Retrieved payment intent: ${paymentIntent.id}`);
          
          // Process the payment success
          await processPaymentForAirtable(paymentIntent);
        } catch (error) {
          console.error(`Error retrieving payment intent for charge ${charge.id}:`, error);
          // Still return success, as we don't want Stripe to retry
          return res.json({ success: true, message: 'Received charge event, but failed to process payment intent' });
        }
      }
      
      return res.json({ success: true, message: 'Charge processed successfully' });
    } 
    else {
      // For any other event type, just acknowledge it
      console.log(`Unhandled event type: ${event.type}`);
      return res.json({ success: true, message: `Received event: ${event.type}` });
    }
  } catch (error) {
    // Log the error but return a 200 to Stripe so it doesn't keep retrying
    console.error(`Error processing webhook event:`, error);
    return res.status(200).json({ 
      success: false, 
      message: 'Error occurred, but received webhook' 
    });
  }
});

// Process payment and send directly to Airtable
async function processPaymentForAirtable(paymentIntent: Stripe.PaymentIntent) {
  console.log(`🔄 Direct webhook processing for payment: ${paymentIntent.id}`);
  
  // Extract customer information
  const shipping = paymentIntent.shipping;
  const metadata = paymentIntent.metadata || {};
  
  // Extract basic customer info
  let firstName = '';
  let lastName = '';
  let email = metadata.customer_email || '';
  let phone = metadata.customer_phone || '';
  let address = '';
  let city = '';
  let state = '';
  let zip = '';
  
  // Get names and shipping details from Stripe data
  if (shipping && shipping.name) {
    // Split the name into first and last
    const nameParts = shipping.name.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
    
    // Get shipping address details
    if (shipping.address) {
      address = shipping.address.line1 || '';
      city = shipping.address.city || '';
      state = shipping.address.state || '';
      zip = shipping.address.postal_code || '';
    }
    
    // Use shipping phone if available
    if (shipping.phone) {
      phone = shipping.phone;
    }
  }
  
  // If we have order metadata, try to extract product info
  let productId = 0; // Convert to number for Airtable
  let productName = "Unknown Product";
  let quantity = 1;
  let selectedWeight = "";
  
  // Try to parse the order summary if it exists
  if (metadata.orderSummary) {
    try {
      const orderSummary = JSON.parse(metadata.orderSummary);
      console.log(`📦 Found orderSummary:`, orderSummary);
      
      if (orderSummary.items && orderSummary.items.length > 0) {
        const firstItem = orderSummary.items[0];
        productId = Number(firstItem.id || 0); // Convert to number for Airtable
        productName = firstItem.name || "Unknown Product";
        quantity = firstItem.qty || 1;
        selectedWeight = firstItem.weight || "";
      }
    } catch (err) {
      console.error(`Error parsing orderSummary:`, err);
    }
  }
  
  // Format amount from cents to dollars
  const amount = paymentIntent.amount / 100;
  
  // Generate a unique order ID
  const orderId = generateUniqueOrderId();
  
  // Create a simple payment details string
  const paymentDetails = JSON.stringify({
    id: paymentIntent.id,
    amount: amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    created: new Date(paymentIntent.created * 1000).toISOString(),
    paymentMethod: paymentIntent.payment_method_types?.join(", ") || "unknown"
  });
  
  // Create the order data object
  const orderData = {
    orderId,
    firstName,
    lastName,
    address,
    city,
    state,
    zip,
    mg: selectedWeight,
    salesPrice: amount,
    quantity,
    productId,
    product: productName,
    shipping: metadata.shipping_method || "standard",
    payment: paymentDetails,
    email,
    phone
  };
  
  console.log(`🛒 Creating Airtable order with data:`, orderData);
  
  // Create the order in Airtable
  try {
    const airtableRecordId = await createOrderInAirtable(orderData);
    if (airtableRecordId) {
      console.log(`✅ Order successfully created in Airtable with ID: ${airtableRecordId}`);
      return true;
    } else {
      console.error(`❌ Failed to create order in Airtable`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error creating order in Airtable:`, error);
    return false;
  }
}

export function registerDirectWebhook(app: express.Express) {
  // Mount the router on the provided Express app
  app.use('/webhook', router);
  
  console.log('📡 Direct Airtable webhook endpoint registered at /webhook/airtable-webhook');
  return router;
}