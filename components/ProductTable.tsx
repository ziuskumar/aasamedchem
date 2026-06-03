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

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();

      setProducts(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  }

  async function handleDelete(id: string) {

    const confirmed = confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {

      const res = await fetch(
        `/api/products/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      alert("Product deleted successfully 😄");

      fetchProducts();

    } catch (error) {

      console.error(error);

      alert("Failed to delete product");
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="text-white mt-8">
        Loading products...
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 mt-8">

      <h2 className="text-2xl font-bold text-white mb-6">
        Products Inventory
      </h2>

      <div className="overflow-x-auto">

        <table className="w-full text-left text-white">

          <thead>

            <tr className="border-b border-zinc-700">

              <th className="p-3">Name</th>

              <th className="p-3">SKU</th>

              <th className="p-3">Category</th>

              <th className="p-3">Unit</th>

              <th className="p-3">Stock</th>

              <th className="p-3">Price</th>

              <th className="p-3">Actions</th>

            </tr>

          </thead>

          <tbody>

            {products.map((product) => (

              <tr
                key={product.id}
                className="border-b border-zinc-800"
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
                  {
                    parseFloat(
                      product.stock_quantity.toString()
                    )
                  }
                </td>

                <td className="p-3">
                  ₹
                  {(
                    product.price_per_base / 100
                  ).toFixed(2)}
                </td>

                <td className="p-3 flex gap-2">

                  <button
                    onClick={() =>
                      handleDelete(product.id)
                    }

                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}