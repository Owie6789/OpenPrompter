<div align="center">
  <h1>OpenPrompter</h1>
  <p><strong>Open-source, unlimited prompt optimizer — BYOK (Bring Your Own Key)</strong></p>
  <p>
    <a href="https://github.com/Owie6789/OpenPrompter/actions"><img src="https://img.shields.io/github/actions/workflow/status/Owie6789/OpenPrompter/ci.yml?branch=main&style=flat-square" alt="CI Status"/></a>
    <a href="https://github.com/Owie6789/OpenPrompter/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Owie6789/OpenPrompter?style=flat-square" alt="License"/></a>
    <a href="https://github.com/Owie6789/OpenPrompter/releases"><img src="https://img.shields.io/github/v/release/Owie6789/OpenPrompter?style=flat-square" alt="Release"/></a>
  </p>
</div>

## Overview

OpenPrompter is a zero-cost prompt engineering tool. You bring your own API key (BYOK) — no subscriptions, no usage limits, no data leaving your endpoint.

**Stack**: React 19 + Vite 6 + Tailwind CSS v4 + TypeScript 5.8 (strict)  
**Backend**: Express 4 + esbuild (production) / tsx (dev)

## Features

- **Prompt Optimizer** — deconstructs and restructures prompts with Role/Task/Context/Constraints/Output
- **Custom Personas** — 5 presets + unlimited custom persona definitions (persisted to localStorage)
- **Curated Templates** — 6 starter templates covering code, marketing, analysis, education, product, sales
- **BYOK + Custom Endpoints** — use your own OpenAI-compatible API key and endpoint
- **Prompt History** — full local history with export to clipboard (text / JSON / markdown)
- **Works Anywhere** — no backend required running as static SPA; optional Node server for proxy

## Quick Start

```bash
# Install dependencies
npm install

# Set your API key
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY / OPENAI_API_KEY

# Start dev server
npm run dev
```

Open http://localhost:3000 — configure your API key via the Settings panel (top-right gear icon).

## Production Build

```bash
npm run build
npm start
```

Serves the SPA from `dist/` with the Express backend on port 3000.

## Project Structure

```
OpenPrompter/
├── src/                  # React app (Vite SPA)
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Entry point
│   ├── types.ts          # TypeScript interfaces
│   ├── data.ts           # Preset personas & templates
│   └── index.css         # Tailwind v4 theme & globals
├── components/ui/        # shadcn/ui components (base-nova style)
├── lib/                  # Utility modules
├── server.ts             # Express backend (dev & production)
├── vite.config.ts        # Vite config
├── tsconfig.json         # TypeScript configuration
└── .env.example          # Environment variables template
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Gemini API key (AI Studio deployment) |
| `OPENAI_API_KEY` | No | OpenAI API key (BYOK fallback in server) |
| `APP_URL` | No | Public URL for self-referential links |

Users can also configure keys in-app via the Settings dialog (persisted to localStorage under `openprompter_byok_key`).

## License

MIT
