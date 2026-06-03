# AASAMEDCHEM — Chemical Supplies & Sales Portal

A premium, enterprise-grade inventory management and sales logging application built with **Next.js (App Router, React 19)**, **TypeScript**, **Tailwind CSS**, and **Neon Serverless PostgreSQL**..

Designed specifically for chemical laboratories and medical supply houses, AASAMEDCHEM solves the complex challenge of managing multi-unit inventories (e.g., selling ethanol in Liters while tracking stock in milliliters, or selling table salt in kilograms while tracking stock in grams) with automatic unit conversions, real-time pricing previews, and strict Role-Based Access Control (RBAC).

---

## 🌟 Key Features

- **Double-Entry Unit Logging**: Stores both the seller's ordered quantity/unit and the absolute base quantity/unit in the database for transparent audits.
- **Dynamic Conversion Engine**: Handles weight (`g` $\leftrightarrow$ `kg`), volume (`mL` $\leftrightarrow$ `L`), and discrete counts (`unit`) on the fly, with automated compatibility verification on both frontend and backend.
- **Paise-Based Financial Precision**: Stores all currency calculations in integer Paise to completely eliminate floating-point rounding errors.
- **Real-Time Interactive Catalog**: Features a debounced search catalog (300ms) with a live-updating pricing modal that previews line totals instantly based on quantity and unit selections.
- **Strict Role-Based Access Control (RBAC)**: Custom NextAuth configuration guarding admin capabilities (CRUD catalog operations, master audits) and seller capabilities (logging sales, personal histories).

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict type safety with custom NextAuth extensions)
- **Styling**: Tailwind CSS (Premium Dark Mode with glassmorphic cards and smooth transition effects)
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless` SQL client)
- **Authentication**: NextAuth.js (Credentials Provider with role-based JWT sessions)
- **Prerendering Guard**: Build-safe lazy connection evaluation to ensure smooth CI/CD builds on Vercel.

---

## 📊 Database Schema & ERD

```
  +------------------+         +------------------+
  |      users       |         |     products     |
  +------------------+         +------------------+
  | id (PK)          |<---+    | id (PK)          |<---+
  | email (Unique)   |    |    | name             |    |
  | password (Hash)  |    |    | sku (Unique)     |    |
  | role             |    |    | category         |    |
  | name             |    |    | description      |    |
  +------------------+    |    | base_unit        |    |
                          |    | stock_quantity   |    |
  +------------------+    |    | price_per_base   |    |
  |      orders      |    |    +------------------+    |
  +------------------+    |                            |
  | id (PK)          |<---|-----------------------+    |
  | user_id (FK) ----+----+                       |    |
  | buyer_name       |                            |    |
  | total_price_paise|                            |    |
  +------------------+                            |    |
        |                                         |    |
        +------------------+                      |    |
                           |                      |    |
                 +------------------+             |    |
                 |   order_items    |             |    |
                 +------------------+             |    |
                 | id (PK)          |             |    |
                 | order_id (FK) ---+-------------+    |
                 | product_id (FK) -+------------------+
                 | ordered_qty      |
                 | ordered_unit     |
                 | base_qty         |
                 | base_unit        |
                 | price_per_base_p |
                 | line_total_paise |
                 +------------------+
```

### Table Definitions
1. **`users`**: Contains system actors (`id`, `email`, `password` (bcrypt), `role` (admin/seller), `name`).
2. **`products`**: Maintains inventory units (`id`, `name`, `sku` (indexed/unique), `category`, `description`, `base_unit` (g, mL, unit), `stock_quantity`, `price_per_base`).
3. **`orders`**: Invoice headers (`id`, `user_id` (references seller), `buyer_name`, `total_price_paise`, `created_at`).
4. **`order_items`**: Purchase breakdowns (`id`, `order_id`, `product_id`, `ordered_qty`, `ordered_unit`, `base_qty`, `base_unit`, `price_per_base_paise`, `line_total_paise`).

---

## 📐 Architecture & Engineering Highlights (Recruiter Q&A)

### Q1: Why store prices in Paise instead of Rupees?
Double-precision floats or standard decimals in JavaScript are prone to binary representation errors (e.g. `0.1 + 0.2 === 0.30000000000000004`). By converting all currency inputs to integers (Paise) at the system boundaries, we perform financial calculations (discounts, aggregations, multiplications) with absolute precision, converting back to display formats only at the view level.

### Q2: How does the Multi-Unit Conversion Engine work?
All conversions are isolated in [lib/units.ts](file:///c:/Users/ASUS/OneDrive/ドキュメント/AasamedProj/aasamedchem/lib/units.ts). It enforces strict unit class mappings:
- Weight class: `g` $\leftrightarrow$ `kg` (Scale factor: 1000)
- Volume class: `mL` $\leftrightarrow$ `L` (Scale factor: 1000)
- Count class: `unit` (Scale factor: 1)

When a seller orders `2 L` of a product whose base unit is `mL`:
$$\text{Base Qty} = 2 \times 1000 = 2000 \text{ mL}$$
$$\text{Line Total (Paise)} = \text{Base Qty} \times \text{Price Per Base} = 2000 \text{ mL} \times 5 \text{ Paise} = 10000 \text{ Paise} = \text{₹}100.00$$

### Q3: How is build-time safety achieved on Vercel?
Next.js attempts to statically compile and dry-run routes during build optimization. If database secrets are not present in the CI/CD pipeline, module-level DB connection instances immediately crash. We implemented **Lazy Evaluation Guards** in [lib/db.ts](file:///c:/Users/ASUS/OneDrive/ドキュメント/AasamedProj/aasamedchem/lib/db.ts) to intercept compile-time instantiations gracefully, allowing production bundles to build securely and execute queries once env variables load.

---

## 📡 REST API Documentation

| Route | Method | Authentication | Description |
|---|---|---|---|
| `/api/products` | `GET` | Public/Authenticated | Fetch catalog, supports `?q=` name/sku keyword search. |
| `/api/products` | `POST` | Admin Only | Create new chemical/supply product catalog entry. |
| `/api/products/[id]` | `PUT` | Admin Only | Edit specs, stock levels, or unit pricing of a product. |
| `/api/products/[id]` | `DELETE` | Admin Only | Remove a product from the database. |
| `/api/orders` | `POST` | Seller Only | Place order, perform conversions, check stock, and deduct inventory. |
| `/api/orders` | `GET` | Admin & Seller | Admins view all sales; Sellers view only their own transactions. |

---

## 🚀 Installation & Local Execution

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment variables (`.env.local`)
Create a `.env.local` file in the project root:
```env
DATABASE_URL=postgresql://neondb_owner:...@ep-bitter-tree-apwft6n8...
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Initialize & Seed Database
Create the PostgreSQL tables in your Neon Console and seed the default products & users:
```bash
npx tsx scripts/db-init.ts
npx tsx scripts/seed.ts
```

### 4. Boot Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🧪 Seeding & Test Case Verifications

Log in with these credentials to verify the unit conversions:
- **Admin**: `admin@test.com` / `admin123`
- **Seller**: `seller@test.com` / `seller123`

### Executed Verification Cases:
1. **Ethanol 99% Order**: Logged as `2 L` (Base: `mL`, price: `5 paise/mL`). Compiles to `2000 mL` base, yielding a total price of exactly **₹100.00**. Stock correctly decrements from `10,000 mL` to `8,000 mL`.
2. **NaCl Order**: Logged as `0.5 kg` (Base: `g`, price: `200 paise/g`). Compiles to `500 g` base, yielding a total price of exactly **₹1,000.00**. Stock correctly decrements from `5,000 g` to `4,500 g`.
3. **Nitrile Gloves Order**: Logged as `100 unit` (Base: `unit`, price: `500 paise/unit`). Compiles to `100 unit` base, yielding a total price of exactly **₹500.00**. Stock correctly decrements from `1,000 units` to `900 units`.
4. **RBAC Redirect Test**:
   - Accessing `/admin` when unauthenticated redirects to `/login`.
   - Logging in as `seller@test.com` redirects to `/seller`.
   - Accessing `/admin` as a seller redirects back to `/seller`.
