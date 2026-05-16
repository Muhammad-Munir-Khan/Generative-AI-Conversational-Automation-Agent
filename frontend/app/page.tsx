"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  Boxes,
  Cloud,
  Database,
  Eye,
  FileText,
  Github,
  Languages,
  Lock,
  Mic,
  Network,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { ThemeToggleIcon } from "@/components/ThemeToggleIcon";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--fg-primary)]">
      <TopNav />
      <Hero />
      <Features />
      <ProviderSwitchDemo />
      <HowItWorks />
      <TechStack />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { text: "text-base", tld: "text-[0.7rem]", icon: "w-4 h-4" },
    md: { text: "text-lg", tld: "text-xs", icon: "w-[18px] h-[18px]" },
    lg: { text: "text-xl", tld: "text-sm", icon: "w-5 h-5" },
  };
  const s = sizes[size];

  return (
    <div className="inline-flex items-baseline gap-1.5">
      <Cloud
        className={`${s.icon} text-[var(--accent)] self-center`}
        strokeWidth={2.25}
      />
      <span
        className={`${s.text} font-bold bg-clip-text text-transparent tracking-tight`}
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--accent-bright), var(--accent))",
        }}
      >
        CloudNest
      </span>
      <span
        className={`${s.tld} font-mono text-[var(--fg-tertiary)] opacity-70 -ml-1`}
      >
        .ai
      </span>
    </div>
  );
}

function TopNav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-base)]/80 border-b border-[var(--border-subtle)]">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" aria-label="CloudNest home">
          <Wordmark size="lg" />
        </Link>
        <div className="flex items-center gap-3">
          <a
            href="#features"
            className="hidden md:inline text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition px-3 py-1.5"
          >
            Features
          </a>
          <a
            href="#stack"
            className="hidden md:inline text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition px-3 py-1.5"
          >
            Stack
          </a>
          <ThemeToggleIcon />
          <Link
            href="/login"
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent-bright)] transition px-4 py-1.5 rounded-md"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--accent-bright) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--fg-primary) 1px, transparent 1px), linear-gradient(90deg, var(--fg-primary) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--fg-tertiary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full px-3 py-1 mb-6">
              <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Production-grade. Multi-tenant. Open architecture.
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              The conversational{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--accent-bright), var(--accent))",
                }}
              >
                AI platform
              </span>{" "}
              you can actually run.
            </h1>

            <p className="text-base md:text-lg text-[var(--fg-secondary)] leading-relaxed mb-8 max-w-lg">
              CloudNest is built from scratch end-to-end: RAG over your own
              documents, tool-using agents, voice, vision, 37 languages,
              multi-LLM ensembles. Strict per-user isolation. Switch LLM
              providers in one config line.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-white text-sm font-medium transition shadow-lg shadow-[var(--accent)]/20"
              >
                Create your workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 text-[var(--fg-primary)] text-sm font-medium transition"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <Stat number="9" label="agent tools" />
              <Stat number="37" label="languages" />
              <Stat number="3" label="LLM providers" />
            </div>
          </div>

          <div className="relative">
            <MockedChat />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div
        className="text-3xl font-bold bg-clip-text text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--accent-bright), var(--accent))",
        }}
      >
        {number}
      </div>
      <div className="text-[0.65rem] font-mono uppercase tracking-wider text-[var(--fg-tertiary)] mt-1">
        {label}
      </div>
    </div>
  );
}

function MockedChat() {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-2xl opacity-40 blur-2xl"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-bright), var(--accent))",
        }}
      />

      <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          <div className="ml-3 text-[0.65rem] font-mono text-[var(--fg-tertiary)]">
            cloudnest / chat
          </div>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold text-white bg-gradient-to-br from-slate-500 to-slate-700">
              U
            </div>
            <div className="flex-1 text-[var(--fg-primary)] pt-1">
              How much would 12 AR-7 cobots cost in EUR?
            </div>
          </div>

          <div className="ml-10 flex flex-wrap gap-1.5">
            <ToolPill name="document_search" />
            <ToolPill name="calculator" />
            <ToolPill name="currency_converter" />
          </div>

          <div className="flex gap-3">
            <div
              className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-bright), var(--accent))",
              }}
            >
              <Cloud className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-[var(--fg-primary)] leading-relaxed">
                AR-7 units are priced at{" "}
                <span className="font-medium">$87,500 each</span>. For 12
                units, the total is $1,050,000, which converts to roughly{" "}
                <span className="font-medium">&#8364;892,500</span> at today
                rate.
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-mono">
                <span className="inline-flex items-center gap-1.5 text-[var(--fg-tertiary)] bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1">
                  <FileText className="w-3 h-3" />
                  sources: test.txt
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--fg-tertiary)] bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1">
                  <Zap className="w-3 h-3" />
                  1.3s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolPill({ name }: { name: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[0.65rem] font-mono px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
      <span className="text-[var(--fg-secondary)]">{name}</span>
      <span className="text-emerald-500">&#9679;</span>
    </div>
  );
}

const FEATURES = [
  {
    icon: FileText,
    title: "Per-user RAG",
    body: "Each user gets their own private Chroma collection. Upload PDFs, text, Markdown, or DOCX up to 10MB. The agent retrieves answers with file-level citations. Strict isolation - one user cannot see another user's documents, sessions, or chunks.",
  },
  {
    icon: Wrench,
    title: "9 production tools",
    body: "RAG search, document summarizer, web search, calculator (with thousands-separator parsing), sandboxed Python REPL, CSV reader, JSON parser, datetime helper, unit converter, currency converter (live ECB rates), live weather.",
  },
  {
    icon: Sparkles,
    title: "Multi-LLM ensemble",
    body: "Fan out the same question to 3 models in parallel, then a judge model ranks them and synthesizes the best answer. Real model comparison with explainable rankings, not vibes.",
  },
  {
    icon: Eye,
    title: "Vision + voice",
    body: "Vision model (Llama-4 Scout 17B via Groq) reads images and scanned PDFs when text extraction falls short. Whisper STT for speech-to-text. Edge TTS for high-quality multilingual voice output.",
  },
  {
    icon: Languages,
    title: "37 languages",
    body: "From English to Urdu to Swahili. The agent responds in your chosen language with a matched native TTS voice. Tool outputs (numbers, currency, dates) translate to fit the conversation naturally.",
  },
  {
    icon: Lock,
    title: "Real auth and isolation",
    body: "JWT plus httpOnly cookies (XSS-resistant). Postgres-backed user accounts with per-user chat sessions, documents, and vector stores. Two users sharing the same backend never see each other's anything.",
  },
];

function Features() {
  return (
    <section
      id="features"
      className="relative py-20 md:py-28 border-t border-[var(--border-subtle)]"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-3">
            Everything that matters
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            A complete platform, not a chat wrapper.
          </h2>
          <p className="text-[var(--fg-secondary)] mt-3 max-w-xl mx-auto">
            Every feature in CloudNest works end-to-end. Every endpoint
            requires authentication. Every user sees only their own data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              body={f.body}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-[var(--accent-soft)] border border-[var(--border-subtle)]">
        <Icon className="w-5 h-5 text-[var(--accent)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--fg-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function ProviderSwitchDemo() {
  return (
    <section className="py-20 md:py-28 border-t border-[var(--border-subtle)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-3">
              Provider abstraction
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Switch LLMs in one line.
            </h2>
            <p className="text-[var(--fg-secondary)] leading-relaxed mb-6">
              CloudNest is built against a provider abstraction, not a vendor
              lock-in. Today you can run on Groq for raw speed, OpenRouter for
              access to Claude, GPT-4 and Gemini through one key, or Ollama for
              fully local inference. Tomorrow when a new provider ships, it is
              one branch in the LLM factory.
            </p>
            <ul className="space-y-2 text-sm text-[var(--fg-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">&rarr;</span>
                <span>
                  <span className="font-medium text-[var(--fg-primary)]">
                    Groq
                  </span>{" "}
                  - sub-second responses on Llama and gpt-oss models
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">&rarr;</span>
                <span>
                  <span className="font-medium text-[var(--fg-primary)]">
                    OpenRouter
                  </span>{" "}
                  - access to ~100 models including Claude, GPT-4o, Gemini,
                  DeepSeek
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">&rarr;</span>
                <span>
                  <span className="font-medium text-[var(--fg-primary)]">
                    Ollama
                  </span>{" "}
                  - fully local inference for privacy-sensitive deployments
                </span>
              </li>
            </ul>
          </div>

          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl opacity-20 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-bright), var(--accent))",
              }}
            />
            <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]">
                <FileText className="w-3.5 h-3.5 text-[var(--fg-tertiary)]" />
                <span className="text-[0.7rem] font-mono text-[var(--fg-tertiary)]">
                  .env
                </span>
              </div>
              <pre className="p-5 text-xs font-mono leading-relaxed text-[var(--fg-secondary)] overflow-x-auto">
                <code>
                  <span className="text-[var(--fg-muted)]">
                    # Switch the entire platform with one line:
                  </span>
                  {"\n\n"}
                  <span className="text-[var(--accent)]">LLM_PROVIDER</span>
                  =groq
                  {"\n"}
                  <span className="text-[var(--fg-muted)]"># or</span>
                  {"\n"}
                  <span className="text-[var(--accent)]">LLM_PROVIDER</span>
                  =openrouter
                  {"\n"}
                  <span className="text-[var(--fg-muted)]"># or</span>
                  {"\n"}
                  <span className="text-[var(--accent)]">LLM_PROVIDER</span>
                  =ollama
                  {"\n\n"}
                  <span className="text-[var(--fg-muted)]">
                    # Restart. Done.
                  </span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Sign up",
    body: "Email plus password. Get your own private workspace with isolated documents, sessions, and vector store.",
  },
  {
    n: "02",
    title: "Upload your docs",
    body: "Drop PDFs, text, Markdown, or DOCX. Files are chunked, embedded with BGE, and indexed into your private collection.",
  },
  {
    n: "03",
    title: "Ask anything",
    body: "The agent reads your docs, calls tools, runs Python, searches the web, sees images, and answers with sources.",
  },
];

function HowItWorks() {
  return (
    <section className="py-20 md:py-28 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-3">
            How it works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            From zero to your own AI in three steps.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="relative p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] h-full hover:border-[var(--accent)]/30 transition"
            >
              <div
                className="text-3xl font-bold bg-clip-text text-transparent mb-3"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--accent-bright), var(--accent))",
                }}
              >
                {s.n}
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STACK = [
  {
    icon: Network,
    label: "FastAPI + LangGraph",
    desc: "async Python backend with ReAct agent loops",
  },
  {
    icon: Database,
    label: "Postgres + Chroma",
    desc: "users, sessions, per-user vector stores",
  },
  {
    icon: Cloud,
    label: "Groq / OpenRouter / Ollama",
    desc: "3 providers, switchable in one config line",
  },
  {
    icon: Eye,
    label: "Vision: Llama-4 Scout 17B",
    desc: "image and scanned-PDF understanding via Groq",
  },
  {
    icon: Mic,
    label: "Voice: Whisper + Edge TTS",
    desc: "faster-whisper for STT, Edge for multilingual TTS",
  },
  {
    icon: Boxes,
    label: "Next.js 15 + Tailwind",
    desc: "streaming UI, dark/light themes, mobile-friendly",
  },
];

const UNDER_THE_HOOD = [
  "httpOnly cookie auth + Bearer JWT (dual transport)",
  "Two SQLAlchemy engines (no event-loop pool collisions)",
  "Streaming responses via SSE with live tool traces",
  "Per-user Chroma collections named by user UUID",
  "Persistent background event loop for sync/async bridging",
  "Defensive tool schemas (LLM type-coercion failsafe)",
  "Auto-generated chat titles via background worker",
  "fastapi-users with Alembic migrations",
];

function TechStack() {
  return (
    <section
      id="stack"
      className="py-20 md:py-28 border-t border-[var(--border-subtle)]"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-3">
            Built on
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Honest engineering choices.
          </h2>
          <p className="text-[var(--fg-secondary)] mt-3 max-w-xl mx-auto">
            No magic. No black boxes. Just well-understood components wired
            carefully and tested end-to-end.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STACK.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition"
              >
                <Icon className="w-5 h-5 text-[var(--accent)] mb-3" />
                <div className="text-sm font-semibold text-[var(--fg-primary)] mb-1">
                  {s.label}
                </div>
                <div className="text-xs text-[var(--fg-tertiary)] leading-relaxed">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--fg-tertiary)] mb-3">
            Under the hood
          </div>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-[var(--fg-secondary)]">
            {UNDER_THE_HOOD.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">&rarr;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-20 md:py-28 border-t border-[var(--border-subtle)] overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--accent-bright) 0%, transparent 50%)",
        }}
      />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Ready to talk to your data?
        </h2>
        <p className="text-[var(--fg-secondary)] mb-8 max-w-md mx-auto">
          Create an account in seconds. Upload a document. Ask the first
          question.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-white text-sm font-medium transition shadow-lg shadow-[var(--accent)]/20"
          >
            Get started for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 text-[var(--fg-primary)] text-sm font-medium transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)] py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--fg-tertiary)]">
        <Wordmark size="sm" />
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="font-mono">
            Built by{" "}
            <a
              href="https://www.linkedin.com/in/munir-k-0106b1256/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--fg-secondary)] hover:text-[var(--accent)] transition font-semibold"
            >
              Munir
            </a>
          </span>
          <span className="text-[var(--border-subtle)]">|</span>
          <a
            href="https://github.com/Muhammad-Munir-Khan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-[var(--fg-primary)] transition"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub
          </a>
          <span className="text-[var(--border-subtle)]">|</span>
          <span className="font-mono">
            FastAPI / Next.js / Postgres / Chroma
          </span>
        </div>
      </div>
    </footer>
  );
}