import { NextResponse } from "next/server";
import { ApiError, isApiError, parseBaseUnit, parseIdParam, parseNonNegativeNumber, parseOptionalString, parsePricePaise } from "@/lib/api-utils";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

type UpdateProductBody = {
  name?: unknown;
  sku?: unknown;
  category?: unknown;
  description?: unknown;
  base_unit?: unknown;
  stock_quantity?: unknown;
  price_per_base_paise?: unknown;
  price_per_base?: unknown;
};

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  base_unit: string;
  stock_quantity: number;
  price_per_base: number;
};

// ==========================================
// UPDATE PRODUCT (admin only)
// ==========================================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = parseIdParam(resolvedParams.id);
    const session = await getAuthSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as UpdateProductBody;

    // First fetch the existing product to retain fields if missing
    const existing = await sql`SELECT * FROM products WHERE id = ${productId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = existing[0] as ProductRow;
    const nextName =
      body.name !== undefined ? parseOptionalString(body.name) ?? "" : product.name;
    const nextSku =
      body.sku !== undefined ? parseOptionalString(body.sku) ?? "" : product.sku;

    if (!nextName) {
      throw new ApiError(400, "name is required.");
    }

    if (!nextSku) {
      throw new ApiError(400, "sku is required.");
    }

    const nextCategory =
      body.category !== undefined
        ? parseOptionalString(body.category) || "General"
        : product.category;
    const nextDescription =
      body.description !== undefined
        ? parseOptionalString(body.description) || ""
        : product.description || "";
    const nextBaseUnit =
      body.base_unit !== undefined
        ? parseBaseUnit(body.base_unit)
        : product.base_unit;
    const nextStockQuantity =
      body.stock_quantity !== undefined
        ? parseNonNegativeNumber(body.stock_quantity, "stock_quantity", {
            integer: true,
          })
        : Number(product.stock_quantity);
    const nextPricePaise =
      body.price_per_base_paise !== undefined || body.price_per_base !== undefined
        ? parsePricePaise(body as Record<string, unknown>)
        : Number(product.price_per_base);

    const updatedProduct = await sql`
      UPDATE products
      SET
        name = ${nextName},
        sku = ${nextSku},
        category = ${nextCategory},
        description = ${nextDescription},
        base_unit = ${nextBaseUnit},
        stock_quantity = ${nextStockQuantity},
        price_per_base = ${nextPricePaise},
        updated_at = NOW()
      WHERE id = ${productId}
      RETURNING *;
    `;

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (
      error instanceof Error &&
      error.message.includes('duplicate key value violates unique constraint')
    ) {
      return NextResponse.json(
        { error: "A product with this SKU already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE PRODUCT (admin only)
// ==========================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = parseIdParam(resolvedParams.id);

    const session = await getAuthSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await sql`
      DELETE FROM products
      WHERE id = ${productId}
      RETURNING *;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
