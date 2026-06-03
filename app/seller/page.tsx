import StatCard from "@/components/StatCard";

export default function SellerPage() {
  return (
    <main>
      <h1 className="text-4xl font-bold mb-8">
        Seller Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          title="My Products"
          value="34"
        />

        <StatCard
          title="Pending Orders"
          value="12"
        />

        <StatCard
          title="Revenue"
          value="$2,300"
        />
      </div>
    </main>
  );
}