import ProductTable from "@/components/ProductTable";

export default function AdminPage() {

  return (
    <div>

      <h1 className="text-4xl font-bold text-white">
        Admin Dashboard
      </h1>

      <ProductTable />

    </div>
  );
}