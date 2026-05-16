"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export function MicButton({
  onTranscribed,
  disabled,
}: {
  onTranscribed: (blob: Blob) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        // stop tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setBusy(true);
        try {
          await onTranscribed(blob);
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "mic blocked");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  const onClick = () => {
    if (disabled) return;
    if (recording) stop();
    else start();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      title={error || (recording ? "Stop recording" : "Hold to speak")}
      className={cn(
        "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all border",
        disabled || busy
          ? "bg-slate-800/40 border-white/5 text-slate-600 cursor-not-allowed"
          : recording
          ? "bg-red-500 border-red-400 text-white shadow-[0_0_0_4px_rgb(239_68_68/0.2)] animate-[mic-pulse_1.4s_infinite]"
          : "bg-slate-900/60 border-white/10 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-cyan-500/10"
      )}
      aria-label={recording ? "Stop" : "Start recording"}
    >
      {busy ? (
        <span className="block w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      ) : recording ? (
        <Square className="w-4 h-4 fill-current" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return undefined;
}
