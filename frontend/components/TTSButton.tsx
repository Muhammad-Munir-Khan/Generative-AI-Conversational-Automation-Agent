"use client";

import { Loader2, Pause, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ttsToBlob } from "@/lib/api";
import type { LanguageCode } from "@/lib/language";
import { cn } from "@/lib/utils";

/* ============================================================================
   TTSButton - per-message "speak this" button.

   Three visual states:
     idle    - small pill with speaker icon + "Speak"
     loading - same pill with a spinner + "Generating..."
     playing - same pill with a pause icon + "Stop"

   Coordination across buttons (only one plays at a time):
     When a button starts playing, it dispatches a CustomEvent on window.
     Other buttons listen for it; if the event carries an instanceId that is
     NOT their own, they pause their own audio.

     This avoids a Context provider + prop drilling. Each button is fully
     self-contained.

   Blob caching:
     The first click triggers ttsToBlob(). The returned blob is cached on the
     ref, so a second click (after stopping) replays without refetching.
     Cleared when the component unmounts.
   ========================================================================== */

const TTS_PLAY_EVENT = "cloudnest:tts-play";

interface TTSPlayDetail {
  instanceId: string;
}

let _idCounter = 0;
const nextId = () => `tts-${++_idCounter}`;

export function TTSButton({
  text,
  language,
}: {
  text: string;
  language: LanguageCode;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);
  const idRef = useRef<string>("");
  if (!idRef.current) idRef.current = nextId();

  /* Stop on unmount: pause audio + revoke any object URL */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  /* Listen for OTHER buttons starting playback - stop ours if so */
  useEffect(() => {
    const onOtherStart = (e: Event) => {
      const detail = (e as CustomEvent<TTSPlayDetail>).detail;
      if (detail.instanceId === idRef.current) return; // it's us, ignore
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        // listeners on the audio element will set state -> "idle"
      }
    };
    window.addEventListener(TTS_PLAY_EVENT, onOtherStart);
    return () => window.removeEventListener(TTS_PLAY_EVENT, onOtherStart);
  }, []);

  /* Create the audio element once, lazily */
  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.onended = () => setState("idle");
    audio.onpause = () => setState((s) => (s === "playing" ? "idle" : s));
    audio.onplay = () => setState("playing");
    audio.onerror = () => setState("idle");
    audioRef.current = audio;
    return audio;
  };

  const startFromCachedBlob = async () => {
    const audio = ensureAudio();
    // Tell other buttons to stop FIRST so we don't get a brief gap of two
    // audio sources playing at once.
    window.dispatchEvent(
      new CustomEvent<TTSPlayDetail>(TTS_PLAY_EVENT, {
        detail: { instanceId: idRef.current },
      }),
    );
    try {
      await audio.play();
      // onplay handler sets state to "playing"
    } catch {
      // play() was rejected (autoplay policy, etc.). Reset.
      setState("idle");
    }
  };

  const handleClick = async () => {
    // Currently playing → stop
    if (state === "playing") {
      if (audioRef.current) audioRef.current.pause();
      return;
    }
    // Loading → ignore double-clicks
    if (state === "loading") return;

    // Idle. If we have a cached blob, just replay.
    if (blobRef.current && urlRef.current) {
      const audio = ensureAudio();
      audio.src = urlRef.current;
      await startFromCachedBlob();
      return;
    }

    // No cache yet → fetch the blob
    setState("loading");
    try {
      const { blob } = await ttsToBlob(text, language);
      blobRef.current = blob;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = ensureAudio();
      audio.src = url;
      await startFromCachedBlob();
    } catch (e) {
      console.warn("TTS failed:", e);
      setState("idle");
    }
  };

  const isActive = state !== "idle";

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label={
        state === "playing"
          ? "Stop reading"
          : state === "loading"
            ? "Generating speech"
            : "Read this aloud"
      }
      className={cn(
        "inline-flex items-center gap-1.5 text-[0.7rem] font-mono px-2.5 py-1 rounded-full border transition-all",
        isActive
          ? "bg-[var(--accent-soft)] border-[var(--accent)]/40 text-[var(--accent)]"
          : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--fg-tertiary)] hover:border-[var(--accent)]/30 hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]/50",
        state === "loading" && "cursor-wait",
      )}
    >
      {state === "playing" ? (
        <Pause className="w-3 h-3" />
      ) : state === "loading" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Volume2 className="w-3 h-3" />
      )}
      <span>
        {state === "playing"
          ? "Stop"
          : state === "loading"
            ? "Generating..."
            : "Speak"}
      </span>
    </button>
  );
}