"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);

  // Supabase sets a session when the user arrives via the reset link
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.replace("/dashboard"), 2500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="bg-teal-800 rounded-lg p-4 mb-6">
          <img src="/logo.png" alt="Abundance City Church" className="w-full max-h-14 object-contain" />
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Password updated!</h2>
            <p className="text-sm text-gray-500">Taking you to the dashboard...</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-medium text-gray-900 mb-1">Set new password</h1>
            <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
                {error}
              </p>
            )}

            {!validSession && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
                Waiting for the reset link to be verified... If this takes more than a few seconds,
                please click the link in your email again.
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-gray-600 mb-1">New password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />

              <label className="block text-sm text-gray-600 mb-1">Confirm new password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full mb-6 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />

              <button
                type="submit"
                disabled={loading || !validSession}
                className="w-full bg-teal-700 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
