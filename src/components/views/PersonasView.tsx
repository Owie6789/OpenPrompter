import { motion } from "motion/react";
import { toast } from "sonner";
import { GearSix, PlusCircle, Trash, ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { PRESET_PERSONAS } from "@/src/data";
import type { CustomPersona } from "@/src/types";

type PersonasViewProps = {
  customPersonas: CustomPersona[];
  setCustomPersonas: React.Dispatch<React.SetStateAction<CustomPersona[]>>;
  selectedPersona: string;
  setSelectedPersona: (id: string) => void;
  editingPersona: CustomPersona | null;
  setEditingPersona: (persona: CustomPersona | null) => void;
  newPersonaName: string;
  setNewPersonaName: (val: string) => void;
  newPersonaDescription: string;
  setNewPersonaDescription: (val: string) => void;
  newPersonaPrompt: string;
  setNewPersonaPrompt: (val: string) => void;
  personaSearch: string;
  setPersonaSearch: (val: string) => void;
  handleSaveCustomPersona: (e: React.FormEvent) => void;
  handleSharePersona: (pers: CustomPersona) => void;
};

export function PersonasView({
  customPersonas,
  setCustomPersonas,
  selectedPersona,
  setSelectedPersona,
  editingPersona,
  setEditingPersona,
  newPersonaName,
  setNewPersonaName,
  newPersonaDescription,
  setNewPersonaDescription,
  newPersonaPrompt,
  setNewPersonaPrompt,
  personaSearch,
  setPersonaSearch,
  handleSaveCustomPersona,
  handleSharePersona,
}: PersonasViewProps) {
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

  const allPersonas = [...PRESET_PERSONAS, ...customPersonas];

  const handleEditPersona = (pers: CustomPersona) => {
    setEditingPersona(pers);
    setNewPersonaName(pers.name);
    setNewPersonaDescription(pers.description);
    setNewPersonaPrompt(pers.systemPrompt);
  };

  return (
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
          <Card className="border-whisper bg-surface shadow-card rounded-xl sticky top-24">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-xl font-bold font-display flex items-center gap-2 text-ink tracking-tight" style={{ textWrap: "balance" }}>
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
                      className="bg-surface border-whisper h-10 text-xs rounded-xl focus:ring-accent shadow-card"
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
                      value={newPersonaDescription}
                      onChange={(e) =>
                        setNewPersonaDescription(e.target.value)
                      }
                      className="bg-surface border-whisper h-10 text-xs rounded-xl focus:ring-accent shadow-card"
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
                      className="bg-surface border-whisper text-xs font-mono rounded-xl focus:ring-accent shadow-card resize-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 border-t border-whisper pt-4 px-6 pb-6 bg-canvas rounded-b-xl mt-4">
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
                    disabled={!newPersonaDescription.trim()}
                    className="bg-accent text-accent-foreground hover:bg-accent-hover text-xs rounded-xl px-5 shadow-md"
                  >
                    {editingPersona ? "Save Updates" : "Create Persona"}
                  </Button>
                </CardFooter>
              </form>
          </Card>
        </div>

        {/* RIGHT: PERSONAS LIST GRID */}
        <div className="flex-1 space-y-4">
          <div className="bg-surface p-5 border border-whisper rounded-xl flex items-center justify-between shadow-card">
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
              className="max-w-[180px] h-9 text-xs bg-canvas border-whisper rounded-xl"
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
                    className={`border-whisper flex flex-col justify-between relative group rounded-xl shadow-card ${selectedPersona === pers.id ? "bg-canvas border-accent/30" : "bg-surface"}`}
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

                      <CardTitle className="text-base font-bold font-display mt-3 text-ink tracking-tight" style={{ textWrap: "balance" }}>
                        {pers.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-steel min-h-[32px] leading-snug mt-1">
                        {pers.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-4 px-5 text-[11px] font-mono leading-snug text-steel max-h-[100px] overflow-y-auto">
                      <div className="bg-canvas p-3 rounded-xl border border-whisper">
                        {pers.systemPrompt}
                      </div>
                    </CardContent>

                    <CardFooter className="py-3 px-5 border-t border-whisper bg-surface flex justify-between items-center rounded-b-xl">
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
                        className={`text-xs font-semibold rounded-xl px-5 transition-colors ${selectedPersona === pers.id ? "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover" : "text-steel hover:bg-hover hover:text-ink"}`}
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
  );
}
