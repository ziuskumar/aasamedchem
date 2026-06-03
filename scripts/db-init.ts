import "./setup-env";
import { sql } from "../lib/db";

async function initializeDatabase() {
  console.log("Initializing database tables...");
  try {
    // Drop existing tables to ensure clean slate
    await sql`DROP TABLE IF EXISTS order_items, orders, products, users CASCADE;`;
    console.log("Dropped existing tables if they existed.");

    // Create users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Created 'users' table.");

    // Create products table
    await sql`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        base_unit VARCHAR(50) NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        price_per_base INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Created 'products' table.");

    // Create orders table
    await sql`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        buyer_name VARCHAR(255) NOT NULL,
        total_price_paise INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("Created 'orders' table.");

    // Create order_items table
    await sql`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        ordered_qty NUMERIC(12, 4) NOT NULL,
        ordered_unit VARCHAR(50) NOT NULL,
        base_qty NUMERIC(12, 4) NOT NULL,
        base_unit VARCHAR(50) NOT NULL,
        price_per_base_paise INTEGER NOT NULL,
        line_total_paise INTEGER NOT NULL
      );
    `;
    console.log("Created 'order_items' table.");

    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
