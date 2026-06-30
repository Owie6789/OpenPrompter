import { motion } from "motion/react";
import { toast } from "sonner";
import { Download, FileText, Trash, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { type PromptHistoryItem } from "@/src/types";
import emptyHistoryAsset from "@/assets/op-appasset-emptyhistorystate.png";

type HistoryViewProps = Readonly<{
  historyList: PromptHistoryItem[];
  setHistoryList: React.Dispatch<React.SetStateAction<PromptHistoryItem[]>>;
  showClearConfirm: boolean;
  setShowClearConfirm: (open: boolean) => void;
  setSelectedHistoryItem: (item: PromptHistoryItem | null) => void;
  handleDeleteHistory: (id: string, e: React.MouseEvent) => void;
}>;

export function HistoryView({
  historyList,
  setHistoryList,
  showClearConfirm,
  setShowClearConfirm,
  setSelectedHistoryItem,
  handleDeleteHistory,
}: HistoryViewProps) {
  const reducedMotion = useReducedMotion();

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

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      <div className="bg-surface p-6 border border-whisper rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-card">
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
                  .map((h) => {
                    const improvementsList = (h.improvements || []).map((i) => `- ${i}`).join("\n");
                    return `# ${h.promptType} - ${h.createdAt}\n\n**Original:**\n${h.originalPrompt}\n\n**Optimized:**\n${h.optimizedPrompt}\n\n**Improvements:**\n${improvementsList}\n\n**Confidence:** ${h.confidenceScore}%  \n---\n`;
                  })
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
            role="button"
            tabIndex={0}
            className="border border-whisper rounded-xl bg-surface p-6 shadow-card cursor-pointer group"
            onClick={() => setSelectedHistoryItem(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedHistoryItem(item);
              }
            }}
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
                <div className="flex items-center gap-1.5 bg-canvas px-3 py-1 rounded-xl border border-whisper shadow-inner">
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
                  className="h-8 w-8 text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-[opacity,color] hover:bg-error/10 rounded-xl"
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
                <div className="p-4 bg-canvas rounded-xl text-xs font-mono text-steel line-clamp-2 select-none border border-whisper shadow-inner leading-snug">
                  {item.originalPrompt}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-ink font-bold tracking-widest uppercase block mb-1">
                  Engineered Prompt Excerpt
                </span>
                <div className="p-4 bg-accent text-accent-foreground rounded-xl text-xs font-mono line-clamp-2 select-none border border-edges shadow-md leading-snug">
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
  );
}
