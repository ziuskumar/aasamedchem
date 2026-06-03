"use client";

import { useState, useEffect } from "react";

type Product = {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string;
  base_unit: string;
  stock_quantity: number;
  price_per_base: number;
};

export default function SellerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // Order modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderUnit, setOrderUnit] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Debounce search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products based on debounced search query
  async function fetchProducts(query: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts(debouncedTerm);
  }, [debouncedTerm]);

  // Open order drawer for a product
  function openOrderModal(product: Product) {
    setSelectedProduct(product);
    setBuyerName("");
    setOrderQty("");
    setOrderError("");
    setOrderSuccess(false);

    // Default to the base unit
    setOrderUnit(product.base_unit);
  }

  // Get compatible units for dropdown selection
  function getCompatibleUnits(baseUnit: string): string[] {
    if (baseUnit === "g") return ["g", "kg"];
    if (baseUnit === "mL") return ["mL", "L"];
    return ["unit"];
  }

  // Get conversion factor for selected unit
  function getConversionFactor(unit: string): number {
    if (unit === "kg" || unit === "L") return 1000;
    return 1; // g, mL, unit
  }

  // Live Price Calculation
  const qtyNum = parseFloat(orderQty);
  let livePriceINR = 0;
  let liveBaseQty = 0;

  if (selectedProduct && !isNaN(qtyNum) && qtyNum > 0 && orderUnit) {
    const factor = getConversionFactor(orderUnit);
    liveBaseQty = qtyNum * factor;
    // price = (qty * conversionFactor * pricePerBasePaise) / 100
    livePriceINR = (qtyNum * factor * selectedProduct.price_per_base) / 100;
  }

  // Format unit pricing display
  function getPriceDisplay(product: Product) {
    const priceBaseINR = product.price_per_base / 100;
    if (product.base_unit === "g") {
      return `₹${priceBaseINR.toFixed(2)}/g | ₹${(priceBaseINR * 1000).toFixed(0)}/kg`;
    }
    if (product.base_unit === "mL") {
      return `₹${priceBaseINR.toFixed(2)}/mL | ₹${(priceBaseINR * 1000).toFixed(0)}/L`;
    }
    return `₹${priceBaseINR.toFixed(2)}/unit`;
  }

  // Handle Order Submit
  async function handleOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOrderError("");
    setSubmittingOrder(true);

    if (!selectedProduct) return;
    if (!buyerName || !orderQty || !orderUnit) {
      setOrderError("Please fill out all fields.");
      setSubmittingOrder(false);
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      setOrderError("Please enter a valid positive quantity.");
      setSubmittingOrder(false);
      return;
    }

    // Double check stock locally first
    if (selectedProduct.stock_quantity < liveBaseQty) {
      setOrderError(
        `Insufficient stock. Available: ${selectedProduct.stock_quantity} ${selectedProduct.base_unit}, Requested: ${liveBaseQty} ${selectedProduct.base_unit}`
      );
      setSubmittingOrder(false);
      return;
    }

    const payload = {
      buyer_name: buyerName,
      items: [
        {
          product_id: selectedProduct.id,
          qty: qtyNum,
          unit: orderUnit,
        },
      ],
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to place order");
      }

      setOrderSuccess(true);
      // Refresh current products list to update stock
      fetchProducts(debouncedTerm);
      // Close modal after a short delay
      setTimeout(() => {
        setSelectedProduct(null);
      }, 1500);
    } catch (err: any) {
      setOrderError(err.message || "Something went wrong.");
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Products Catalog</h1>
          <p className="text-sm text-zinc-400 mt-1">Search inventory and log sales with real-time conversion previews</p>
        </div>
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Grid of Product Cards */}
      {loading ? (
        <div className="flex justify-center py-20 text-zinc-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Searching inventory...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
          No matching products found in the catalog.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {products.map((product) => {
            const isOutOfStock = product.stock_quantity <= 0;
            return (
              <div
                key={product.id}
                className="bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="bg-zinc-800 text-zinc-400 font-mono text-xxs px-2 py-0.5 rounded uppercase tracking-wider">
                      {product.sku}
                    </span>
                    <span className="text-zinc-500 text-xs">{product.category}</span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-zinc-850 pt-4 space-y-4">
                  <div className="flex justify-between items-end text-sm">
                    <div>
                      <span className="text-xxs text-zinc-500 block uppercase tracking-wider">Stock Available</span>
                      <span className={`font-bold mt-0.5 block ${isOutOfStock ? "text-red-500" : "text-white"}`}>
                        {isOutOfStock ? "Out of Stock" : `${product.stock_quantity.toLocaleString()} ${product.base_unit}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xxs text-zinc-500 block uppercase tracking-wider">Pricing</span>
                      <span className="font-bold text-blue-400 mt-0.5 block">{getPriceDisplay(product)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openOrderModal(product)}
                    disabled={isOutOfStock}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-850 disabled:text-zinc-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:shadow-none text-xs transition-all"
                  >
                    {isOutOfStock ? "Unavailable" : "Log Order"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Form Drawer/Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Log Sale: {selectedProduct.name}</h3>
                <span className="text-xs text-zinc-500">Base Unit: {selectedProduct.stock_quantity} {selectedProduct.base_unit} available</span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="p-6 space-y-4">
              {orderSuccess ? (
                <div className="bg-green-950/40 border border-green-500/50 text-green-200 p-4 rounded-lg text-center text-sm font-semibold animate-bounce">
                  Order logged successfully! 🎉
                </div>
              ) : (
                <>
                  {orderError && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg text-xs">
                      {orderError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Buyer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABC Diagnostics"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400">Quantity</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={orderQty}
                        onChange={(e) => setOrderQty(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400">Unit</label>
                      <select
                        value={orderUnit}
                        onChange={(e) => setOrderUnit(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                      >
                        {getCompatibleUnits(selectedProduct.base_unit).map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Real-time price and base conversion summary */}
                  {!isNaN(qtyNum) && qtyNum > 0 && (
                    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-4 space-y-2 animate-in slide-in-from-top-1 duration-150">
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>Quantity in Base:</span>
                        <span className="font-semibold text-white">
                          {liveBaseQty.toLocaleString()} {selectedProduct.base_unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>Rate:</span>
                        <span>₹{(selectedProduct.price_per_base / 100).toFixed(2)} per {selectedProduct.base_unit}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-zinc-850 pt-2 text-sm">
                        <span className="font-semibold text-zinc-300">Live Preview Price:</span>
                        <span className="font-black text-green-400 text-base">
                          ₹{livePriceINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      {submittingOrder ? "Submitting..." : "Place Order"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}