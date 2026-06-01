"use client";

export function Hero() {
  return (
    <header className="pb-8 mb-8 border-b border-[var(--border-subtle)] relative">
      <div
        className="flex items-center gap-2 mb-2 font-mono text-[0.72rem] tracking-[0.18em] uppercase"
        style={{ color: "var(--accent)" }}
      >
        <span
          className="pulse-dot inline-block w-[6px] h-[6px] rounded-full"
          style={{
            background: "var(--accent)",
            boxShadow: "0 0 8px var(--accent-glow)",
          }}
        />
        <span>CloudNest &middot; Conversational AI &middot; v1.0</span>
      </div>
      <h1 className="font-bold text-[2.6rem] leading-tight tracking-tight bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
        Your{" "}
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--accent-bright), var(--accent))",
          }}
        >
          AI workspace
        </span>
        .
        <br />
        Built for your data.
      </h1>
      <p className="mt-3 text-[var(--fg-secondary)] max-w-[60ch] leading-relaxed">
        Per-user RAG with cited sources, a tool-using agent loop, voice in and
        out, vision, and 100+ languages for retrieval (37 voices for TTS).
        Switch between Groq, OpenRouter, and Ollama in one config line.
      </p>
      <div className="mt-5 flex gap-2 flex-wrap">
        {["FastAPI", "LangGraph", "Postgres", "Weaviate", "BGE-M3", "Groq", "OpenRouter", "Ollama"].map((label) => (
          <span
            key={label}
            className="font-mono text-[0.68rem] text-[var(--fg-tertiary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-full tracking-wider"
          >
            {label}
          </span>
        ))}
      </div>
      <div
        className="absolute bottom-[-1px] left-0 w-20 h-px"
        style={{
          background:
            "linear-gradient(to right, var(--accent), transparent)",
        }}
      />
    </header>
  );
}