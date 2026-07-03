"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm"
      >
        <div className="bg-teal-800 rounded-lg p-4 mb-6">
          <img src="/logo.png" alt="Abundance City Church" className="w-full max-h-14 object-contain" />
        </div>
        <h1 className="text-xl font-medium text-gray-900 mb-1">Church dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your leader account</p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />

        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />

        <div className="flex justify-end mb-6">
          <Link
            href="/forgot-password"
            className="text-xs text-teal-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">
          New leader? Ask your admin to send you an invite.
        </p>
      </form>
    </div>
  );
}
