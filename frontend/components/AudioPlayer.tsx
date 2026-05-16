"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";

export function AudioPlayer({ blob, mime, autoplay = true }: { blob: Blob; mime: string; autoplay?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    urlRef.current = url;
    if (audioRef.current) {
      audioRef.current.src = url;
      if (autoplay) {
        audioRef.current.play().then(() => setPlaying(true)).catch(() => {
          // autoplay blocked — user can click play
        });
      }
    }
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob, mime, autoplay]);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <div className="mt-3 inline-flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-full px-3 py-1.5">
      <button
        onClick={toggle}
        className="w-7 h-7 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 transition"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <Volume2 className="w-3.5 h-3.5 text-slate-500" />
      <span className="text-[0.7rem] font-mono text-slate-400">spoken response</span>
      <audio
        ref={audioRef}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
