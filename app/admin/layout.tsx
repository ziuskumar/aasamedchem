import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar role="admin" />

      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}