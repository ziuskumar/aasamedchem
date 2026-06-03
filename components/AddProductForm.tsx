"use client";

import { useState } from "react";

export default function AddProductForm() {

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    base_unit: "g",
    stock_quantity: "",
    price_per_base: "",
  });

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {

      setLoading(true);

      const res = await fetch("/api/products", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formData,

          stock_quantity: Number(
            formData.stock_quantity
          ),

          price_per_base: Number(
            formData.price_per_base
          ),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create product");
      }

      alert("Product created successfully 😄");

      window.location.reload();

    } catch (error) {

      console.error(error);

      alert("Failed to create product");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 mt-8">

      <h2 className="text-2xl font-bold text-white mb-6">
        Add Product
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4"
      >

        <input
          type="text"
          placeholder="Product Name"
          className="p-3 rounded bg-zinc-800 text-white"

          value={formData.name}

          onChange={(e) =>
            setFormData({
              ...formData,
              name: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="SKU"
          className="p-3 rounded bg-zinc-800 text-white"

          value={formData.sku}

          onChange={(e) =>
            setFormData({
              ...formData,
              sku: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Category"
          className="p-3 rounded bg-zinc-800 text-white"

          value={formData.category}

          onChange={(e) =>
            setFormData({
              ...formData,
              category: e.target.value,
            })
          }
        />

        <select
          className="p-3 rounded bg-zinc-800 text-white"

          value={formData.base_unit}

          onChange={(e) =>
            setFormData({
              ...formData,
              base_unit: e.target.value,
            })
          }
        >
          <option value="g">g</option>
          <option value="mL">mL</option>
          <option value="unit">unit</option>
        </select>

        <input
          type="number"
          placeholder="Stock Quantity"
          className="p-3 rounded bg-zinc-800 text-white"

          value={formData.stock_quantity}

          onChange={(e) =>
            setFormData({
              ...formData,
              stock_quantity: e.target.value,
            })
          }
        />

        <input
          type="number"
          placeholder="Price Per Base (paise)"
          className="p-3 rounded bg-zinc-800 text-white"

          value={formData.price_per_base}

          onChange={(e) =>
            setFormData({
              ...formData,
              price_per_base: e.target.value,
            })
          }
        />

        <textarea
          placeholder="Description"
          className="p-3 rounded bg-zinc-800 text-white col-span-2"

          value={formData.description}

          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
            })
          }
        />

        <button
          type="submit"

          disabled={loading}

          className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded col-span-2"
        >

          {loading
            ? "Creating..."
            : "Create Product"}

        </button>

      </form>
    </div>
  );
}