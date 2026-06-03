import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";


// =========================
// GET PRODUCTS
// =========================

export async function GET(req: NextRequest) {
  try {

    const searchParams = req.nextUrl.searchParams;

    const q = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const unitType = searchParams.get("unit_type");

    const products = await sql`
      SELECT *
      FROM products
      WHERE
        (
          name ILIKE ${"%" + q + "%"}
          OR sku ILIKE ${"%" + q + "%"}
          OR category ILIKE ${"%" + q + "%"}
        )

        AND (
          ${category}::text IS NULL
          OR category = ${category}
        )

        AND (
          ${unitType}::text IS NULL
          OR base_unit = ${unitType}
        )

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



// =========================
// CREATE PRODUCT
// =========================

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const {
      name,
      sku,
      category,
      description,
      base_unit,
      stock_quantity,
      price_per_base,
    } = body;

    // Validation
    if (
      !name ||
      !sku ||
      !category ||
      !base_unit ||
      stock_quantity === undefined ||
      price_per_base === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
        ${category},
        ${description},
        ${base_unit},
        ${stock_quantity},
        ${price_per_base}
      )
      RETURNING *;
    `;

    return NextResponse.json(insertedProduct[0], {
      status: 201,
    });

  } catch (error) {

    console.error("CREATE PRODUCT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}