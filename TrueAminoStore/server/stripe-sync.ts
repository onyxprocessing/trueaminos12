/**
 * Stripe synchronization module
 * This module fetches orders directly from Stripe and saves them to the local database
 */

import Stripe from "stripe";
import { recordPaymentToDatabase } from "./db-orders";
import { recordPaymentToAirtable } from "./airtable-orders";

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Synchronize orders from Stripe to local database and Airtable
 * @param startDate Optional start date (unix timestamp) to sync payments from, defaults to last 30 days
 * @returns Summary of sync results
 */
export async function syncOrdersFromStripe(startDate?: number): Promise<{
  success: boolean,
  totalProcessed: number,
  savedToDatabase: number,
  savedToAirtable: number,
  errors: string[]
}> {
  console.log('🔄 Starting Stripe order synchronization');
  
  // Default to last 30 days if no start date provided
  const startTimestamp = startDate || Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  console.log(`📅 Fetching payments since: ${new Date(startTimestamp * 1000).toISOString()}`);
  
  const result = {
    success: false,
    totalProcessed: 0,
    savedToDatabase: 0,
    savedToAirtable: 0,
    errors: [] as string[]
  };
  
  try {
    // Get all successful payments from Stripe
    const paymentIntents = await fetchAllSuccessfulPayments(startTimestamp);
    console.log(`📊 Found ${paymentIntents.length} successful payments in Stripe`);
    
    result.totalProcessed = paymentIntents.length;
    
    // Process each payment intent (only those with status 'succeeded')
    for (const paymentIntent of paymentIntents) {
      // Only process successful payments
      if (paymentIntent.status !== 'succeeded') {
        console.log(`⏭️ Skipping payment ${paymentIntent.id} with status: ${paymentIntent.status}`);
        continue;
      }
      
      try {
        console.log(`💰 Processing payment: ${paymentIntent.id} (${formatCurrency(paymentIntent.amount, paymentIntent.currency)})`);
        
        // Save to database
        try {
          const savedToDatabase = await recordPaymentToDatabase(paymentIntent);
          if (savedToDatabase) {
            console.log(`✅ Payment ${paymentIntent.id} saved to database`);
            result.savedToDatabase++;
          } else {
            console.error(`❌ Failed to save payment ${paymentIntent.id} to database`);
            result.errors.push(`Failed to save payment ${paymentIntent.id} to database`);
          }
        } catch (dbError) {
          console.error(`❌ Error saving payment ${paymentIntent.id} to database:`, dbError);
          result.errors.push(`Error saving payment ${paymentIntent.id} to database: ${String(dbError)}`);
        }
        
        // Save to Airtable
        try {
          const savedToAirtable = await recordPaymentToAirtable(paymentIntent);
          if (savedToAirtable) {
            console.log(`✅ Payment ${paymentIntent.id} saved to Airtable`);
            result.savedToAirtable++;
          } else {
            console.error(`❌ Failed to save payment ${paymentIntent.id} to Airtable`);
            result.errors.push(`Failed to save payment ${paymentIntent.id} to Airtable`);
          }
        } catch (airtableError) {
          console.error(`❌ Error saving payment ${paymentIntent.id} to Airtable:`, airtableError);
          result.errors.push(`Error saving payment ${paymentIntent.id} to Airtable: ${String(airtableError)}`);
        }
      } catch (paymentError) {
        console.error(`❌ Error processing payment ${paymentIntent.id}:`, paymentError);
        result.errors.push(`Error processing payment ${paymentIntent.id}: ${String(paymentError)}`);
      }
    }
    
    result.success = true;
    console.log(`🎉 Stripe sync completed: ${result.savedToDatabase}/${result.totalProcessed} saved to database, ${result.savedToAirtable}/${result.totalProcessed} saved to Airtable`);
    
    return result;
  } catch (error) {
    console.error('❌ Error syncing orders from Stripe:', error);
    result.errors.push(`Error syncing orders from Stripe: ${String(error)}`);
    return result;
  }
}

/**
 * Fetch all successful payments from Stripe
 * @param startTimestamp Unix timestamp to start from
 * @returns Array of payment intent objects
 */
async function fetchAllSuccessfulPayments(startTimestamp: number): Promise<Stripe.PaymentIntent[]> {
  const allPaymentIntents: Stripe.PaymentIntent[] = [];
  
  // Fetch all payment intents with status 'succeeded'
  let hasMore = true;
  let startingAfter: string | undefined = undefined;
  
  while (hasMore) {
    const params: Stripe.PaymentIntentListParams = {
      limit: 100,
      created: { gte: startTimestamp }
    };
    
    if (startingAfter) {
      params.starting_after = startingAfter;
    }
    
    const paymentIntents = await stripe.paymentIntents.list(params);
    
    // Add current batch to results
    if (paymentIntents.data && paymentIntents.data.length > 0) {
      allPaymentIntents.push(...paymentIntents.data);
      
      // Set up for next page if there is one
      if (paymentIntents.has_more) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }
  
  return allPaymentIntents;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return 'unknown amount';
  
  const numericAmount = amount / 100; // Convert from cents
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'usd'
  }).format(numericAmount);
}