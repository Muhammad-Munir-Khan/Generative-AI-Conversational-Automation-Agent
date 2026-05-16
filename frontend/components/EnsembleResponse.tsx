"use client";

import { Award, Crown, Medal, Trophy, X } from "lucide-react";
import type { EnsembleData } from "@/lib/types";
import { MarkdownContent } from "./MarkdownContent";
import { LatencyPill } from "./LatencyPill";

export function EnsembleResponse({ data }: { data: EnsembleData }) {
  const rankByModel = new Map(data.ranking.map((r) => [r.model, r]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-mono text-[var(--fg-tertiary)] uppercase tracking-wider flex-wrap">
        <Award className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Multi-LLM consensus · {data.candidates.length} models · judged by</span>
        <code className="text-[var(--accent)]">{data.judge_model}</code>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.candidates.map((c) => {
          const ranking = rankByModel.get(c.model);
          return <CandidateColumn key={c.model} candidate={c} ranking={ranking} />;
        })}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-[var(--accent)]/30 p-5 shadow-[0_0_24px_rgb(6_182_212/0.15)]">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Crown className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)]">
            Final verdict · synthesized
          </span>
          <LatencyPill ms={data.total_latency_ms} />
        </div>
        <div className="markdown-body text-[var(--fg-primary)]">
          <MarkdownContent content={data.verdict} />
        </div>
      </div>
    </div>
  );
}

function CandidateColumn({
  candidate,
  ranking,
}: {
  candidate: { model: string; answer: string; latency_ms: number; error: string | null };
  ranking?: { rank: number; reason: string };
}) {
  const isError = !!candidate.error;
  const rank = ranking?.rank;
  const isWinner = rank === 1;

  return (
    <div
      className={
        "rounded-xl border p-4 flex flex-col gap-2 transition-all " +
        (isError
          ? "bg-red-500/5 border-red-500/30"
          : isWinner
            ? "bg-[var(--bg-card)] border-[var(--accent)]/50 shadow-[0_0_16px_rgb(6_182_212/0.2)]"
            : "bg-[var(--bg-card)] border-[var(--border-subtle)]")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {rank === 2 && <Medal className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          {rank === 3 && <Medal className="w-3.5 h-3.5 text-orange-400/70 shrink-0" />}
          <span className="text-xs font-mono text-[var(--fg-primary)] truncate">{candidate.model}</span>
        </div>
        {rank && !isError && (
          <span
            className={
              "text-[0.65rem] font-mono px-2 py-0.5 rounded-full shrink-0 " +
              (isWinner
                ? "bg-amber-500/15 text-amber-500 border border-amber-500/40"
                : "bg-[var(--bg-hover)] text-[var(--fg-secondary)] border border-[var(--border-subtle)]")
            }
          >
            #{rank}
          </span>
        )}
      </div>

      {ranking?.reason && !isError && (
        <div className="text-[0.7rem] italic text-[var(--fg-tertiary)] leading-relaxed border-l-2 border-[var(--border-default)] pl-2">
          &ldquo;{ranking.reason}&rdquo;
        </div>
      )}

      <div className="text-xs text-[var(--fg-primary)] leading-relaxed flex-1 overflow-y-auto max-h-[300px] pr-1">
        {isError ? (
          <div className="flex items-start gap-1.5 text-red-500 text-xs">
            <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{candidate.error}</span>
          </div>
        ) : (
          <div className="markdown-body">
            <MarkdownContent content={candidate.answer} />
          </div>
        )}
      </div>

      <div className="text-[0.65rem] font-mono text-[var(--fg-muted)] pt-1 border-t border-[var(--border-subtle)]">
        {candidate.latency_ms} ms
      </div>
    </div>
  );
}