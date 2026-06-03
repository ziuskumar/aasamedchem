import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

// ==========================================
// UPDATE PRODUCT (admin only)
// ==========================================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
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

    // First fetch the existing product to retain fields if missing
    const existing = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = existing[0];

    const updatedProduct = await sql`
      UPDATE products
      SET
        name = ${name !== undefined ? name : product.name},
        sku = ${sku !== undefined ? sku : product.sku},
        category = ${category !== undefined ? category : product.category},
        description = ${description !== undefined ? description : product.description},
        base_unit = ${base_unit !== undefined ? base_unit : product.base_unit},
        stock_quantity = ${stock_quantity !== undefined ? Number(stock_quantity) : product.stock_quantity},
        price_per_base = ${finalPricePaise !== undefined ? Number(finalPricePaise) : product.price_per_base},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
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
    const { id } = resolvedParams;

    const session = await getAuthSession();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await sql`
      DELETE FROM products
      WHERE id = ${id}
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
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}