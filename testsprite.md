# OpenPrompter — Ground-Level Documentation for TestSprite

> This document is the single source of truth for TestSprite to understand OpenPrompter's architecture, features, user flows, component structure, API contracts, state management, styling system, and testing surface. Every section maps to testable behavior.

---

## 1. What This App Is

OpenPrompter is an open-source prompt optimization tool. Users paste a rough prompt, select an AI provider + model + persona, and the app sends the prompt through a structured optimization pipeline that returns an improved prompt with confidence scoring.

**Core value prop**: BYOK (Bring Your Own Key) — users supply their own API keys, nothing is stored server-side, zero telemetry.

**Running locally**: `npm run dev` starts an Express server on port 3000 with Vite dev middleware. Production mode serves pre-built `dist/` as static files.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS v4 + custom "Shaders" dark theme |
| UI Components | shadcn/ui (Dialog, Card, Button, Badge, Select, Textarea, Input, AlertDialog, Toaster/sonner) |
| Icons | @phosphor-icons/react (NOT Lucide) |
| Animation | motion (framer-motion rebrand) |
| Fonts | Geist Variable (body), Albert Sans Variable (display), Space Mono (mono) |
| Backend | Express 4 + helmet + cors + express-rate-limit |
| Build | Vite bundler + esbuild for production |
| State | React useState + useEffect, localStorage persistence (no Redux/Zustand) |

---

## 3. Application Structure (File Map)

```
server.ts                    — Express server, API routes, security middleware
index.html                   — HTML shell, OG meta tags, theme-init.js script
public/theme-init.js         — Inline dark mode init (runs before React mounts)
public/favicon.svg           — App favicon
public/og-image.png          — Social sharing OG image
src/
  main.tsx                   — React entry point
  App.tsx                    — Single-file app (2209 lines), ALL UI + state
  index.css                  — Tailwind v4 theme tokens, Shaders design system
  types.ts                   — TypeScript types/interfaces
  data.ts                    — Preset personas (5) + preset templates (6)
  components/
    ScrollProgress.tsx       — Scroll progress bar (fixed top)
  hooks/
    use-reduced-motion.ts    — OS motion preference hook
  lib/
    motion-config.ts         — Motion utility (low-end detection, reduced motion)
    share.ts                 — URL-based share encode/decode (lz-string compression)
components/
  ByokDialog.tsx             — BYOK API key configuration dialog
  HistoryDetailDialog.tsx    — History item detail view dialog
  ImportShareDialog.tsx      — Share import confirmation dialog
  ui/                        — shadcn/ui primitives (button, card, badge, etc.)
```

---

## 4. Routing & Navigation

**No React Router** — this is a single-page app with tab-based navigation managed by React state.

```
activeTab: "optimizer" | "templates" | "personas" | "history" | "about"
```

### Desktop Navigation
- Horizontal tab bar in the header (`nav` element, hidden on mobile)
- Arrow key navigation (left/right cycles through tabs)
- Each tab is a `Button` with `id="tab-{name}"` for testing

### Mobile Navigation
- Hamburger menu (`Button id="mobile-menu-trigger"`) toggles `mobileMenuOpen` state
- Dropdown panel appears below header with full-width tab buttons
- Selecting a tab closes the menu

### Tab IDs (for testing)
| Tab | Desktop button ID | Content area |
|-----|------------------|--------------|
| Workspace (Optimizer) | `tab-optimizer` | Main optimization interface |
| Curated Presets | `tab-templates` | Template gallery |
| Custom Personas | `tab-personas` | Persona creator + list |
| Durable History | `tab-history` | Optimization history log |
| About & Guide | `tab-about` | Static info page |

---

## 5. LocalStorage Keys

All state persists to localStorage under these keys:

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `openprompter_byok_key` | string | `""` | API key |
| `openprompter_endpoint` | string | `""` | Custom API endpoint URL |
| `openprompter_provider` | string | `"openai"` | Active provider |
| `openprompter_custom_model` | string | `""` | Custom model name |
| `openprompter_selected_model` | string | `"gpt-4o"` | Selected model ID |
| `openprompter_custom_instructions` | string | `""` | Custom optimization instructions |
| `openprompter_prompt_history` | JSON array | `[]` | Up to 100 history items |
| `openprompter_custom_personas` | JSON array | `[]` | User-created personas |
| `theme` | string | `null` | Dark/light preference (read by theme-init.js) |

---

## 6. User Flows (Testable Scenarios)

### Flow 1: Optimize a Prompt (Primary)

1. User lands on Workspace tab (default)
2. Types or pastes text into `#prompt-input` textarea (max 5000 chars)
3. Selects persona from "Expert Persona Role" dropdown (`#persona-role`)
4. Selects model from "Model" dropdown (`#model-select`)
5. Optionally types in "Additional Custom Instructions" (`#custom-instructions`, max 1000 chars)
6. Clicks "Optimize Prompt" button (`#run-optimize-btn`) OR presses Ctrl+Enter
7. **Loading state**: skeleton shimmer animation appears, progress text cycles through 6 steps
8. **Success**: Right column shows optimization result with:
   - Prompt type badge (e.g., "Coding", "General")
   - Confidence score (color-coded: ≥90% = ink, ≥70% = steel, <70% = amber)
   - Structural improvements (numbered grid)
   - Applied architectures (badge chips)
   - Engineered prompt (monospace output with copy toolbar)
9. **Error**: Toast notification appears (sonner), BYOK dialog opens if no API key

### Flow 2: BYOK Setup

1. Click "Connection Setup" button (top-right, `#key-settings-btn`) — or auto-opened on missing key
2. Dialog opens with provider grid: OpenAI, DeepSeek, Anthropic, Custom
3. Selecting a provider auto-fills the endpoint URL
4. Enter API key in the key input field
5. Optional: enter custom endpoint URL, custom model name
6. Click "Save Configuration"
7. Dialog closes, toast "BYOK Engine configuration saved successfully"
8. Models auto-fetch from the provider's `/models` endpoint

### Flow 3: Template Selection

1. Click "Curated Presets" tab
2. Browse 6 preset templates in a 2-column grid
3. Filter by category: All, Coding, Marketing, Analysis, Sales, Education
4. Search by name/description
5. Click "Load into Workspace →" or click the template card
6. Toast confirms: `Loaded template: "{name}" into workspace!`
7. App switches to Workspace tab with prompt pre-filled

### Flow 4: Template/Persona Share

1. On any template card, click "Share" button
2. URL-encoded payload generated via lz-string compression
3. Share URL copied to clipboard
4. Toast: "Template share link copied!"
5. FAB notification appears bottom-right: "Share link copied!"

### Flow 5: Share Import (via URL)

1. User navigates to `/?share={encoded-payload}`
2. On mount, `useEffect` detects `share` query param
3. Payload decoded and validated (version check, field validation, length limits)
4. Import dialog (`ImportShareDialog`) opens with preview
5. User clicks "Import Template" or "Import Persona"
6. Template → loaded into workspace; Persona → added to custom personas list

### Flow 6: Custom Persona CRUD

1. Click "Custom Personas" tab
2. Left panel: create/edit form with Name, Description, System Instruction fields
3. Right panel: grid of all personas (5 presets + custom)
4. Create: fill form → "Create Persona" → toast + auto-select
5. Edit: click gear icon on custom persona → form populates → "Save Updates"
6. Delete: click trash icon → persona removed, toast confirmation
7. Adopt: click "Adopt Persona" on any card → sets as active for optimization
8. Share: click "Share" on custom persona → URL copied to clipboard

### Flow 7: History Management

1. Click "Durable History" tab
2. Header shows count badge on desktop nav
3. History items displayed as cards with:
   - Prompt type badge, timestamp, persona name
   - Confidence score
   - Side-by-side excerpt comparison (original vs optimized)
4. Click card → opens `HistoryDetailDialog` with full view
5. Delete individual items (trash icon on hover)
6. Export all as JSON or Markdown
7. "Clear" button → confirmation dialog → wipes all history

### Flow 8: Copy to Clipboard

On the optimized result card:
- "Copy Prompt" button → copies plain text
- "MD" button → copies formatted Markdown
- "JSON" button → copies full JSON
- Each shows checkmark feedback for 2 seconds

---

## 7. API Endpoints

### `GET /api/health`
Returns `{ status: "ok", mode: "production" }`.

### `POST /api/models`
Fetches available models from a provider.

**Request**:
```json
{
  "apiKey": "sk-...",
  "apiEndpoint": "https://api.openai.com/v1",
  "provider": "openai"
}
```

**Response**:
```json
{
  "models": [
    { "id": "gpt-4o", "name": "gpt-4o" },
    { "id": "gpt-4o-mini", "name": "gpt-4o-mini" }
  ]
}
```

**Provider-specific behavior**:
- Anthropic: returns hardcoded model list (Claude Sonnet 4, Claude 3.5 Sonnet, etc.)
- OpenAI/DeepSeek/Custom: fetches from `{endpoint}/models` and filters out embedding/TTS/whisper/moderation/dall-e models
- Empty array returned on any error (never crashes)

### `POST /api/optimize`
Main optimization endpoint.

**Request**:
```json
{
  "prompt": "Write a draft story about...",
  "apiKey": "sk-...",
  "model": "gpt-4o",
  "provider": "openai",
  "apiEndpoint": "https://api.openai.com/v1",
  "persona": "Standard Prompt Engineer: You are an expert...",
  "customInstructions": "Keep it short"
}
```

**Validation**:
- `prompt` required, max 5000 chars
- `persona` max 2000 chars
- `customInstructions` max 1000 chars
- Model validated against known patterns unless it's "gpt-4o"
- Endpoint validated against allowed list (or custom HTTPS endpoints)

**Response** (successful):
```json
{
  "optimized_prompt": "Here is the optimized prompt...",
  "improvements": ["Added role definition", "Structured output format"],
  "key_changes": ["Structure Optimization", "Language Refinement"],
  "confidence_score": 95,
  "prompt_type": "Coding"
}
```

**Error responses**:
- 400: validation_error (invalid input, bad endpoint, bad model)
- 401: apiKey_missing (opens BYOK dialog)
- 429: rate_limited (20 requests/minute)
- 500: server_error, schema_error, json_parse_error, api_error

**Security measures**:
- Rate limiting: 20 requests/minute per IP
- Endpoint allowlisting: only api.openai.com, api.deepseek.com, api.anthropic.com + custom HTTPS
- SSRF protection: blocks private IPs, localhost in production, internal hostnames
- Control sequence sanitization on persona/instructions text
- API key redaction in all log output (26 provider-specific regex patterns)
- Request timeout: 30 seconds

---

## 8. Supported AI Providers

| Provider | Endpoint | API Format | Key Pattern |
|----------|----------|------------|-------------|
| OpenAI | api.openai.com/v1 | OpenAI | `sk-proj-*`, `sk-org-*`, `sk-*` |
| DeepSeek | api.deepseek.com/v1 | OpenAI | (standard) |
| Anthropic | api.anthropic.com/v1 | Anthropic (messages API) | `sk-ant-*` |
| Custom | User-provided URL | OpenAI-compatible | Any |

The server auto-detects provider from endpoint URL if not explicitly specified.

---

## 9. Design System — "Shaders"

Dark-first design system. No light mode toggle — always dark.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--canvas` / `--background` | `#141416` | Page background |
| `--surface` / `--card` | `#1a1a1b` | Card/panel backgrounds |
| `--ink` / `--foreground` | `#e6e9fa` | Primary text |
| `--steel` / `--muted` | `#697088` | Secondary text |
| `--steel-bright` | `#81879c` | Tertiary text |
| `--accent` / `--primary` | `#6bdfff` | Brand cyan (CTAs, links, highlights) |
| `--accent-hover` | `#87f3ff` | Hover state for accent |
| `--secondary-accent` | `#ffcb6b` | Golden yellow (rare, decorative) |
| `--error` / `--destructive` | `#ff6b6b` | Error states, destructive actions |
| `--whisper` | `rgba(255,255,255,0.06)` | Subtle borders, dividers |
| `--edges` / `--border` | `#202129` | Borders, input outlines |
| `--hover` | `rgba(107,223,255,0.08)` | Hover background tint |

### Typography

| Token | Font | Usage |
|-------|------|-------|
| `--font-sans` | Geist Variable | Body text, UI labels |
| `--font-display` | Albert Sans Variable | Headings, card titles |
| `--font-mono` | Space Mono | Code, scores, timestamps, badges |

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-card` | `0 4px 12px rgba(0,0,0,0.15)` |
| `--shadow-elevated` | `0 12px 32px rgba(0,0,0,0.2)` |

### Dark Mode Init

`public/theme-init.js` runs before React mounts:
- Checks `localStorage.getItem("theme")`
- Falls back to `prefers-color-scheme: dark` media query
- Adds `dark` class to `<html>` if dark mode is preferred
- Currently always applies dark — Shaders is dark-first

### Animation

- `useReducedMotion()` hook respects `prefers-reduced-motion: reduce` OS setting
- `motionConfig.shouldAnimate()` also checks `navigator.hardwareConcurrency <= 4` for low-end devices
- All tab transitions use `AnimatePresence` with spring physics (stiffness: 300, damping: 30)
- Staggered entry on card grids: `staggerChildren: 0.06`, `delayChildren: 0.08`
- Scroll progress bar (fixed top, `ScrollProgress.tsx`) uses `useSpring` for smooth tracking
- Loading shimmer on optimization: `skeleton-shimmer` CSS class
- Model marquee: infinite horizontal scroll animation (30s linear loop)
- `transition-[background,color]` not `transition-all` (scoped transitions)

---

## 10. Component Inventory

### Top-Level (App.tsx)

| Component | Purpose | Key IDs |
|-----------|---------|---------|
| `ScrollProgress` | Fixed scroll indicator bar | N/A (decorative) |
| `Toaster` (sonner) | Toast notifications | theme="dark", position="top-right" |
| Header (sticky) | Logo, nav tabs, API button, mobile menu | `key-settings-btn`, `mobile-menu-trigger` |
| Announcement Bar | Privacy notice strip | N/A |
| Tab: Workspace | Main optimize interface | `prompt-input`, `run-optimize-btn`, `persona-role`, `model-select`, `custom-instructions` |
| Tab: Templates | Template gallery with filters | Category filter buttons, search input |
| Tab: Personas | Persona CRUD + grid | `persona-name`, `persona-desc`, `persona-prompt` |
| Tab: History | Optimization logs | Export buttons, clear button |
| Tab: About | Static info | GitHub link |
| Footer | Navigation links, copyright | Buy Me a Coffee link |

### Dialogs

| Dialog | Component | Trigger |
|--------|-----------|---------|
| BYOK Settings | `ByokDialog` | API button click or missing key |
| History Detail | `HistoryDetailDialog` | Click any history card |
| Share Import | `ImportShareDialog` | Navigating to `/?share=...` URL |
| Clear History Confirmation | AlertDialog (inline) | "Clear" button in History tab |

---

## 11. Preset Data

### 5 Preset Personas

| ID | Name | Focus |
|----|------|-------|
| p1 | Standard Prompt Engineer | Default, structured logical prompting |
| p2 | Technical Software Architect | Code quality, debugging, API design |
| p3 | SaaS Copywriter & Growth Marketer | Conversion copy, hooks, landing pages |
| p4 | Creative Content Director | Storytelling, video scripts, metaphors |
| p5 | Academic Researcher & Analyst | Systematic reviews, data analysis |

### 6 Preset Templates

| Name | Category | Purpose |
|------|----------|---------|
| Code Refactoring Architect | Coding | Refactor messy code |
| Direct Copywriter Generator | Marketing | PAS framework sales copy |
| Intelligent PDF Summarizer | Analysis | Extract insights from papers |
| Interactive Language Coach | Education | Language practice roleplay |
| SaaS Product Spec Creator | Product | PRD with user stories |
| B2B Outreach Email | Sales | Personalized cold emails |

---

## 12. Share System

### Encoding
1. Create payload: `{ type, version: 1, data }`
2. JSON stringify → compress with `lz-string` `compressToEncodedURIComponent`
3. Result appended to URL: `/?share={compressed}`

### Decoding (on page load)
1. Extract `share` query parameter
2. Decompress with `lz-string`
3. Parse JSON, validate version (must be ≤ 1)
4. Validate type (`template` or `persona`)
5. Validate required fields exist
6. Validate length limits (name: 100, description: 500, prompt: 10000)
7. Sanitize (trim whitespace)
8. Show import dialog → user confirms

### Max URL Length
2000 characters — if exceeded, shows error "Content too large to share via URL"

---

## 13. Security Features

### Content Security Policy (CSP)
- **Production**: strict CSP — `'self'` only, no unsafe-inline/eval
- **Development**: relaxed CSP — adds `'unsafe-inline'`, `'unsafe-eval'`, `ws://localhost:*`, `wss://localhost:*` for Vite HMR
- Additional hardening: `objectSrc: 'none'`, `baseUri: 'self'`, `frameAncestors: 'none'`

### Rate Limiting
- 20 requests per minute per IP on `/api/optimize` and `/api/models`
- Returns `429` with `{ error: "rate_limited" }` message

### SSRF Protection
- Custom endpoints must be HTTPS (except localhost in dev)
- Blocks private IPs (10.x, 172.16-31.x, 192.168.x, 169.254.x)
- Blocks internal hostnames (.internal, .local)
- Production: localhost endpoints blocked entirely

### API Key Redaction
- 26 regex patterns covering 25+ providers
- All keys redacted in server logs (`sanitizeForLog`)
- Covers: OpenAI (sk-proj-, sk-org-, sk-), Anthropic (sk-ant-), OpenRouter, NVIDIA NIM, xAI, Cohere, Groq, Replicate, Fireworks, Perplexity, Anyscale, OctoAI, Lepton, Novita, Predibase, Baseten, Modal, Google AI, Pinecone, Voyage, Jina, Hugging Face, Bearer tokens

### Other
- Helmet security headers
- CORS configuration (APP_URL env var)
- JSON body limit: 50kb
- Input sanitization (control sequences stripped from persona/instructions)
- Request IDs for log tracing
- 30-second fetch timeout on upstream API calls

---

## 14. Error Handling Patterns

### Frontend
- All localStorage reads wrapped in `safeLocalStorageGet` / `safeLocalStorageJsonGet` with try/catch
- `navigator.clipboard.writeText` has fallback: "Clipboard access denied. Please copy manually."
- Toast notifications for every user-facing error
- BYOK dialog auto-opens when API key is missing (401 response)
- `modelFetchSeq` ref prevents stale model responses from overwriting newer ones

### Backend
- All API routes wrapped in try/catch with `sanitizeForLog`
- Structured error responses: `{ error, code, message }`
- Model validation: known patterns (gpt-, o\d, claude-, deepseek-, etc.) + generic alphanumeric check
- Endpoint validation: allowlist for known providers + HTTPS enforcement for custom

---

## 15. Responsive Design

### Breakpoints
- **Mobile**: < 768px (single column, hamburger menu)
- **Tablet/Desktop**: ≥ 768px (two-column layout, inline nav)

### Mobile-Specific
- Hamburger menu (`md:hidden`) replaces tab bar
- Cards stack vertically (`grid-cols-1`)
- Tab content uses full width
- Dialog widths: `sm:max-w-md`, `sm:max-w-4xl` (responsive)
- Header height: `h-14` mobile → `h-16` desktop

### Desktop-Specific
- Tab bar inline in header (`hidden md:flex`)
- Optimizer tab: left/right column split (`flex-col lg:flex-row`)
- Templates grid: 2 columns (`md:grid-cols-2`)
- Personas grid: 2 columns (`md:grid-cols-2`)
- History: side-by-side comparison (`md:grid-cols-2`)

---

## 16. Key Element Selectors (for TestSprite)

### Navigation
- `[id="tab-optimizer"]` — Workspace tab button (desktop)
- `[id="tab-templates"]` — Templates tab button (desktop)
- `[id="tab-personas"]` — Personas tab button (desktop)
- `[id="tab-history"]` — History tab button (desktop)
- `[id="tab-about"]` — About tab button (desktop)
- `[id="mobile-menu-trigger"]` — Hamburger menu (mobile)

### Workspace
- `[id="prompt-input"]` — Main textarea
- `[id="run-optimize-btn"]` — Optimize button
- `[id="persona-role"]` — Persona selector dropdown
- `[id="model-select"]` — Model selector dropdown
- `[id="custom-instructions"]` — Additional instructions input
- `text=Optimize Prompt` — Button text
- `text=Reset` — Reset workspace button

### BYOK Dialog
- `[id="key-settings-btn"]` — Open BYOK dialog (header)
- Provider grid buttons: OpenAI, DeepSeek, Anthropic, Custom
- API Key input field
- Endpoint URL input field
- Custom model input field
- "Save Configuration" button
- "Get API Key →" link per provider

### Templates Tab
- Category filter buttons: All, Coding, Marketing, Analysis, Sales, Education
- Search input: `placeholder="Search curated prompts..."`
- Template cards with "Share" and "Load into Workspace →" buttons

### Personas Tab
- Persona form inputs: `[id="persona-name"]`, `[id="persona-desc"]`, `[id="persona-prompt"]`
- "Create Persona" / "Save Updates" submit button
- Persona cards with "Adopt Persona" button, gear (edit), trash (delete), share buttons
- Search input: `placeholder="Keyword filter..."`

### History Tab
- History cards (click to open detail dialog)
- Export buttons: "JSON" and "MD"
- "Clear" button → confirmation dialog

### Result Area (after optimization)
- Confidence score display
- Structural improvements grid
- Applied architectures badges
- "Copy Prompt" / "MD" / "JSON" toolbar buttons
- Engineered prompt text area (monospace, scrollable)

---

## 17. Testing Priorities

### Critical Path (must work)
1. App loads without errors (check console)
2. Dark theme renders correctly (dark background, light text)
3. Tab navigation works (all 5 tabs accessible)
4. BYOK dialog opens and saves configuration
5. Model dropdown populates after BYOK setup
6. Prompt input accepts text (max 5000 chars enforced)
7. Optimize button triggers API call
8. Loading state shows during optimization
9. Result displays with all sections (prompt type, score, improvements, output)
10. Copy buttons work (clipboard API)

### Secondary Path
11. Template gallery loads and filters work
12. Template loads into workspace on click
13. Share template generates valid URL
14. Persona create/edit/delete works
15. Persona adopt sets active persona
16. History records optimization results
17. History export (JSON/MD) downloads files
18. History clear with confirmation works
19. Share import from URL works

### Edge Cases
20. Empty prompt submission shows warning toast
21. Missing API key opens BYOK dialog
22. Rate limiting returns 429 after 20 requests
23. Invalid share URL shows error toast
24. localStorage full shows warning toast
25. Mobile menu opens/closes correctly
26. Keyboard navigation (Ctrl+Enter, arrow keys in nav)

---

## 18. Environment Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | (unset = dev) | `"production"` enables strict CSP |
| `BIND_HOST` | `127.0.0.1` | Server bind address |
| `APP_URL` | (none) | CORS origin for production |
| `OPENAI_API_KEY` | (none) | Server-side fallback key |
| `DEEPSEEK_API_KEY` | (none) | Server-side fallback key |
| `ANTHROPIC_API_KEY` | (none) | Server-side fallback key |

---

## 19. Build & Verification Commands

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build (vite build + esbuild)
npm run lint       # Type check (tsc --noEmit)
npm test           # (not configured — no test runner)
```

### Health Check
```bash
curl http://localhost:3000/api/health
# → { "status": "ok", "mode": "production" }
```

---

## 20. Known Limitations

1. **No server-side tests** — no test runner configured
2. **No light mode** — Shaders is dark-only, `theme-init.js` always applies dark
3. **Single-page, no deep linking** — tab state is in-memory, not URL-persisted (except share URLs)
4. **Max 100 history items** — oldest trimmed automatically
5. **5000 char prompt limit** — enforced both client and server side
6. **No real-time streaming** — optimization is request/response, not SSE/WebSocket
7. **Model list depends on provider** — some providers return empty lists
8. **Custom endpoint validation is HTTPS-only** — no localhost in production, no HTTP
