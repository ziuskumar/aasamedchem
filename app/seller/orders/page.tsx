"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  product_name: string;
  product_sku: string;
  ordered_qty: number;
  ordered_unit: string;
  base_qty: number;
  base_unit: string;
  price_per_base_paise: number;
  line_total_paise: number;
};

type Order = {
  id: number;
  buyer_name: string;
  seller_name: string;
  total_price_paise: number;
  created_at: string;
  items: OrderItem[];
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">My Sales History</h1>
        <p className="text-sm text-zinc-400 mt-1">Review your past transactions, buyer conversions, and order statuses</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-zinc-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading sales records...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
          You haven't placed any orders yet. Go to the Catalog to log your first sale!
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
            >
              {/* Order Header */}
              <div className="bg-zinc-950/80 px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-8 gap-y-2">
                  <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Order ID</div>
                    <div className="text-sm font-bold text-white">#ORD-{order.id.toString().padStart(4, "0")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Date Placed</div>
                    <div className="text-sm font-medium text-zinc-300">
                      {new Date(order.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Buyer Name</div>
                    <div className="text-sm font-bold text-white">{order.buyer_name}</div>
                  </div>
                </div>
                <div className="sm:text-right border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Invoice Amount</div>
                  <div className="text-lg font-black text-green-400">
                    ₹{(order.total_price_paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-xxs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-6">Product / SKU</th>
                      <th className="py-3 px-6 text-center">Ordered Quantity</th>
                      <th className="py-3 px-6 text-center">Converted Base Qty</th>
                      <th className="py-3 px-6 text-right">Unit Price</th>
                      <th className="py-3 px-6 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/50 text-sm text-zinc-350">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-white">{item.product_name}</div>
                          <div className="text-xs font-mono text-zinc-500 mt-0.5">{item.product_sku}</div>
                        </td>
                        <td className="py-3.5 px-6 text-center font-medium">
                          {item.ordered_qty} <span className="text-zinc-500 text-xs">{item.ordered_unit}</span>
                        </td>
                        <td className="py-3.5 px-6 text-center font-medium text-zinc-400">
                          {item.base_qty} <span className="text-zinc-500 text-xs">{item.base_unit}</span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-medium">
                          ₹{(item.price_per_base_paise / 100).toFixed(2)}
                          <span className="text-zinc-500 text-xs">/{item.base_unit}</span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-bold text-white">
                          ₹{(item.line_total_paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
