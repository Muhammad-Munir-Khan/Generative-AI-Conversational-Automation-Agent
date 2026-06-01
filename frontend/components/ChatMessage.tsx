"use client";

import { Bot, User } from "lucide-react";
import { MarkdownContent } from "./MarkdownContent";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import type { LanguageCode } from "@/lib/language";
import { cn } from "@/lib/utils";
import { AttachmentChip } from "./AttachmentChip";
import { LatencyPill } from "./LatencyPill";
import { SourcesPanel } from "./SourcesPanel";
import { ToolCallsPanel } from "./ToolCallsPanel";
import { AgentTrace } from "./AgentTrace";
import { EnsembleResponse } from "./EnsembleResponse";
import { TTSButton } from "./TTSButton";

export function ChatMessageView({
  message,
  language,
  liveTrace,
  isStreaming,
}: {
  message: ChatMessageType;
  language: LanguageCode;
  liveTrace?: { entries: ChatMessageType["trace"]; isLive: boolean };
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  const isEnsemble = !!message.ensemble;

  /* For ensemble responses, the user-visible "answer" is the judge's verdict.
   * For everything else, it's just message.content. We pass this into TTSButton
   * so the right text gets spoken in both modes. */
  const speakableText = isEnsemble
    ? (message.ensemble?.verdict || "").trim()
    : (message.content || "").trim();

  return (
    <div className={cn("flex gap-3 mb-5", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-md flex items-center justify-center border",
          isUser
            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-300"
            : "bg-[var(--bg-card)] border-cyan-500/30 text-cyan-600 dark:text-cyan-300 shadow-[0_0_12px_rgb(6_182_212/0.25)]"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn(
          "flex flex-col gap-1 min-w-0",
          isUser ? "items-end" : "items-start",
          isEnsemble ? "max-w-full w-full" : "max-w-[85%]"
        )}
      >
        {message.attachmentName && (
          <div className="mb-1">
            <AttachmentChip name={message.attachmentName} />
          </div>
        )}
        <div
          className={cn(
            "text-sm leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-[0_4px_16px_rgb(6_182_212/0.25)] rounded-2xl rounded-br-sm px-4 py-3"
              : isEnsemble
                ? "w-full"
                : "bg-[var(--bg-bubble-assistant)] text-[var(--fg-primary)] border border-[var(--border-subtle)] rounded-2xl rounded-bl-sm px-4 py-3"
          )}
        >
          {!isUser && !isEnsemble && liveTrace && liveTrace.entries && liveTrace.entries.length > 0 && (
            <AgentTrace entries={liveTrace.entries} isLive={liveTrace.isLive} />
          )}
          <div className="break-words">
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : isEnsemble ? (
              <EnsembleResponse data={message.ensemble!} />
            ) : (
              <>
                <MarkdownContent content={message.content} />
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-cyan-500 animate-pulse align-text-bottom" />
                )}
              </>
            )}
          </div>
        </div>

        {!isUser && !isStreaming && (
          <div className="w-full">
            {/* Action row: latency + per-message TTS. Sits directly below the
             * bubble for assistant messages (including ensemble). */}
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {message.latencyMs !== undefined && <LatencyPill ms={message.latencyMs} />}
              {speakableText.length > 0 && (
                <TTSButton text={speakableText} language={language} />
              )}
            </div>

            {!isEnsemble && (
              <>
                {message.trace && message.trace.length > 0 && (
                  <details className="mt-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
                    <summary className="px-3 py-2 text-xs text-[var(--fg-secondary)] hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-500/5 cursor-pointer flex items-center gap-2">
                      <span className="font-mono text-[0.7rem]">🧠</span>
                      Agent trace · {message.trace.length} step{message.trace.length === 1 ? "" : "s"}
                    </summary>
                    <div className="border-t border-[var(--border-subtle)] p-3 bg-[var(--bg-card)]">
                      <AgentTrace entries={message.trace} isLive={false} />
                    </div>
                  </details>
                )}
                <SourcesPanel sources={message.sources || []} />
                <ToolCallsPanel toolCalls={message.toolCalls || []} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}