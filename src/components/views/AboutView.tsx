import { motion } from "motion/react";
import { Lock } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import openprompterIcon from "@/assets/openpromptericon.png";

export function AboutView() {
  return (
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
              <CardTitle className="text-2xl font-bold font-display tracking-tight text-ink" style={{ textWrap: "balance" }}>
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

          <div className="p-6 bg-accent text-accent-foreground border border-edges rounded-xl space-y-3 shadow-card">
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
              Click the <strong>Key icon</strong> in the sidebar footer
              to open the BYOK Engine settings.
            </li>
            <li className="pl-4">
              Select your preferred API provider from the grid:
              OpenAI, DeepSeek, Anthropic, Gemini, or Custom endpoint.
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
  );
}
