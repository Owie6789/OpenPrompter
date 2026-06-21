import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();
if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}

const app = express();
const rawPort = process.env.PORT ?? "3000";
const parsedPort = Number.parseInt(rawPort, 10);
if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
  throw new Error(`Invalid PORT value "${rawPort}". Expected an integer from 0 to 65535.`);
}
const PORT = parsedPort;

// Security middleware stack
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
    },
  },
}));
const configuredOrigins = process.env.APP_URL
  ? process.env.APP_URL.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

const corsOrigin = process.env.NODE_ENV === "production"
  ? configuredOrigins.length > 0
    ? configuredOrigins
    : (() => { throw new Error("APP_URL must be configured in production for CORS."); })()
  : configuredOrigins.length > 0
    ? configuredOrigins
    : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "50kb" }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limited", message: "Too many requests. Please try again later." },
});
app.use("/api/optimize", apiLimiter);
app.use("/api/models", apiLimiter);

type ProviderConfig = {
  label: string;
  defaultEndpoint: string;
  apiFormat: "openai" | "anthropic";
};

const PROVIDERS: Record<string, ProviderConfig> = {
  openai:    { label: "OpenAI",    defaultEndpoint: "https://api.openai.com/v1",         apiFormat: "openai" },
  deepseek:  { label: "DeepSeek",  defaultEndpoint: "https://api.deepseek.com/v1",       apiFormat: "openai" },
  anthropic: { label: "Anthropic", defaultEndpoint: "https://api.anthropic.com/v1",      apiFormat: "anthropic" },
  custom:    { label: "Custom",    defaultEndpoint: "",                                   apiFormat: "openai" },
};

// Known model ID patterns for validation
const KNOWN_MODEL_PATTERNS = [
  /^gpt-/,
  /^o\d/,
  /^claude-/,
  /^deepseek-/,
  /^dbrx/,
  /^llama/,
  /^mistral/,
  /^mixtral/,
  /^gemini/,
  /^command-/,
];

const ALLOWED_ENDPOINTS = [
  "api.openai.com",
  "api.deepseek.com",
  "api.anthropic.com",
];

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(?:1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
];

const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[::1\]$/,
  /\.internal$/i,
  /\.local$/i,
];

function assertSafeEndpoint(url: string, prov: string): void {
  if (!url) return;
  const parsed = new URL(url);
  if (prov === "custom") {
    const isLocalhost =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";

    if (isLocalhost) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Localhost endpoints are not allowed in production.");
      }
      return;
    }

    if (parsed.protocol !== "https:") {
      throw new Error("Only HTTPS endpoints are allowed.");
    }

    // Block private/link-local hostnames
    if (PRIVATE_HOSTNAME_PATTERNS.some((p) => p.test(parsed.hostname))) {
      throw new Error("Custom endpoints cannot point to private or internal addresses.");
    }
    return;
  }
  const allowed = ALLOWED_ENDPOINTS.some((h) => parsed.hostname.endsWith(h));
  if (!allowed) {
    throw new Error("Endpoint not permitted.");
  }
}

function isValidModel(model: string): boolean {
  return KNOWN_MODEL_PATTERNS.some((re) => re.test(model)) || /^\w+(?:\/[\w.:-]+)?$/.test(model);
}

function sanitizeControlSequences(text: string): string {
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
}

function resolveProvider(endpoint: string): ProviderConfig {
  if (!endpoint) return PROVIDERS.custom;
  const e = endpoint.toLowerCase();
  if (e.includes("deepseek")) return PROVIDERS.deepseek;
  if (e.includes("anthropic")) return PROVIDERS.anthropic;
  if (e.includes("openai")) return PROVIDERS.openai;
  return PROVIDERS.custom;
}

// Generate a simple request ID
function requestId(): string {
  try {
    return `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }): Promise<Response> {
  const timeout = options.timeout ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// Standardised error response format
interface ErrorResponse {
  error: string;
  code: string;
  details?: object;
}

function errorResponse(code: string, message: string, details?: object): ErrorResponse {
  return { error: message, code, ...(details ? { details } : {}) };
}

// API: Health probe
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "production" });
});

// API: Fetch available models from provider
app.post("/api/models", async (req, res) => {
  const rid = requestId();
  try {
    const { apiKey, apiEndpoint, provider } = req.body;

    if (!apiKey || typeof apiKey !== "string") {
      return res.json({ models: [] });
    }

    const endpoint = (apiEndpoint || "").trim();
    const prov = provider || resolveProvider(endpoint).label.toLowerCase();
    const cfg = PROVIDERS[prov] || PROVIDERS.openai;

    try {
      assertSafeEndpoint(endpoint, prov);
    } catch {
      return res.json({ models: [] });
    }

    const baseUrl = endpoint || cfg.defaultEndpoint;

    let activeKey = (apiKey || "").trim();
    if (!activeKey && prov === "openai") activeKey = process.env.OPENAI_API_KEY || "";
    if (!activeKey && prov === "deepseek") activeKey = process.env.DEEPSEEK_API_KEY || "";
    if (!activeKey && prov === "anthropic") activeKey = process.env.ANTHROPIC_API_KEY || "";

    if (!activeKey) {
      return res.json({ models: [] });
    }

    let modelList: { id: string; name: string }[] = [];

    if (cfg.apiFormat === "anthropic") {
      modelList = [
        { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
        { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
      ];
    } else {
      const modelsUrl = `${baseUrl.replace(/\/$/, "")}/models`;
      const resp = await fetchWithTimeout(modelsUrl, {
        headers: { Authorization: `Bearer ${activeKey}` },
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const models: any[] = data.data || data.models || [];
        modelList = models
          .filter((m: any) => {
            const id = (m.id || m.name || "").toLowerCase();
            if (id.includes("embedding") || id.includes("tts") || id.includes("whisper") || id.includes("moderation") || id.includes("dall-e") || id.includes("davinci") || id.includes("babbage") || id.includes("curie")) return false;
            return true;
          })
          .map((m: any) => ({
            id: m.id || m.name || m,
            name: m.id || m.name || m,
          }))
          .slice(0, 50);
      }
    }

    return res.json({ models: modelList });
  } catch (error: any) {
    console.error(`[${rid}] Models fetch error:`, error);
    return res.json({ models: [] });
  }
});

// LLM response schema
interface LlmResponse {
  optimized_prompt: string;
  improvements: string[];
  key_changes: string[];
  confidence_score: number;
  prompt_type: string;
}

function validateLlmResponse(data: unknown): data is LlmResponse {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.optimized_prompt === "string" &&
    Array.isArray(d.improvements) &&
    d.improvements.every((i: unknown) => typeof i === "string") &&
    Array.isArray(d.key_changes) &&
    d.key_changes.every((k: unknown) => typeof k === "string") &&
    typeof d.confidence_score === "number" &&
    d.confidence_score >= 0 &&
    d.confidence_score <= 100 &&
    typeof d.prompt_type === "string"
  );
}

function sanitizeLlmResponse(data: unknown): LlmResponse {
  const d = data as Record<string, unknown>;
  return {
    optimized_prompt: typeof d.optimized_prompt === "string" ? d.optimized_prompt : "",
    improvements: Array.isArray(d.improvements) ? d.improvements.map(String) : [],
    key_changes: Array.isArray(d.key_changes) ? d.key_changes.map(String) : [],
    confidence_score: typeof d.confidence_score === "number" ? Math.min(100, Math.max(0, d.confidence_score)) : 85,
    prompt_type: typeof d.prompt_type === "string" ? d.prompt_type : "General",
  };
}

function stripJsonFence(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    cleaned = firstNewline >= 0 ? cleaned.slice(firstNewline + 1) : cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

function sanitizeForLog(s: string, maxLen = 500): string {
  const ESC = String.fromCodePoint(27);
  // Redact API key patterns (sk-*, sk-ant-*, Bearer tokens, etc.)
  let clean = s
    .replace(/sk-[A-Za-z0-9]{20,}/g, "sk-...REDACTED")
    .replace(/sk-ant-[A-Za-z0-9]{20,}/g, "sk-ant-...REDACTED")
    .replace(/Bearer\s+[A-Za-z0-9\-_.]{20,}/gi, "Bearer ...REDACTED");
  return clean.replaceAll(ESC, " ").replace(/[\r\n\t]/g, " ").slice(0, maxLen);
}

// API: Optimizer core
app.post("/api/optimize", async (req, res) => {
  const rid = requestId();
  try {
    const { prompt, apiKey, model, apiEndpoint, provider, persona, customInstructions } = req.body;

    // Input validation
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json(errorResponse("validation_error", "A valid prompt is required."));
    }

    // Enforce length limits
    if (prompt.length > 5000) {
      return res.status(400).json(errorResponse("validation_error", "Prompt exceeds maximum length of 5000 characters."));
    }
    if (persona && typeof persona === "string" && persona.length > 2000) {
      return res.status(400).json(errorResponse("validation_error", "Persona constraints exceed maximum length of 2000 characters."));
    }
    if (customInstructions && typeof customInstructions === "string" && customInstructions.length > 1000) {
      return res.status(400).json(errorResponse("validation_error", "Custom instructions exceed maximum length of 1000 characters."));
    }

    const activeEndpoint = (apiEndpoint || "").trim();
    const prov = provider || resolveProvider(activeEndpoint).label.toLowerCase();
    const cfg = PROVIDERS[prov] || PROVIDERS.openai;

    // Validate endpoint
    try {
      assertSafeEndpoint(activeEndpoint, prov);
    } catch (e: any) {
      return res.status(400).json(errorResponse("validation_error", e.message));
    }

    // Validate model
    const chosenModel = model || "gpt-4o";
    if (chosenModel !== "gpt-4o" && !isValidModel(chosenModel)) {
      return res.status(400).json(errorResponse("validation_error", "Invalid model identifier."));
    }

    const baseUrl = activeEndpoint || cfg.defaultEndpoint;

    // Secure key handling
    let activeKey = (apiKey || "").trim();
    if (!activeKey) {
      if (prov === "openai") activeKey = process.env.OPENAI_API_KEY || "";
      else if (prov === "deepseek") activeKey = process.env.DEEPSEEK_API_KEY || "";
      else if (prov === "anthropic") activeKey = process.env.ANTHROPIC_API_KEY || "";
    }

    if (!activeKey) {
      return res.status(401).json({
        error: "apiKey_missing",
        code: "auth_required",
        message:
          "No API key configured. OpenPrompter runs in BYOK mode — click the Key icon (top-right) to supply your API key.",
      });
    }

    // System instruction for prompt engineering
    const baseInstruction = `Act as an expert Prompt Engineer. Your task is to optimize the user's prompt according to the following structured instructions. Follow each step precisely.

Section 1: Structure Optimization
Restructure the prompt into clear, logical sections (e.g. Role, Context, Task, Constraints, Expected Output, Output Format).

Section 2: Language Refinement
Refine the language, make the intent precise, remove vague phrases, and ensure tone and style are executive-level professional.

Section 3: Concrete Output Specification
Identify any unclear requests in the original prompt. Transform vague requests into concrete, structured, actionable instructions.`;

    let sysContent = baseInstruction;

    // Sanitize user-controlled content before injecting into system prompt
    if (persona && typeof persona === "string") {
      sysContent += `\n\nPersona/Role constraints to adopt: ${sanitizeControlSequences(persona)}`;
    }
    if (customInstructions && typeof customInstructions === "string") {
      sysContent += `\n\nAdditional custom mandates to follow: ${sanitizeControlSequences(customInstructions)}`;
    }

    const systemPrompt = `${sysContent}

You MUST return your response as a valid, parsable JSON object matching this schema EXCLUSIVELY:
{
  "optimized_prompt": "string: The beautifully restructured, professional, polished prompt.",
  "improvements": ["string array of 3-5 specific modifications and why."],
  "confidence_score": 95,
  "prompt_type": "string: e.g., Coding, Writing, Analysis, Roleplay, General.",
  "key_changes": ["string array of 3-4 sections engineered (Structure, Language, etc)."]
}`;

    if (cfg.apiFormat === "anthropic") {
      // Anthropic API format
      const endpointUrl = `${baseUrl.replace(/\/$/, "")}/messages`;
      const response = await fetchWithTimeout(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": activeKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: chosenModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${rid}] Anthropic API error: ${sanitizeForLog(errorText)}`);
        return res.status(response.status).json(errorResponse("api_error", "Upstream API error. Check your key and model."));
      }

      const resData: any = await response.json();
      const content = resData.content?.[0]?.text;
      if (!content) {
        throw new Error("No text content returned from Anthropic API.");
      }
      const cookedText = stripJsonFence(content);
      try {
        const parsedData = JSON.parse(cookedText);
        if (!validateLlmResponse(parsedData)) {
          console.error(`[${rid}] Schema validation failed: ${sanitizeForLog(cookedText, 200)}`);
          return res.status(500).json(errorResponse("schema_error", "LLM returned an unexpected response format."));
        }
        return res.json(sanitizeLlmResponse(parsedData));
      } catch {
        console.error(`[${rid}] Failed to parse JSON from Anthropic: ${sanitizeForLog(cookedText, 200)}`);
        return res.status(500).json(errorResponse("json_parse_error", "Failed to parse API response as JSON."));
      }
    } else {
      // OpenAI-compatible format
      const endpointUrl = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
      const requestBody: any = {
        model: chosenModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      };

      const response = await fetchWithTimeout(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${rid}] API error: ${sanitizeForLog(errorText)}`);
        return res.status(response.status).json(errorResponse("api_error", "Upstream API error. Check your key and model."));
      }

      const resData: any = await response.json();
      const content = resData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No text content returned from the API.");
      }

      const cookedText = stripJsonFence(content);

      try {
        const parsedData = JSON.parse(cookedText);
        if (!validateLlmResponse(parsedData)) {
          console.error(`[${rid}] Schema validation failed: ${sanitizeForLog(cookedText, 200)}`);
          return res.status(500).json(errorResponse("schema_error", "LLM returned an unexpected response format."));
        }
        return res.json(sanitizeLlmResponse(parsedData));
      } catch {
        console.error(`[${rid}] Failed to parse JSON: ${sanitizeForLog(cookedText, 200)}`);
        return res.status(500).json(errorResponse("json_parse_error", "Failed to parse API response as JSON."));
      }
    }
  } catch (error: any) {
    console.error(`[${rid}] Endpoint error: ${error?.message || error}`);
    return res.status(500).json(errorResponse("server_error", "An unexpected error occurred."));
  }
});

// Start server
async function run() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const BIND_HOST = process.env.BIND_HOST || "127.0.0.1";
  const server = app.listen(PORT, BIND_HOST, () => {
    const addr = server.address();
    const actualPort = addr && typeof addr === "object" ? addr.port : PORT;
    console.log(`OpenPrompter running on http://localhost:${actualPort}`);
  }).on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Another OpenPrompter instance may be running, or another process owns this port.`);
      console.error(`\n   Options:`);
      console.error(`   • Kill it:    npx kill-port ${PORT}  (or: lsof -ti:${PORT} | xargs kill -9)`);
      console.error(`   • Use another: PORT=${PORT + 1} npm run dev`);
      console.error(`   • Auto-find:  Set PORT=0 to let OS pick a free port\n`);
      process.exit(1);
    }
    throw err;
  });
}

run();
