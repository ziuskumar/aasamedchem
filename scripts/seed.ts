import "./setup-env";
import bcrypt from "bcryptjs";

import { sql } from "../lib/db";

async function seedUsers() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  const sellerPassword = await bcrypt.hash("seller123", 10);

  const buyerPassword = await bcrypt.hash("buyer123", 10);

  await sql`
    INSERT INTO users (email, password, role, name)
    VALUES
      (
        'admin@test.com',
        ${adminPassword},
        'admin',
        'Admin User'
      ),
      (
        'seller@test.com',
        ${sellerPassword},
        'seller',
        'Seller User'
      ),
      (
        'buyer@test.com',
        ${buyerPassword},
        'buyer',
        'Buyer User'
      )
  `;

  console.log("Users seeded successfully!");
}

seedUsers();