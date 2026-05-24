"use client";

import { Cloud } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { ThemeToggleIcon } from "@/components/ThemeToggleIcon";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function Wordmark() {
  return (
    <div className="inline-flex items-baseline gap-1.5">
      <Cloud
        className="w-5 h-5 text-[var(--accent)] self-center"
        strokeWidth={2.25}
      />
      <span
        className="text-xl font-bold bg-clip-text text-transparent tracking-tight"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--accent-bright), var(--accent))",
        }}
      >
        CloudNest
      </span>
      <span className="text-sm font-mono text-[var(--fg-tertiary)] opacity-70 -ml-1">
        .ai
      </span>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // fastapi-users returns 202 regardless of whether the email exists
      // (no user enumeration). We show the same confirmation either way.
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Even on network error we show the neutral confirmation; the user
      // can retry. We deliberately don't reveal backend state.
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="absolute top-5 right-5 z-10">
        <ThemeToggleIcon />
      </div>

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--accent-bright) 0%, transparent 65%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--fg-primary) 1px, transparent 1px), linear-gradient(90deg, var(--fg-primary) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="CloudNest home" className="inline-block">
            <Wordmark />
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--fg-primary)]">
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-sm text-[var(--fg-secondary)]">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl opacity-30 blur-xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-bright), var(--accent))",
            }}
          />

          {done ? (
            <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-7 shadow-2xl text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <h2 className="text-base font-semibold text-[var(--fg-primary)] mb-2">
                Check your email
              </h2>
              <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-5">
                If an account exists for{" "}
                <span className="text-[var(--fg-primary)] font-medium">
                  {email}
                </span>
                , you&apos;ll receive a password reset link shortly. The link
                expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-bright)] font-medium transition"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-7 space-y-5 shadow-2xl"
            >
              <label className="block">
                <span className="text-xs font-medium text-[var(--fg-secondary)] mb-2 block uppercase tracking-wider">
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-[var(--fg-primary)] placeholder-[var(--fg-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all"
                  placeholder="you@example.com"
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !email}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-white text-sm font-medium transition-all shadow-lg shadow-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>

              <div className="text-center text-xs text-[var(--fg-tertiary)] pt-1">
                Remember it?{" "}
                <Link
                  href="/login"
                  className="text-[var(--accent)] hover:text-[var(--accent-bright)] font-medium transition"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}