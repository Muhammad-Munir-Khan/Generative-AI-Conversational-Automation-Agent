"use client";

import { Paperclip, X } from "lucide-react";
import { formatBytes } from "@/lib/utils";

export function AttachmentChip({
  name,
  bytes,
  method,
  onRemove,
}: {
  name: string;
  bytes?: number;
  method?: string;
  onRemove?: () => void;
}) {
  const methodLabel = method
    ? { text: "text", pypdf: "PDF text", vision: "vision OCR", "pdf+vision": "PDF + OCR" }[method] ?? method
    : null;

  return (
    <div className="inline-flex items-center gap-2 max-w-full bg-cyan-500/10 border border-cyan-500/30 rounded-full px-3 py-1.5 text-cyan-300">
      <Paperclip className="w-3.5 h-3.5 shrink-0" />
      <span className="text-xs font-mono truncate">{name}</span>
      {bytes !== undefined && (
        <span className="text-[0.65rem] text-cyan-400/60 font-mono shrink-0">{formatBytes(bytes)}</span>
      )}
      {methodLabel && (
        <span className="text-[0.65rem] text-cyan-400/60 font-mono shrink-0 border-l border-cyan-500/20 pl-2">
          {methodLabel}
        </span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-cyan-400/60 hover:text-cyan-300 transition shrink-0"
          aria-label="Remove attachment"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
