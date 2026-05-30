"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Database } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { UserFooter } from "@/components/UserFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/lib/theme";

const ADMIN_ROLES = ["corpus_admin", "super_admin"];

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/corpus", label: "Knowledge Base", icon: Database, exact: false },
  { href: "/admin/users", label: "Users", icon: Users, exact: false, superOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  const role = (user as { role?: string } | null)?.role ?? "user";
  const isAdmin = ADMIN_ROLES.includes(role);
  const isSuper = role === "super_admin";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!isAdmin) {
      router.replace("/chat");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--fg-tertiary)]">
          loading...
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <aside className="w-[280px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-5 py-6 sticky top-0 h-screen overflow-y-auto flex flex-col">
        <div
          className="font-bold text-xl bg-clip-text text-transparent tracking-tight"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--accent-bright), var(--accent))",
          }}
        >
          ◆ Admin
        </div>
        <div className="font-mono text-[0.72rem] tracking-[0.08em] uppercase text-[var(--fg-tertiary)] mt-1 mb-6">
          {role}
        </div>

        <nav className="space-y-1">
          {NAV.filter((n) => !n.superOnly || isSuper).map((n) => {
            const active = n.exact
              ? pathname === n.href
              : pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/40"
                    : "text-[var(--fg-secondary)] border border-transparent hover:bg-[var(--bg-card)] hover:text-[var(--fg-primary)]"
                }`}
              >
                <Icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-7 mb-3 font-mono text-[0.72rem] tracking-[0.12em] uppercase text-[var(--fg-tertiary)]">
          Appearance
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />

        <div className="flex-1 min-h-[1.5rem]" />

        <UserFooter variant="admin" />
      </aside>

      <main className="flex-1 px-8 py-8 max-w-[1100px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}