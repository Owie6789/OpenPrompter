import { Key, ArrowSquareOut, Cpu, Info, Check, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  { id: "custom", label: "Custom", endpoint: "" },
] as const;

const providerKeyUrls: Record<string, string> = {
  openai: "https://platform.openai.com/api-keys",
  deepseek: "https://platform.deepseek.com/api_keys",
  anthropic: "https://console.anthropic.com/settings/keys",
};

const providerDisplayNames: Record<string, string> = {
  openai: "OpenAI",
  deepseek: "DeepSeek",
  anthropic: "Anthropic",
};

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
  handleSaveApiKey,
}: Readonly<ByokDialogProps>) {
  const providerKeyUrl = providerKeyUrls[providerInputVal] ?? null;
  const providerLabel = providerDisplayNames[providerInputVal] ?? "API";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border-none text-ink sm:max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl rounded-xl p-0">
        <div className="p-5 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold font-display flex items-center gap-2 tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
                <Key className="w-4 h-4 text-ink" />
              </div>
              BYOK Engine & Keys
            </DialogTitle>
            <DialogDescription className="text-xs text-steel leading-snug mt-2 p-4 bg-canvas rounded-lg border border-whisper">
              Supply your own API connection. Keys are stored in browser
              local storage and sent to our stateless backend proxy for
              each prompt optimization request — they are not stored or
              logged on the server.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* PROVIDER SELECTOR */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                API Provider
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROVIDER_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProviderInputVal(p.id);
                      if (p.endpoint) setEndpointInputVal(p.endpoint);
                    }}
                    className={`text-xs font-semibold py-2.5 px-3 rounded-md border transition-colors,shadow ${
                      providerInputVal === p.id
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-surface text-steel border-whisper hover:border-accent/40"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="byok-api-key" className="text-[11px] font-semibold text-steel uppercase tracking-widest">
                  API Key
                </label>
                {providerKeyUrl ? (
                  <a
                    href={providerKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1 font-semibold"
                  >
                    Get {providerLabel} Key <ArrowSquareOut className="w-2.5 h-2.5" />
                  </a>
                ) : null}
              </div>
              <Input
                id="byok-api-key"
                type="password"
                placeholder="sk-..."
                value={apiKeyInputVal}
                onChange={(e) => setApiKeyInputVal(e.target.value)}
                className="bg-surface border-whisper font-mono text-sm leading-none h-12 rounded-md shadow-card focus:ring-accent"
              />
            </div>

            {/* Custom Endpoint URL */}
            <div className="space-y-2">
                <label htmlFor="byok-endpoint" className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                  Custom Endpoint (Base URL)
                </label>
                <Input
                  id="byok-endpoint"
                  type="text"
                  placeholder="E.g., https://api.deepseek.com/v1"
                  value={endpointInputVal}
                  onChange={(e) => setEndpointInputVal(e.target.value)}
                  className="bg-surface border-whisper font-mono text-xs h-11 rounded-md shadow-card focus:ring-accent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEndpointInputVal("https://api.deepseek.com/v1")
                    }
                    className="text-[10px] font-semibold bg-canvas border border-whisper px-2.5 py-1 rounded-md text-steel hover:bg-hover transition-colors"
                  >
                    DeepSeek Preset
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEndpointInputVal("https://api.openai.com/v1")
                    }
                    className="text-[10px] font-semibold bg-canvas border border-whisper px-2.5 py-1 rounded-md text-steel hover:bg-hover transition-colors"
                  >
                    OpenAI Preset
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEndpointInputVal("http://localhost:1234/v1")
                    }
                    className="text-[10px] font-semibold bg-canvas border border-whisper px-2.5 py-1 rounded-md text-steel hover:bg-hover transition-colors"
                  >
                    Local Host
                  </button>
                </div>
              </div>

            {/* Custom Model Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="byok-model" className="text-[11px] font-semibold text-steel uppercase tracking-widest">
                  Model Override
                </label>
                {availableModels.length > 0 && (
                  <span className="text-[10px] text-muted font-mono">
                    {availableModels.length} models
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="byok-model"
                    type="text"
                    placeholder="Search or type model ID..."
                    value={customModelInputVal}
                    onChange={(e) => setCustomModelInputVal(e.target.value)}
                    className="bg-surface border-whisper font-mono text-xs h-11 rounded-md shadow-card focus:ring-accent pl-9"
                  />
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Fetched model list — search-filtered, compact scroll */}
              {availableModels.length > 0 && (
                <div className="border border-whisper rounded-md bg-canvas overflow-hidden">
                  <div className="max-h-36 overflow-y-auto overscroll-contain divide-y divide-whisper/50">
                    {availableModels
                      .filter((m) =>
                        !customModelInputVal ||
                        m.id.toLowerCase().includes(customModelInputVal.toLowerCase()) ||
                        m.name.toLowerCase().includes(customModelInputVal.toLowerCase())
                      )
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setCustomModelInputVal(m.id);
                            setCustomModel(m.id);
                          }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 text-[11px] font-mono transition-colors hover:bg-surface ${
                            customModelInputVal === m.id
                              ? "bg-accent/5 text-accent font-semibold"
                              : "text-steel"
                          }`}
                        >
                          <span className="truncate mr-2">{m.name}</span>
                          {customModelInputVal === m.id && (
                            <Check className="w-3 h-3 shrink-0 text-accent" />
                          )}
                        </button>
                      ))}
                    {availableModels.filter((m) =>
                      !customModelInputVal ||
                      m.id.toLowerCase().includes(customModelInputVal.toLowerCase()) ||
                      m.name.toLowerCase().includes(customModelInputVal.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-4 text-[11px] text-muted text-center">
                        No models match your filter.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] p-4 rounded-md bg-canvas border border-whisper text-steel leading-snug font-medium">
              <span className="font-bold flex items-center gap-1.5 uppercase tracking-widest text-[10px] mb-1">
                <Info className="w-3 h-3" />
                <span>Direct Endpoint Proxy</span>
              </span>
              <p className="text-[11px] p-4 rounded-md bg-canvas border border-whisper text-steel leading-snug font-medium">
                Keys and preferences are sent securely to our stateless backend
                proxy to optimize prompt structures without client-side
                exposure. Evaluates using standard REST flows.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 bg-canvas p-6 border-t border-whisper sm:justify-end flex-col sm:flex-row shadow-inner">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-md font-semibold text-steel"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md text-error border-error/20 hover:bg-error/10 font-semibold"
            onClick={() => {
              handleSaveApiKey("", "", "openai", "");
              onOpenChange(false);
            }}
          >
            <X className="w-3 h-3 mr-1" />
            Clear Config
          </Button>
          <Button
            size="sm"
            className="rounded-md bg-accent text-accent-foreground hover:bg-accent-hover font-semibold shadow-sm px-6"
            onClick={() =>
              handleSaveApiKey(
                apiKeyInputVal,
                endpointInputVal,
                providerInputVal,
                customModelInputVal,
              )
            }
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
