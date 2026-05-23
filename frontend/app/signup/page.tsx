"use client";

import { Cloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/AuthProvider";
import { ThemeToggleIcon } from "@/components/ThemeToggleIcon";
import { AuthError } from "@/lib/auth";
import { OAuthButtons } from "@/components/OAuthButtons";
/* --------------- Inline Wordmark (matches landing page) ------------------- */

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

/* ---------------------------- Signup Page -------------------------------- */

export default function SignupPage() {
  const router = useRouter();
  const { register, login } = useAuth();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

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
      await register(email.trim(), password, displayName.trim() || undefined);
      // Auto-login after successful registration.
      await login(email.trim(), password);
      router.push("/chat");
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.message?.toLowerCase().includes("already exists")) {
          setError("An account with that email already exists.");
        } else {
          setError(err.message || "Registration failed.");
        }
      } else {
        setError("Network error. Is the backend running?");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--bg-base)] flex items-center justify-center px-4 py-12">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-5 right-5 z-10">
        <ThemeToggleIcon />
      </div>

      {/* Ambient gradient orb behind the form */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--accent-bright) 0%, transparent 65%)",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--fg-primary) 1px, transparent 1px), linear-gradient(90deg, var(--fg-primary) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Wordmark header */}
        <div className="mb-8 text-center">
          <Link href="/" aria-label="CloudNest home" className="inline-block">
            <Wordmark />
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--fg-primary)]">
            Create your workspace
          </h1>
          <p className="mt-1.5 text-sm text-[var(--fg-secondary)]">
            Your private AI platform &mdash; documents, sessions, and data are yours alone.
          </p>
        </div>

        {/* Form card with subtle glow */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl opacity-30 blur-xl pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-bright), var(--accent))",
            }}
          />
          <form
            onSubmit={handleSubmit}
            className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-7 space-y-5 shadow-2xl"
          > <OAuthButtons />
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

            <label className="block">
              <span className="text-xs font-medium text-[var(--fg-secondary)] mb-2 block uppercase tracking-wider">
                Display name{" "}
                <span className="text-[var(--fg-muted)] normal-case font-normal tracking-normal">
                  (optional)
                </span>
              </span>
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-[var(--fg-primary)] placeholder-[var(--fg-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all"
                placeholder="Munir"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[var(--fg-secondary)] mb-2 block uppercase tracking-wider">
                Password
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
                Confirm password
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
              disabled={submitting || !email || !password || !confirm}
              className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-white text-sm font-medium transition-all shadow-lg shadow-[var(--accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>

            <div className="text-center text-xs text-[var(--fg-tertiary)] pt-1">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[var(--accent)] hover:text-[var(--accent-bright)] font-medium transition"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>

        {/* Tiny footer signal */}
        <div className="mt-6 text-center text-[0.65rem] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
          private workspace &middot; per-user rag &middot; isolated by default
        </div>
      </div>
    </div>
  );
}