"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/AuthProvider";
import { AuthError } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get("next") || "/chat";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push(next);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(
          err.status === 400
            ? "Incorrect email or password."
            : err.message || "Login failed.",
        );
      } else {
        setError("Network error. Is the backend running?");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-base)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="font-bold text-2xl bg-clip-text text-transparent tracking-tight"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--accent-bright), var(--accent))",
            }}
          >
            ◆ Welcome back
          </div>
          <div className="text-xs text-[var(--fg-tertiary)] font-mono uppercase tracking-wider mt-2">
            sign in to continue
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-6 space-y-4"
        >
          <label className="block">
            <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md text-[var(--fg-primary)] focus:border-[var(--accent)] focus:outline-none transition"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md text-[var(--fg-primary)] focus:border-[var(--accent)] focus:outline-none transition"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-bright)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center text-xs text-[var(--fg-tertiary)] pt-2">
            New here?{" "}
            <Link
              href="/signup"
              className="text-[var(--accent)] hover:underline"
            >
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}