import Sidebar from "@/components/Sidebar";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar role="buyer" />

      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}