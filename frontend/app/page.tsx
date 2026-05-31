"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  Boxes,
  Building2,
  Cloud,
  Container,
  Database,
  Eye,
  FileText,
  Gavel,
  Globe,
  GraduationCap,
  Github,
  HeartPulse,
  Languages,
  Layers,
  LineChart,
  Lock,
  Mic,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
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
      <BuiltForTeams />
      <UseCases />
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
            href="#use-cases"
            className="hidden md:inline text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition px-3 py-1.5"
          >
            Use cases
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
              Self-hostable &middot; Multi-tenant &middot; Production-ready
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              Your own{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--accent-bright), var(--accent))",
                }}
              >
                AI workspace
              </span>
              . Your data. Your rules.
            </h1>

            <p className="text-base md:text-lg text-[var(--fg-secondary)] leading-relaxed mb-8 max-w-lg">
              CloudNest is a complete conversational AI platform you run
              yourself. Per-user RAG, tool-using agents, a curated knowledge
              base, voice, vision, and true multilingual retrieval across
              100+ languages with BGE-M3 embeddings. Switch LLM providers
              with one config line. Deploy with one Docker command.
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
              <Stat number="10" label="agent tools" />
              <Stat number="100+" label="languages" />
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
              What does our refund policy say, and how much would 12 units cost
              with the bulk discount?
            </div>
          </div>

          <div className="ml-10 flex flex-wrap gap-1.5">
            <ToolPill name="knowledge_base_search" />
            <ToolPill name="document_search" />
            <ToolPill name="calculator" />
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
                Per the company refund policy, returns are accepted within{" "}
                <span className="font-medium">30 days</span> of purchase. For
                12 units at the bulk-tier price of $7,200 each, the total comes
                to <span className="font-medium">$78,840</span> after the 8.75%
                volume discount.
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-mono">
                <span className="inline-flex items-center gap-1.5 text-[var(--fg-tertiary)] bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1">
                  <FileText className="w-3 h-3" />
                  sources: refund_policy.pdf &middot; pricing.docx
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--fg-tertiary)] bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-full px-2.5 py-1">
                  <Zap className="w-3 h-3" />
                  1.4s
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
    body: "Every user gets a private Weaviate tenant. Upload PDFs, DOCX, text, or Markdown. The agent retrieves answers with file-level citations. One user cannot see another user's documents, sessions, or vector chunks - enforced at the storage layer, not just the application.",
  },
  {
    icon: Layers,
    title: "Shared knowledge base",
    body: "A curated corpus that everyone in your workspace can read but only admins can write. Upload policies, manuals, FAQs - all employees query them through the same chat. Citations show which source came from personal documents vs the shared knowledge base.",
  },
  {
    icon: ShieldCheck,
    title: "Admin panel",
    body: "Three-tier role system: user, corpus_admin, super_admin. Manage users, suspend accounts (with email notification + reason), reset passwords, force-logout active sessions instantly. Curate the shared knowledge base. Live system stats.",
  },
  {
    icon: Wrench,
    title: "10 agent tools",
    body: "Personal document search, shared knowledge base search, document summarizer, web search, calculator, JSON parser, datetime helper, unit converter, currency converter (live ECB rates), live weather. Powered by a LangGraph ReAct loop.",
  },
  {
    icon: Sparkles,
    title: "Multi-LLM ensemble",
    body: "Fan out a question to three different models in parallel, then a judge model ranks them and synthesizes the best answer. Real model comparison with explainable rankings - useful when accuracy matters more than latency.",
  },
  {
    icon: Eye,
    title: "Vision + voice",
    body: "Vision model reads images and scanned PDFs when text extraction falls short. Whisper for speech-to-text. Edge TTS for multilingual voice output with native voices across 37 languages.",
  },
  {
    icon: Globe,
    title: "Multilingual retrieval",
    body: "Powered by BAAI/bge-m3, a state-of-the-art multilingual embedding model with first-class support for 100+ languages including Urdu, Arabic, Bengali, Hindi, Chinese, Russian, French, Spanish, Swahili and more. Upload a manual in one language, query it in another - retrieval works cross-lingually because the embeddings share semantic space across languages.",
  },
  {
    icon: Languages,
    title: "Voice in 37 languages",
    body: "The agent responds in the user's chosen language with a matched native TTS voice across 37 locales. Tool outputs (numbers, currency, dates) translate naturally into the conversation. Whisper handles speech-to-text on the way in.",
  },
  {
    icon: Lock,
    title: "Production-ready security",
    body: "JWT plus httpOnly cookies (XSS-resistant). OAuth via Google and GitHub. Force-logout invalidates active sessions on the very next request, globally - not just /admin. Account suspension with audit-trail-friendly admin logging.",
  },
  {
    icon: LineChart,
    title: "Built-in observability",
    body: "Every agent run is traced via Langfuse: tool calls, latencies, tokens, costs. Filter by user, by session. Debug bad answers by replaying the exact tool tree the agent followed.",
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

function BuiltForTeams() {
  return (
    <section className="py-20 md:py-28 border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <div
              className="absolute inset-0 rounded-2xl opacity-20 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-bright), var(--accent))",
              }}
            />
            <div className="relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-[0.7rem] font-mono text-[var(--fg-tertiary)]">
                  Admin / Users
                </span>
              </div>
              <div className="p-5 text-sm space-y-3">
                <AdminRow
                  email="alice@acme.com"
                  role="super_admin"
                  status="active"
                />
                <AdminRow
                  email="bob@acme.com"
                  role="corpus_admin"
                  status="active"
                />
                <AdminRow
                  email="charlie@acme.com"
                  role="user"
                  status="active"
                />
                <AdminRow
                  email="ex.contractor@acme.com"
                  role="user"
                  status="suspended"
                />
                <div className="pt-2 border-t border-[var(--border-subtle)] text-[0.65rem] font-mono text-[var(--fg-tertiary)] flex flex-wrap gap-3">
                  <span>&rarr; suspend (with reason + email)</span>
                  <span>&rarr; force-logout</span>
                  <span>&rarr; send reset link</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-3">
              Built for teams
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Real user management, not a settings page.
            </h2>
            <p className="text-[var(--fg-secondary)] leading-relaxed mb-6">
              CloudNest ships with the admin tooling most internal AI projects
              never bother to build. Onboard users, define roles, curate what
              the AI knows about your company, and shut down a compromised
              account before someone gets a chance to misuse it.
            </p>
            <ul className="space-y-3 text-sm text-[var(--fg-secondary)]">
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium text-[var(--fg-primary)]">
                    Three-tier roles.
                  </span>{" "}
                  Regular users, corpus admins who manage the shared knowledge
                  base, and super admins who manage everything.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium text-[var(--fg-primary)]">
                    Suspend with one click.
                  </span>{" "}
                  Block an account, force-logout active sessions instantly, and
                  email the user a clear reason. Unblock is just as fast.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Search className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium text-[var(--fg-primary)]">
                    Curate the knowledge base.
                  </span>{" "}
                  Drag in PDFs and manuals. Preview retrieval with hybrid
                  search before users see it. Delete sources cleanly.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <LineChart className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium text-[var(--fg-primary)]">
                    Observe everything.
                  </span>{" "}
                  Every agent run is traced. Inspect tool calls, latencies,
                  token usage. Debug bad answers with full reproducibility.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminRow({
  email,
  role,
  status,
}: {
  email: string;
  role: string;
  status: "active" | "suspended";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--fg-primary)] truncate flex-1">{email}</span>
      <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--fg-secondary)] shrink-0">
        {role}
      </span>
      <span
        className={`text-[0.65rem] font-mono px-2 py-0.5 rounded shrink-0 ${
          status === "active"
            ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/30"
            : "text-red-500 bg-red-500/10 border border-red-500/30"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

const USE_CASES = [
  {
    icon: Building2,
    title: "Internal company AI",
    body: "Give every employee an AI assistant that already knows your company's policies, SOPs, product documentation, and pricing. Each person also gets a private space for their own working documents. No shared chats, no leaked drafts.",
    tags: ["Operations", "HR", "Sales enablement"],
  },
  {
    icon: HeartPulse,
    title: "Regulated industries",
    body: "Healthcare, legal, finance - any vertical where your data cannot leave your perimeter. Self-host on your own VPC. Use Ollama for fully local inference. CloudNest does not phone home; the only outbound calls are the ones your config tells it to make.",
    tags: ["HIPAA-aware", "On-prem", "Air-gapped friendly"],
  },
  {
    icon: GraduationCap,
    title: "Universities and research",
    body: "Each student or researcher gets their own RAG corpus for course notes, papers, and personal references. Faculty curates a shared knowledge base of textbooks, syllabi, and lab documentation. 37 languages including Urdu, Arabic, Bengali, Hindi.",
    tags: ["EdTech", "Multilingual", "Per-user privacy"],
  },
  {
    icon: Gavel,
    title: "Law firms and consultancies",
    body: "Upload case files, contracts, and prior memos to a partner's private workspace. Cite the exact filename and page in answers. Use the ensemble feature to compare how different models interpret an ambiguous clause.",
    tags: ["Citation-grade", "Confidentiality"],
  },
  {
    icon: Boxes,
    title: "Customer support copilot",
    body: "Load your product manuals, troubleshooting guides, and policy documents into the shared knowledge base. Every agent in your support team gets fast, citation-backed answers without sending customer data to a third-party AI.",
    tags: ["CX", "Internal tooling"],
  },
  {
    icon: GraduationCap,
    title: "Training and onboarding",
    body: "Drop your onboarding handbook, role-specific playbooks, and historical training material into the knowledge base. New hires ask questions and get back grounded answers with sources they can verify.",
    tags: ["L&D", "Knowledge management"],
  },
];

function UseCases() {
  return (
    <section
      id="use-cases"
      className="py-20 md:py-28 border-t border-[var(--border-subtle)]"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] mb-3">
            Where teams use it
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            One platform. Many shapes.
          </h2>
          <p className="text-[var(--fg-secondary)] mt-3 max-w-xl mx-auto">
            The same architecture - per-user isolation, shared knowledge base,
            switchable LLM providers - fits a wide range of organizational
            needs. Pick the deployment that matches your trust requirements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {USE_CASES.map((u) => (
            <UseCaseCard key={u.title} {...u} />
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCaseCard({
  icon: Icon,
  title,
  body,
  tags,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tags: string[];
}) {
  return (
    <div className="group relative p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition flex flex-col">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-[var(--accent-soft)] border border-[var(--border-subtle)]">
        <Icon className="w-5 h-5 text-[var(--accent)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--fg-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--fg-secondary)] leading-relaxed flex-1">
        {body}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--fg-tertiary)]"
          >
            {t}
          </span>
        ))}
      </div>
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
              No vendor lock-in
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Switch LLMs in one line.
            </h2>
            <p className="text-[var(--fg-secondary)] leading-relaxed mb-6">
              CloudNest is built against a provider abstraction. Today you can
              run on Groq for raw speed, OpenRouter for access to Claude, GPT-4
              and Gemini through one key, or Ollama for fully local inference.
              Tomorrow when a new provider ships, it is one branch in the LLM
              factory.
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
    title: "Deploy in minutes",
    body: "One docker-compose command brings up the full stack: API, Postgres, Weaviate, and the Next.js frontend. Run it on your laptop, your VPC, or your own bare-metal server.",
  },
  {
    n: "02",
    title: "Onboard your team",
    body: "Invite users. Assign roles. Curate the shared knowledge base with policies, manuals, and reference docs. Every user also gets their own private document space.",
  },
  {
    n: "03",
    title: "Ask anything",
    body: "Your team starts using AI immediately. The agent reads your docs, calls tools, searches the web, sees images, and answers with sources - across 100+ languages with cross-lingual retrieval.",
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
    label: "Postgres + Weaviate",
    desc: "users, sessions, multi-tenant vector stores",
  },
  {
    icon: Globe,
    label: "BAAI/bge-m3 embeddings",
    desc: "1024-dim multilingual vectors covering 100+ languages",
  },
  {
    icon: Cloud,
    label: "Groq / OpenRouter / Ollama",
    desc: "3 LLM providers, switchable in one config line",
  },
  {
    icon: Eye,
    label: "Vision + voice",
    desc: "Llama-4 Scout for images, Whisper for STT, Edge for TTS",
  },
  {
    icon: LineChart,
    label: "Langfuse tracing",
    desc: "every agent run captured with full tool tree",
  },
  {
    icon: Container,
    label: "Docker-native",
    desc: "single docker-compose for the full stack",
  },
  {
    icon: Boxes,
    label: "Next.js 15 + Tailwind",
    desc: "streaming UI, dark/light themes, mobile-friendly",
  },
  {
    icon: Lock,
    label: "fastapi-users + Alembic",
    desc: "JWT + httpOnly cookies, OAuth, migrations",
  },
];

const UNDER_THE_HOOD = [
  "httpOnly cookie auth + Bearer JWT (dual transport)",
  "Streaming responses via SSE with live tool traces",
  "Per-user Weaviate tenants enforced at the storage layer",
  "Global force-logout via JWT iat-cutoff checks",
  "Account suspension with email notifications + reason",
  "Hybrid retrieval (BM25 + vector) merged across personal + shared corpora",
  "Cross-lingual semantic search via BGE-M3 (Urdu query -> English docs works)",
  "Auto-generated chat titles via background worker",
  "Multi-tenant Postgres with Alembic migrations",
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
            No magic. No black boxes. Well-understood components wired
            carefully and tested end-to-end.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          Your AI. Your infrastructure. Your data.
        </h2>
        <p className="text-[var(--fg-secondary)] mb-8 max-w-md mx-auto">
          Try the hosted demo, or clone the repo and run the full stack on
          your own machine in minutes.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-bright)] text-white text-sm font-medium transition shadow-lg shadow-[var(--accent)]/20"
          >
            Try the demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/Muhammad-Munir-Khan/Generative-AI-Conversational-Automation-Agent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 text-[var(--fg-primary)] text-sm font-medium transition"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
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
            FastAPI / Next.js / Postgres / Weaviate / Docker
          </span>
        </div>
      </div>
    </footer>
  );
}