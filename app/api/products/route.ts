import { NextRequest, NextResponse } from "next/server";
import {
  ApiError,
  isApiError,
  parseBaseUnit,
  parseNonNegativeNumber,
  parseOptionalString,
  parsePricePaise,
  parseRequiredString,
} from "@/lib/api-utils";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

type CreateProductBody = {
  name?: unknown;
  sku?: unknown;
  category?: unknown;
  description?: unknown;
  base_unit?: unknown;
  stock_quantity?: unknown;
  price_per_base_paise?: unknown;
  price_per_base?: unknown;
};

// ==========================================
// GET PRODUCTS (?q=searchterm)
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const q = (searchParams.get("q") || "").trim();

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
      { status: 500 },
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

    const body = (await req.json()) as CreateProductBody;
    const name = parseRequiredString(body.name, "name");
    const sku = parseRequiredString(body.sku, "sku");
    const baseUnit = parseBaseUnit(body.base_unit);
    const stockQuantity = parseNonNegativeNumber(
      body.stock_quantity,
      "stock_quantity",
      { integer: true },
    );
    const finalPricePaise = parsePricePaise(body as Record<string, unknown>);
    const finalCategory = parseOptionalString(body.category) || "General";
    const finalDescription = parseOptionalString(body.description) || "";

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
        ${baseUnit},
        ${stockQuantity},
        ${finalPricePaise}
      )
      RETURNING *;
    `;

    return NextResponse.json(insertedProduct[0], {
      status: 201,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      return NextResponse.json(
        { error: "A product with this SKU already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
