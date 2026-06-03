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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    base_unit: "g",
    price_in_inr: "",
    stock_quantity: "",
    description: "",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch products
  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
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
    fetchProducts();
  }, []);

  // Open Form for Adding
  function openAddModal() {
    setEditingProduct(null);
    setFormData({
      name: "",
      sku: "",
      category: "",
      base_unit: "g",
      price_in_inr: "",
      stock_quantity: "",
      description: "",
    });
    setFormError("");
    setIsFormOpen(true);
  }

  // Open Form for Editing
  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      base_unit: product.base_unit,
      price_in_inr: (product.price_per_base / 100).toString(),
      stock_quantity: product.stock_quantity.toString(),
      description: product.description || "",
    });
    setFormError("");
    setIsFormOpen(true);
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const { name, sku, category, base_unit, price_in_inr, stock_quantity, description } = formData;

    if (!name || !sku || !category || !base_unit || price_in_inr === "" || stock_quantity === "") {
      setFormError("All fields except description are required.");
      setSubmitting(false);
      return;
    }

    const priceRupees = parseFloat(price_in_inr);
    const stockQty = Number(stock_quantity);

    if (isNaN(priceRupees) || priceRupees < 0) {
      setFormError("Please enter a valid price.");
      setSubmitting(false);
      return;
    }

    if (isNaN(stockQty) || stockQty < 0) {
      setFormError("Please enter a valid stock quantity.");
      setSubmitting(false);
      return;
    }

    // Convert price to paise
    const pricePerBasePaise = Math.round(priceRupees * 100);

    const payload = {
      name,
      sku,
      category,
      description,
      base_unit,
      stock_quantity: stockQty,
      price_per_base_paise: pricePerBasePaise,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save product");
      }

      setIsFormOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle Deletion
  async function handleDelete(product: Product) {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete product");
      }

      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Products Catalog</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage chemical inventory, SKUs, pricing and stock levels</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all text-sm"
        >
          Add New Product
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-zinc-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading inventory catalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center text-zinc-400">
          No products found. Click "Add New Product" to populate the inventory.
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">SKU</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Base Unit</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6 text-right">Price per Base Unit</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-sm text-zinc-300">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-zinc-400">{product.sku}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{product.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-zinc-400">{product.base_unit}</td>
                    <td className="py-4 px-6 font-semibold">
                      {product.stock_quantity.toLocaleString()} {product.base_unit}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-white">
                      ₹{(product.price_per_base / 100).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium px-3 py-1.5 rounded transition-all text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="bg-red-950/40 hover:bg-red-900 border border-red-900/30 text-red-300 font-medium px-3 py-1.5 rounded transition-all text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? `Edit Product: ${editingProduct.sku}` : "Add New Product"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                    placeholder="e.g. Sodium Hydroxide"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                    placeholder="e.g. SH-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                    placeholder="e.g. Chemicals"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Base Unit</label>
                  <select
                    value={formData.base_unit}
                    onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                  >
                    <option value="g">g (Grams)</option>
                    <option value="mL">mL (Milliliters)</option>
                    <option value="unit">unit (Count)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Price in ₹ (per Base Unit)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price_in_inr}
                      onChange={(e) => setFormData({ ...formData, price_in_inr: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg pl-7 pr-3 py-2.5 text-sm transition-all outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Stock Quantity (Base Unit)</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg p-2.5 text-sm transition-all outline-none h-20 resize-none"
                  placeholder="Additional details about the product..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                >
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
