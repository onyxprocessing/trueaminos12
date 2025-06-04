import { db } from './db';
import { orders } from '../shared/schema';
import { desc, eq, sql } from 'drizzle-orm';

/**
 * Get all orders from the database with optional limit and offset
 * @param limit Maximum number of orders to return
 * @param offset Number of orders to skip
 * @returns Array of orders
 */
export async function getAllOrders(limit: number = 50, offset: number = 0) {
  try {
    const results = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
    
    return results;
  } catch (error) {
    console.error('Error getting orders from database:', error);
    return [];
  }
}

/**
 * Get a specific order by ID
 * @param id Order ID
 * @returns Order object or null if not found
 */
export async function getOrderById(id: number) {
  try {
    const [result] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    
    return result || null;
  } catch (error) {
    console.error(`Error getting order ${id} from database:`, error);
    return null;
  }
}

/**
 * Count total number of orders in the database
 * @returns Total number of orders
 */
export async function countOrders() {
  try {
    const [result] = await db
      .select({ count: sql`count(${orders.id})` })
      .from(orders);
    
    return Number(result?.count) || 0;
  } catch (error) {
    console.error('Error counting orders in database:', error);
    return 0;
  }
}

/**
 * Search orders by various criteria
 * @param searchTerm Term to search for
 * @param limit Maximum number of orders to return
 * @param offset Number of orders to skip
 * @returns Array of matching orders
 */
export async function searchOrders(searchTerm: string, limit: number = 50, offset: number = 0) {
  try {
    // Convert search term to lowercase for case-insensitive search
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Get all orders first (inefficient but simple for this demo)
    const allOrders = await db
      .select()
      .from(orders);
    
    // Filter orders that match the search term in various fields
    const filteredOrders = allOrders.filter(order => {
      return (
        order.orderId.toLowerCase().includes(lowerSearchTerm) ||
        order.firstName.toLowerCase().includes(lowerSearchTerm) ||
        order.lastName.toLowerCase().includes(lowerSearchTerm) ||
        (order.email && order.email.toLowerCase().includes(lowerSearchTerm)) ||
        (order.phone && order.phone.toLowerCase().includes(lowerSearchTerm)) ||
        order.address.toLowerCase().includes(lowerSearchTerm) ||
        order.city.toLowerCase().includes(lowerSearchTerm) ||
        order.state.toLowerCase().includes(lowerSearchTerm) ||
        order.zip.toLowerCase().includes(lowerSearchTerm) ||
        order.productName.toLowerCase().includes(lowerSearchTerm)
      );
    });
    
    // Sort by created date (newest first)
    filteredOrders.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Apply pagination
    return filteredOrders.slice(offset, offset + limit);
  } catch (error) {
    console.error(`Error searching orders for "${searchTerm}":`, error);
    return [];
  }
}