import React, { useState, useEffect, useRef } from "react";
import { Check, X, Coffee } from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ScrollProgress } from "@/src/components/ScrollProgress"
import { AppLayout } from "@/src/components/AppLayout";
import { AboutView } from "@/src/components/views/AboutView";
import { HistoryView } from "@/src/components/views/HistoryView";
import { PresetsView } from "@/src/components/views/PresetsView";
import { PersonasView } from "@/src/components/views/PersonasView";
import { WorkspaceView } from "@/src/components/views/WorkspaceView";

import { PRESET_PERSONAS } from "./data";
import {
  PromptHistoryItem,
  CustomPersona,
  PromptTemplate,
  OptimizationResult,
  TemplateShareData,
  PersonaShareData,
} from "./types";
import { generateShareUrl, decodeSharePayload, SharePayload } from "./lib/share";

import ByokDialog from "@/components/ByokDialog";
import HistoryDetailDialog from "@/components/HistoryDetailDialog";
import ImportShareDialog from "@/components/ImportShareDialog";

import loadingAsset from "@/assets/op-appasset-aigenerating-loadstate.png";


function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try { return JSON.parse(json) as T; }
  catch { return fallback; }
}

function safeLocalStorageJsonGet<T>(key: string, fallback: T): T {
  try {
    return safeJsonParse<T>(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function safeLocalStorageGet(key: string, fallback = ""): string {
  try { return localStorage.getItem(key) ?? fallback; }
  catch { return fallback; }
}

function generateId(prefix: string): string {
  try { return `${prefix}_${crypto.randomUUID().slice(0, 8)}`; }
  catch {
    const arr = new Uint32Array(2);
    globalThis.crypto.getRandomValues(arr);
    return `${prefix}_${arr[0].toString(36)}${arr[1].toString(36)}`.slice(0, prefix.length + 9);
  }
}

export default function App() {
  type TabType = "optimizer" | "templates" | "personas" | "history" | "about";

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("optimizer");

  // App core state
  const [promptInput, setPromptInput] = useState("");
  const [customInstructions, setCustomInstructions] = useState(() =>
    safeLocalStorageJsonGet("openprompter_custom_instructions", "")
  );
  const [selectedModel, setSelectedModel] = useState<string>(() =>
    safeLocalStorageJsonGet("openprompter_selected_model", "gpt-4o")
  );
  const [selectedPersona, setSelectedPersona] = useState<string>("p1"); // Ref to CustomPersona.id
  const [apiKey, setApiKey] = useState(() => safeLocalStorageGet("openprompter_byok_key"));

  // Local storage lists
  const [historyList, setHistoryList] = useState<PromptHistoryItem[]>(() =>
    safeLocalStorageJsonGet<PromptHistoryItem[]>("openprompter_prompt_history", [])
  );

  const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>(() =>
    safeLocalStorageJsonGet<CustomPersona[]>("openprompter_custom_personas", [])
  );

  // Optimization process states
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("Initializing...");
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);

  // Search queries
  const [templateSearch, setTemplateSearch] = useState("");
  const [personaSearch, setPersonaSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Persona creator editor
  const [editingPersona, setEditingPersona] = useState<CustomPersona | null>(
    null,
  );
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaDesc, setNewPersonaDescription] = useState("");
  const [newPersonaPrompt, setNewPersonaPrompt] = useState("");

  // Dialog & View State helpers
  const [apiEndpoint, setApiEndpoint] = useState(() => safeLocalStorageGet("openprompter_endpoint"));

  const [customModel, setCustomModel] = useState(() => safeLocalStorageGet("openprompter_custom_model"));

  const [activeProvider, setActiveProvider] = useState(() => safeLocalStorageGet("openprompter_provider", "custom"));

  // Sticky announcement bar — hide when footer is in view
  const footerRef = useRef<HTMLElement>(null);
  const [footerVisible, setFooterVisible] = useState(false);
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const [apiKeyInputVal, setApiKeyInputVal] = useState(apiKey);
  const [endpointInputVal, setEndpointInputVal] = useState(apiEndpoint);
  
  const [customModelInputVal, setCustomModelInputVal] = useState(customModel);
  const [providerInputVal, setProviderInputVal] = useState(activeProvider);

  const [showKeyDialog, setShowApiKeyDialog] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] =
    useState<PromptHistoryItem | null>(null);
  const [sharedLinkCopied, setSharedLinkCopied] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Share/Import state
  const [importData, setImportData] = useState<{
    type: "template";
    data: TemplateShareData;
  } | {
    type: "persona";
    data: PersonaShareData;
  } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Copy-state feedbacks
  const [copiedState, setCopiedState] = useState<
    "original" | "optimized" | "markdown" | "json" | null
  >(null);

  // Combine Presets + Custom lists
  const allPersonas = [...PRESET_PERSONAS, ...customPersonas];

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "openprompter_prompt_history",
        JSON.stringify(historyList.slice(0, 100)),
      );
    } catch {
      toast.warning("Storage limit reached — old history may not save.");
    }
  }, [historyList]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "openprompter_custom_personas",
        JSON.stringify(customPersonas),
      );
    } catch {
      toast.warning("Persona storage full — changes may not persist.");
    }
  }, [customPersonas]);

  // Persist selected model to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("openprompter_selected_model", selectedModel);
    } catch {
      // quota full — acceptable to skip
    }
  }, [selectedModel]);

  // Persist custom instructions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("openprompter_custom_instructions", customInstructions);
    } catch {
      // quota full — acceptable to skip
    }
  }, [customInstructions]);

  // Animate optimization step text during active optimization
  useEffect(() => {
    if (!isOptimizing) return;
    const steps = [
      "Analyzing input text quality...",
      "Deconstructing logical parts...",
      "Applying Section 1 Structure guidelines...",
      "Refining language & removing ambiguity...",
      "Validating JSON Schema compliance...",
      "Finalizing high-end Prompt formatting...",
    ];
    let count = 0;

    // Set initial
    setProgressStep(steps[0]);

    const interval = setInterval(() => {
      count++;
      if (count < steps.length) {
        setProgressStep(steps[count]);
      }
    }, 1800);

    return () => clearInterval(interval);
  }, [isOptimizing]);

  // Auto-fetch models when provider or key changes
  useEffect(() => {
    if (apiKey) fetchAvailableModels();
  }, [activeProvider, apiKey, apiEndpoint]);

  // Debounced auto-fetch when dialog inputs change (key + endpoint)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!apiKeyInputVal || !showKeyDialog) return;
    debounceRef.current = setTimeout(() => {
      fetchAvailableModels({
        apiKey: apiKeyInputVal,
        apiEndpoint: endpointInputVal,
        provider: providerInputVal,
      });
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [apiKeyInputVal, endpointInputVal, providerInputVal, showKeyDialog]);

  // Handle save of Key
  const handleSaveApiKey = (
    keyToSave: string,
    endpointToSave?: string,
    providerToSave?: string,
    modelToSave?: string,
  ) => {
    const cleanedKey = keyToSave.trim();
    const cleanedEndpoint = (
      endpointToSave !== undefined ? endpointToSave : endpointInputVal
    ).trim();
    const cleanedProvider = (
      providerToSave !== undefined ? providerToSave : providerInputVal
    ).trim();
    const cleanedCustomModel = (
      modelToSave !== undefined ? modelToSave : customModelInputVal
    ).trim();

    // Write storage first, then update state
    try {
      localStorage.setItem("openprompter_byok_key", cleanedKey);
      localStorage.setItem("openprompter_endpoint", cleanedEndpoint);
      localStorage.setItem("openprompter_custom_model", cleanedCustomModel);
      localStorage.setItem("openprompter_provider", cleanedProvider);
    } catch {
      toast.error("Could not save BYOK configuration. Storage may be blocked or full.");
      return;
    }

    setApiKey(cleanedKey);
    setApiEndpoint(cleanedEndpoint);
    setCustomModel(cleanedCustomModel);
    setActiveProvider(cleanedProvider);

    toast.success("BYOK Engine configuration saved successfully.");
    setShowApiKeyDialog(false);
    fetchAvailableModels({
      apiKey: cleanedKey,
      apiEndpoint: cleanedEndpoint,
      provider: cleanedProvider,
    });
  };

  const modelFetchSeq = React.useRef(0);

  // Fetch available models from the configured provider
  const fetchAvailableModels = async (
    override?: { apiKey?: string; apiEndpoint?: string; provider?: string }
  ) => {
    const key = override?.apiKey ?? apiKey;
    const endpoint = override?.apiEndpoint ?? apiEndpoint;
    const provider = override?.provider ?? activeProvider;
    const seq = ++modelFetchSeq.current;

    if (!key) {
      setAvailableModels([]);
      setModelsLoading(false);
      return;
    }

    setModelsLoading(true);
    try {
      const resp = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key,
          apiEndpoint: endpoint,
          provider,
        }),
      });
      const data = await resp.json();
      if (seq === modelFetchSeq.current && data.models) {
        setAvailableModels(data.models);
      }
    } catch {
      if (seq === modelFetchSeq.current) {
        setAvailableModels([]);
        toast.error("Failed to fetch models from provider.");
      }
    } finally {
      if (seq === modelFetchSeq.current) {
        setModelsLoading(false);
      }
    }
  };

  // Run the API optimizer proxy
  const handleOptimizePrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) {
      toast.warning("Paste or write a prompt to optimize first.");
      return;
    }

    setIsOptimizing(true);
    setOptimizedResult(null);

    const activePersona = allPersonas.find((p) => p.id === selectedPersona);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptInput,
          apiKey: apiKey,
          model:
            customModel || selectedModel,
          provider: activeProvider,
          apiEndpoint: apiEndpoint,
          persona: activePersona
            ? `${activePersona.name}: ${activePersona.systemPrompt}`
            : undefined,
          customInstructions: customInstructions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific BYOK missing prompt
        if (data.error === "apiKey_missing") {
          setShowApiKeyDialog(true);
          setApiKeyInputVal("");
          toast.error("API Key Configuration Required");
          throw new Error(data.message);
        }
        throw new Error(data.message || data.error || "Optimization failed.");
      }

      // We have a successful optimization!
      setOptimizedResult(data);
      toast.success("Prompt engineered successfully!");

      // Add to our prompt history list
      const newHistoryItem: PromptHistoryItem = {
        id: generateId("h"),
        originalPrompt: promptInput,
        optimizedPrompt: data.optimized_prompt,
        improvements: data.improvements || [],
        keyChanges: data.key_changes || [],
        confidenceScore: data.confidence_score || 85,
        promptType: data.prompt_type || "General",
        createdAt: new Date().toISOString(),
        modelUsed: selectedModel,
        personaName: activePersona?.name || "Standard",
        customInstructions: customInstructions || undefined,
      };

      setHistoryList((prev) => [newHistoryItem, ...prev]);
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        (err instanceof Error ? err.message : null) ||
          "Could not optimize prompt. Check console and configuration.",
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  // Pre-fill prompt input utilizing a Curator template
  const handleApplyTemplate = (tpl: PromptTemplate) => {
    setPromptInput(tpl.promptText);
    setActiveTab("optimizer");
    toast.success(`Loaded template: "${tpl.name}" into workspace!`);
  };

  // Toggle/Create a custom AI system persona
  const handleSaveCustomPersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonaName.trim() || !newPersonaPrompt.trim()) {
      toast.warning("Please fill in Name and Persona Instruction.");
      return;
    }
    if (!newPersonaDesc.trim()) {
      toast.error("Short description is required.");
      return;
    }

    if (editingPersona) {
      // Edit mode
      setCustomPersonas((prev) =>
        prev.map((p) =>
          p.id === editingPersona.id
            ? {
                ...p,
                name: newPersonaName,
                description: newPersonaDesc,
                systemPrompt: newPersonaPrompt,
              }
            : p,
        ),
      );
      toast.success("Persona updated successfully!");
    } else {
      // New mode
      const newPersona: CustomPersona = {
        id: generateId("pers"),
        name: newPersonaName,
        description: newPersonaDesc,
        systemPrompt: newPersonaPrompt,
        isPreset: false,
      };
      setCustomPersonas((prev) => [...prev, newPersona]);
      setSelectedPersona(newPersona.id);
      toast.success("New Custom Persona created!");
    }

    // Reset Form
    setNewPersonaName("");
    setNewPersonaDescription("");
    setNewPersonaPrompt("");
    setEditingPersona(null);
  };

  const handleDeleteHistory = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
    toast.info("Prompt removed from local history.");
  };

  // Copy utility supporting inline transition indicator
  const handleCopyToClipboard = async (
    text: string,
    type: "original" | "optimized" | "markdown" | "json",
  ) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const copyOk = document.execCommand('copy'); // NOSONAR - intentional fallback for non-HTTPS
      ta.remove();
      if (!copyOk) throw new Error('execCommand copy failed');
    }
    setCopiedState(type);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedState(null), 2000);
  };

  // Clear workspace input
  const handleResetWorkspace = () => {
    setPromptInput("");
    setCustomInstructions("");
    setOptimizedResult(null);
    toast.info("Workspace pristine and reset.");
  };

  // Copy a URL to clipboard with fallback for non-HTTPS contexts
  const copyUrlToClipboard = async (url: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const copyOk = document.execCommand('copy'); // NOSONAR - intentional fallback for non-HTTPS
      ta.remove();
      if (!copyOk) throw new Error('execCommand copy failed');
    }
    setSharedLinkCopied(true);
    setTimeout(() => setSharedLinkCopied(false), 3000);
    toast.success(successMessage);
  };

  // Share a template via URL
  const handleShareTemplate = async (tpl: PromptTemplate) => {
    const payload: SharePayload = {
      type: "template",
      version: 1,
      data: {
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        promptText: tpl.promptText,
        iconName: tpl.iconName,
      },
    };
    const result = generateShareUrl(payload);
    if (result.success === true) {
      try {
        await copyUrlToClipboard(result.url, "Template share link copied!");
      } catch {
        toast.error("Could not copy link — please copy the URL manually.");
      }
    } else {
      toast.error(result.error);
    }
  };

  // Share a persona via URL
  const handleSharePersona = async (pers: CustomPersona) => {
    const payload: SharePayload = {
      type: "persona",
      version: 1,
      data: {
        name: pers.name,
        description: pers.description,
        systemPrompt: pers.systemPrompt,
      },
    };
    const result = generateShareUrl(payload);
    if (result.success === true) {
      try {
        await copyUrlToClipboard(result.url, "Persona share link copied!");
      } catch {
        toast.error("Could not copy link — please copy the URL manually.");
      }
    } else {
      toast.error(result.error);
    }
  };

  // Import a shared resource from URL
  const handleConfirmImport = () => {
    if (!importData) return;
    if (importData.type === "template") {
      const tpl = importData.data;
      const newTemplate: PromptTemplate = {
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        promptText: tpl.promptText,
        iconName: tpl.iconName,
      };
      // Add to templates by loading into workspace
      setPromptInput(newTemplate.promptText);
      setActiveTab("optimizer");
      toast.success(`Imported template: "${newTemplate.name}"`);
    } else {
      const pers = importData.data;
      const newPersona: CustomPersona = {
        id: generateId("pers"),
        name: pers.name,
        description: pers.description,
        systemPrompt: pers.systemPrompt,
        isPreset: false,
      };
      setCustomPersonas((prev) => [newPersona, ...prev]);
      setActiveTab("personas");
      toast.success(`Imported persona: "${newPersona.name}"`);
    }
    setImportData(null);
  };

  const handleCancelImport = () => {
    setImportData(null);
  };

  // Detect shared content on page load
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const encoded = params.get("share");
    if (!encoded) return;
    const result = decodeSharePayload(encoded);
    if (result.valid === true) {
      const { type, data } = result.payload;
      if (type === "template") {
        setImportData({ type: "template", data: data as TemplateShareData });
      } else {
        setImportData({ type: "persona", data: data as PersonaShareData });
      }
    } else {
      toast.error(result.error);
      setShareError(result.error);
    }
    // Clean URL without reload — use URLSearchParams for correctness
    const cleanParams = new URLSearchParams(globalThis.location.search);
    cleanParams.delete("share");
    const cleanSearch = cleanParams.toString() ? `?${cleanParams.toString()}` : "";
    const cleanUrl = globalThis.location.pathname + cleanSearch;
    globalThis.history.replaceState(null, "", cleanUrl || "/");
  }, []);

  // Export as Markdown format
  const getMarkdownText = (pr: OptimizationResult | null) => {
    if (!pr) return "";
    return `# Optimized System Prompt

${pr.optimized_prompt}

## Improvements Applied
${(pr.improvements || []).map((imp: string) => `- ${imp}`).join("\n")}

## Key Architecture Confirmations
${(pr.key_changes || []).map((ch: string) => `- ${ch}`).join("\n")}

---
*Generated via OpenPrompter with confidence score ${pr.confidence_score}%*`;
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={(t) => setActiveTab(t as TabType)}>
    <div className="min-h-[100dvh] bg-canvas text-ink flex flex-col font-sans select-text selection:bg-accent/20 selection:text-ink antialiased">
      <ScrollProgress />
      <Toaster richColors closeButton theme="dark" position="top-right" />

      {/* CORE CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 w-full">
        {/* SHARE ERROR BANNER */}
        {shareError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400 mb-4 flex items-start justify-between">
            <span>{shareError}</span>
            <button
              className="ml-3 text-red-400 hover:text-red-300 shrink-0"
              onClick={() => setShareError(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TABS CONTAINER */}
        <AnimatePresence mode="wait">
          {/* TAB 1: OPERATIONAL WORKSPACE (OPTIMIZER) */}
          {activeTab === "optimizer" && (
            <WorkspaceView
              promptInput={promptInput}
              setPromptInput={setPromptInput}
              customInstructions={customInstructions}
              setCustomInstructions={setCustomInstructions}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              setCustomModel={setCustomModel}
              setCustomModelInputVal={setCustomModelInputVal}
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
              allPersonas={allPersonas}
              availableModels={availableModels}
              modelsLoading={modelsLoading}
              fetchAvailableModels={fetchAvailableModels}
              setShowApiKeyDialog={setShowApiKeyDialog}
              isOptimizing={isOptimizing}
              optimizedResult={optimizedResult}
              progressStep={progressStep}
              copiedState={copiedState}
              handleOptimizePrompt={handleOptimizePrompt}
              handleCopyToClipboard={handleCopyToClipboard}
              getMarkdownText={getMarkdownText}
              handleResetWorkspace={handleResetWorkspace}
              loadingAsset={loadingAsset}
              setActiveTab={(t) => setActiveTab(t as TabType)}
            />
          )}

          {/* TAB 2: CURATED PRESETS & TEMPLATES */}
          {activeTab === "templates" && (
            <PresetsView
              templateSearch={templateSearch}
              setTemplateSearch={setTemplateSearch}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              handleApplyTemplate={handleApplyTemplate}
              handleShareTemplate={handleShareTemplate}
            />
          )}

          {/* TAB 3: CUSTOM PERSONAS */}
          {activeTab === "personas" && (
            <PersonasView
              customPersonas={customPersonas}
              setCustomPersonas={setCustomPersonas}
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
              editingPersona={editingPersona}
              setEditingPersona={setEditingPersona}
              newPersonaName={newPersonaName}
              setNewPersonaName={setNewPersonaName}
              newPersonaDescription={newPersonaDesc}
              setNewPersonaDescription={setNewPersonaDescription}
              newPersonaPrompt={newPersonaPrompt}
              setNewPersonaPrompt={setNewPersonaPrompt}
              personaSearch={personaSearch}
              setPersonaSearch={setPersonaSearch}
              handleSaveCustomPersona={handleSaveCustomPersona}
              handleSharePersona={handleSharePersona}
            />
          )}

          {/* TAB 4: DURABLE HISTORY */}
          {activeTab === "history" && (
            <HistoryView
              historyList={historyList}
              setHistoryList={setHistoryList}
              showClearConfirm={showClearConfirm}
              setShowClearConfirm={setShowClearConfirm}
              setSelectedHistoryItem={setSelectedHistoryItem}
              handleDeleteHistory={handleDeleteHistory}
            />
          )}

          {/* TAB 5: ABOUT AND GUIDE */}
          {activeTab === "about" && <AboutView />}


      {/* ANNOUNCEMENT BAR — sticky bottom, hides when footer in view */}
      {!footerVisible && (
        <div className="sticky bottom-0 bg-surface border-t border-whisper px-4 py-2.5 text-center text-[11px] text-steel z-40">
          <span className="font-semibold text-ink uppercase tracking-wider text-[10px]">
            Open-Source Prompt Optimizer:
          </span>{" "}
          Your prompts use BYOK through a stateless proxy and are never cached on servers.
        </div>
      )}

      {/* FOOTER */}
      <footer ref={footerRef} className="border-t border-whisper bg-surface py-8 text-center text-xs text-steel mt-12 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex justify-center gap-6 text-muted flex-wrap">
            <button
              className="hover:text-ink transition-colors"
              onClick={() => setActiveTab("optimizer")}
            >
              Workspace
            </button>
            <button
              className="hover:text-ink transition-colors"
              onClick={() => setActiveTab("templates")}
            >
              Presets
            </button>
            <button
              className="hover:text-ink transition-colors"
              onClick={() => setActiveTab("personas")}
            >
              Personas
            </button>
            <button
              className="hover:text-ink transition-colors"
              onClick={() => setActiveTab("about")}
            >
              How-to Guide
            </button>
            <a
              href="https://www.buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover transition-colors"
            >
              <Coffee className="w-3.5 h-3.5 inline -mt-0.5" /> Buy Me a Coffee
            </a>
          </div>
          <p className="text-muted">
            © {new Date().getFullYear()} OpenPrompter. Privacy first.
            Zero prompt histories saved on server.
          </p>
        </div>
      </footer>

      {/* DIALOG 1: BRING YOUR OWN KEY SETTINGS */}
      <ByokDialog
        open={showKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        apiKeyInputVal={apiKeyInputVal}
        setApiKeyInputVal={setApiKeyInputVal}
        endpointInputVal={endpointInputVal}
        setEndpointInputVal={setEndpointInputVal}
        providerInputVal={providerInputVal}
        setProviderInputVal={setProviderInputVal}
        customModelInputVal={customModelInputVal}
        setCustomModelInputVal={setCustomModelInputVal}
        setCustomModel={setCustomModel}
        availableModels={availableModels}
        modelsLoading={modelsLoading}
        handleSaveApiKey={handleSaveApiKey}
      />

      {/* DIALOG 2: DETAIL INSPECTION MODAL FOR LOGS */}
      <HistoryDetailDialog
        selectedHistoryItem={selectedHistoryItem}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedHistoryItem(null);
        }}
        handleDeleteHistory={handleDeleteHistory}
        handleCopyToClipboard={handleCopyToClipboard}
        />

        {/* DIALOG 3: SHARE IMPORT */}
        <ImportShareDialog
          importData={importData}
          onOpenChange={(open) => { if (!open) setImportData(null); }}
          handleCancelImport={handleCancelImport}
          handleConfirmImport={handleConfirmImport}
        />

        {/* SHARED LINK FAB */}
      {sharedLinkCopied && (
        <div className="fixed bottom-6 right-6 z-50 bg-accent text-accent-foreground text-xs font-semibold px-4 py-2.5 rounded-xl shadow-card animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check className="w-3.5 h-3.5 mr-1.5 inline" />
          Share link copied!
        </div>
      )}
        </AnimatePresence>
      </main>
    </div>
    </AppLayout>
  );
}
