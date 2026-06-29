"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowSquareOut,
  Cpu,
  Check,
} from "@phosphor-icons/react";
import { TimedUndoAction } from "@/src/components/timed-undo-action";

interface ByokDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKeyInputVal: string;
  setApiKeyInputVal: (v: string) => void;
  endpointInputVal: string;
  setEndpointInputVal: (v: string) => void;
  providerInputVal: string;
  setProviderInputVal: (v: string) => void;
  customModelInputVal: string;
  setCustomModelInputVal: (v: string) => void;
  setCustomModel: (v: string) => void;
  availableModels: { id: string; name: string }[];
  modelsLoading?: boolean;
  handleSaveApiKey: (
    key: string,
    endpoint: string,
    provider: string,
    model: string,
  ) => void;
}

const PROVIDER_OPTIONS = [
  { id: "openai", label: "OpenAI", endpoint: "https://api.openai.com/v1" },
  { id: "deepseek", label: "DeepSeek", endpoint: "https://api.deepseek.com/v1" },
  { id: "anthropic", label: "Anthropic", endpoint: "https://api.anthropic.com/v1" },
  { id: "gemini", label: "Gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta" },
  { id: "custom", label: "Custom", endpoint: "" },
] as const;

const providerKeyUrls: Record<string, string> = {
  openai: "https://platform.openai.com/api-keys",
  deepseek: "https://platform.deepseek.com/api_keys",
  anthropic: "https://console.anthropic.com/settings/keys",
  gemini: "https://aistudio.google.com/apikey",
};

const providerDisplayNames: Record<string, string> = {
  openai: "OpenAI",
  deepseek: "DeepSeek",
  anthropic: "Anthropic",
  gemini: "Gemini",
};

function ProviderLogo({ provider, className = "w-4 h-4" }: Readonly<{ provider: string; className?: string }>) {
  switch (provider) {
    case "openai":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      );
    case "deepseek":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45" />
        </svg>
      );
    case "anthropic":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
        </svg>
      );
    case "gemini":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
  }
}

export default function ByokDialog({
  open,
  onOpenChange,
  apiKeyInputVal,
  setApiKeyInputVal,
  endpointInputVal,
  setEndpointInputVal,
  providerInputVal,
  setProviderInputVal,
  customModelInputVal,
  setCustomModelInputVal,
  setCustomModel,
  availableModels,
  modelsLoading = false,
  handleSaveApiKey,
}: Readonly<ByokDialogProps>) {
  const endpointRef = useRef<HTMLDivElement>(null);

  const providerKeyUrl = providerKeyUrls[providerInputVal] ?? null;
  const providerLabel = providerDisplayNames[providerInputVal] ?? "API";
  // Separate toggle state — independent of provider selection
  const [showEndpoint, setShowEndpoint] = useState(false);
  const previousProviderRef = useRef<string>("openai");

  const filteredModels = availableModels.filter((m) =>
    !customModelInputVal ||
    m.id.toLowerCase().includes(customModelInputVal.toLowerCase()) ||
    m.name.toLowerCase().includes(customModelInputVal.toLowerCase())
  );

  const handleProviderClick = useCallback((p: { id: string; endpoint: string }) => {
    setProviderInputVal(p.id);
    if (p.endpoint) {
      setEndpointInputVal(p.endpoint);
      setShowEndpoint(false);
    } else {
      setEndpointInputVal("");
      setShowEndpoint(true);
    }
  }, [setProviderInputVal, setEndpointInputVal]);

  const handleToggleEndpoint = useCallback(() => {
    setShowEndpoint(prev => {
      if (prev) {
        // Turning OFF — restore previous provider and its default endpoint
        const restoreTo = previousProviderRef.current || "openai";
        const matchedOption = PROVIDER_OPTIONS.find(p => p.id === restoreTo);
        setProviderInputVal(restoreTo);
        setEndpointInputVal(matchedOption?.endpoint ?? "");
      } else {
        // Turning ON — save current provider, switch to Custom, clear endpoint
        previousProviderRef.current = providerInputVal;
        setProviderInputVal("custom");
        setEndpointInputVal("");
      }
      return !prev;
    });
  }, [providerInputVal, setProviderInputVal, setEndpointInputVal]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* BG Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Glow Effects */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.3 },
            }}
            className="byok-dialog relative w-full max-w-lg max-h-[80vh] overflow-y-auto backdrop-blur-2xl rounded-2xl border-[5px] border-whisper bg-surface/80 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            {/* Header — sticky */}
            <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-xl px-6 pt-6 pb-4">
              <h2 className="text-lg font-bold font-display tracking-tight text-ink">
                API Configuration
              </h2>
              <p className="text-xs text-steel leading-snug mt-1">
                Keys stay in your browser and are proxied through our stateless backend.
              </p>
            </div>

            {/* Body */}
            <div className="byok-body px-6 py-5 space-y-6">
              {/* Provider Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-steel uppercase tracking-widest">
                    API Provider
                  </span>
                  {providerKeyUrl && (
                    <a
                      href={providerKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1 font-semibold transition-colors"
                    >
                      Get {providerLabel} Key <ArrowSquareOut className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                {/* Animated Pill Provider Selector — icons only */}
                <div className="relative flex gap-1 p-1 bg-canvas border border-whisper rounded-2xl">
                  {PROVIDER_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderClick(p)}
                      title={p.label}
                      className={`relative z-10 flex-1 flex items-center justify-center py-2.5 transition-colors duration-300 ${
                        providerInputVal === p.id
                          ? "text-ink"
                          : "text-steel hover:text-ink/70"
                      }`}
                    >
                      {providerInputVal === p.id && (
                        <motion.div
                          layoutId="providerPill"
                          className="absolute inset-0 rounded-xl bg-surface border border-whisper shadow-sm"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                      <span className="relative z-10">
                        <ProviderLogo provider={p.id} className="w-5 h-5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-whisper" />

              {/* API Key */}
              <div className="space-y-2">
                <label htmlFor="byok-api-key" className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                  API Key
                </label>
                <input
                  id="byok-api-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKeyInputVal}
                  onChange={(e) => setApiKeyInputVal(e.target.value)}
                  className="byok-input w-full rounded-2xl px-4 py-3 bg-canvas border border-whisper text-ink font-mono text-sm placeholder:text-muted outline-none focus-visible:outline-none transition-colors focus:border-accent/40"
                />
              </div>

              {/* Custom Endpoint Toggle */}
              <div ref={endpointRef} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                      Custom Endpoint
                    </span>
                    <p className="text-[10px] text-muted mt-0.5">
                      Override the default API base URL
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleEndpoint}
                    className={`w-10 h-6 rounded-full transition-colors duration-300 relative ${
                      showEndpoint
                        ? "bg-ink"
                        : "bg-surface-high"
                    }`}
                  >
                    <motion.div
                      animate={{ x: showEndpoint ? 18 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`absolute top-0.5 w-5 h-5 rounded-full ${
                        showEndpoint
                          ? "bg-surface"
                          : "bg-steel-bright"
                      }`}
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {showEndpoint && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <input
                        id="byok-endpoint"
                        type="text"
                        placeholder="https://your-api.com/v1"
                        value={endpointInputVal}
                        onChange={(e) => setEndpointInputVal(e.target.value)}
                        className="byok-input w-full rounded-2xl px-4 py-3 bg-canvas border border-whisper text-ink font-mono text-xs placeholder:text-muted outline-none focus-visible:outline-none transition-colors focus:border-accent/40"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-whisper" />

              {/* Model Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="byok-model" className="text-[11px] font-semibold text-steel uppercase tracking-widest">
                    Model
                  </label>
                  {modelsLoading ? (
                    <span className="text-[10px] text-accent font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full border border-accent border-t-transparent animate-spin" />
                      Fetching...
                    </span>
                  ) : availableModels.length > 0 ? (
                    <span className="text-[10px] text-muted font-mono tabular-nums">
                      {availableModels.length} models
                    </span>
                  ) : null}
                </div>

                <div className="relative">
                  <input
                    id="byok-model"
                    type="text"
                    placeholder="Search or type model ID..."
                    value={customModelInputVal}
                    onChange={(e) => setCustomModelInputVal(e.target.value)}
                    className="byok-input w-full rounded-2xl px-4 py-3 pl-9 bg-canvas border border-whisper text-ink font-mono text-xs placeholder:text-muted outline-none focus-visible:outline-none transition-colors focus:border-accent/40"
                  />
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>

                {/* Fetched model list */}
                {availableModels.length > 0 && (
                  <div className="border border-whisper rounded-2xl bg-canvas overflow-hidden">
                    <div className="max-h-36 overflow-y-auto divide-y divide-whisper/50">
                      {filteredModels.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setCustomModelInputVal(m.id);
                            setCustomModel(m.id);
                          }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2.5 text-[11px] font-mono transition-colors ${
                            customModelInputVal === m.id
                              ? "bg-accent/5 text-accent font-semibold"
                              : "text-steel hover:bg-surface"
                          }`}
                        >
                          <span className="truncate mr-2">{m.name}</span>
                          {customModelInputVal === m.id && (
                            <Check className="w-3 h-3 shrink-0 text-accent" />
                          )}
                        </button>
                      ))}
                      {filteredModels.length === 0 && (
                        <div className="px-3 py-4 text-[11px] text-muted text-center">
                          No models match your filter.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-canvas/90 backdrop-blur-xl border-t border-whisper px-6 py-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-steel border border-whisper hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <TimedUndoAction
                  initialSeconds={10}
                  deleteLabel="Clear All Data"
                  undoLabel="Cancel Deletion"
                  onConfirm={() => {
                    setApiKeyInputVal("");
                    setEndpointInputVal("");
                    setProviderInputVal("custom");
                    setCustomModelInputVal("");
                    setShowEndpoint(false);
                    try {
                      localStorage.removeItem("openprompter_byok_key");
                      localStorage.removeItem("openprompter_endpoint");
                      localStorage.removeItem("openprompter_custom_model");
                      localStorage.removeItem("openprompter_provider");
                    } catch { /* storage blocked */ }
                    onOpenChange(false);
                  }}
                />
              </div>
              <button
                onClick={() =>
                  handleSaveApiKey(
                    apiKeyInputVal,
                    endpointInputVal,
                    providerInputVal,
                    customModelInputVal,
                  )
                }
                className="px-6 py-2 rounded-xl text-sm font-bold bg-ink text-canvas hover:bg-highlight transition-all active:scale-[0.97]"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
