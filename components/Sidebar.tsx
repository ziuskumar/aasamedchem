"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  role: string;
};

export default function Sidebar({
  role,
}: Props) {
  return (
    <aside className="w-20 md:w-64 bg-black text-white min-h-screen p-5">
      <h2 className="text-2xl font-bold mb-8">
        AASAMEDCHEM
      </h2>

      <nav className="space-y-4">
        <Link
          href={`/${role}`}
          className="block hover:text-gray-300"
        >
          Dashboard
        </Link>

        <button
          onClick={() => signOut()}
          className="text-red-400 hover:text-red-300"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}