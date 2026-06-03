# AASAMEDCHEM Web Application

A premium Chemicals & Lab Supplies inventory manager and sales logging portal built with Next.js, TypeScript, Tailwind CSS, and Neon (PostgreSQL).

## Tech Stack & Architecture
- **Framework**: Next.js (App Router, React 19)
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Authentication**: NextAuth.js (Credentials Provider with role-based JWT sessions)
- **Styling**: Tailwind CSS with custom dark mode and premium interactive cards
- **Middleware**: Next.js middleware for path-level RBAC route protection

---

## Database Schema

The database consists of four tables:
1. **`users`**: Manages credentials and roles (`admin`, `seller`).
2. **`products`**: Maintains inventory, SKU codes, categories, descriptions, base units (`g`, `mL`, `unit`), stock quantities, and base pricing (stored in paise).
3. **`orders`**: Tracks sales orders placed by sellers including overall invoice values and buyer names.
4. **`order_items`**: Logs individual items per order, recording both the ordered units/quantities (e.g., `L`, `kg`) and the translated base units/quantities (e.g., `mL`, `g`) alongside unit prices and line totals in paise.

---

## Unit Conversion & Pricing Logic

All conversions and calculations are centralized in [lib/units.ts](file:///c:/Users/ASUS/OneDrive/ドキュメント/AasamedProj/aasamedchem/lib/units.ts):
- **Compatible Units**:
  - Weight (`g` base): `g`, `kg` (1 kg = 1000 g)
  - Volume (`mL` base): `mL`, `L` (1 L = 1000 mL)
  - Count (`unit` base): `unit`
- **Frontend Real-time Previews**:
  $$\text{Price (₹)} = \frac{\text{Qty} \times \text{Conversion Factor} \times \text{Price Per Base (paise)}}{100}$$
- **Backend Validation**:
  Orders convert requested quantities to the base unit using `toBaseUnit()`. Checks are performed to ensure sufficient stock exists. Deductions are then performed in base quantities, preserving stock integrity.

---

## Running the Project

### 1. Setup Environment
Ensure your `.env.local` contains:
```env
DATABASE_URL=your_neon_db_url
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database & Seed
Initialize tables and seed demo credentials + products:
```bash
npx tsx scripts/db-init.ts
npx tsx scripts/seed.ts
```

### 4. Start Development Server
```bash
npm run dev
```

---

## Demo Credentials & Test Cases

### 1. Credentials
- **Admin**: `admin@test.com` / `admin123`
- **Seller**: `seller@test.com` / `seller123`

### 2. Test Cases verified:
- **2L Ethanol 99%**: base `mL`, price `5 paise/mL`. Converts to `2000 mL`. Line total is `₹100.00`.
- **0.5kg NaCl**: base `g`, price `200 paise/g`. Converts to `500 g`. Line total is `₹1,000.00`.
- **100 Nitrile Gloves**: base `unit`, price `500 paise/unit`. Converts to `100 units`. Line total is `₹500.00`.
- **RBAC Redirection**: Unauthenticated accesses to `/admin` or `/seller` redirect to `/login`. Non-admin accesses to `/admin` redirect to `/seller`.
