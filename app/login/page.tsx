"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Fetch latest session using getSession to bypass Next.js 15 client fetch caching
        const session = await getSession();
        const role = session?.user?.role;

        if (role === "admin") {
          window.location.href = "/admin";
        } else if (role === "seller") {
          window.location.href = "/seller";
        } else {
          window.location.href = "/";
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight text-white">AASAMEDCHEM</h1>
          <p className="text-sm text-zinc-400 mt-2">Sign in to manage chemical supplies & inventory</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/50 text-red-200 p-3.5 rounded-lg text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@test.com or seller@test.com"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 text-sm transition-all mt-2"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-2 text-xxs text-zinc-500">
          <div className="font-semibold text-zinc-400 uppercase tracking-wider">Demo Credentials:</div>
          <div className="flex justify-between">
            <span>Admin: <strong className="text-zinc-300">admin@test.com</strong></span>
            <span>Password: <strong className="text-zinc-300">admin123</strong></span>
          </div>
          <div className="flex justify-between">
            <span>Seller: <strong className="text-zinc-300">seller@test.com</strong></span>
            <span>Password: <strong className="text-zinc-300">seller123</strong></span>
          </div>
        </div>
      </div>
    </main>
  );
}