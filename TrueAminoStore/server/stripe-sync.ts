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
  // Removed all console.log statements for production cleanup
  
  // Default to last 30 days if no start date provided
  const startTimestamp = startDate || Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
  
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
    
    result.totalProcessed = paymentIntents.length;
    
    // Process each payment intent (only those with status 'succeeded')
    for (const paymentIntent of paymentIntents) {
      // Only process successful payments
      if (paymentIntent.status !== 'succeeded') {
        continue;
      }
      
      try {
        // Save to database
        try {
          const savedToDatabase = await recordPaymentToDatabase(paymentIntent);
          if (savedToDatabase) {
            result.savedToDatabase++;
          } else {
            result.errors.push(`Failed to save payment ${paymentIntent.id} to database`);
          }
        } catch (dbError) {
          result.errors.push(`Error saving payment ${paymentIntent.id} to database: ${String(dbError)}`);
        }
        
        // Save to Airtable
        try {
          const savedToAirtable = await recordPaymentToAirtable(paymentIntent);
          if (savedToAirtable) {
            result.savedToAirtable++;
          } else {
            result.errors.push(`Failed to save payment ${paymentIntent.id} to Airtable`);
          }
        } catch (airtableError) {
          result.errors.push(`Error saving payment ${paymentIntent.id} to Airtable: ${String(airtableError)}`);
        }
      } catch (paymentError) {
        result.errors.push(`Error processing payment ${paymentIntent.id}: ${String(paymentError)}`);
      }
    }
    
    result.success = true;
    
    return result;
  } catch (error) {
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