"use client";

import { useEffect, useState } from "react";
import { Users, Database } from "lucide-react";

import { adminSystemStats, adminCorpusStats } from "@/lib/api";
import type { SystemStats, CorpusStats } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";

export default function AdminDashboard() {
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role ?? "user";
  const isSuper = role === "super_admin";

  const [sysStats, setSysStats] = useState<SystemStats | null>(null);
  const [corpusStats, setCorpusStats] = useState<CorpusStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminCorpusStats()
      .then(setCorpusStats)
      .catch(() => setCorpusStats(null));

    if (isSuper) {
      adminSystemStats()
        .then(setSysStats)
        .catch((e) =>
          setError(e instanceof Error ? e.message : "Failed to load"),
        );
    }
  }, [isSuper]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">
        Dashboard
      </h1>
      <p className="text-sm text-[var(--fg-secondary)] mt-1">
        Overview of the platform.
      </p>

      {error && (
        <div className="mt-6 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <StatCard
          icon={<Database size={20} />}
          label="Knowledge base"
          value={corpusStats?.total}
          unit="objects"
        />
        {isSuper && (
          <StatCard
            icon={<Users size={20} />}
            label="Total users"
            value={sysStats?.total_users}
          />
        )}
      </div>

      {!isSuper && (
        <p className="mt-6 text-xs text-[var(--fg-tertiary)]">
          You have knowledge-base management access. User management requires
          super-admin.
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center gap-2 text-[var(--fg-tertiary)]">
        {icon}
        <span className="text-[0.65rem] font-mono uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-[var(--fg-primary)]">
          {value === undefined ? "—" : value.toLocaleString()}
        </span>
        {unit && (
          <span className="text-xs text-[var(--fg-tertiary)]">{unit}</span>
        )}
      </div>
    </div>
  );
}