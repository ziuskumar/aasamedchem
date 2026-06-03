"use client";

import { signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        AASAMEDCHEM Dashboard
      </h1>

      {!session ? (
        <div>
          <p className="mb-4">You are not logged in.</p>

          <a
            href="/login"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Go to Login
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <p>
            Welcome:
            <span className="font-bold ml-2">
              {session.user?.name}
            </span>
          </p>

          <p>
            Role:
            <span className="font-bold ml-2">
              {(session.user as { role?: string })?.role}
            </span>
          </p>

          <p>
            Email:
            <span className="font-bold ml-2">
              {session.user?.email}
            </span>
          </p>

          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </main>
  );
}