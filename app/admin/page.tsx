import { sql } from "@/lib/db";
import Link from "next/link";

export const revalidate = 0; // Disable caching to ensure real-time stats

export default async function AdminPage() {
  let totalProducts = 0;
  let totalOrders = 0;
  let totalRevenueRupees = 0;
  let recentOrders: any[] = [];

  try {
    // Query statistics from database directly
    const productsCountRes = await sql`SELECT COUNT(*)::int as count FROM products`;
    const ordersCountRes = await sql`
      SELECT 
        COUNT(*)::int as count, 
        COALESCE(SUM(total_price_paise), 0)::bigint as total_revenue 
      FROM orders
    `;

    totalProducts = productsCountRes[0]?.count || 0;
    totalOrders = ordersCountRes[0]?.count || 0;
    const totalRevenuePaise = Number(ordersCountRes[0]?.total_revenue || 0);
    totalRevenueRupees = totalRevenuePaise / 100;

    // Fetch recent orders
    recentOrders = await sql`
      SELECT o.id, o.buyer_name, o.total_price_paise, o.created_at, u.name as seller_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
  } catch (error) {
    console.warn("Admin Dashboard: Database stats fetch deferred (build/no-connection context):", error);
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">Real-time inventory and sales metrics for AASAMEDCHEM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-md">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Total Products</span>
          <span className="text-4xl font-black text-white block mt-2">{totalProducts}</span>
          <span className="text-xs text-zinc-400 mt-1 block">In catalog</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-md">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Orders Processed</span>
          <span className="text-4xl font-black text-white block mt-2">{totalOrders}</span>
          <span className="text-xs text-zinc-400 mt-1 block">Across all sellers</span>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-md">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Gross Sales Revenue</span>
          <span className="text-4xl font-black text-green-400 block mt-2">
            ₹{totalRevenueRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-zinc-400 mt-1 block">INR value</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between hover:border-blue-500/55 transition-all group">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Products Catalog Management</h3>
            <p className="text-sm text-zinc-400 mt-2">
              Add new supplies, edit specifications, update base pricing per units, adjust inventory levels, and delete products.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center text-sm font-semibold text-blue-500 hover:text-blue-400 mt-6"
          >
            Go to Products →
          </Link>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-xl p-6 flex flex-col justify-between hover:border-blue-500/55 transition-all group">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Sales Audit Log</h3>
            <p className="text-sm text-zinc-400 mt-2">
              Access the master sales log. Audit transactions, view full item breakdowns, ordered units, base units, and seller credits.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-sm font-semibold text-blue-500 hover:text-blue-400 mt-6"
          >
            Go to Orders →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Recent Sales</h3>
        {recentOrders.length === 0 ? (
          <div className="text-zinc-500 text-sm py-4 text-center">No orders placed recently.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <div className="font-semibold text-white">#ORD-{order.id.toString().padStart(4, "0")}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Placed by <span className="font-medium text-blue-400">{order.seller_name}</span> for <span className="font-medium text-zinc-350">{order.buyer_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">₹{(order.total_price_paise / 100).toFixed(2)}</div>
                  <div className="text-xxs text-zinc-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
