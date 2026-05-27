"use client";

import { Cloud } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { ThemeToggleIcon } from "@/components/ThemeToggleIcon";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing or invalid reset link. Please request a new one.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        const data = await res.json().catch(() => null);
        const reason = data?.detail;
        if (typeof reason === "string" && reason.includes("RESET_PASSWORD_BAD_TOKEN")) {
          setError("This reset link is invalid or has expired. Request a new one.");
        } else if (typeof reason === "string" && reason.includes("PASSWORD")) {
          setError("Password doesn't meet requirements. Use at least 8 characters.");
        } else {
          setError("This reset link is invalid or has expired. Request a new one.");
        }
      }
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setSubmitting(false);
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
            Set a new password
          </h1>
          <p className="mt-1.5 text-sm text-[var(--fg-secondary)]">
            Choose a strong password for your account.
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
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-emerald-500" strokeWidth={2} />
              </div>
              <h2 className="text-base font-semibold text-[var(--fg-primary)] mb-2">
                Password updated
              </h2>
              <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-5">
                Your password has been reset. Redirecting you to sign in...
              </p>
              <Link
                href="/login"
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-bright)] font-medium transition"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-7 space-y-5 shadow-2xl"
            >
              <label className="block">
                <span className="text-xs font-medium text-[var(--fg-secondary)] mb-2 block uppercase tracking-wider">
                  New password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-[var(--fg-primary)] placeholder-[var(--fg-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all"
                  placeholder="at least 8 characters"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[var(--fg-secondary)] mb-2 block uppercase tracking-wider">
                  Confirm new password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-[var(--fg-primary)] placeholder-[var(--fg-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all"
                  placeholder="********"
                />
              </label>

              {error && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !password || !confirm}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-white text-sm font-medium transition-all shadow-lg shadow-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {submitting ? "Updating..." : "Update password"}
              </button>

              <div className="text-center text-xs text-[var(--fg-tertiary)] pt-1">
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

// useSearchParams() requires a Suspense boundary in Next.js production builds.
// The page export wraps the form in Suspense so static prerendering succeeds.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}