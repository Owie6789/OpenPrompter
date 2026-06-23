import React, { useState, useEffect } from "react";
import {
  Sparkle,
  ClockCounterClockwise,
  GearSix,
  Key,
  Copy,
  Check,
  ArrowCounterClockwise,
  FileText,
  UserCheck,
  Trash,
  PlusCircle,
  Download,
  ShareNetwork,
  Question,
  Lock,
  ShieldCheck,
  List,
  X,
  CaretRight,
  MagicWand,
  Sliders,
  Cpu,
  Layout,
  Coffee,
  ArrowsClockwise,
  Lightbulb,
} from "@phosphor-icons/react";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ScrollProgress } from "@/src/components/ScrollProgress"
import { useReducedMotion } from "@/src/hooks/use-reduced-motion"

import { PRESET_PERSONAS, PRESET_TEMPLATES } from "./data";
import {
  PromptHistoryItem,
  CustomPersona,
  PromptTemplate,
  OptimizationResult,
  TemplateShareData,
  PersonaShareData,
} from "./types";
import { generateShareUrl, decodeSharePayload, SharePayload } from "./lib/share";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import ByokDialog from "@/components/ByokDialog";
import HistoryDetailDialog from "@/components/HistoryDetailDialog";
import ImportShareDialog from "@/components/ImportShareDialog";

import openprompterIcon from "@/assets/openpromptericon.png";
import loadingAsset from "@/assets/op-appasset-aigenerating-loadstate.png";
import emptyHistoryAsset from "@/assets/op-appasset-emptyhistorystate.png";

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
  // Animation variants for staggered entry
  const reducedMotion = useReducedMotion()

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.06,
        delayChildren: reducedMotion ? 0 : 0.08,
      },
    },
  } satisfies React.ComponentProps<typeof motion.div>["variants"];

  const staggerItem = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  } satisfies React.ComponentProps<typeof motion.div>["variants"];

type TabType = "optimizer" | "templates" | "personas" | "history" | "about";

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("optimizer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const [activeProvider, setActiveProvider] = useState(() => safeLocalStorageGet("openprompter_provider", "openai"));

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

  // Restore model + instructions from localStorage on mount
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

  const handleEditPersona = (pers: CustomPersona) => {
    setEditingPersona(pers);
    setNewPersonaName(pers.name);
    setNewPersonaDescription(pers.description);
    setNewPersonaPrompt(pers.systemPrompt);
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
      setCopiedState(type);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedState(null), 2000);
    } catch {
      toast.error("Clipboard access denied. Please copy manually.");
    }
  };

  // Clear workspace input
  const handleResetWorkspace = () => {
    setPromptInput("");
    setCustomInstructions("");
    setOptimizedResult(null);
    toast.info("Workspace pristine and reset.");
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
        await navigator.clipboard.writeText(result.url);
      } catch {
        // Fallback for non-HTTPS or restricted contexts
        const ta = document.createElement('textarea');
        ta.value = result.url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setSharedLinkCopied(true);
      setTimeout(() => setSharedLinkCopied(false), 3000);
      toast.success("Template share link copied!");
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
        await navigator.clipboard.writeText(result.url);
      } catch {
        // Fallback for non-HTTPS or restricted contexts
        const ta = document.createElement('textarea');
        ta.value = result.url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setSharedLinkCopied(true);
      setTimeout(() => setSharedLinkCopied(false), 3000);
      toast.success("Persona share link copied!");
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

  // Filter templates list
  const filteredTemplates = PRESET_TEMPLATES.filter((t) => {
    const query = templateSearch.toLowerCase();
    const hitsQuery =
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.promptText.toLowerCase().includes(query);
    const hitsCategory =
      categoryFilter === "All" || t.category === categoryFilter;
    return hitsQuery && hitsCategory;
  });

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink flex flex-col font-sans select-text selection:bg-accent/20 selection:text-ink antialiased">
      <ScrollProgress />
      <Toaster richColors closeButton theme="dark" position="top-right" />

      {/* HEADER — Fluid Island */}
      <header className="mx-auto max-w-7xl w-full px-3 sm:px-6 mt-2 sm:mt-3 sticky top-3 z-50">
        <div className="bg-surface rounded-xl border border-whisper shadow-elevated px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <img src={openprompterIcon} alt="" width={40} height={40} className="w-10 h-10 rounded-md shadow-card" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-ink font-display">
                  OpenPrompter
                </h1>
                <p className="text-[10px] text-steel uppercase font-mono tracking-widest leading-none mt-0.5">
                  Open-Source Optimizer
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav
              className="hidden md:flex items-center gap-1"
              role="tablist"
              onKeyDown={(e) => {
                const tabs: TabType[] = ["optimizer","templates","personas","history","about"];
                const idx = tabs.indexOf(activeTab);
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveTab(tabs[(idx + 1) % tabs.length]);
                }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
                }
              }}
            >
              <Button
                variant={activeTab === "optimizer" ? "secondary" : "ghost"}
                className={`text-sm rounded-lg px-4 transition-colors,shadow active:scale-[0.98] ${activeTab === "optimizer" ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-steel hover:text-ink"}`}
                onClick={() => setActiveTab("optimizer")}
                id="tab-optimizer"
              >
                <Sparkle className="w-4 h-4 mr-2" />
                Workspace
              </Button>
              <Button
                variant={activeTab === "templates" ? "secondary" : "ghost"}
                className={`text-sm rounded-lg px-4 transition-colors,shadow ${activeTab === "templates" ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-steel hover:text-ink"}`}
                onClick={() => setActiveTab("templates")}
                id="tab-templates"
              >
                <Layout className="w-4 h-4 mr-2" />
                Curated Presets
              </Button>
              <Button
                variant={activeTab === "personas" ? "secondary" : "ghost"}
                className={`text-sm rounded-lg px-4 transition-colors,shadow ${activeTab === "personas" ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-steel hover:text-ink"}`}
                onClick={() => setActiveTab("personas")}
                id="tab-personas"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Custom Personas
              </Button>
              <Button
                variant={activeTab === "history" ? "secondary" : "ghost"}
                className={`text-sm rounded-lg px-4 transition-colors,shadow ${activeTab === "history" ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-steel hover:text-ink"}`}
                onClick={() => setActiveTab("history")}
                id="tab-history"
              >
                <ClockCounterClockwise className="w-4 h-4 mr-2" />
                Durable History
                {historyList.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 bg-whisper text-[10px] text-steel border-none shrink-0 px-1.5 py-0"
                  >
                    {historyList.length}
                  </Badge>
                )}
              </Button>
              <Button
                variant={activeTab === "about" ? "secondary" : "ghost"}
                className={`text-sm rounded-lg px-4 transition-colors,shadow ${activeTab === "about" ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-steel hover:text-ink"}`}
                onClick={() => setActiveTab("about")}
                id="tab-about"
              >
                <Question className="w-4 h-4 mr-2" />
                About & Guide
              </Button>
            </nav>

            {/* API Settings & Key triggers */}
            <div className="flex items-center gap-3">
              <Button
                variant={apiKey ? "outline" : "default"}
                className={`h-9 text-xs rounded-lg transition-colors,shadow active:scale-95 ${apiKey ? "border-edges text-steel hover:bg-hover" : "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover"}`}
                aria-label={apiKey ? "API Connected" : "Connection Setup"}
                onClick={() => {
                  setApiKeyInputVal(apiKey);
                  setShowApiKeyDialog(true);
                }}
                id="key-settings-btn"
              >
                <Key className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{apiKey ? "API Connected" : "Connection Setup"}</span>
              </Button>

              {/* Mobile menu trigger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                id="mobile-menu-trigger"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <List className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile menu panel */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-whisper px-4 py-3 space-y-2">
              <Button
                className="w-full justify-start text-left"
                variant={activeTab === "optimizer" ? "secondary" : "ghost"}
                onClick={() => {
                  setActiveTab("optimizer");
                  setMobileMenuOpen(false);
                }}
              >
                <Sparkle className="w-4 h-4 mr-2" />
                Workspace
              </Button>
              <Button
                className="w-full justify-start text-left"
                variant={activeTab === "templates" ? "secondary" : "ghost"}
                onClick={() => {
                  setActiveTab("templates");
                  setMobileMenuOpen(false);
                }}
              >
                <Layout className="w-4 h-4 mr-2" />
                Curated Presets
              </Button>
              <Button
                className="w-full justify-start text-left"
                variant={activeTab === "personas" ? "secondary" : "ghost"}
                onClick={() => {
                  setActiveTab("personas");
                  setMobileMenuOpen(false);
                }}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Custom Personas
              </Button>
              <Button
                className="w-full justify-start text-left"
                variant={activeTab === "history" ? "secondary" : "ghost"}
                onClick={() => {
                  setActiveTab("history");
                  setMobileMenuOpen(false);
                }}
              >
                <ClockCounterClockwise className="w-4 h-4 mr-2" />
                Durable History
              </Button>
              <Button
                className="w-full justify-start text-left"
                variant={activeTab === "about" ? "secondary" : "ghost"}
                onClick={() => {
                  setActiveTab("about");
                  setMobileMenuOpen(false);
                }}
              >
                <Question className="w-4 h-4 mr-2" />
                About & Guide
              </Button>
            </div>
          )}

        </div>
      </header>

      {/* ANNOUNCEMENT BAR */}
      <div className="bg-surface border-b border-whisper px-4 py-2.5 text-center text-[11px] text-steel">
        <span className="font-semibold text-ink uppercase tracking-wider text-[10px]">
          Open-Source Prompt Optimizer:
        </span>{" "}
        Your prompts use BYOK through a stateless proxy and are never cached on servers.
      </div>

      {/* CORE CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 w-full">
        {/* SHARE ERROR BANNER */}
        {shareError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400 mb-4 flex items-start justify-between">
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
            <motion.div
              key="optimizer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: WORKSPACE INPUTS & CONFIG */}
                <div className="flex-1 lg:w-1/2 space-y-6">
                  {/* WORKSPACE CARD */}
                  <Card className="border border-whisper bg-surface shadow-card rounded-xl relative overflow-hidden">
                    <CardHeader className="pb-3 pt-4 px-4 lg:px-6 lg:pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl font-bold flex items-center gap-2 font-display text-ink tracking-tight">
                            <Sparkle className="w-5 h-5 text-ink" />
                            Optimize Prompt
                          </CardTitle>
                          <CardDescription className="text-xs text-steel font-medium tracking-wide uppercase mt-2">
                            Translate rough drafts into structured
                            instructions
                          </CardDescription>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetWorkspace}
                          className="h-8 text-xs text-muted hover:text-ink rounded-xl"
                        >
                          <ArrowCounterClockwise className="w-3.5 h-3.5 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6 px-6">
                        {/* INPUT AREA */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label htmlFor="prompt-input" className="text-sm font-semibold text-steel tracking-tight">
                              Paste Your Prompt
                            </label>
                            <span className="text-[10px] text-muted font-mono tracking-wider">
                              {promptInput.length}/5000 chars
                            </span>
                          </div>
                          <Textarea
                            id="prompt-input"
                            placeholder="E.g., Write a draft story about a lost robot... OR Refactor this python class..."
                            className="min-h-[160px] lg:min-h-[220px] bg-canvas border-whisper font-mono text-sm leading-snug text-ink placeholder:text-muted focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors,shadow,ring focus:border-accent rounded-md resize-none shadow-inner"
                            value={promptInput}
                            onChange={(e) =>
                              setPromptInput(e.target.value.slice(0, 5000))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                e.preventDefault();
                                handleOptimizePrompt();
                              }
                            }}
                          />
                          <div className="text-[10px] text-muted flex justify-between">
                            <span>
                              <Lightbulb className="w-3 h-3 inline -mt-0.5 text-muted" /> Press{" "}
                              <kbd className="bg-whisper border border-whisper px-1.5 py-0.5 rounded text-steel font-mono shadow-card">
                                Ctrl + Enter
                              </kbd>{" "}
                              to optimize instantly.
                            </span>
                          </div>
                        </div>

                        {/* PARAMETERS SETTINGS (COLLAPSIBLE OR DIRECT) */}
                        <div className="border-t border-whisper pt-6 mt-6 space-y-5">
                          <h4 className="text-xs font-bold text-ink flex items-center gap-2 uppercase tracking-widest">
                            <Sliders className="w-3.5 h-3.5 text-steel" />
                            Tuning Options
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Pick Custom Persona */}
                            <div className="space-y-2">
                              <label htmlFor="persona-role" className="text-[11px] font-semibold text-steel uppercase tracking-wider block">
                                Expert Persona Role
                              </label>
                              <Select
                                id="persona-role"
                                value={selectedPersona}
                                onValueChange={(val) => {
                                  setSelectedPersona(val);
                                  const selected = allPersonas.find(
                                    (p) => p.id === val,
                                  );
                                  if (selected) {
                                    toast.info(
                                      `Adopted Persona: "${selected.name}"`,
                                    );
                                  }
                                }}
                                options={allPersonas.map((p) => ({ value: p.id, label: p.name }))}
                              >
                                <SelectTrigger
                                  icon={undefined}
                                  placeholder="Standard Prompt Engineer"
                                  className="bg-surface border-whisper text-ink text-xs h-10 rounded-md shadow-card focus:ring-accent focus:ring-offset-1"
                                />
                                <SelectContent className="bg-surface border-whisper text-ink rounded-md shadow-elevated">
                                  {allPersonas.map((persona, i) => (
                                    <SelectItem
                                      key={persona.id}
                                      value={persona.id}
                                      index={i}
                                      className="text-xs py-2 focus:bg-canvas focus:text-ink"
                                    >
                                      {persona.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Model Selector */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label htmlFor="model-select" className="text-[11px] font-semibold text-steel uppercase tracking-wider">
                                  Model
                                </label>
                                {modelsLoading ? (
                                  <span className="flex items-center gap-1 text-[10px] text-muted">
                                    <div className="w-2.5 h-2.5 rounded-xl border-2 border-muted border-t-transparent animate-spin" />
                                    Loading models...
                                  </span>
                                ) : availableModels.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKeyDialog(true)}
                                    className="tabular-nums text-[10px] text-accent hover:text-accent-hover font-semibold tracking-wider"
                                  >
                                    {availableModels.length} models
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKeyDialog(true)}
                                    className="text-[10px] text-accent hover:text-accent-hover font-semibold tracking-wider"
                                  >
                                    Configure API
                                  </button>
                                )}
                              </div>
                              <Select
                                id="model-select"
                                value={selectedModel}
                                onValueChange={(val) => {
                                  setSelectedModel(val);
                                  setCustomModelInputVal(val);
                                }}
                                options={availableModels.length > 0
                                  ? availableModels.map((m) => ({ value: m.id, label: m.name }))
                                  : [{ value: "gpt-4o", label: "gpt-4o (default)" }]}
                              >
                                <SelectTrigger
                                  icon={undefined}
                                  placeholder={selectedModel || "Select model"}
                                  className="bg-surface border-whisper text-ink text-xs h-10 rounded-md shadow-card focus:ring-accent focus:ring-offset-1"
                                />
                                <SelectContent className="bg-surface border-whisper text-ink rounded-md shadow-elevated max-h-60">
                                  {availableModels.length > 0 ? (
                                    availableModels.map((m, i) => (
                                      <SelectItem
                                        key={m.id}
                                        value={m.id}
                                        index={i}
                                        className="text-xs py-2 focus:bg-canvas focus:text-ink"
                                      >
                                        {m.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="gpt-4o" index={0} className="text-xs">
                                      gpt-4o (default)
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => fetchAvailableModels()}
                                  className="text-[10px] text-accent hover:text-accent-hover font-medium flex items-center gap-1 transition-colors"
                                >
                                  <ArrowsClockwise className={`w-3 h-3 ${modelsLoading ? "animate-spin" : ""}`} />
                                  {modelsLoading ? "Loading..." : "Refresh from API"}
                                </button>
                                <span className="text-[10px] text-muted">
                                  · {availableModels.length} models available
                                </span>
                              </div>
                            </div>
                            </div>

                          {/* MODEL MARQUEE */}
                          {availableModels.length > 0 && (
                            <div className="relative overflow-hidden rounded-md bg-canvas border border-whisper py-2.5 px-4 shadow-inner">
                              <div className="flex items-center gap-2 text-[11px] text-muted mb-1.5">
                                <Cpu className="w-3 h-3 text-accent" />
                                <span className="font-semibold uppercase tracking-wider">Available Models</span>
                                <span className="text-[10px]">· {availableModels.length}</span>
                              </div>
                              <div className="overflow-hidden">
                                <motion.div
                                  className="flex gap-3 whitespace-nowrap"
                                  animate={{ x: ["0%", "-50%"] }}
                                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                >
                                  {/* Duplicate array for seamless loop */}
                                  {[...availableModels, ...availableModels].map((m, i) => (
                                    <button
                                      key={`${m.id}-${i}`}
                                      onClick={() => {
                                        setSelectedModel(m.id);
                                        setCustomModelInputVal(m.id);
                                        toast.info(`Model set to ${m.name}`);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface border border-whisper text-[11px] text-steel hover:border-accent hover:text-accent transition-colors shrink-0 cursor-pointer"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-xl bg-emerald-400" />
                                      {m.name}
                                    </button>
                                  ))}
                                </motion.div>
                              </div>
                            </div>
                          )}

                            </div>

                          {/* Additional Instructions */}
                          <div className="space-y-2">
                            <label htmlFor="custom-instructions" className="text-[11px] font-semibold text-steel uppercase tracking-wider block">
                              Additional Custom Instructions
                            </label>
                            <Input
                              id="custom-instructions"
                              placeholder="E.g., Keep the sentence length short, emphasize security..."
                              maxLength={1000}
                              value={customInstructions}
                              onChange={(e) =>
                                setCustomInstructions(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault();
                                  handleOptimizePrompt();
                                }
                              }}
                              className="bg-surface border-whisper text-ink text-xs h-10 rounded-md shadow-card focus-visible:ring-accent focus-visible:ring-offset-1 placeholder:text-muted"
                            />
                          </div>

                    </CardContent>

                      <CardFooter className="border-t border-whisper pt-5 pb-6 flex justify-end gap-3 bg-canvas rounded-b-[calc(2rem-0.5rem)] px-6 mt-4">
                        <Button
                          size="lg"
                          className="group relative bg-accent hover:bg-accent-hover text-sm font-semibold rounded-xl text-accent-foreground pl-8 pr-3 shadow-card flex items-center justify-center gap-3 h-11 active:scale-[0.98] transition-[transform,background-color,box-shadow]"
                          disabled={isOptimizing}
                          onClick={handleOptimizePrompt}
                          id="run-optimize-btn"
                        >
                          {isOptimizing ? (
                            <>
                              <div className="w-4 h-4 rounded-xl border-2 border-white/30 border-t-white animate-spin" />
                              Optimizing...
                            </>
                          ) : (
                            <>
                              <span>Optimize Prompt</span>
                              <span className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300">
                                <Sparkle className="w-3.5 h-3.5 text-accent-foreground" />
                              </span>
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>

                  {/* BYOK ENCOURAGEMENT CARD */}
                  <div className="border border-whisper rounded-lg p-5 bg-surface shadow-card flex items-start gap-4">
                    <div className="w-10 h-10 rounded-md bg-canvas border border-whisper flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-steel" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-ink gap-1.5 tracking-tight">
                        BYOK Privacy Architecture
                      </h5>
                      <p className="text-xs text-steel mt-1 leading-snug max-w-md">
                        Keys are stored locally and sent to the stateless
                        backend proxy only when optimizing. The proxy
                        forwards requests without persisting keys, prompts,
                        or responses.
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: AI ANALYSIS AND OPTIMIZED VERSION */}
                <div className="flex flex-col gap-6 lg:w-1/2">
                  {/* GENERATING SCREEN STATE */}
                  {isOptimizing && (
                    <div className="border border-whisper rounded-xl bg-surface p-6 lg:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px] lg:min-h-[450px] shadow-card transform transition-colors,shadow,ring">
                      <img src={loadingAsset} alt="Optimizing..." className="w-48 h-auto opacity-80 mb-2" width={192} height={192} />
                      <div className="space-y-4 w-full">
                        <div className="skeleton-shimmer h-12 w-3/4 mx-auto border-none rounded-xl" />
                        <div className="skeleton-shimmer h-4 w-1/2 mx-auto border-none rounded-lg" />
                        <div className="skeleton-shimmer h-32 w-full border-none rounded-lg" />
                      </div>

                      <div className="space-y-3 max-w-sm">
                        <h4 className="text-xl font-bold text-ink font-display tracking-tight">
                          Prompt Optimization Active
                        </h4>
                        <p className="text-xs font-mono text-steel uppercase tracking-widest bg-canvas py-1.5 px-3 rounded-xl inline-block">
                          {progressStep}
                        </p>
                        <p className="text-sm text-steel leading-snug pt-2">
                          The AI is restructuring sections, polishing language
                          constraints, and framing target outputs based on elite
                          prompt engineer frameworks...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* IDLE (NO RESULT) VIEW */}
                  {!isOptimizing && !optimizedResult && (
                    <div className="border border-dashed border-whisper rounded-xl p-6 lg:p-12 flex flex-col items-center justify-center text-center text-steel bg-canvas min-h-[300px] lg:min-h-[480px]">
                      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-accent/5 rounded-xl animate-pulse" />
                        <div
                          className="absolute inset-4 bg-accent/10 rounded-xl animate-ping"
                          style={{ animationDuration: "3s" }}
                        />
                        <div className="relative w-20 h-20 rounded-xl bg-surface flex items-center justify-center shadow-card border border-whisper z-10">
                          <MagicWand className="w-8 h-8 text-accent shrink-0" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-surface border border-whisper rounded-xl flex items-center justify-center shadow-sm">
                            <Sparkle className="w-3 h-3 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-ink mb-2 font-display tracking-tight">
                        Workspace Ready
                      </h3>
                      <p className="text-sm text-steel max-w-sm leading-snug mb-8">
                        Paste your rough prompt on the left and click{" "}
                        <strong>Optimize Prompt</strong> to let our logic engine
                        restructure and refine it.
                      </p>

                      {/* Curated Templates Link Quick Hack */}
                      <Button
                        variant="outline"
                        className="text-steel hover:text-ink text-xs gap-1 rounded-xl border-whisper bg-surface active:-translate-y-px transition-colors,shadow,ring"
                        onClick={() => setActiveTab("templates")}
                      >
                        Browse professional presets{" "}
                        <CaretRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* RESULT VIEW */}
                  {optimizedResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* ACCREDITATIONS & SCORE */}
                      <div className="bg-surface rounded-xl shadow-card border border-whisper overflow-hidden">
                        <div className="p-6 border-b border-whisper">
                          <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-whisper text-steel border-none font-mono text-[10px] tracking-widest uppercase font-semibold px-3 py-1">
                                {optimizedResult.prompt_type || "Standard"}
                              </Badge>
                              <CardTitle className="text-xl font-bold font-display tracking-tight text-ink">
                                Optimization Analysis
                              </CardTitle>
                            </div>

                            <div className="flex items-center gap-2 bg-canvas px-4 py-2 rounded-md shadow-inner border border-whisper">
                              <span className="text-[10px] text-steel uppercase font-mono tracking-widest font-semibold">
                                Confidence
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-base font-bold font-mono tracking-tight ${optimizedResult.confidence_score >= 90 ? "text-ink" : optimizedResult.confidence_score >= 70 ? "text-steel" : "text-amber-500"}`}
                                >
                                  {optimizedResult.confidence_score}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 space-y-6 bg-canvas">
                          {/* KEY IMPROVEMENTS MAP */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-muted uppercase tracking-widest font-mono">
                              Structural Improvements
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {optimizedResult.improvements?.map(
                                (imp: string, i: number) => (
                                  <div
                                    key={`${imp.slice(0, 60)}-${i}`}
                                    className="text-sm p-4 rounded-lg bg-surface border border-whisper text-steel leading-snug flex items-start gap-3 shadow-card hover:shadow-md transition-shadow"
                                  >
                                    <span className="text-muted shrink-0 font-bold font-mono text-xs mt-0.5">
                                      {(i + 1).toString().padStart(2, "0")}
                                    </span>
                                    <span>{imp}</span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          {/* KEY CHANGES */}
                          {optimizedResult.key_changes &&
                            optimizedResult.key_changes.length > 0 && (
                              <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-muted uppercase tracking-widest font-mono">
                                  Applied Architectures
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {optimizedResult.key_changes.map(
                                    (ch: string, i: number) => (
                                      <Badge
                                        key={`${ch.slice(0, 60)}-${i}`}
                                        variant="outline"
                                        className="bg-surface border-whisper text-[11px] px-3 py-1 font-mono text-steel shadow-card"
                                      >
                                        <Check className="w-3 h-3 mr-1 text-emerald-500" />{" "}
                                        {ch}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* OPTIMIZED PROMPT OUTPUT CARD */}
                      <Card className="border border-whisper bg-surface shadow-card rounded-xl relative overflow-hidden p-2">
                        <div className="bg-surface rounded-lg shadow-card border border-whisper h-full">
                          <CardHeader className="pb-4 pt-6 px-6 border-b border-whisper flex flex-row items-center justify-between">
                            <div>
                              <CardTitle className="text-2xl font-bold flex items-center gap-2 font-display tracking-tight text-ink">
                                <Sparkle className="w-5 h-5 text-ink" />
                                Engineered Prompt
                              </CardTitle>
                            </div>

                            {/* Toolbar options */}
                            <div className="flex items-center gap-2 bg-canvas p-1 rounded-xl border border-whisper">
                              {/* Copy plain */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs rounded-xl hover:bg-surface text-steel hover:text-ink shadow-card"
                                onClick={() =>
                                  handleCopyToClipboard(
                                    optimizedResult.optimized_prompt,
                                    "optimized",
                                  )
                                }
                              >
                                {copiedState === "optimized" ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 mr-1" />
                                )}
                                Copy Prompt
                              </Button>

                              {/* Export selectors */}
                              <div className="flex rounded-xl py-0.5 px-1 bg-surface divide-x divide-edges shadow-card shrink-0 items-center">
                                <button
                                  className="px-3 py-1 text-[11px] text-steel hover:text-ink transition-colors,shadow,ring font-mono font-semibold"
                                  onClick={() =>
                                    handleCopyToClipboard(
                                      getMarkdownText(optimizedResult),
                                      "markdown",
                                    )
                                  }
                                  title="Copy as Markdown"
                                >
                                  {copiedState === "markdown" ? "✓ MD" : "MD"}
                                </button>
                                <button
                                  className="px-3 py-1 text-[11px] text-steel hover:text-ink transition-colors,shadow,ring font-mono font-semibold"
                                  onClick={() =>
                                    handleCopyToClipboard(
                                      JSON.stringify(optimizedResult, null, 2),
                                      "json",
                                    )
                                  }
                                  title="Copy as JSON"
                                >
                                  {copiedState === "json" ? "✓ JSON" : "JSON"}
                                </button>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="p-0">
                            {/* OUTPUT COPY CONTAINER */}
                            <div className="bg-canvas p-6 font-mono text-sm leading-snug text-ink border-b border-whisper max-h-[380px] overflow-y-auto whitespace-pre-wrap selection:bg-accent/20">
                              {optimizedResult.optimized_prompt}
                            </div>
                          </CardContent>

                          <CardFooter className="py-4 flex justify-between bg-surface text-xs text-muted font-medium px-6 rounded-b-[calc(2rem-0.5rem)]">
                            <span>Engineered via {selectedModel}</span>
                            <span className="flex items-center gap-1.5 text-steel tracking-tight">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              Secure client-side execution
                            </span>
                          </CardFooter>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CURATED PRESETS & TEMPLATES */}
          {activeTab === "templates" && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              {/* FILTER TOOLBAR */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 rounded-lg border border-whisper shadow-card">
                <div>
                  <h3 className="text-xl font-bold font-display tracking-tight text-ink">
                    Prompt Presets Gallery
                  </h3>
                  <p className="text-xs text-steel mt-0.5">
                    High-fidelity prompts verified across GPT-4, Claude, and
                    DeepSeek models. Select any to load.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Filter */}
                  <div className="flex gap-1 border border-whisper p-1 bg-canvas rounded-md">
                    {[
                      "All",
                      "Coding",
                      "Marketing",
                      "Analysis",
                      "Sales",
                      "Education",
                    ].map((cat) => (
                      <button
                        key={cat}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold tracking-wide uppercase transition-colors,shadow,ring ${categoryFilter === cat ? "bg-surface text-ink shadow-card" : "text-muted hover:text-steel"}`}
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search input */}
                  <Input
                    placeholder="Search curated prompts..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="max-w-[200px] h-9 text-xs bg-surface border-whisper rounded-lg shadow-card"
                  />
                </div>
              </div>

              {/* GRID */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {filteredTemplates.map((tpl, i) => (
                  <motion.div key={`${tpl.category}-${tpl.name}`} variants={staggerItem}>
                    <Card
                      className="border-whisper bg-surface hover:shadow-md shadow-card transition-colors,shadow,ring hover:border-whisper flex flex-col justify-between group rounded-lg ring-1 ring-inset ring-whisper/20"
                    >
                    <CardHeader className="pb-3 pt-5 px-5 border-b border-whisper/40">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-muted">
                          {tpl.category}
                        </span>
                        <Badge
                          variant="outline"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-accent/30 text-accent text-[10px] bg-accent/5 shadow-none"
                        >
                          Quick Use
                        </Badge>
                      </div>
                      <CardTitle
                        className="text-lg font-bold mt-2 font-display text-ink tracking-tight cursor-pointer group-hover:text-accent transition-colors"
                        onClick={() => handleApplyTemplate(tpl)}
                      >
                        {tpl.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-steel leading-snug mt-1">
                        {tpl.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-4 px-5 pt-4">
                      {/* Double-bezel: inner nested surface with its own depth */}
                      <div
                        className="p-4 bg-canvas border border-whisper/70 rounded-md text-[11px] font-mono leading-snug text-steel/80 line-clamp-3 group-hover:line-clamp-none transition-[background,color] duration-300 select-none cursor-pointer hover:bg-canvas/80"
                        onClick={() => handleApplyTemplate(tpl)}
                      >
                        {tpl.promptText}
                      </div>
                      <div className="flex justify-end mt-2">
                        <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          click excerpt or title to load
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="py-3 px-5 border-t border-whisper/40 bg-canvas/50 flex justify-between rounded-b-[1.5rem]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted hover:text-accent font-semibold rounded-xl hover:bg-surface border border-transparent hover:border-accent/20"
                        onClick={() => handleShareTemplate(tpl)}
                      >
                        <ShareNetwork className="w-3.5 h-3.5 mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-steel hover:text-ink font-semibold rounded-xl hover:bg-surface border border-transparent hover:border-whisper shadow-none hover:shadow-card"
                        onClick={() => handleApplyTemplate(tpl)}
                      >
                        Load into Workspace →
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}

                {filteredTemplates.length === 0 && (
                  <div className="col-span-full py-12 text-center text-steel">
                    No curated templates matched your search criteria.
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* TAB 3: CUSTOM PERSONAS */}
          {activeTab === "personas" && (
            <motion.div
              key="personas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: EDIT / CREATE FORM */}
                <div className="lg:w-1/3">
                  <Card className="border-whisper bg-surface shadow-card rounded-xl sticky top-24 p-1.5">
                    <div className="bg-surface rounded-[calc(0.75rem-0.375rem)] shadow-card border border-whisper h-full">
                      <CardHeader className="px-6 pt-6">
                        <CardTitle className="text-xl font-bold font-display flex items-center gap-2 text-ink tracking-tight">
                          {editingPersona ? (
                            <GearSix className="w-5 h-5 text-ink" />
                          ) : (
                            <PlusCircle className="w-5 h-5 text-ink" />
                          )}
                          {editingPersona
                            ? "Modify Custom Persona"
                            : "Create Custom Persona"}
                        </CardTitle>
                        <CardDescription className="text-xs text-steel leading-snug mt-1">
                          Design specific expert role plays (system cues) for
                          custom tailored outputs.
                        </CardDescription>
                      </CardHeader>

                      <form onSubmit={handleSaveCustomPersona}>
                        <CardContent className="space-y-5 px-6">
                          {/* NAME */}
                          <div className="space-y-2">
                            <label htmlFor="persona-name" className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                              Persona Name
                            </label>
                            <Input
                              id="persona-name"
                              placeholder="E.g., Python Refactoring Ninja"
                              required
                              value={newPersonaName}
                              onChange={(e) =>
                                setNewPersonaName(e.target.value)
                              }
                              className="bg-surface border-whisper h-10 text-xs rounded-md focus:ring-accent shadow-card"
                            />
                          </div>

                          {/* DESCRIPTION */}
                          <div className="space-y-2">
                            <label htmlFor="persona-desc" className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                              Short Description
                            </label>
                            <Input
                              id="persona-desc"
                              placeholder="E.g., Optimizes for clean architectures"
                              value={newPersonaDesc}
                              onChange={(e) =>
                                setNewPersonaDescription(e.target.value)
                              }
                              className="bg-surface border-whisper h-10 text-xs rounded-md focus:ring-accent shadow-card"
                            />
                          </div>

                          {/* SYSTEM PROMPT */}
                          <div className="space-y-2">
                            <label htmlFor="persona-prompt" className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                              System Instruction / Prompt Cues
                            </label>
                            <Textarea
                              id="persona-prompt"
                              placeholder="E.g., Act as a Python programmer..."
                              required
                              rows={5}
                              value={newPersonaPrompt}
                              onChange={(e) =>
                                setNewPersonaPrompt(e.target.value)
                              }
                              className="bg-surface border-whisper text-xs font-mono rounded-md focus:ring-accent shadow-card resize-none"
                            />
                          </div>
                        </CardContent>

                        <CardFooter className="flex justify-end gap-2 border-t border-whisper pt-4 px-6 pb-6 bg-canvas rounded-b-[calc(2rem-0.375rem)] mt-4">
                          {editingPersona && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs font-semibold rounded-xl"
                              onClick={() => {
                                setEditingPersona(null);
                                setNewPersonaName("");
                                setNewPersonaDescription("");
                                setNewPersonaPrompt("");
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!newPersonaDesc.trim()}
                            className="bg-accent text-accent-foreground hover:bg-accent-hover text-xs rounded-xl px-5 shadow-md"
                          >
                            {editingPersona ? "Save Updates" : "Create Persona"}
                          </Button>
                        </CardFooter>
                      </form>
                    </div>
                  </Card>
                </div>

                {/* RIGHT: PERSONAS LIST GRID */}
                <div className="flex-1 space-y-4">
                  <div className="bg-surface p-5 border border-whisper rounded-lg flex items-center justify-between shadow-card">
                    <div>
                      <h3 className="text-base font-bold font-display text-ink tracking-tight">
                        Durable Persona Registry
                      </h3>
                      <p className="text-xs text-steel mt-0.5">
                        Toggle and edit custom crafted expert models loaded
                        dynamically on optimization.
                      </p>
                    </div>

                    <Input
                      placeholder="Keyword filter..."
                      value={personaSearch}
                      onChange={(e) => setPersonaSearch(e.target.value)}
                      className="max-w-[180px] h-9 text-xs bg-canvas border-whisper rounded-md"
                    />
                  </div>

                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {allPersonas
                      .filter((p) =>
                        p.name
                          .toLowerCase()
                          .includes(personaSearch.toLowerCase()),
                      )
                      .map((pers) => {
                        const isPreset = pers.isPreset;
                        return (
                          <motion.div key={pers.id} variants={staggerItem}>
                          <Card
                            className={`border-whisper flex flex-col justify-between relative group rounded-lg shadow-card transition-colors,shadow,ring hover:shadow-md ${selectedPersona === pers.id ? "bg-canvas border-accent/30" : "bg-surface"}`}
                          >
                            <CardHeader className="pb-3 pt-5 px-5">
                              <div className="flex justify-between items-start">
                                <Badge
                                  variant="secondary"
                                  className={
                                    isPreset
                                      ? "bg-whisper border border-transparent text-[10px] text-steel font-semibold tracking-widest uppercase"
                                      : "bg-canvas text-accent border border-accent/20 text-[10px] uppercase tracking-widest font-semibold"
                                  }
                                >
                                  {isPreset ? "Preset Default" : "Custom Built"}
                                </Badge>

                                {!isPreset && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted hover:text-ink hover:bg-hover rounded-xl"
                                      onClick={() => handleEditPersona(pers)}
                                    >
                                      <GearSix className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted hover:text-error hover:bg-error/10 rounded-xl"
                                      onClick={() => {
                                        setCustomPersonas((prev) =>
                                          prev.filter((p) => p.id !== pers.id),
                                        );
                                        if (selectedPersona === pers.id)
                                          setSelectedPersona("p1");
                                        toast.info(
                                          `Persona "${pers.name}" deleted.`,
                                        );
                                      }}
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <CardTitle className="text-base font-bold font-display mt-3 text-ink tracking-tight">
                                {pers.name}
                              </CardTitle>
                              <CardDescription className="text-xs text-steel min-h-[32px] leading-snug mt-1">
                                {pers.description || "No description provided."}
                              </CardDescription>
                            </CardHeader>

                            <CardContent className="pb-4 px-5 text-[11px] font-mono leading-snug text-steel max-h-[100px] overflow-y-auto">
                              <div className="bg-canvas p-3 rounded-md border border-whisper">
                                {pers.systemPrompt}
                              </div>
                            </CardContent>

                            <CardFooter className="py-3 px-5 border-t border-whisper bg-surface flex justify-between items-center rounded-b-2xl">
                              {!isPreset && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-muted hover:text-accent font-semibold rounded-xl hover:bg-surface border border-transparent hover:border-accent/20"
                                  onClick={() => handleSharePersona(pers)}
                                >
                                  <ShareNetwork className="w-3.5 h-3.5 mr-1" />
                                  Share
                                </Button>
                              )}
                              {isPreset && <div />}
                              <Button
                                size="sm"
                                variant={
                                  selectedPersona === pers.id
                                    ? "secondary"
                                    : "ghost"
                                }
                                className={`text-xs font-semibold rounded-xl px-5 transition-colors,shadow,ring ${selectedPersona === pers.id ? "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover shadow-md" : "text-steel hover:bg-hover hover:text-ink"}`}
                                onClick={() => {
                                  setSelectedPersona(pers.id);
                                  toast.success(
                                    `Active Persona role set to: "${pers.name}"`,
                                  );
                                }}
                              >
                                {selectedPersona === pers.id
                                  ? "✓ Currently Active"
                                  : "Adopt Persona"}
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                        );
                      })}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: DURABLE HISTORY */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="bg-surface p-6 border border-whisper rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-card">
                <div>
                  <h3 className="text-xl font-bold font-display tracking-tight text-ink">
                    Prompt Engineering Logs
                  </h3>
                  <p className="text-xs text-steel mt-0.5">
                    Durable local history tracking optimization scores and
                    metadata over your session.
                  </p>
                </div>

                {historyList.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-steel hover:text-ink rounded-xl font-semibold cursor-pointer"
                      onClick={() => {
                        // Download as JSON
                        const blob = new Blob(
                          [JSON.stringify(historyList, null, 2)],
                          { type: "application/json" },
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "openprompter-history.json";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                        toast.success("History exported as JSON");
                      }}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-steel hover:text-ink rounded-xl font-semibold cursor-pointer"
                      onClick={() => {
                        const md = historyList
                          .map(
                            (h) =>
                              `# ${h.promptType} - ${h.createdAt}\n\n**Original:**\n${h.originalPrompt}\n\n**Optimized:**\n${h.optimizedPrompt}\n\n**Improvements:**\n${(h.improvements || []).map((i) => `- ${i}`).join("\n")}\n\n**Confidence:** ${h.confidenceScore}%  \n---\n`,
                          )
                          .join("\n");
                        const blob = new Blob([md], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "openprompter-history.md";
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                        toast.success("History exported as Markdown");
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      MD
                    </Button>
                    <>
                      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                        <AlertDialogContent className="bg-surface border-none">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-ink font-display tracking-tight">Clear History</AlertDialogTitle>
                            <AlertDialogDescription className="text-steel text-sm leading-snug">
                              Wipe all local prompt history? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-semibold text-steel">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl font-semibold bg-error text-destructive-foreground hover:bg-error/80"
                              onClick={() => {
                                setHistoryList([]);
                                toast.success("History cache cleared pristine!");
                              }}
                            >
                              Yes, Clear Everything
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-error hover:text-error hover:bg-error/10 border-error/20 self-end md:self-auto rounded-xl font-semibold shadow-card"
                        onClick={() => setShowClearConfirm(true)}
                      >
                        <Trash className="w-3.5 h-3.5 mr-1.5" />
                        Clear
                      </Button>
                    </>
                  </>
                )}
              </div>

              {/* HISTORY LIST */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {historyList.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={staggerItem}
                  >
                  <div
                    className="border border-whisper rounded-lg bg-surface p-6 hover:shadow-md transition-colors,shadow,ring cursor-pointer group"
                    onClick={() => setSelectedHistoryItem(item)}
                  >
                    {/* Upper Metadata */}
                    <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-whisper text-steel border-none text-[10px] uppercase tracking-widest font-mono font-semibold px-3 py-1">
                          {item.promptType}
                        </Badge>
                        <span className="text-[10px] text-muted font-mono tracking-wider font-semibold">
                          Optimized {item.createdAt}
                        </span>
                        {item.personaName && (
                          <span className="text-[10px] text-accent hover:text-accent-hover font-mono font-semibold tracking-wider">
                            Adopted: {item.personaName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-canvas px-3 py-1 rounded-lg border border-whisper shadow-inner">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-steel font-semibold">
                            Score
                          </span>
                          <span className="text-sm font-black font-mono text-ink">
                            {item.confidenceScore}%
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity,color hover:bg-error/10 rounded-xl"
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Excerpt Split comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-whisper pt-4">
                      <div>
                        <span className="text-[10px] font-mono text-muted font-bold tracking-widest uppercase block mb-1">
                          Original Draft Excerpt
                        </span>
                        <div className="p-4 bg-canvas rounded-md text-xs font-mono text-steel line-clamp-2 select-none border border-whisper shadow-inner leading-snug">
                          {item.originalPrompt}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-ink font-bold tracking-widest uppercase block mb-1">
                          Engineered Prompt Excerpt
                        </span>
                        <div className="p-4 bg-accent text-accent-foreground rounded-md text-xs font-mono line-clamp-2 select-none border border-edges shadow-md leading-snug">
                          {item.optimizedPrompt}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dashed border-whisper">
                      <span className="text-[10px] text-muted font-mono flex items-center gap-1 font-semibold tracking-widest uppercase hover:text-ink transition-colors">
                        Click details for full inspection and config tool{" "}
                        <CaretRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                  </motion.div>
                ))}

                {historyList.length === 0 && (
                  <div className="border border-dashed border-whisper rounded-xl p-12 text-center text-steel bg-surface">
                    <img src={emptyHistoryAsset} alt="No history" className="w-32 h-auto mx-auto mb-4 opacity-60" width={128} height={128} />
                    <h4 className="text-sm font-bold text-ink tracking-tight">
                      No prompt history found
                    </h4>
                    <p className="text-xs text-steel max-w-sm mx-auto mt-1 leading-snug">
                      Once you optimize prompts, they will be saved securely in
                      this view so you do not lose any modifications.
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* TAB 5: ABOUT AND GUIDE */}
          {activeTab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <Card className="border border-whisper bg-surface shadow-card rounded-xl">
                <CardHeader className="p-8 border-b border-whisper pb-6">
                  <div className="flex items-center gap-4 mb-3">
                    <img src={openprompterIcon} alt="OpenPrompter" className="w-14 h-14 rounded-xl shadow-card" width={56} height={56} />
                    <div>
                      <CardTitle className="text-2xl font-bold font-display tracking-tight text-ink">
                        About OpenPrompter
                      </CardTitle>
                      <CardDescription className="text-xs text-steel bg-canvas uppercase tracking-widest font-mono font-semibold py-1.5 px-3 rounded-xl inline-block mt-2 w-max">
                        Zero Limits. Zero Telemetry. 100% Free.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 py-6 space-y-8 text-sm text-steel leading-snug">
                  <p className="text-base text-ink font-medium tracking-tight">
                    OpenPrompter was constructed specifically to circumvent
                    artificial limitations and paywalls present in consumer
                    prompt optimization tools. We achieve this through extreme
                    architectural transparency.
                  </p>

                  <div className="p-6 bg-accent text-accent-foreground border border-edges rounded-lg space-y-3 shadow-card">
                    <h4 className="text-xs font-bold text-accent-foreground flex items-center gap-2 uppercase font-mono tracking-widest">
                      <Lock className="w-4 h-4 text-emerald-400" /> Bring Your
                      Own Key Architecture
                    </h4>
                    <p className="text-xs text-muted leading-snug font-mono">
                      By using your own API key from any supported provider, the
                      optimization pipeline runs through a stateless backend proxy
                      that forwards requests without storing keys or prompt data.
                    </p>
                  </div>

                  <h3 className="text-lg font-bold font-display border-b border-whisper pb-3 pt-2 text-ink tracking-tight">
                    How to configure your API connection
                  </h3>
                  <ol className="list-decimal list-outside ms-4 space-y-4 text-xs text-steel">
                    <li className="pl-4">
                      Click the <strong>Key icon</strong> in the top navigation
                      bar to open the BYOK Engine settings.
                    </li>
                    <li className="pl-4">
                      Select your preferred API provider from the grid:
                      OpenAI, DeepSeek, Anthropic, or Custom endpoint.
                    </li>
                    <li className="pl-4">
                      Generate and copy your API key from the provider's
                      developer console (linked for your convenience).
                    </li>
                    <li className="pl-4">
                      Optionally override the default endpoint URL or enter
                      a custom model name.
                    </li>
                    <li className="pl-4">
                      Click <strong>Save Configuration</strong> and start
                      optimizing prompts immediately.
                    </li>
                  </ol>

                  <h3 className="text-lg font-bold font-display border-b border-whisper pb-3 mt-4 pt-2 text-ink tracking-tight">
                    LLM Structuring Framework
                  </h3>
                  <p className="text-xs text-steel leading-snug">
                    Under the hood, OpenPrompter directs your configured LLM using strict
                    declarative JSON logic rules defining precise role
                    configurations, specific constraint mapping, structured
                    iteration schemas, and calculation margins: all to output
                    pristine LLM-ingestible context blocks far superior to
                    standard human draft prose.
                  </p>
                </CardContent>
                <CardFooter className="border-t border-whisper p-6 flex justify-between items-center text-xs text-muted font-mono uppercase tracking-widest font-bold">
                  <span>OpenPrompter Version 1.0.0</span>
                  <a
                    href="https://github.com/Owie6789/OpenPrompter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent-hover underline transition-colors"
                  >
                    Github Source
                  </a>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-whisper bg-surface py-8 text-center text-xs text-steel mt-12 shadow-inner">
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
        <div className="fixed bottom-6 right-6 z-50 bg-accent text-accent-foreground text-xs font-semibold px-4 py-2.5 rounded-lg shadow-card animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check className="w-3.5 h-3.5 mr-1.5 inline" />
          Share link copied!
        </div>
      )}
    </div>
  );
}
