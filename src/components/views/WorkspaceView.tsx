import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Sparkle,
  ArrowCounterClockwise,
  Sliders,
  Cpu,
  ArrowsClockwise,
  Check,
  Copy,
  CaretRight,
  MagicWand,
  ShieldCheck,
  Lock,
  Lightbulb,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import type { CustomPersona, OptimizationResult } from "@/src/types";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";

type AvailableModel = { id: string; name: string };

type WorkspaceViewProps = Readonly<{
  promptInput: string;
  setPromptInput: (val: string) => void;
  customInstructions: string;
  setCustomInstructions: (val: string) => void;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  setCustomModel: (val: string) => void;
  setCustomModelInputVal: (val: string) => void;
  selectedPersona: string;
  setSelectedPersona: (val: string) => void;
  allPersonas: CustomPersona[];
  availableModels: AvailableModel[];
  modelsLoading: boolean;
  fetchAvailableModels: () => void;
  setShowApiKeyDialog: (show: boolean) => void;
  isOptimizing: boolean;
  optimizedResult: OptimizationResult | null;
  progressStep: string;
  copiedState: "original" | "optimized" | "markdown" | "json" | null;
  handleOptimizePrompt: () => void;
  handleCopyToClipboard: (text: string, type: string) => void;
  getMarkdownText: (result: OptimizationResult) => string;
  handleResetWorkspace: () => void;
  loadingAsset: string;
  setActiveTab: (tab: string) => void;
}>;

export function WorkspaceView({
  promptInput,
  setPromptInput,
  customInstructions,
  setCustomInstructions,
  selectedModel,
  setSelectedModel,
  setCustomModel,
  setCustomModelInputVal,
  selectedPersona,
  setSelectedPersona,
  allPersonas,
  availableModels,
  modelsLoading,
  fetchAvailableModels,
  setShowApiKeyDialog,
  isOptimizing,
  optimizedResult,
  progressStep,
  copiedState,
  handleOptimizePrompt,
  handleCopyToClipboard,
  getMarkdownText,
  handleResetWorkspace,
  loadingAsset,
  setActiveTab,
}: WorkspaceViewProps) {
  const reducedMotion = useReducedMotion();

  const confidenceColorClass = (score: number): string => {
    if (score >= 90) return "text-ink";
    if (score >= 70) return "text-steel";
    return "text-amber-500";
  };

  const modelStatusLabel = modelsLoading
    ? "loading"
    : availableModels.length > 0
      ? "available"
      : "none";

  return (
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
                  <CardTitle className="text-2xl font-bold flex items-center gap-2 font-display text-ink tracking-tight" style={{ textWrap: "balance" }}>
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
                    <span className="text-[10px] text-muted font-mono tracking-wider tabular-nums">
                      {promptInput.length}/5000 chars
                    </span>
                  </div>
                  <Textarea
                    id="prompt-input"
                    placeholder="E.g., Write a draft story about a lost robot... OR Refactor this python class..."
                    className="min-h-[160px] lg:min-h-[220px] bg-canvas border-whisper font-mono text-sm leading-snug text-ink placeholder:text-muted focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors shadow-inner rounded-xl resize-none"
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

                {/* PARAMETERS SETTINGS */}
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
                          className="bg-surface border-whisper text-ink text-xs h-10 rounded-xl shadow-card focus:ring-accent focus:ring-offset-1"
                        />
                        <SelectContent className="bg-surface border-whisper text-ink rounded-xl shadow-elevated">
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
                        {modelStatusLabel === "loading" && (
                          <span className="flex items-center gap-1 text-[10px] text-muted">
                            <div className="w-2.5 h-2.5 rounded-xl border-2 border-muted border-t-transparent animate-spin" />
                            Loading models...
                          </span>
                        )}
                        {modelStatusLabel === "available" && (
                          <button
                            type="button"
                            onClick={() => setShowApiKeyDialog(true)}
                            className="tabular-nums text-[10px] text-accent hover:text-accent-hover font-semibold tracking-wider"
                          >
                            {availableModels.length} models
                          </button>
                        )}
                        {modelStatusLabel === "none" && (
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
                          setCustomModel(val);
                          setCustomModelInputVal(val);
                        }}
                        options={availableModels.length > 0
                          ? availableModels.map((m) => ({ value: m.id, label: m.name }))
                          : [{ value: "gpt-4o", label: "gpt-4o (default)" }]}
                      >
                        <SelectTrigger
                          icon={undefined}
                          placeholder={selectedModel || "Select model"}
                          className="bg-surface border-whisper text-ink text-xs h-10 rounded-xl shadow-card focus:ring-accent focus:ring-offset-1"
                        />
                        <SelectContent className="bg-surface border-whisper text-ink rounded-xl shadow-elevated max-h-60">
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

                  {/* MODEL MARQUEE — STICKY */}
                  {availableModels.length > 0 && (
                    <div className="sticky top-0 z-10 relative overflow-hidden rounded-xl bg-canvas border border-whisper py-2.5 px-4 shadow-inner">
                      <div className="flex items-center gap-2 text-[11px] text-muted mb-1.5">
                        <Cpu className="w-3 h-3 text-accent" />
                        <span className="font-semibold uppercase tracking-wider">Available Models</span>
                        <span className="text-[10px] tabular-nums">· {availableModels.length}</span>
                      </div>
                      <div className="overflow-hidden">
                        <motion.div
                          className="flex gap-3 whitespace-nowrap"
                          animate={reducedMotion ? undefined : { x: ["0%", "-50%"] }}
                          transition={reducedMotion ? undefined : { duration: 30, repeat: Infinity, ease: "linear" }}
                        >
                          {/* Duplicate array for seamless loop */}
                          {[...availableModels, ...availableModels].map((m, i) => (
                            <button
                              key={`${m.id}-${i}`}
                              onClick={() => {
                                setSelectedModel(m.id);
                                setCustomModel(m.id);
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
                      className="bg-surface border-whisper text-ink text-xs h-10 rounded-xl shadow-card focus-visible:ring-accent focus-visible:ring-offset-1 placeholder:text-muted"
                    />
                  </div>

            </CardContent>

              <CardFooter className="border-t border-whisper pt-5 pb-6 flex justify-end gap-3 bg-canvas rounded-b-xl px-6 mt-4">
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
          <div className="border border-whisper rounded-xl p-5 bg-surface shadow-card flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-canvas border border-whisper flex items-center justify-center shrink-0">
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
            <div className="border border-whisper rounded-xl bg-surface p-6 lg:p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px] lg:min-h-[450px] shadow-card">
              <img src={loadingAsset} alt="Optimizing..." className="w-48 h-auto opacity-80 mb-2" width={192} height={192} />
              <div className="space-y-4 w-full">
                <div className="skeleton-shimmer h-12 w-3/4 mx-auto border-none rounded-xl" />
                <div className="skeleton-shimmer h-4 w-1/2 mx-auto border-none rounded-xl" />
                <div className="skeleton-shimmer h-32 w-full border-none rounded-xl" />
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

              <Button
                variant="outline"
                className="text-steel hover:text-ink text-xs gap-1 rounded-xl border-whisper bg-surface active:-translate-y-px transition-colors"
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
                      <CardTitle className="text-xl font-bold font-display tracking-tight text-ink" style={{ textWrap: "balance" }}>
                        Optimization Analysis
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-2 bg-canvas px-4 py-2 rounded-xl shadow-inner border border-whisper">
                      <span className="text-[10px] text-steel uppercase font-mono tracking-widest font-semibold">
                        Confidence
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-base font-bold font-mono tracking-tight ${confidenceColorClass(optimizedResult.confidence_score)}`}
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
                            className="text-sm p-4 rounded-xl bg-surface border border-whisper text-steel leading-snug flex items-start gap-3 shadow-card"
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
              <Card className="border border-whisper bg-surface shadow-card rounded-xl relative overflow-hidden sticky bottom-4 z-10">
                  <CardHeader className="pb-4 pt-6 px-6 border-b border-whisper flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2 font-display tracking-tight text-ink" style={{ textWrap: "balance" }}>
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
                          className="px-3 py-1 text-[11px] text-steel hover:text-ink transition-colors font-mono font-semibold"
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
                          className="px-3 py-1 text-[11px] text-steel hover:text-ink transition-colors font-mono font-semibold"
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
                    <div className="bg-canvas p-6 font-mono text-sm leading-snug text-ink border-b border-whisper max-h-[380px] overflow-y-auto whitespace-pre-wrap selection:bg-accent/20">
                      {optimizedResult.optimized_prompt}
                    </div>
                  </CardContent>

                  <CardFooter className="py-4 flex justify-between bg-surface text-xs text-muted font-medium px-6 rounded-b-xl">
                    <span>Engineered via {selectedModel}</span>
                    <span className="flex items-center gap-1.5 text-steel tracking-tight">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Secure client-side execution
                    </span>
                  </CardFooter>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
