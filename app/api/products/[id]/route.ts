import { NextResponse } from "next/server";
import { sql } from "@/lib/db";


// UPDATE PRODUCT
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const updatedProduct = await sql`
      UPDATE products
      SET
        name = ${name},
        sku = ${sku},
        category = ${category},
        description = ${description},
        base_unit = ${base_unit},
        stock_quantity = ${stock_quantity},
        price_per_base = ${price_per_base},
        updated_at = NOW()

      WHERE id = ${params.id}

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


// DELETE PRODUCT
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {

    await sql`
      DELETE FROM products
      WHERE id = ${params.id};
    `;

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