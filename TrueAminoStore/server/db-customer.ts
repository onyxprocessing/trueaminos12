/**
 * Database customer operations
 * This module handles saving and retrieving customer information
 */
import { db } from './db';
import { customers, InsertCustomer, Customer } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Save customer information to the database
 * @param customerData The customer data to save
 * @returns The saved customer object
 */
export async function saveCustomerInfo(customerData: InsertCustomer): Promise<Customer> {
  // Check if customer with this sessionId already exists
  const existingCustomer = await getCustomerBySessionId(customerData.sessionId);
  
  if (existingCustomer) {
    // Update existing customer
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...customerData,
        updatedAt: new Date()
      })
      .where(eq(customers.sessionId, customerData.sessionId))
      .returning();
    
    return updatedCustomer;
  } else {
    // Create new customer
    const [newCustomer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    
    return newCustomer;
  }
}

/**
 * Get customer information by session ID
 * @param sessionId The session ID to look up
 * @returns The customer object or undefined if not found
 */
export async function getCustomerBySessionId(sessionId: string): Promise<Customer | undefined> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.sessionId, sessionId));
  
  return customer;
}