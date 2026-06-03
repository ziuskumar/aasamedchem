import StatCard from "@/components/StatCard";

export default function BuyerPage() {
  return (
    <main>
      <h1 className="text-4xl font-bold mb-8">
        Buyer Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          title="Orders"
          value="8"
        />

        <StatCard
          title="Wishlist"
          value="15"
        />

        <StatCard
          title="Cart Items"
          value="4"
        />
      </div>
    </main>
  );
}