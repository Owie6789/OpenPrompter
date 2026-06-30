import {
  Check,
  Copy,
  Sliders,
  Trash,
  UserCheck,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PromptHistoryItem } from "@/src/types";

interface Props {
  selectedHistoryItem: PromptHistoryItem | null;
  onOpenChange: (open: boolean) => void;
  handleDeleteHistory: (id: string) => void;
  handleCopyToClipboard: (text: string, type: string) => void;
}

export default function HistoryDetailDialog({
  selectedHistoryItem,
  onOpenChange,
  handleDeleteHistory,
  handleCopyToClipboard,
}: Readonly<Props>) {
  if (!selectedHistoryItem) return null;

  return (
    <Dialog
      open={!!selectedHistoryItem}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <DialogContent className="bg-surface border-none text-ink sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl p-0 shadow-2xl">
        <div className="p-5 sm:p-8">
          <DialogHeader>
            <div className="flex justify-between items-center flex-wrap gap-2 text-xs mb-2">
              <Badge
                variant="secondary"
                className="bg-whisper text-steel border-none px-3 py-1 uppercase tracking-widest font-mono font-semibold"
              >
                {selectedHistoryItem.promptType}
              </Badge>
              <span className="text-muted font-mono tracking-widest uppercase font-semibold">
                Engineered {selectedHistoryItem.createdAt}
              </span>

              <div className="flex items-center gap-1.5 bg-canvas border border-whisper px-3 py-1.5 rounded-xl shadow-inner">
                <span className="text-[10px] text-steel uppercase font-mono font-bold tracking-widest">
                  Confidence Score
                </span>
                <span className="text-sm font-black font-mono text-ink">
                  {selectedHistoryItem.confidenceScore}%
                </span>
              </div>
            </div>

            <DialogTitle className="text-2xl font-bold font-display mt-4 tracking-tight text-ink">
              Prompt Audit Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-6">
            {/* Splitted view comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* original */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest font-mono block">
                  Original Draft
                </span>
                <div className="p-5 rounded-xl bg-canvas border border-whisper text-xs font-mono leading-snug max-h-[220px] overflow-y-auto whitespace-pre-wrap select-all text-steel shadow-inner">
                  {selectedHistoryItem.originalPrompt}
                </div>
              </div>

              {/* optimized */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-ink uppercase tracking-widest font-mono block">
                  Optimized Framework
                </span>
                <div className="p-5 rounded-xl bg-accent text-accent-foreground border border-edges text-xs font-mono leading-snug max-h-[220px] overflow-y-auto whitespace-pre-wrap select-all selection:bg-accent/30 shadow-card">
                  {selectedHistoryItem.optimizedPrompt}
                </div>
              </div>
            </div>

            {/* Improvements details */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-steel uppercase tracking-widest font-mono">
                Improvements Applied
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedHistoryItem.improvements.map((imp, i) => (
                  <li
                    key={`${imp.slice(0, 80)}-${i}`}
                    className="text-xs p-4 rounded-xl bg-surface border border-whisper text-steel leading-snug flex items-start gap-3 shadow-card"
                  >
                    <span className="text-muted shrink-0 font-bold font-mono">
                      {(i + 1).toString().padStart(2, "0")}.
                    </span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Changes check */}
            {selectedHistoryItem.keyChanges &&
              selectedHistoryItem.keyChanges.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-bold text-steel uppercase tracking-widest font-mono">
                    Changes Confirmation
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedHistoryItem.keyChanges.map((ch, i) => (
                      <Badge
                        key={`${ch.slice(0, 80)}-${i}`}
                        variant="outline"
                        className="bg-surface text-[11px] text-steel border border-whisper shadow-card px-3 py-1 font-mono"
                      >
                        <Check className="w-3 h-3 mr-1 text-emerald-500" />{" "}
                        {ch}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Advanced Parameters Metadata */}
            {(selectedHistoryItem.personaName ||
              selectedHistoryItem.customInstructions) && (
              <div className="text-[10px] font-mono border-t border-dashed border-whisper pt-4 text-steel flex flex-wrap gap-5 font-semibold tracking-widest uppercase">
                {selectedHistoryItem.personaName && (
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3" /> Adopted Persona:{" "}
                    {selectedHistoryItem.personaName}
                  </span>
                )}
                {selectedHistoryItem.customInstructions && (
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3 h-3" /> Custom Constraints
                    Applied
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-whisper bg-canvas p-6 flex flex-col sm:flex-row items-center justify-between shadow-inner">
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-error hover:text-error border-error/20 hover:bg-error/10 font-semibold rounded-xl"
            onClick={() => {
              handleDeleteHistory(selectedHistoryItem.id);
              onOpenChange(false);
            }}
          >
            <Trash className="w-3 h-3 mr-1" />
            Delete from Logs
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-semibold text-steel"
            >
              Close
            </Button>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent-hover text-xs shadow-sm rounded-xl px-6 font-semibold"
              onClick={() =>
                handleCopyToClipboard(
                  selectedHistoryItem.optimizedPrompt,
                  "optimized",
                )
              }
            >
              <Copy className="w-3 h-3 mr-1.5" />
              Copy Optimized Prompt
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
