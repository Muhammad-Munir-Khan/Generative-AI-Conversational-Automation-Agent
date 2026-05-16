"use client";

import { Check, Loader2 } from "lucide-react";
import type { TraceEntry } from "@/lib/types";

export function AgentTrace({ entries, isLive }: { entries: TraceEntry[]; isLive: boolean }) {
  if (entries.length === 0) return null;

  return (
    <div className="my-3 border-l-2 border-cyan-500/30 pl-4 space-y-2.5">
      {entries.map((entry, i) => (
        <div key={i} className="text-sm relative">
          <div
            className={`absolute -left-[1.45rem] top-1 w-3 h-3 rounded-full flex items-center justify-center ${
              entry.status === "running" ? "bg-cyan-500/20 border border-cyan-400" : "bg-emerald-500/20 border border-emerald-400"
            }`}
          >
            {entry.status === "running" ? (
              <Loader2 className="w-2 h-2 text-cyan-400 animate-spin" />
            ) : (
              <Check className="w-2 h-2 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className={`font-mono text-xs ${
                entry.status === "running" ? "text-cyan-300" : "text-slate-400"
              }`}
            >
              {entry.status === "running" ? "calling" : "called"}
            </span>
            <span className="font-mono text-xs font-semibold text-cyan-400">{entry.name}</span>
            <span className="font-mono text-[0.7rem] text-slate-500 truncate max-w-[40ch]">
              ({formatArgs(entry.args)})
            </span>
          </div>
          {entry.preview && (
            <div className="font-mono text-[0.7rem] text-slate-400 mt-1 bg-slate-900/40 rounded px-2 py-1 truncate">
              → {entry.preview}
            </div>
          )}
        </div>
      ))}
      {isLive && entries.length > 0 && (
        <div className="text-[0.7rem] font-mono text-slate-500 italic ml-1">thinking…</div>
      )}
    </div>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args || {});
  if (!entries.length) return "";
  return entries
    .map(([k, v]) => {
      const s = typeof v === "string" ? `"${v}"` : JSON.stringify(v);
      return `${k}=${s.length > 30 ? s.slice(0, 30) + "..." : s}`;
    })
    .join(", ");
}
