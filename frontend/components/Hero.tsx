"use client";

export function Hero() {
  return (
    <header className="pb-8 mb-8 border-b border-[var(--border-subtle)] relative">
      <div className="flex items-center gap-2 mb-2 font-mono text-[0.72rem] tracking-[0.18em] uppercase text-cyan-600 dark:text-cyan-400">
        <span className="pulse-dot inline-block w-[6px] h-[6px] rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgb(6_182_212/0.6)]" />
        <span>CloudNest &middot; Conversational AI &middot; v1.0</span>
      </div>
      <h1 className="font-bold text-[2.6rem] leading-tight tracking-tight bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
        Your{" "}
        <span className="bg-gradient-to-br from-cyan-600 to-cyan-700 dark:from-cyan-300 dark:to-cyan-500 bg-clip-text text-transparent">
          AI workspace
        </span>
        .
        <br />
        Built for your data.
      </h1>
      <p className="mt-3 text-[var(--fg-secondary)] max-w-[60ch] leading-relaxed">
        Per-user RAG with cited sources, a tool-using agent loop, voice in and out, vision, and 37 languages. Switch
        between Groq and OpenRouter in one config line.
      </p>
      <div className="mt-5 flex gap-2 flex-wrap">
        {["FastAPI", "LangGraph", "Postgres", "Chroma", "Groq", "OpenRouter"].map((label) => (
          <span
            key={label}
            className="font-mono text-[0.68rem] text-[var(--fg-tertiary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-full tracking-wider"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="absolute bottom-[-1px] left-0 w-20 h-px bg-gradient-to-r from-cyan-500 to-transparent" />
    </header>
  );
}