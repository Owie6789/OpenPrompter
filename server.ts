import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

function resolveProvider(endpoint: string): ProviderConfig {
  if (!endpoint) return PROVIDERS.custom;
  const e = endpoint.toLowerCase();
  if (e.includes("deepseek")) return PROVIDERS.deepseek;
  if (e.includes("anthropic")) return PROVIDERS.anthropic;
  if (e.includes("openai")) return PROVIDERS.openai;
  return PROVIDERS.custom;
}

// API: Health probe
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "production" });
});

// API: Fetch available models from provider
app.post("/api/models", async (req, res) => {
  try {
    const { apiKey, apiEndpoint, provider } = req.body;
    const endpoint = (apiEndpoint || "").trim();
    const prov = provider || resolveProvider(endpoint).label.toLowerCase();
    const cfg = PROVIDERS[prov] || PROVIDERS.openai;
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
      // Anthropic doesn't have a public models endpoint — return known models
      modelList = [
        { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
        { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
      ];
    } else {
      const modelsUrl = `${baseUrl.replace(/\/$/, "")}/models`;
      const resp = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${activeKey}` },
      });
      if (resp.ok) {
        const data: any = await resp.json();
        // Filter to chat-capable models only
        const models: any[] = data.data || data.models || [];
        modelList = models
          .filter((m: any) => {
            const id = (m.id || m.name || "").toLowerCase();
            // Exclude non-chat models (embedding, tts, moderation, etc.)
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
    console.error("Models fetch error:", error);
    return res.json({ models: [] });
  }
});

// API: Optimizer core
app.post("/api/optimize", async (req, res) => {
  try {
    const { prompt, apiKey, model, apiEndpoint, provider, persona, customInstructions } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({ error: "A valid prompt is required." });
    }

    const activeEndpoint = (apiEndpoint || "").trim();
    const prov = provider || resolveProvider(activeEndpoint).label.toLowerCase();
    const cfg = PROVIDERS[prov] || PROVIDERS.openai;
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
        message:
          "No API key configured. OpenPrompter runs in BYOK mode — click the Key icon (top-right) to supply your API key.",
      });
    }

    const chosenModel = model || "gpt-4o";

    // System instruction for prompt engineering
    const baseInstruction = `Act as an expert Prompt Engineer. Your task is to optimize the user's prompt according to the following structured instructions. Follow each step precisely.

Section 1: Structure Optimization
Restructure the prompt into clear, logical sections (e.g. Role, Context, Task, Constraints, Expected Output, Output Format).

Section 2: Language Refinement
Refine the language, make the intent precise, remove vague phrases, and ensure tone and style are executive-level professional.

Section 3: Concrete Output Specification
Identify any unclear requests in the original prompt. Transform vague requests into concrete, structured, actionable instructions.`;

    let sysContent = baseInstruction;

    if (persona) {
      sysContent += `\n\nPersona/Role constraints to adopt: ${persona}`;
    }
    if (customInstructions) {
      sysContent += `\n\nAdditional custom mandates to follow: ${customInstructions}`;
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
      const response = await fetch(endpointUrl, {
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
        return res.status(response.status).json({ error: "api_error", message: errorText });
      }

      const resData: any = await response.json();
      const content = resData.content?.[0]?.text;
      if (!content) {
        throw new Error("No text content returned from Anthropic API.");
      }
      const cookedText = content.trim();
      try {
        const parsedData = JSON.parse(cookedText);
        return res.json(parsedData);
      } catch {
        console.error("Failed to parse JSON:", cookedText);
        return res.status(500).json({ error: "json_parse_error", message: "Failed to parse API response as JSON.", raw_response: cookedText });
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

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error (${response.status}): ${errorText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch { /* use raw text */ }
        return res.status(response.status).json({ error: "api_error", message: errorMessage });
      }

      const resData: any = await response.json();
      const content = resData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No text content returned from the API.");
      }

      let cookedText = content.trim();
      if (cookedText.startsWith("```json")) cookedText = cookedText.slice(7);
      if (cookedText.endsWith("```")) cookedText = cookedText.slice(0, -3);
      cookedText = cookedText.trim();

      try {
        const parsedData = JSON.parse(cookedText);
        return res.json(parsedData);
      } catch {
        console.error("Failed to parse JSON:", cookedText);
        return res.status(500).json({ error: "json_parse_error", message: "Failed to parse API response as JSON.", raw_response: cookedText });
      }
    }
  } catch (error: any) {
    console.error("Endpoint error:", error);
    return res.status(500).json({
      error: "server_generation_error",
      message: error.message || "An unexpected error occurred.",
    });
  }
});

// Admin dashboard — lightweight web shell
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin";

app.get("/admin", (req, res) => {
  const token = req.query.token as string;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).send("Unauthorized. Pass ?token= in URL");
  }
  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenPrompter Admin</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Geist,system-ui,sans-serif;background:#f5f5f4;color:#0c0a09;padding:2rem;max-width:960px;margin:0 auto}
h1{font-size:1.5rem;font-weight:700;margin-bottom:1rem;display:flex;gap:0.75rem;align-items:center}
.card{background:#fff;border:1px solid rgba(214,211,209,0.5);border-radius:1.25rem;padding:1.5rem;margin-bottom:1rem}
.card h2{font-size:0.9rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#57534e;margin-bottom:0.75rem}
pre{font-family:Geist Mono,monospace;font-size:0.8125rem;background:#f5f5f4;border-radius:0.75rem;padding:1rem;overflow-x:auto;line-height:1.5}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
.stat{padding:1rem;background:#f5f5f4;border-radius:0.75rem}
.stat-label{font-size:0.75rem;color:#a8a29e;text-transform:uppercase;letter-spacing:0.05em}
.stat-value{font-size:1.25rem;font-weight:700;margin-top:0.25rem;font-variant-numeric:tabular-nums}
.cmd-form{display:flex;gap:0.75rem;margin-bottom:1rem}
.cmd-form input{flex:1;padding:0.75rem 1rem;border:1px solid rgba(214,211,209,0.5);border-radius:0.75rem;font-family:Geist Mono,monospace;font-size:0.875rem;outline:none}
.cmd-form input:focus{border-color:#2563eb}
.cmd-form button{padding:0.75rem 1.5rem;background:#2563eb;color:#fff;border:none;border-radius:0.75rem;font-size:0.875rem;font-weight:600;cursor:pointer}
.cmd-form button:hover{background:#1d4ed8}
.error{color:#be123c}
#output{display:none}
</style></head><body>
<h1><svg width="28" height="28" viewBox="0 0 256 256" fill="none"><path d="M128 32a96 96 0 1 0 96 96 96 96 0 0 0-96-96zm-8 144V80l56 48z" fill="#2563eb"/></svg>OpenPrompter Admin</h1>
<div class="grid">
<div class="stat"><div class="stat-label">Uptime</div><div class="stat-value" id="uptime">-</div></div>
<div class="stat"><div class="stat-label">Memory</div><div class="stat-value" id="memory">-</div></div>
<div class="stat"><div class="stat-label">Node</div><div class="stat-value" id="nodever">-</div></div>
<div class="stat"><div class="stat-label">Processes</div><div class="stat-value" id="procs">-</div></div>
</div>
<div class="card">
<h2>Command Shell</h2>
<div class="cmd-form">
<input id="cmdInput" placeholder="ls -la /app" value="ls -la /app">
<button onclick="exec()">Run</button>
</div>
<pre id="output"></pre>
</div>
<script>
const TOKEN = '${token}';
async function exec(){const c=document.getElementById('cmdInput').value;const o=document.getElementById('output');o.style.display='block';o.textContent='Running...';o.className='';const r=await fetch('/api/admin/exec?token='+TOKEN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:c})});const d=await r.json();if(d.error){o.className='error';o.textContent=d.error}else{o.textContent=d.output||'(empty output)'}}
async function stats(){const r=await fetch('/api/admin/stats?token='+TOKEN);const d=await r.json();if(d.uptime!==undefined){document.getElementById('uptime').textContent=Math.floor(d.uptime/60)+'m '+Math.floor(d.uptime%60)+'s';document.getElementById('memory').textContent=Math.round(d.memory/1024/1024)+' MB';document.getElementById('nodever').textContent=d.node;document.getElementById('procs').textContent=d.procs}}
stats();setInterval(stats,5000);
</script></body></html>`);
});

// API: Admin command exec
app.post("/api/admin/exec", express.json(), (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(401).json({ error: "unauthorized" });
  try {
    const cmd = (req.body?.cmd || "").trim();
    if (!cmd) return res.status(400).json({ error: "no command" });
    const output = execSync(cmd, { timeout: 10000, encoding: "utf-8", maxBuffer: 1024 * 1024 });
    return res.json({ output: output.trim() });
  } catch (e: any) {
    return res.json({ output: e.stdout?.trim() || e.message });
  }
});

// API: Admin stats
app.get("/api/admin/stats", (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(401).json({ error: "unauthorized" });
  const mem = process.memoryUsage().rss;
  const uptime = process.uptime();
  const node = process.version;
  let procs = "?";
  try { procs = execSync("ps aux --no-headers | wc -l", { encoding: "utf-8" }).trim(); } catch {}
  res.json({ uptime, memory: mem, node, procs });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OpenPrompter running on http://localhost:${PORT}`);
  });
}

run();
