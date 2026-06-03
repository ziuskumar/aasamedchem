import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { toBaseUnit, getCompatibleUnits } from "@/lib/units";

// ==========================================
// GET ORDERS (admin sees all, seller sees own)
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const session = (await getAuthSession()) as any;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    const finalUserId = isNaN(Number(userId)) ? -1 : Number(userId);

    // Join orders, users, order_items, and products
    const rows = await sql`
      SELECT
        o.id AS order_id,
        o.buyer_name,
        o.total_price_paise,
        o.created_at,
        u.name AS seller_name,
        oi.id AS item_id,
        oi.ordered_qty,
        oi.ordered_unit,
        oi.base_qty,
        oi.base_unit,
        oi.price_per_base_paise,
        oi.line_total_paise,
        p.name AS product_name,
        p.sku AS product_sku
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE ${role} = 'admin' OR o.user_id = ${finalUserId}
      ORDER BY o.created_at DESC, o.id DESC;
    `;

    const ordersMap: Record<number, any> = {};

    for (const row of rows) {
      const orderId = row.order_id;
      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          id: orderId,
          buyer_name: row.buyer_name,
          total_price_paise: row.total_price_paise,
          created_at: row.created_at,
          seller_name: row.seller_name,
          items: [],
        };
      }

      ordersMap[orderId].items.push({
        id: row.item_id,
        product_name: row.product_name,
        product_sku: row.product_sku,
        ordered_qty: Number(row.ordered_qty),
        ordered_unit: row.ordered_unit,
        base_qty: Number(row.base_qty),
        base_unit: row.base_unit,
        price_per_base_paise: row.price_per_base_paise,
        line_total_paise: row.line_total_paise,
      });
    }

    return NextResponse.json(Object.values(ordersMap));
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// ==========================================
// POST ORDER (create order & decrement stock)
// ==========================================
export async function POST(req: Request) {
  try {
    const session = (await getAuthSession()) as any;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { buyer_name, items } = body; // items: Array<{ product_id: number, qty: number, unit: string }>

    if (!buyer_name || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: buyer_name and items" },
        { status: 400 }
      );
    }

    // Step 1: Pre-validate all items and check stock levels
    const validatedItems: Array<{
      product: any;
      qty: number;
      unit: string;
      baseQty: number;
      lineTotalPaise: number;
    }> = [];

    for (const item of items) {
      const { product_id, qty, unit } = item;

      if (!product_id || !qty || !unit) {
        return NextResponse.json(
          { error: "Invalid item details: product_id, qty, and unit are required" },
          { status: 400 }
        );
      }

      const products = await sql`
        SELECT * FROM products WHERE id = ${product_id}
      `;
      const product = products[0];

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${product_id} not found` },
          { status: 404 }
        );
      }

      // Check unit compatibility
      const compatible = getCompatibleUnits(product.base_unit);
      if (!compatible.includes(unit)) {
        return NextResponse.json(
          { error: `Incompatible unit '${unit}' for product '${product.name}' with base unit '${product.base_unit}'` },
          { status: 400 }
        );
      }

      // Convert quantity to base unit
      let baseQty: number;
      try {
        baseQty = toBaseUnit(Number(qty), unit);
      } catch (err: any) {
        return NextResponse.json(
          { error: `Unit conversion error for ${product.name}: ${err.message}` },
          { status: 400 }
        );
      }

      // Check stock
      if (product.stock_quantity < baseQty) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity} ${product.base_unit}, Requested: ${baseQty} ${product.base_unit}`,
          },
          { status: 400 }
        );
      }

      // Calculate line total in paise
      const lineTotalPaise = Math.round(baseQty * product.price_per_base);

      validatedItems.push({
        product,
        qty: Number(qty),
        unit,
        baseQty,
        lineTotalPaise,
      });
    }

    // Step 2: Perform inserts and updates
    // Create order header
    const finalUserId = isNaN(Number(session.user.id)) ? -1 : Number(session.user.id);
    const orderRes = await sql`
      INSERT INTO orders (user_id, buyer_name, total_price_paise)
      VALUES (${finalUserId}, ${buyer_name}, 0)
      RETURNING id;
    `;
    const orderId = orderRes[0].id;

    let totalPricePaise = 0;

    for (const val of validatedItems) {
      const { product, qty, unit, baseQty, lineTotalPaise } = val;

      // Deduct stock from products table
      await sql`
        UPDATE products
        SET stock_quantity = stock_quantity - ${baseQty}
        WHERE id = ${product.id};
      `;

      // Insert into order_items
      await sql`
        INSERT INTO order_items (
          order_id,
          product_id,
          ordered_qty,
          ordered_unit,
          base_qty,
          base_unit,
          price_per_base_paise,
          line_total_paise
        )
        VALUES (
          ${orderId},
          ${product.id},
          ${qty},
          ${unit},
          ${baseQty},
          ${product.base_unit},
          ${product.price_per_base},
          ${lineTotalPaise}
        );
      `;

      totalPricePaise += lineTotalPaise;
    }

    // Update total price in orders header
    await sql`
      UPDATE orders
      SET total_price_paise = ${totalPricePaise}
      WHERE id = ${orderId};
    `;

    return NextResponse.json({
      success: true,
      order_id: orderId,
      total_price_paise: totalPricePaise,
    }, { status: 201 });

  } catch (error) {
    console.error("POST ORDER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to place order: " + String(error) },
      { status: 500 }
    );
  }
}
