"use client";

import { Cpu, Database, FileText, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  { icon: <FileText className="w-4 h-4" />, label: "Doc Q&A", text: "What is the AR-7's payload capacity?" },
  { icon: <Cpu className="w-4 h-4" />, label: "Compute", text: "What is 87,500 × 24, then convert to EUR?" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Web search", text: "What's the weather in Karachi right now?" },
  { icon: <Database className="w-4 h-4" />, label: "Multi-step", text: "Summarize test.txt and convert revenue to EUR" },
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <div className="font-mono text-[0.72rem] tracking-[0.18em] uppercase text-[var(--fg-tertiary)] mb-3">
        Ready when you are
      </div>
      <h2 className="text-2xl font-semibold text-[var(--fg-primary)] mb-8">
        Ask anything to get started
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[640px]">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onPick(s.text)}
            className="group flex flex-col items-start gap-2 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-left"
          >
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              {s.icon}
              <span className="font-mono text-[0.7rem] tracking-wider uppercase">{s.label}</span>
            </div>
            <span className="text-sm text-[var(--fg-primary)] group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition">
              {s.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}