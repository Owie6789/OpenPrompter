<div align="center">

<img src="assets/openpromptericon.png" alt="OpenPrompter Icon" width="96" height="96" />

<h1>OpenPrompter</h1>

<p><strong>Open-source AI prompt optimizer. Bring your own key. Zero limits. Zero middlemen.</strong></p>

<img src="assets/openpromptereadmeherobanner.png" alt="OpenPrompter Hero" width="100%" style="border-radius:16px;" />

<br/>
<br/>

<a href="https://github.com/Owie6789/OpenPrompter/blob/main/LICENSE">
  <img src="https://img.shieldcn.dev/badge/license-MIT-0c0a09?style=flat-square&labelColor=f5f5f4" alt="License MIT" />
</a>
<a href="https://github.com/Owie6789/OpenPrompter/releases">
  <img src="https://img.shieldcn.dev/badge/version-1.0.0-2563eb?style=flat-square&labelColor=f5f5f4" alt="Version" />
</a>
<img src="https://img.shieldcn.dev/badge/React-19-2563eb?style=flat-square&logo=react&logoColor=white&labelColor=0c0a09" alt="React 19" />
<img src="https://img.shieldcn.dev/badge/TypeScript-5.8%20strict-2563eb?style=flat-square&logo=typescript&logoColor=white&labelColor=0c0a09" alt="TypeScript" />
<img src="https://img.shieldcn.dev/badge/Vite-6-2563eb?style=flat-square&logo=vite&logoColor=white&labelColor=0c0a09" alt="Vite 6" />
<img src="https://img.shieldcn.dev/badge/TailwindCSS-v4-2563eb?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=0c0a09" alt="Tailwind v4" />
<img src="https://img.shieldcn.dev/badge/BYOK-privacy%20first-0c0a09?style=flat-square&labelColor=f5f5f4" alt="BYOK" />
<img src="https://img.shieldcn.dev/badge/zero-telemetry-0c0a09?style=flat-square&labelColor=f5f5f4" alt="Zero Telemetry" />

</div>

---

## What is OpenPrompter?

Most prompt optimizer tools are paywalled, rate-limited, or quietly logging your ideas. **OpenPrompter is none of those things.**

You paste a rough prompt. OpenPrompter — using **your own API key** from OpenAI, DeepSeek, Anthropic, or any compatible provider — deconstructs it, restructures it into a framework of Role / Task / Context / Constraints / Output, and hands you back something an LLM actually parses well.

Your key. Your data. Your prompts. That's it.

> **No accounts. No subscriptions. No server-side prompt logging. Keys live in your browser only.**

---

## Features

### 🧠 Prompt Optimization Workspace

<img src="assets/opfeature1.png" alt="Prompt Optimizer" width="100%" />

Paste any rough draft — a story idea, a code request, a marketing brief. Select an expert persona, pick your model, add optional constraints, and hit **Optimize** (or `Ctrl + Enter`).

The engine deconstructs your input and outputs a structured, high-clarity prompt with:
- **Confidence Score** — how well-formed the output is
- **Structural Improvements list** — what changed and why
- **Applied Architectures** — labelled techniques used
- **Export options** — copy as plain text, Markdown, or raw JSON

---

### 🔑 BYOK — Bring Your Own Key

<img src="assets/opfeature2.png" alt="BYOK Setup" width="100%" />

Plug in your own API key from any supported provider. OpenPrompter routes your prompt directly from browser → your key → provider API — no intermediary, no logging.

**Supported providers out of the box:**

| Provider | Default Endpoint | Key Format |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `sk-...` |
| DeepSeek | `https://api.deepseek.com/v1` | `sk-...` |
| Anthropic | `https://api.anthropic.com/v1` | `sk-ant-...` |
| Custom | Any OpenAI-compatible URL | Your format |

After saving, OpenPrompter **auto-fetches your available models** and displays them in a live-scrolling marquee. Pick from your actual model list — no hardcoded dropdown guessing.

---

### 📋 Curated Prompt Templates

<img src="assets/opfeature3.png" alt="Prompt History" width="100%" />

6 high-fidelity starter templates spanning:
- **Coding** — Refactor, review, architect
- **Marketing** — Copy, campaigns, positioning
- **Analysis** — Research synthesis, data breakdowns
- **Sales** — Outreach, objection handling
- **Education** — Lesson plans, explanations
- **Product** — PRDs, user stories, roadmaps

Filter by category or search by keyword. One click loads any template directly into the workspace.

---

### 🎭 Custom Personas

Design your own expert AI roles with a name, description, and system instruction — e.g. *"Python Refactoring Ninja"* or *"Senior UX Copywriter"*. Personas persist across sessions via localStorage and apply as system-level instructions during optimization.

5 presets included. Unlimited custom ones you can create, edit, and delete.

---

### 🕒 Prompt History & Export

Every optimization is saved locally with full metadata:
- Original vs. optimized side-by-side
- Confidence score, prompt type, persona used
- Timestamp and model used

Export your entire session as **JSON** or **Markdown**. Or wipe it clean with one click. Nothing ever leaves your device.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Owie6789/OpenPrompter.git
cd OpenPrompter

# 2. Install
npm install

# 3. Dev server
npm run dev
