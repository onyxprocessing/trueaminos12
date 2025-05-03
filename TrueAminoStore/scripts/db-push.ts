// Migrate schema to the database
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Support WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('🔄 Pushing schema to database...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // Use simple push migration for now
  try {
    // Use SQL to create tables directly
    for (const tableName in schema) {
      if (tableName.startsWith('_')) continue;
      
      const table = (schema as any)[tableName];
      if (table && table.name) {
        console.log(`Creating table if not exists: ${table.name}`);
      }
    }

    // Push the schema to the database
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "image_url" text
      );
      
      CREATE TABLE IF NOT EXISTS "products" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "description" text NOT NULL,
        "price" text NOT NULL,
        "category_id" integer NOT NULL,
        "image_url" text,
        "slug" text NOT NULL UNIQUE,
        "in_stock" boolean NOT NULL DEFAULT true,
        "featured" boolean NOT NULL DEFAULT false
      );
      
      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" serial PRIMARY KEY,
        "product_id" integer NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "session_id" text NOT NULL,
        "selected_weight" text
      );
      
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" serial PRIMARY KEY,
        "order_id" text NOT NULL UNIQUE,
        "first_name" text NOT NULL,
        "last_name" text NOT NULL,
        "email" text,
        "phone" text,
        "address" text NOT NULL,
        "city" text NOT NULL,
        "state" text NOT NULL,
        "zip" text NOT NULL,
        "product_id" integer NOT NULL,
        "product_name" text NOT NULL,
        "quantity" integer NOT NULL,
        "selected_weight" text,
        "sales_price" numeric NOT NULL,
        "shipping" text NOT NULL,
        "payment_intent_id" text NOT NULL,
        "payment_details" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    console.log('✅ Schema push completed successfully');
  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();