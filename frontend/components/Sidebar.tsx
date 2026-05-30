"use client";

import {
  Activity,
  Cloud,
  Mic,
  RefreshCcw,
  Shield,
  Sparkles,
  Volume2,
} from "lucide-react";
import Link from "next/link";

import type { HealthResponse, Mode } from "@/lib/types";
import type { SessionInfo } from "@/lib/api";
import type { Theme } from "@/lib/theme";
import type { LanguageCode } from "@/lib/language";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/AuthProvider";
import { ChatList } from "./ChatList";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { DocumentManager } from "./DocumentManager";
import { UserFooter } from "./UserFooter";

const ADMIN_ROLES = ["corpus_admin", "super_admin"];

export function Sidebar({
  health,
  error,
  mode,
  setMode,
  ttsEnabled,
  setTtsEnabled,
  ensembleEnabled,
  setEnsembleEnabled,
  onRefresh,
  onReindex,
  reindexing,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  theme,
  onToggleTheme,
  language,
  setLanguage,
}: {
  health: HealthResponse | null;
  error: string | null;
  mode: Mode;
  setMode: (m: Mode) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
  ensembleEnabled: boolean;
  setEnsembleEnabled: (v: boolean) => void;
  onRefresh: () => void;
  onReindex: () => void;
  reindexing: boolean;
  sessions: SessionInfo[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, title: string) => void;
  onDeleteSession: (id: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
}) {
  const { user } = useAuth();
  const role = (user as { role?: string } | null)?.role ?? "user";
  const isAdmin = ADMIN_ROLES.includes(role);

  return (
    <aside className="w-[280px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-5 py-6 sticky top-0 h-screen overflow-y-auto flex flex-col">
      <div
        className="font-bold text-xl bg-clip-text text-transparent tracking-tight"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--accent-bright), var(--accent))",
        }}
      >
        ◆ Console
      </div>
      <div className="font-mono text-[0.72rem] tracking-[0.08em] uppercase text-[var(--fg-tertiary)] mt-1 mb-4">
        agent control plane
      </div>

      {/* Switch to Admin Panel - top of sidebar, admins only */}
      {isAdmin && (
        <Link
          href="/admin"
          className="mb-5 flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-semibold text-white transition-all shadow-lg shadow-[var(--accent)]/20 hover:opacity-90"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-bright), var(--accent))",
          }}
        >
          <Shield className="w-3.5 h-3.5" />
          Switch to Admin Panel
        </Link>
      )}

      <StatusCard health={health} error={error} />

      <button
        onClick={onRefresh}
        className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-medium text-[var(--fg-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 rounded-md py-2 transition-all"
      >
        <RefreshCcw className="w-3.5 h-3.5" />
        Refresh status
      </button>

      <SectionHeader>Appearance</SectionHeader>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />

      <SectionHeader>Language</SectionHeader>
      <LanguageSelector value={language} onChange={setLanguage} />

      <SectionHeader>Chats</SectionHeader>
      <ChatList
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={onSelectSession}
        onNew={onNewChat}
        onRename={onRenameSession}
        onDelete={onDeleteSession}
      />

      <SectionHeader>Mode</SectionHeader>
      <div className="flex flex-col gap-1.5">
        <ModeOption
          label="Agent"
          desc="Multi-step, can use tools"
          selected={mode === "agent"}
          disabled={ensembleEnabled}
          onClick={() => setMode("agent")}
        />
        <ModeOption
          label="RAG only"
          desc="Single-shot doc Q&A"
          selected={mode === "rag"}
          disabled={ensembleEnabled}
          onClick={() => setMode("rag")}
        />
      </div>

      <SectionHeader>Multi-LLM</SectionHeader>
      <label
        className={cn(
          "flex items-start gap-2 px-3 py-2 rounded-md border cursor-pointer transition",
          ensembleEnabled
            ? "bg-cyan-500/10 border-cyan-500/40"
            : "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-cyan-500/30",
        )}
      >
        <input
          type="checkbox"
          checked={ensembleEnabled}
          onChange={(e) => setEnsembleEnabled(e.target.checked)}
          className="accent-cyan-500 mt-0.5"
        />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[var(--fg-primary)] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--accent)]" />
            Multi-LLM mode
          </div>
          <div className="text-[0.65rem] text-[var(--fg-tertiary)] leading-snug mt-0.5">
            Compare 3 Groq models side-by-side, judged by Llama 70B
          </div>
        </div>
      </label>
      {ensembleEnabled && (
        <div className="mt-2 text-[0.65rem] text-[var(--fg-muted)] font-mono italic px-1">
          ⓘ Bypasses agent + RAG. No tools, no memory.
        </div>
      )}

      <SectionHeader>Voice</SectionHeader>
      <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] cursor-pointer hover:border-cyan-500/30 transition">
        <input
          type="checkbox"
          checked={ttsEnabled}
          onChange={(e) => setTtsEnabled(e.target.checked)}
          className="accent-cyan-500"
        />
        <Volume2 className="w-3.5 h-3.5 text-[var(--fg-secondary)]" />
        <span className="text-xs text-[var(--fg-primary)]">Speak responses</span>
      </label>

      <SectionHeader>Documents</SectionHeader>
      <DocumentManager />

      {/* Spacer pushes the user footer to the bottom of the sidebar */}
      <div className="flex-1 min-h-[1.5rem]" />

      <UserFooter activeSessionId={activeSessionId} variant="chat" />
    </aside>
  );
}

/* ------------------------------ helpers --------------------- */

function StatusCard({
  health,
  error,
}: {
  health: HealthResponse | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 shadow-[0_0_12px_rgb(239_68_68/0.6)]" />
        <Row label="Status" value="● OFFLINE" valueColor="text-red-500" />
        <Row label="Error" value={error.slice(0, 40)} mono last />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-4 animate-pulse">
        <div className="h-3 bg-[var(--bg-hover)] rounded w-1/2 mb-2" />
        <div className="h-3 bg-[var(--bg-hover)] rounded w-2/3 mb-2" />
        <div className="h-3 bg-[var(--bg-hover)] rounded w-1/3" />
      </div>
    );
  }

  const provider = (health.provider || "?").toUpperCase();
  const Icon = provider === "GROQ" ? Cloud : Activity;

  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-4 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 shadow-[0_0_12px_rgb(16_185_129/0.6)]" />
      <Row label="Status" value="● ONLINE" valueColor="text-cyan-500" />
      <Row
        label="Provider"
        value={
          <span className="inline-flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            {provider}
          </span>
        }
      />
      <Row label="Model" value={health.llm_model} mono />
      <Row
        label="TTS"
        value={(health.tts_backend || "piper").toUpperCase()}
        mono
      />
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
  mono,
  last,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between", !last && "mb-1.5")}>
      <span className="font-mono text-[0.7rem] tracking-wider uppercase text-[var(--fg-tertiary)]">
        {label}
      </span>
      <span
        className={cn(
          "text-[0.78rem] font-medium",
          valueColor || "text-[var(--fg-primary)]",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[0.72rem] tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mt-7 mb-3">
      {children}
    </div>
  );
}

function ModeOption({
  label,
  desc,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  desc: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-left px-3 py-2 rounded-md border transition-all",
        disabled && "opacity-40 cursor-not-allowed",
        !disabled && selected
          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--fg-primary)] hover:border-cyan-500/20",
      )}
    >
      <div className="text-xs font-semibold">{label}</div>
      <div
        className={cn(
          "text-[0.68rem] mt-0.5",
          selected && !disabled
            ? "text-cyan-600/80 dark:text-cyan-400/80"
            : "text-[var(--fg-tertiary)]",
        )}
      >
        {desc}
      </div>
    </button>
  );
}