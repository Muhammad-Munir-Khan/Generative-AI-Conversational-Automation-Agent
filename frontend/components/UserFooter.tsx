"use client";

import { LogOut, Mic, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";

/**
 * Shared user footer used by BOTH the chat sidebar and the admin panel.
 * Shows the signed-in user + logout. In the admin panel it also shows a
 * "Back to chat" link. (The "Switch to Admin Panel" link lives at the TOP
 * of the chat sidebar, not here.)
 */
export function UserFooter({
  activeSessionId,
  variant = "chat",
}: {
  activeSessionId?: string;
  variant?: "chat" | "admin";
}) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  if (!user) {
    return (
      <div className="pt-4 border-t border-[var(--border-subtle)] text-[0.7rem] text-[var(--fg-muted)] font-mono flex items-center gap-1.5">
        <Mic className="w-3 h-3" />
        {activeSessionId
          ? `Voice ready · session ${activeSessionId.slice(0, 6)}`
          : "Not signed in"}
      </div>
    );
  }

  const initial =
    (user.display_name || user.email).trim().charAt(0).toUpperCase() || "?";
  const displayName = user.display_name || user.email.split("@")[0];

  return (
    <div className="pt-4 border-t border-[var(--border-subtle)]">
      {variant === "admin" && (
        <Link
          href="/chat"
          className="mb-2 flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-[var(--fg-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to chat
        </Link>
      )}

      <div className="flex items-center gap-2.5 px-2 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)]">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-bright), var(--accent))",
          }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-medium text-[var(--fg-primary)] truncate"
            title={displayName}
          >
            {displayName}
          </div>
          <div
            className="text-[0.65rem] text-[var(--fg-tertiary)] truncate"
            title={user.email}
          >
            {user.email}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-[var(--fg-tertiary)] hover:text-red-500 transition p-1 rounded shrink-0"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {variant === "chat" && activeSessionId && (
        <div className="mt-2 text-[0.65rem] text-[var(--fg-muted)] font-mono flex items-center gap-1.5 px-1">
          <Mic className="w-3 h-3" />
          Voice ready · session {activeSessionId.slice(0, 6)}
        </div>
      )}
    </div>
  );
}