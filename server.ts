import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { execSync } from "child_process";
import { existsSync } from "fs";

dotenv.config();
// Also load .env.local (local overrides, gitignored)
if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

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
<link rel="preconnect" href="https://fonts.googleapis.com">
<style>
:root{--bg:#f5f5f4;--surface:#fff;--ink:#0c0a09;--steel:#57534e;--muted:#a8a29e;--whisper:rgba(214,211,209,0.5);--accent:#2563eb;--accent-hover:#1d4ed8;--radius:1.25rem;--font:'Geist Variable',system-ui,-apple-system,sans-serif;--mono:'Geist Mono','SF Mono',monospace}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--ink);padding:1.5rem;max-width:1024px;margin:0 auto;min-height:100dvh}
h1{font-size:1.25rem;font-weight:700;margin-bottom:1.5rem;display:flex;gap:.75rem;align-items:center;text-wrap:balance}
.card{background:var(--surface);border:1px solid var(--whisper);border-radius:var(--radius);padding:1.5rem;margin-bottom:1rem}
.card h2{font-size:.8125rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--steel);margin-bottom:1rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem;margin-bottom:1rem}
.stat{background:var(--bg);border-radius:calc(var(--radius)*.6);padding:1rem}
.stat-label{font-size:.6875rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.25rem}
.stat-value{font-size:1.25rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.3}
.stat-value.small{font-size:.875rem}
.cmd-wrap{position:relative}
.cmd-row{display:flex;gap:.5rem}
.cmd-row input{flex:1;padding:.625rem .875rem;border:1px solid var(--whisper);border-radius:calc(var(--radius)*.5);font-family:var(--mono);font-size:.8125rem;outline:none;background:var(--surface);color:var(--ink);transition:border-color .15s}
.cmd-row input:focus{border-color:var(--accent)}
.cmd-row button{padding:.625rem 1.25rem;background:var(--accent);color:#fff;border:none;border-radius:calc(var(--radius)*.5);font-size:.8125rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .15s}
.cmd-row button:hover{background:var(--accent-hover)}
.cmd-hint{font-size:.6875rem;color:var(--muted);margin-top:.5rem;font-family:var(--mono)}
#output{display:none;margin-top:.75rem;border-radius:calc(var(--radius)*.5);max-height:60vh;overflow:auto}
pre#output{font-family:var(--mono);font-size:.75rem;background:#1a1a2e;color:#e4e4e7;padding:1rem;line-height:1.6}
#output .error-row{color:#f87171}
#output .stderr{color:#fbbf24;opacity:.8}
.history-item{padding:.375rem .5rem;font-family:var(--mono);font-size:.75rem;color:var(--steel);cursor:pointer;border-radius:.375rem;transition:background .1s}
.history-item:hover{background:var(--bg)}
.muted{color:var(--muted);font-size:.75rem}
</style></head><body>
<h1>
<svg width="24" height="24" viewBox="0 0 256 256" fill="none"><path d="M128 32a96 96 0 1 0 96 96 96 96 0 0 0-96-96zm-8 144V80l56 48z" fill="var(--accent)"/></svg>
OpenPrompter Admin
<span class="muted" id="hostname"></span>
</h1>
<div class="grid" id="statsGrid">
<div class="stat"><div class="stat-label">Uptime</div><div class="stat-value" id="uptime">-</div></div>
<div class="stat"><div class="stat-label">Memory</div><div class="stat-value" id="memory">-</div></div>
<div class="stat"><div class="stat-label">Node</div><div class="stat-value small" id="nodever">-</div></div>
<div class="stat"><div class="stat-label">Platform</div><div class="stat-value small" id="platform">-</div></div>
</div>
<div class="card">
<h2>Shell</h2>
<div class="cmd-row">
<input id="cmdInput" spellcheck="false" autocomplete="off" placeholder="ls -la /app" value="ls -la /app">
<button id="runBtn">Run</button>
</div>
<div class="cmd-hint">Enter to run · ↑↓ for history · Ctrl+L to clear</div>
<pre id="output"></pre>
</div>
<div class="card" id="historyCard" style="display:none">
<h2>History</h2>
<div id="historyList"></div>
</div>
<script>
const TOKEN = '${token}';let CMD_HISTORY = JSON.parse(sessionStorage.getItem('op_cmd_history')||'[]');let HIST_IDX = -1;
document.getElementById('cmdInput').addEventListener('keydown',e=>{if(e.key==='Enter'){exec()}else if(e.key==='ArrowUp'){e.preventDefault();if(HIST_IDX<CMD_HISTORY.length-1){HIST_IDX++;document.getElementById('cmdInput').value=CMD_HISTORY[CMD_HISTORY.length-1-HIST_IDX]}}else if(e.key==='ArrowDown'){e.preventDefault();if(HIST_IDX>0){HIST_IDX--;document.getElementById('cmdInput').value=CMD_HISTORY[CMD_HISTORY.length-1-HIST_IDX]}else{HIST_IDX=-1;document.getElementById('cmdInput').value=''}}else if(e.key==='l'&&(e.ctrlKey||e.metaKey)){e.preventDefault();document.getElementById('output').style.display='none';document.getElementById('output').textContent=''}});
document.getElementById('runBtn').addEventListener('click',exec);
async function exec(){const inp=document.getElementById('cmdInput');const c=inp.value.trim();if(!c)return;const o=document.getElementById('output');o.style.display='block';o.textContent='$ '+c+'\\nRunning...';document.getElementById('runBtn').disabled=true;try{const r=await fetch('/api/admin/exec?token='+TOKEN,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:c})});const d=await r.json();if(d.error){o.textContent='$ '+c+'\\n\\nError: '+d.error;o.style.color='#f87171'}else{let txt='$ '+c+'\\n';if(d.stdout)txt+=d.stdout;if(d.stderr)txt+='\\nstderr:\\n'+d.stderr;if(!d.stdout&&!d.stderr)txt+='(empty output)';o.textContent=txt;o.style.color='#e4e4e7'}}catch(e){o.textContent='$ '+c+'\\n\\nRequest failed: '+e.message}finally{document.getElementById('runBtn').disabled=false}
CMD_HISTORY.push(c);if(CMD_HISTORY.length>50)CMD_HISTORY.shift();sessionStorage.setItem('op_cmd_history',JSON.stringify(CMD_HISTORY));HIST_IDX=-1;renderHistory()}
function renderHistory(){const h=document.getElementById('historyList');const card=document.getElementById('historyCard');if(!CMD_HISTORY.length){card.style.display='none';return}card.style.display='block';h.innerHTML=CMD_HISTORY.slice().reverse().slice(0,20).map((c,i)=>'<div class="history-item" onclick="fillCmd(\\''+c.replace(/'/g,"\\'")+'\\')">'+(i+1)+'. '+escapeHtml(c)+'</div>').join('')}
function fillCmd(c){document.getElementById('cmdInput').value=c}
function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
async function stats(){try{const r=await fetch('/api/admin/stats?token='+TOKEN);const d=await r.json();if(d.uptime!==undefined){document.getElementById('uptime').textContent=Math.floor(d.uptime/86400)+'d '+Math.floor((d.uptime%86400)/3600)+'h '+Math.floor((d.uptime%3600)/60)+'m';document.getElementById('memory').textContent=Math.round(d.memory/1024/1024)+' MB';document.getElementById('nodever').textContent=d.node;document.getElementById('platform').textContent=d.platform||'?';document.getElementById('hostname').textContent=d.hostname?'@'+d.hostname:''}}catch(e){}}
stats();setInterval(stats,10000);renderHistory();
</script></body></html>`);
});

// API: Admin command exec (captures stdout + stderr separately)
app.post("/api/admin/exec", express.json(), (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(401).json({ error: "unauthorized" });
  try {
    const cmd = (req.body?.cmd || "").trim();
    if (!cmd) return res.status(400).json({ error: "no command" });
    const stdout = execSync(cmd, { timeout: 10000, encoding: "utf-8", maxBuffer: 1024 * 1024 });
    return res.json({ stdout: stdout.trim(), stderr: "" });
  } catch (e: any) {
    return res.json({
      stdout: e.stdout?.toString().trim() || "",
      stderr: e.stderr?.toString().trim() || e.message,
    });
  }
});

// API: Admin stats (enhanced)
app.get("/api/admin/stats", (req, res) => {
  if (req.query.token !== ADMIN_TOKEN) return res.status(401).json({ error: "unauthorized" });
  const mem = process.memoryUsage().rss;
  const uptime = process.uptime();
  const node = process.version;
  const platform = process.platform + " " + process.arch;
  let hostname = "?";
  let procs = "?";
  try { hostname = execSync("hostname", { encoding: "utf-8" }).trim(); } catch {}
  try { procs = execSync("ps aux --no-headers 2>/dev/null | wc -l || echo ?", { encoding: "utf-8" }).trim(); } catch {}
  res.json({ uptime, memory: mem, node, procs, platform, hostname });
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
