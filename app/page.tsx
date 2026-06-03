"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    } else if (status === "authenticated") {
      const role = session?.user?.role;
      if (role === "admin") {
        window.location.href = "/admin";
      } else if (role === "seller") {
        window.location.href = "/seller";
      } else {
        window.location.href = "/login";
      }
    }
  }, [status, session]);

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-450">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="text-sm font-medium tracking-wide">Connecting to AASAMEDCHEM portal...</span>
      </div>
    </main>
  );
}