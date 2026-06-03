"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  base_unit: string;
  stock_quantity: number;
  price_per_base: number;
};

export default function ProductTable() {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    try {

      const res = await fetch("/api/products");

      const data = await res.json();

      setProducts(data);

    } catch (error) {
      console.error("FETCH PRODUCTS ERROR:", error);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-white text-lg">
        Loading products...
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 mt-8 overflow-x-auto">

      <h2 className="text-2xl font-bold text-white mb-4">
        Products Inventory
      </h2>

      <table className="w-full text-left text-white">

        <thead className="border-b border-zinc-700">

          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">SKU</th>
            <th className="p-3">Category</th>
            <th className="p-3">Unit</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Price</th>
          </tr>

        </thead>

        <tbody>

          {products.map((product) => (

            <tr
              key={product.id}
              className="border-b border-zinc-800 hover:bg-zinc-800"
            >

              <td className="p-3">
                {product.name}
              </td>

              <td className="p-3">
                {product.sku}
              </td>

              <td className="p-3">
                {product.category}
              </td>

              <td className="p-3">
                {product.base_unit}
              </td>

              <td className="p-3">
                {product.stock_quantity}
              </td>

              <td className="p-3">
                ₹{(product.price_per_base / 100).toFixed(2)}
              </td>

            </tr>

          ))}

        </tbody>

      </table>
    </div>
  );
}