"use client";

import { useState } from "react";
import { ChevronDown, FileText, BookOpen } from "lucide-react";
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
          {sources.map((s, i) => {
            const isKB = s.origin === "knowledge_base";
            return (
              <div
                key={i}
                className={cn(
                  "bg-slate-900/60 border border-white/5 rounded p-3 border-l-[3px]",
                  isKB ? "border-l-amber-500" : "border-l-cyan-500"
                )}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={cn(
                        "font-mono text-[0.75rem] font-medium truncate",
                        isKB ? "text-amber-300" : "text-cyan-300"
                      )}
                    >
                      {s.source_file}
                    </span>
                    {isKB && (
                      <span
                        title="From the shared knowledge base"
                        className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-mono uppercase tracking-wider text-amber-200 bg-amber-500/10 border border-amber-500/30"
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        KB
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[0.65rem] text-slate-500 shrink-0">
                    {s.page != null ? `page ${s.page}` : ""}
                    {s.page != null && s.score != null ? " · " : ""}
                    {s.score != null ? `score ${s.score.toFixed(2)}` : ""}
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {s.snippet}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}