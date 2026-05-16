"use client";

import { useState } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import type { ToolCall } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ToolCallsPanel({ toolCalls }: { toolCalls: ToolCall[] }) {
  const [open, setOpen] = useState(false);
  if (!toolCalls?.length) return null;

  return (
    <div className="mt-2 rounded-md border border-white/5 bg-slate-950/40 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5 transition"
      >
        <span className="flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5" />
          {toolCalls.length} tool {toolCalls.length === 1 ? "call" : "calls"}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-white/5 p-3 space-y-2 bg-slate-950/40">
          {toolCalls.map((tc, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-white/5 border-l-[3px] border-l-cyan-500 rounded p-3"
            >
              <div className="font-mono text-[0.75rem] text-cyan-300 font-medium mb-1">{tc.name}</div>
              <div className="font-mono text-[0.65rem] text-slate-500 mb-2">
                {Object.entries(tc.args || {})
                  .map(([k, v]) => `${k}=${typeof v === "string" ? `"${v}"` : JSON.stringify(v)}`)
                  .join(", ") || "(no args)"}
              </div>
              {tc.result_preview && (
                <pre className="text-[0.7rem] text-slate-400 bg-black/30 rounded p-2 overflow-x-auto max-h-24 whitespace-pre-wrap break-all">
                  {tc.result_preview}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
