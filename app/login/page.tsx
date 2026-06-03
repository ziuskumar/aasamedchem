"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
  const sessionRes = await fetch("/api/auth/session");

  const session = await sessionRes.json();

  const role = session?.user?.role;

  if (role === "admin") {
    window.location.href = "/admin";
  } else if (role === "seller") {
    window.location.href = "/seller";
  } else if (role === "buyer") {
    window.location.href = "/buyer";
  } else {
    window.location.href = "/";
  }
}
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="border p-6 rounded-lg w-[350px] space-y-4"
      >
        <h1 className="text-2xl font-bold">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded"
        >
          Login
        </button>
      </form>
    </main>
  );
}