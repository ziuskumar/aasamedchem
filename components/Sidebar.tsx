"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

type Props = {
  role: string;
};

export default function Sidebar({ role }: Props) {
  const pathname = usePathname();

  const isAdmin = role === "admin";

  const links = isAdmin
    ? [
        { label: "Dashboard Overview", href: "/admin" },
        { label: "Manage Products", href: "/admin/products" },
        { label: "All Orders", href: "/admin/orders" },
      ]
    : [
        { label: "Products Catalog", href: "/seller" },
        { label: "My Orders", href: "/seller/orders" },
      ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 text-white min-h-screen p-6 flex flex-col justify-between">
      <div>
        <div className="mb-8">
          <h2 className="text-xl font-black tracking-wider text-blue-500">
            AASAMEDCHEM
          </h2>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            {role} Portal
          </span>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full bg-zinc-900 hover:bg-red-950 hover:text-red-400 border border-zinc-800 hover:border-red-900 text-zinc-300 font-medium px-4 py-3 rounded-lg text-sm transition-all"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}