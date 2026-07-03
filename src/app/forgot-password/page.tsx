"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="bg-teal-800 rounded-lg p-4 mb-6">
          <img src="/logo.png" alt="Abundance City Church" className="w-full max-h-14 object-contain" />
        </div>

        {!sent ? (
          <>
            <h1 className="text-xl font-medium text-gray-900 mb-1">Reset password</h1>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full mb-6 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              The link expires in 24 hours.
            </p>
            <p className="text-xs text-gray-400">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setSent(false)}
                className="text-teal-700 underline"
              >
                try again
              </button>.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-xs text-teal-700 hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
