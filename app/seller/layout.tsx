import Sidebar from "@/components/Sidebar";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar role="seller" />

      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}