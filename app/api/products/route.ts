import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// ==========================================
// GET PRODUCTS (?q=searchterm)
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";

    const products = await sql`
      SELECT *
      FROM products
      WHERE
        name ILIKE ${"%" + q + "%"}
        OR sku ILIKE ${"%" + q + "%"}
      ORDER BY name ASC;
    `;

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// ==========================================
// CREATE PRODUCT (admin only)
// ==========================================
export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      category,
      description,
      base_unit,
      stock_quantity,
      price_per_base_paise,
      price_per_base,
    } = body;

    const finalPricePaise = price_per_base_paise !== undefined 
      ? price_per_base_paise 
      : price_per_base;

    // Validation
    if (
      !name ||
      !sku ||
      !base_unit ||
      stock_quantity === undefined ||
      finalPricePaise === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields: name, sku, base_unit, stock_quantity, price_per_base_paise" },
        { status: 400 }
      );
    }

    const finalCategory = category || "General";
    const finalDescription = description || "";

    const insertedProduct = await sql`
      INSERT INTO products (
        name,
        sku,
        category,
        description,
        base_unit,
        stock_quantity,
        price_per_base
      )
      VALUES (
        ${name},
        ${sku},
        ${finalCategory},
        ${finalDescription},
        ${base_unit},
        ${Number(stock_quantity)},
        ${Number(finalPricePaise)}
      )
      RETURNING *;
    `;

    return NextResponse.json(insertedProduct[0], {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}