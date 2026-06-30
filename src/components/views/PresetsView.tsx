import { useMemo } from "react";
import { motion } from "motion/react";
import { ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { PRESET_TEMPLATES } from "@/src/data";
import type { PromptTemplate } from "@/src/types";

type PresetsViewProps = {
  templateSearch: string;
  setTemplateSearch: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  handleApplyTemplate: (tpl: PromptTemplate) => void;
  handleShareTemplate: (tpl: PromptTemplate) => void;
};

const CATEGORIES = ["All", "Coding", "Marketing", "Analysis", "Sales", "Education"] as const;

export function PresetsView({
  templateSearch,
  setTemplateSearch,
  categoryFilter,
  setCategoryFilter,
  handleApplyTemplate,
  handleShareTemplate,
}: PresetsViewProps) {
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

  const filteredTemplates = useMemo(() => {
    const query = templateSearch.toLowerCase();
    return PRESET_TEMPLATES.filter((t) => {
      const hitsQuery = !query ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query);
      const hitsCategory = categoryFilter === "All" || t.category === categoryFilter;
      return hitsQuery && hitsCategory;
    });
  }, [templateSearch, categoryFilter]);

  return (
    <motion.div
      key="templates"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      {/* FILTER TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 rounded-xl border border-whisper shadow-card">
        <div>
          <h3 className="text-xl font-bold font-display tracking-tight text-ink" style={{ textWrap: "balance" }}>
            Prompt Presets Gallery
          </h3>
          <p className="text-xs text-steel mt-0.5">
            High-fidelity prompts verified across GPT-4, Claude, and
            DeepSeek models. Select any to load.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex gap-1 border border-whisper p-1 bg-canvas rounded-xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold tracking-wide uppercase transition-colors ${categoryFilter === cat ? "bg-surface text-ink shadow-card" : "text-muted hover:text-steel"}`}
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
            className="max-w-[200px] h-9 text-xs bg-surface border-whisper rounded-xl shadow-card"
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
        {filteredTemplates.map((tpl) => (
          <motion.div key={`${tpl.category}-${tpl.name}`} variants={staggerItem}>
            <Card
              className="border-whisper bg-surface shadow-card flex flex-col justify-between group rounded-xl"
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
                className="text-lg font-bold mt-2 font-display text-ink tracking-tight cursor-pointer" style={{ textWrap: "balance" }}
                onClick={() => handleApplyTemplate(tpl)}
              >
                {tpl.name}
              </CardTitle>
              <CardDescription className="text-xs text-steel leading-snug mt-1">
                {tpl.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-4 px-5 pt-4">
              <div
                className="p-4 bg-canvas border border-whisper/70 rounded-xl text-[11px] font-mono leading-snug text-steel/80 line-clamp-3 select-none cursor-pointer"
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

            <CardFooter className="py-3 px-5 border-t border-whisper/40 bg-canvas/50 flex justify-between rounded-b-xl">
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
  );
}
