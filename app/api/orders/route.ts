import { Pool } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { ApiError, isApiError, parseNonNegativeNumber, parseRequiredString } from "@/lib/api-utils";
import { getAuthSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { toBaseUnit, getCompatibleUnits } from "@/lib/units";

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  base_unit: "g" | "mL" | "unit";
  stock_quantity: number;
  price_per_base: number;
};

type OrderListRow = {
  order_id: number;
  buyer_name: string;
  total_price_paise: number;
  created_at: string;
  seller_name: string;
  item_id: number;
  ordered_qty: string | number;
  ordered_unit: string;
  base_qty: string | number;
  base_unit: string;
  price_per_base_paise: number;
  line_total_paise: number;
  product_name: string;
  product_sku: string;
};

type OrderMapEntry = {
  id: number;
  buyer_name: string;
  total_price_paise: number;
  created_at: string;
  seller_name: string;
  items: Array<{
    id: number;
    product_name: string;
    product_sku: string;
    ordered_qty: number;
    ordered_unit: string;
    base_qty: number;
    base_unit: string;
    price_per_base_paise: number;
    line_total_paise: number;
  }>;
};

type OrderItemInput = {
  product_id?: unknown;
  qty?: unknown;
  unit?: unknown;
};

type OrderBody = {
  buyer_name?: unknown;
  items?: unknown;
};

// ==========================================
// GET ORDERS (admin sees all, seller sees own)
// ==========================================
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user;
    const finalUserId = Number(userId);
    if (!Number.isInteger(finalUserId) || finalUserId <= 0) {
      return NextResponse.json({ error: "Invalid session user id" }, { status: 401 });
    }

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

    const ordersMap: Record<number, OrderMapEntry> = {};

    for (const row of rows as OrderListRow[]) {
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
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as OrderBody;
    const buyerName = parseRequiredString(body.buyer_name, "buyer_name");
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "At least one order item is required.");
    }

    // Step 1: Pre-validate all items and check stock levels
    const validatedItems: Array<{
      product: any;
      qty: number;
      unit: string;
      baseQty: number;
      lineTotalPaise: number;
      productId: number;
      pricePerBasePaise: number;
    }> = [];

    for (const rawItem of items as OrderItemInput[]) {
      const productId = parseNonNegativeNumber(
        rawItem.product_id,
        "product_id",
        { integer: true }
      );
      const qty = parseNonNegativeNumber(rawItem.qty, "qty");
      const unit = parseRequiredString(rawItem.unit, "unit");

      const products = await sql`
        SELECT * FROM products WHERE id = ${productId}
      `;
      const product = products[0] as ProductRow | undefined;

      if (!product) {
        throw new ApiError(404, `Product with ID ${productId} not found.`);
      }

      // Check unit compatibility
      const compatible = getCompatibleUnits(product.base_unit);
      if (!compatible.includes(unit)) {
        throw new ApiError(
          400,
          `Incompatible unit '${unit}' for product '${product.name}' with base unit '${product.base_unit}'.`
        );
      }

      // Convert quantity to base unit
      let baseQty: number;
      try {
        baseQty = toBaseUnit(qty, unit);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown conversion error";
        throw new ApiError(
          400,
          `Unit conversion error for ${product.name}: ${message}`
        );
      }

      // Check stock
      if (product.stock_quantity < baseQty) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.name}. Available: ${product.stock_quantity} ${product.base_unit}, Requested: ${baseQty} ${product.base_unit}`
        );
      }

      // Calculate line total in paise
      const lineTotalPaise = Math.round(baseQty * product.price_per_base);

      validatedItems.push({
        product,
        productId,
        qty,
        unit,
        baseQty,
        lineTotalPaise,
        pricePerBasePaise: Number(product.price_per_base),
      });
    }

    const finalUserId = Number(session.user.id);
    if (!Number.isInteger(finalUserId) || finalUserId <= 0) {
      throw new ApiError(401, "Invalid session user id.");
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set.");
    }

    const pool = new Pool({ connectionString });

    try {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const orderRes = await client.query<{ id: number }>(
          `
            INSERT INTO orders (user_id, buyer_name, total_price_paise)
            VALUES ($1, $2, 0)
            RETURNING id
          `,
          [finalUserId, buyerName]
        );
        const orderId = orderRes.rows[0]?.id;
        if (!orderId) {
          throw new Error("Failed to create order header.");
        }

        let totalPricePaise = 0;

        for (const item of validatedItems) {
          const stockUpdate = await client.query(
            `
              UPDATE products
              SET stock_quantity = stock_quantity - $1
              WHERE id = $2 AND stock_quantity >= $1
              RETURNING id
            `,
            [item.baseQty, item.productId]
          );

          if (stockUpdate.rowCount !== 1) {
            throw new ApiError(
              400,
              `Insufficient stock for ${item.product.name}.`
            );
          }

          await client.query(
            `
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
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
              orderId,
              item.productId,
              item.qty,
              item.unit,
              item.baseQty,
              item.product.base_unit,
              item.pricePerBasePaise,
              item.lineTotalPaise,
            ]
          );

          totalPricePaise += item.lineTotalPaise;
        }

        await client.query(
          `
            UPDATE orders
            SET total_price_paise = $1
            WHERE id = $2
          `,
          [totalPricePaise, orderId]
        );

        await client.query("COMMIT");

        return NextResponse.json(
          {
            success: true,
            order_id: orderId,
            total_price_paise: totalPricePaise,
          },
          { status: 201 }
        );
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }

  } catch (error) {
    console.error("POST ORDER ERROR:", error);

    if (isApiError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
