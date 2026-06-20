<div align="center">

<img src="assets/openpromptericon.png" alt="OpenPrompter Icon" width="96" height="96" />

# OpenPrompter

**Open-source AI prompt optimizer. Bring your own key. Zero limits. Zero middlemen.**

<p align="center">
<a href="https://github.com/Owie6789/OpenPrompter/blob/main/LICENSE"><img src="https://www.shieldcn.dev/badge/License-MIT-18181B.svg?theme=stone&font=geist-mono" alt="License" /></a>
<a href="https://github.com/Owie6789/OpenPrompter/releases"><img src="https://www.shieldcn.dev/badge/Version-1.0.0-18181B.svg?theme=stone&font=geist-mono" alt="Version" /></a>
<img src="https://www.shieldcn.dev/badge/Status-Privacy_First-10B981.svg?theme=stone&font=geist-mono" alt="Privacy First" />
<img src="https://www.shieldcn.dev/badge/Telemetry-Zero-EF4444.svg?theme=stone&font=geist-mono" alt="Zero Telemetry" />
</p>

<img src="assets/openpromptereadmeherobanner.png" alt="OpenPrompter Hero" width="85%" />

</div>

<br>

## <img src="https://api.iconify.design/ph:info.svg?color=%232563eb" width="28" height="28" align="center" /> **What is OpenPrompter?**

Most prompt optimizer tools are paywalled, rate-limited, or quietly logging your ideas. **OpenPrompter is none of those things.**

You paste a rough prompt. OpenPrompter — using **your own API key** from OpenAI, DeepSeek, Anthropic, or any compatible provider — deconstructs it, restructures it into a framework of Role / Task / Context / Constraints / Output, and hands you back something an LLM actually parses well.

Your key. Your data. Your prompts. That's it.

> **<img src="https://api.iconify.design/ph:lock-key.svg?color=%232563eb" width="18" height="18" align="center" /> Privacy Guarantee:** No accounts. No subscriptions. No server-side prompt logging. Keys live in your browser's local storage only.

<br>

## <img src="https://api.iconify.design/ph:stack.svg?color=%232563eb" width="28" height="28" align="center" /> **Built With**

<p align="left">
<img src="https://www.shieldcn.dev/badge/-React_19-61DAFB.svg?logo=react&variant=branded&theme=stone&font=geist-mono" alt="React 19" />
<img src="https://www.shieldcn.dev/badge/-TypeScript_5.8-3178C6.svg?logo=typescript&variant=branded&theme=stone&font=geist-mono" alt="TypeScript" />
<img src="https://www.shieldcn.dev/badge/-Vite_6-646CFF.svg?logo=vite&variant=branded&theme=stone&font=geist-mono" alt="Vite 6" />
<img src="https://www.shieldcn.dev/badge/-Tailwind_v4-06B6D4.svg?logo=tailwindcss&variant=branded&theme=stone&font=geist-mono" alt="Tailwind CSS" />
</p>

<br>

## <img src="https://api.iconify.design/ph:sparkle.svg?color=%232563eb" width="28" height="28" align="center" /> **Core Features**

### <img src="https://api.iconify.design/ph:brain.svg?color=%232563eb" width="24" height="24" align="center" /> **Prompt Optimization Workspace**

<p align="center">
<img src="assets/opfeature1.png" alt="Prompt Optimizer" width="85%" />
</p>

Paste any rough draft — a story idea, a code request, a marketing brief. Select an expert persona, pick your model, add optional constraints, and hit **Optimize** (or `Ctrl + Enter`).

The engine deconstructs your input and outputs a structured, high-clarity prompt with:
* **Confidence Score:** How well-formed the output is.
* **Structural Improvements:** What changed and why.
* **Applied Architectures:** Labelled techniques used.
* **Export Options:** Copy as plain text, Markdown, or raw JSON.

---

### <img src="https://api.iconify.design/ph:key.svg?color=%232563eb" width="24" height="24" align="center" /> **BYOK — Bring Your Own Key**

<p align="center">
<img src="assets/opfeature2.png" alt="BYOK Setup" width="85%" />
</p>

Plug in your own API key from any supported provider. OpenPrompter routes your prompt directly from browser → your key → provider API. No intermediary, no logging.

<div align="center">

| Provider | Default Endpoint | Key Format |
|:---:|:---:|:---:|
| **OpenAI** | `https://api.openai.com/v1` | `sk-...` |
| **DeepSeek** | `https://api.deepseek.com/v1` | `sk-...` |
| **Anthropic** | `https://api.anthropic.com/v1` | `sk-ant-...` |
| **Custom** | Any OpenAI-compatible URL | Your format |

</div>

*After saving, OpenPrompter **auto-fetches your available models** and displays them in a live-scrolling marquee.*

---

### <img src="https://api.iconify.design/ph:clipboard-text.svg?color=%232563eb" width="24" height="24" align="center" /> **Curated Prompt Templates**

<p align="center">
<img src="assets/opfeature3.png" alt="Prompt Templates" width="85%" />
</p>

6 high-fidelity starter templates spanning:
* **Coding:** Refactor, review, architect.
* **Marketing:** Copy, campaigns, positioning.
* **Analysis:** Research synthesis, data breakdowns.
* **Sales:** Outreach, objection handling.
* **Education:** Lesson plans, explanations.
* **Product:** PRDs, user stories, roadmaps.

Filter by category or search by keyword. One click loads any template directly into the workspace.

---

### <img src="https://api.iconify.design/ph:mask-happy.svg?color=%232563eb" width="24" height="24" align="center" /> **Custom Personas** & <img src="https://api.iconify.design/ph:clock-counter-clockwise.svg?color=%232563eb" width="24" height="24" align="center" /> **Local History**

<p align="center">
<img src="assets/op-feature4.png" alt="Custom Personas and History" width="85%" />
</p>

* **Personas:** Design your own expert AI roles (e.g., *"Python Refactoring Ninja"*). Personas persist across sessions via localStorage and apply as system-level instructions. 5 presets included.
* **History:** Every optimization is saved locally with full metadata (score, type, timestamp, model). Export your session as JSON/Markdown, or wipe it clean in one click.

<br>

## <img src="https://api.iconify.design/ph:terminal.svg?color=%232563eb" width="28" height="28" align="center" /> **Quick Start**

```bash
# 1. Clone the repository
git clone https://github.com/Owie6789/OpenPrompter.git
cd OpenPrompter

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
