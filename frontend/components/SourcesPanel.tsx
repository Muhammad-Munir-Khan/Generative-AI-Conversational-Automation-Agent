"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { SourceInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourcesPanel({ sources }: { sources: SourceInfo[] }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;

  return (
    <div className="mt-3 rounded-md border border-white/5 bg-slate-950/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5 transition"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          {sources.length} {sources.length === 1 ? "source" : "sources"} cited
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-white/5 p-3 space-y-2 bg-slate-950/40">
          {sources.map((s, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-white/5 border-l-[3px] border-l-cyan-500 rounded p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[0.75rem] text-cyan-300 font-medium">{s.source_file}</span>
                <span className="font-mono text-[0.65rem] text-slate-500">
                  page {s.page ?? "?"}
                  {s.score !== null && s.score !== undefined ? ` · score ${s.score.toFixed(2)}` : ""}
                </span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed line-clamp-3">{s.snippet}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
