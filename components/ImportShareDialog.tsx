import { ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TemplateShareData, PersonaShareData } from "@/src/types";

type ImportData =
  | {
      type: "template";
      data: TemplateShareData;
    }
  | {
      type: "persona";
      data: PersonaShareData;
    };

interface Props {
  importData: ImportData | null;
  onOpenChange: (open: boolean) => void;
  handleCancelImport: () => void;
  handleConfirmImport: () => void;
}

export default function ImportShareDialog({
  importData,
  onOpenChange,
  handleCancelImport,
  handleConfirmImport,
}: Readonly<Props>) {
  return (
    <Dialog open={!!importData} onOpenChange={onOpenChange}>
      {importData && (
        <DialogContent className="bg-surface border-none text-ink sm:max-w-md rounded-xl p-0 shadow-2xl">
          <div className="p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-display flex items-center gap-2 tracking-tight">
                <ShareNetwork className="w-5 h-5" />
                Import Shared {importData.type === "template" ? "Template" : "Persona"}
              </DialogTitle>
              <DialogDescription className="text-xs text-steel mt-3 p-4 bg-canvas rounded-md border border-whisper leading-snug">
                Someone shared a {importData.type} with you. Review the details below and confirm to add it to your workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                  Name
                </p>
                <div className="p-3 bg-surface border border-whisper rounded-md text-sm font-medium text-ink">
                  {importData.data.name}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                  Description
                </p>
                <div className="p-3 bg-surface border border-whisper rounded-md text-xs text-steel leading-snug">
                  {importData.data.description || "No description"}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                  {importData.type === "template" ? "Prompt Text" : "System Prompt"}
                </p>
                <div className="p-3 bg-canvas border border-whisper rounded-md text-xs font-mono text-steel leading-snug max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                  {importData.type === "template"
                    ? importData.data.promptText
                    : importData.data.systemPrompt}
                </div>
              </div>

              {importData.type === "template" && importData.data.category && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-steel uppercase tracking-widest block">
                    Category
                  </p>
                  <div className="p-3 bg-surface border border-whisper rounded-md text-xs font-medium text-steel">
                    {importData.data.category}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 bg-canvas p-6 border-t border-whisper shadow-inner">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelImport}
              className="rounded-md font-semibold text-steel"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent-hover text-xs shadow-sm rounded-md px-6 font-semibold"
              onClick={handleConfirmImport}
            >
              Import {importData.type === "template" ? "Template" : "Persona"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
