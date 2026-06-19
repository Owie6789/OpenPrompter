import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

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
