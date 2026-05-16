# LinkedIn launch post

I spent the last few weeks building a GenAI conversational agent end-to-end — not a wrapper around an LLM, but the whole orchestration layer that sits behind systems like ChatGPT and Perplexity.

Here's what's in it, and (more interestingly) what I learned that the tutorials don't cover.

---

**What I built:**

→ A LangGraph ReAct agent loop with 11 tools (RAG, web search, sandboxed Python REPL with pandas pre-loaded, currency, weather, calculator, OCR, more)

→ RAG over local documents using Chroma + BGE embeddings, with **real citations** (source file, page number, similarity score) — not just confident-sounding text

→ A **multi-LLM consensus mode** — toggle it on and a single query fans out to 3 Groq models in parallel (Llama 8B, Llama 70B, GPT-OSS-20B). A 4th model judges the responses, ranks them with reasoning, and synthesizes a verdict. Inspired by Together AI's "Mixture of Agents" research.

→ Token-by-token streaming with a **live agent trace timeline** in the UI — watch tool calls appear, transition from running → done in real time, then collapse into an expander

→ Voice in/out (faster-whisper for STT, Edge neural voices for TTS)

→ OCR for scanned PDFs and images (Groq vision fallback when text extraction fails)

→ Persistent multi-session chat with SQLite + LLM-generated chat titles (background thread, doesn't block the user)

→ Sandboxed Python execution for actual data analysis on uploaded CSVs (not just "talk about the data")

→ Light/dark mode that genuinely works (CSS-variable architecture, single source of truth)

Stack: FastAPI · LangGraph · Chroma · BGE · faster-whisper · Edge TTS · Next.js 15 · Tailwind v4

---

**What I actually learned (the tutorials skip this):**

**1. Tool selection is a system-prompt problem, not a model problem.**
Most "the agent picked the wrong tool" failures went away after I rewrote tool descriptions to emphasize *when* to use each one — not just *what* it does.

**2. Streaming UX is the difference between "demo" and "product."**
Users tolerate latency if they can see something happening. The live trace timeline shipped before any real performance work, and it changed how the system felt.

**3. SQLite + WAL beats every "AI memory framework" I evaluated** for single-user apps. 200 lines of Python, zero ops, perfect for portfolio scale.

**4. Multi-LLM ensembling produces visibly better answers on judgment questions, not factual ones.**
For "what year was X invented" three models give the same answer. For "should I hire a senior or two juniors with limited runway" they disagree productively — and a smaller model from a different family caught a budget constraint that two bigger Llamas missed. The judge picked it. That's the moment the architecture earned its compute.

**5. LangGraph's explicit state machine pays off when streaming.**
Trying to stream from a LangChain AgentExecutor was painful. LangGraph emits `updates` and `messages` events you can directly forward over SSE.

---

**What I'd do differently next time:**

Skip Streamlit. I built a Streamlit version first and then ported to Next.js. The Next.js version is what makes the system feel like a product. Streamlit is great for internal tools and notebook-grade demos; for anything you'd show a recruiter, build it in something real from day one.

---

This is open source. Code, full README, and architecture diagrams here:
🔗 https://github.com/<your-username>/genai-conversational-agent

If you're building agents and got stuck on streaming, tool selection, or multi-model orchestration — happy to compare notes. Drop a comment.

#AIEngineering #LLM #LangGraph #RAG #GenAI #OpenSource

---

## Notes on posting this

**Best time to post:** Tuesday or Wednesday morning, US business hours (LinkedIn's algorithm shows more reach during weekday mornings). For Pakistan, that's Tuesday/Wednesday around 7-9 PM PKT.

**Critical:** include a 30-90 second demo video as the post's media. The text alone won't get traction. The video is what makes someone stop scrolling.

**Hashtags:** Use 3-5, not more. The ones I included are right — niche enough to reach engineers, broad enough that they trigger.

**First comment:** post the GitHub link as a top-level comment on your own post. LinkedIn deprioritizes posts with external links in the body, so putting the URL in a comment instead boosts reach.

**Engage in the first hour.** Reply to every comment in the first 60 minutes. LinkedIn's algorithm reads "comment activity in the first hour" as a strong signal and amplifies the post accordingly.