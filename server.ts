import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health probe
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "production" });
});

// API: Optimizer core
app.post("/api/optimize", async (req, res) => {
  try {
    const { prompt, apiKey, model, apiEndpoint, persona, customInstructions } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({ error: "A valid prompt is required." });
    }

    const activeEndpoint = apiEndpoint?.trim() || "";

    // Secure key handling
    let activeKey = apiKey?.trim();
    if (!activeKey) {
      activeKey = process.env.OPENAI_API_KEY;
    }

    if (!activeKey || activeKey === "MY_OPENAI_API_KEY") {
      return res.status(401).json({
        error: "apiKey_missing",
        message: "No API Key configuration found. OpenPrompter operates in BYOK (Bring Your Own Key) mode. Please click the Settings icon in the top right to supply your API key.",
      });
    }

    const chosenModel = model || "gpt-4o";

    // System instruction including the core prompt engineer optimization mandates
    let baseInstruction = `Act as an expert Prompt Engineer. Your task is to optimize the user's prompt according to the following structured instructions. Follow each step precisely and confirm your actions in your response.

Section 1: Structure Optimization
Restructure the prompt into clear, logical sections (e.g. Role, Context, Task, Constraints, Expected Output, Output Format).

Section 2: Language Refinement
Refine the language, make the intent precise, remove vague phrases, and ensure tone and style are executive-level professional.

Section 3: Concrete Output Specification
Identify any unclear requests in the original prompt. Transform vague requests into concrete, structured, actionable instructions.`;

    if (persona) {
      baseInstruction += `\n\nPersona/Role constraints to adopt: ${persona}`;
    }

    if (customInstructions) {
      baseInstruction += `\n\nAdditional custom mandates to follow: ${customInstructions}`;
    }

    const baseUrl = activeEndpoint || "https://api.openai.com/v1";
    const endpointUrl = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

    // Embed formatting instructions directly into system prompt for robust JSON parsing
    const systemPrompt = `${baseInstruction}

You MUST return your response as a valid, parsable JSON object matching this schema EXCLUSIVELY:
{
  "optimized_prompt": "string: The beautifully restructured, professional, polished prompt with optimal prompt engineering, Role, Task, Context, constraints and output formats.",
  "improvements": ["string array of 3-5 specific details of what modifications were done and why, formatted as simple statements."],
  "confidence_score": 95,
  "prompt_type": "string: The categorized genre of the prompt, e.g., Coding, Writing, Analysis, Roleplay, General.",
  "key_changes": ["string array of 3-4 sections engineered (such as Structure, Language, Persona Shift)."]
}`;

    const requestBody: any = {
      model: chosenModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${activeKey}`
    };

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `OpenAI API Error (${response.status}): ${errorText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        // use raw text
      }
      return res.status(response.status).json({ error: "api_error", message: errorMessage });
    }

    const resData: any = await response.json();
    const content = resData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No text content returned from the custom endpoint choices.");
    }

    let cookedText = content.trim();
    if (cookedText.startsWith("```json")) {
      cookedText = cookedText.substring(7);
    }
    if (cookedText.endsWith("```")) {
      cookedText = cookedText.substring(0, cookedText.length - 3);
    }
    cookedText = cookedText.trim();
    
    try {
      const parsedData = JSON.parse(cookedText);
      return res.json(parsedData);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", cookedText);
      return res.status(500).json({ error: "json_parse_error", message: "Failed to parse API response as JSON.", raw_response: cookedText });
    }

  } catch (error: any) {
    console.error("Endpoint error:", error);
    return res.status(500).json({
      error: "server_generation_error",
      message: error.message || "An unexpected error occurred during prompt optimization.",
    });
  }
});

// Start integration server
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OpenPrompter server running on http://localhost:${PORT}`);
  });
}

run();
