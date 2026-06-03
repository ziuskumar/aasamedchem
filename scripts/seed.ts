import "./setup-env";
import bcrypt from "bcryptjs";
import { sql } from "../lib/db";

async function seed() {
  console.log("Seeding database...");
  try {
    const adminPassword = await bcrypt.hash("admin123", 10);
    const sellerPassword = await bcrypt.hash("seller123", 10);
    const buyerPassword = await bcrypt.hash("buyer123", 10);

    // Clean up existing seed data if any (tables are dropped in db-init but good to have)
    await sql`DELETE FROM users;`;
    await sql`DELETE FROM products;`;

    // Seed Users
    const users = await sql`
      INSERT INTO users (email, password, role, name)
      VALUES
        ('admin@test.com', ${adminPassword}, 'admin', 'Admin User'),
        ('seller@test.com', ${sellerPassword}, 'seller', 'Seller User'),
        ('buyer@test.com', ${buyerPassword}, 'buyer', 'Buyer User')
      RETURNING id, email, role;
    `;
    console.log("Seeded Users:", users);

    // Seed Products
    const products = await sql`
      INSERT INTO products (name, sku, category, description, base_unit, stock_quantity, price_per_base)
      VALUES
        (
          'Ethanol 99%',
          'ETH-001',
          'Chemicals',
          'High purity laboratory grade Ethanol solvent.',
          'mL',
          10000,
          5
        ),
        (
          'Sodium Chloride (NaCl)',
          'NAC-001',
          'Chemicals',
          'Analytical reagent grade Sodium Chloride.',
          'g',
          5000,
          200
        ),
        (
          'Nitrile Gloves',
          'GLO-001',
          'Consumables',
          'Powder-free, blue nitrile gloves. Size M.',
          'unit',
          1000,
          500
        )
      RETURNING id, name, sku;
    `;
    console.log("Seeded Products:", products);

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();