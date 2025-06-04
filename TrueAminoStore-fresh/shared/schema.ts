import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
});

// Products table - Note: Airtable may provide prices as strings
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(), // Changed to text to match Airtable data
  categoryId: integer("category_id").notNull(),
  imageUrl: text("image_url"),
  slug: text("slug").notNull().unique(),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  outofstock: boolean("out_of_stock").default(false), // New field to mark if product is temporarily out of stock
});

// Cart items table (for memory storage only)
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  sessionId: text("session_id").notNull(),
  selectedWeight: text("selected_weight"),
});

// Customer information table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  shipping: text("shipping").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table for storing checkout data
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(), // TA-[timestamp]-[random]
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  selectedWeight: text("selected_weight"),
  salesPrice: text("sales_price").notNull(), // Store as text for compatibility with API
  shipping: text("shipping").notNull(),
  paymentMethod: text("payment_method").notNull().default("card"), // card, bank, crypto
  paymentIntentId: text("payment_intent_id"), // Only needed for card payments
  paymentDetails: text("payment_details"), // JSON string of payment info
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, completed, failed
  discountCode: text("discount_code"), // Affiliate or discount code applied to order
  discountPercentage: text("discount_percentage"), // Discount percentage as string, if any
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertOrderSchema = createInsertSchema(orders);

// Types for use in application
export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
}
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Custom Product interface to match Airtable data structure
export interface Product {
  id: number;
  name: string;
  description: string;
  description2?: string; // Additional description field from Airtable
  meta?: string; // SEO meta description for the product
  price: string; // Generic price (now used as price5mg)
  price5mg?: string; // Price specific to 5mg weight
  price10mg?: string; // Price specific to 10mg weight
  price15mg?: string; // Price specific to 15mg weight
  price20mg?: string; // Price specific to 20mg weight
  price2mg?: string; // Price specific to 2mg weight
  price750mg?: string; // Price specific to 750mg weight (MK-677)
  price100mg?: string; // Price specific to 100mg weight (NAD+)
  price500mg?: string; // Price specific to 500mg weight (NAD+)
  price1mg?: string; // Price specific to 1mg weight
  price30mg?: string; // Price specific to 30mg weight
  price300mg?: string; // Price specific to 300mg weight
  price600mg?: string; // Price specific to 600mg weight
  price1500mg?: string; // Price specific to 1500mg weight
  price5000mg?: string; // Price specific to 5000mg weight
  categoryId: number;
  imageUrl: string | null;
  image2Url?: string | null;
  image3Url?: string | null;
  weightOptions?: string[];
  slug: string;
  inStock: boolean;
  featured: boolean;
  outofstock?: boolean; // New field to indicate if product is out of stock but can still be ordered with extended shipping
}

export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Extended types for cart with product details
export type CartItemWithProduct = CartItem & {
  product: Product;
};

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
