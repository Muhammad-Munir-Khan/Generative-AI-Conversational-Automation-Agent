"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, SendHorizonal } from "lucide-react";
import { MicButton } from "./MicButton";
import { AttachmentChip } from "./AttachmentChip";
import { cn } from "@/lib/utils";

export interface PendingAttachment {
  name: string;
  text: string;
  method: string;
  bytes: number;
}

export function Composer({
  onSubmit,
  onAttachFile,
  onTranscribe,
  pendingAttachment,
  onRemoveAttachment,
  attaching,
  busy,
  prefill,
}: {
  onSubmit: (text: string) => void;
  onAttachFile: (file: File) => void;
  onTranscribe: (blob: Blob) => Promise<void>;
  pendingAttachment: PendingAttachment | null;
  onRemoveAttachment: () => void;
  attaching: boolean;
  busy: boolean;
  prefill?: string;
}) {
  const [text, setText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync the textarea to the prefill prop. Crucially this also CLEARS the box
  // when prefill becomes undefined (new chat, session switch, post-submit) —
  // the old `if (prefill) setText(prefill)` only ever wrote, never cleared, so
  // a transcript left the textarea populated across a New Chat. Typing does not
  // touch prefill, so manual input is never wiped (effect only fires when the
  // prefill value itself changes).
  useEffect(() => {
    setText(prefill ?? "");
  }, [prefill]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  function handleSubmit() {
    const t = text.trim();
    if (!t || busy) return;
    onSubmit(t);
    setText("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onAttachFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "rounded-2xl border bg-[var(--bg-input)] backdrop-blur transition-all shadow-lg",
        dragOver
          ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_0_3px_rgb(6_182_212/0.2)]"
          : "border-[var(--border-default)]",
        "focus-within:border-cyan-500/60 focus-within:shadow-[0_0_0_3px_rgb(6_182_212/0.15)]"
      )}
    >
      {pendingAttachment && (
        <div className="px-3 pt-3">
          <AttachmentChip
            name={pendingAttachment.name}
            bytes={pendingAttachment.bytes}
            method={pendingAttachment.method}
            onRemove={onRemoveAttachment}
          />
        </div>
      )}

      {attaching && !pendingAttachment && (
        <div className="px-4 pt-3 text-xs text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-2">
          <span className="block w-3 h-3 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          extracting…
        </div>
      )}

      <div className="flex items-end gap-2 p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || attaching}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--fg-secondary)] hover:border-cyan-500/40 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAttachFile(f);
            e.target.value = "";
          }}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          placeholder="Ask anything — type, attach a file, or tap the mic"
          className="flex-1 resize-none bg-transparent text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] outline-none py-2.5 px-1 max-h-[200px]"
        />

        <MicButton onTranscribed={onTranscribe} disabled={busy || attaching} />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy || !text.trim()}
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
            !text.trim() || busy
              ? "bg-[var(--bg-hover)] text-[var(--fg-muted)] cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_20px_rgb(6_182_212/0.4)]"
          )}
          aria-label="Send"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}