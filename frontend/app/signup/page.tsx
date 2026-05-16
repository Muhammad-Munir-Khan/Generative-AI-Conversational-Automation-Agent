"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/AuthProvider";
import { AuthError } from "@/lib/auth";

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
            ◆ Get started
          </div>
          <div className="text-xs text-[var(--fg-tertiary)] font-mono uppercase tracking-wider mt-2">
            create your account
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
              Display name <span className="text-[var(--fg-muted)]">(optional)</span>
            </span>
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md text-[var(--fg-primary)] focus:border-[var(--accent)] focus:outline-none transition"
              placeholder="Munir"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">
              Password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md text-[var(--fg-primary)] focus:border-[var(--accent)] focus:outline-none transition"
              placeholder="at least 8 characters"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            disabled={submitting || !email || !password || !confirm}
            className="w-full py-2 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-bright)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>

          <div className="text-center text-xs text-[var(--fg-tertiary)] pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--accent)] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}