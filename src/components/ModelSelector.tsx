import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { AVAILABLE_MODELS, type ModelId, type ProviderType } from "@/lib/chat-api";

interface ModelSelectorProps {
  value: ModelId;
  provider: ProviderType;
  onChange: (model: ModelId, provider: ProviderType) => void;
}

export function ModelSelector({ value, provider, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = AVAILABLE_MODELS.find((m) => m.id === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground shadow-soft backdrop-blur-sm transition-all duration-200 hover:shadow-glass hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0"
      >
        <Sparkles className="h-3 w-3 text-primary" />
        {selected?.label || "Select model"}
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-2xl glass-strong shadow-glass overflow-hidden border border-border/30"
            >
              <div className="p-1">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { onChange(model.id, model.provider); setOpen(false); }}
                    className={`flex w-full flex-col px-3 py-2.5 text-left rounded-xl transition-all duration-150 ${
                      value === model.id ? "bg-primary/10 shadow-soft" : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xs font-medium text-foreground">{model.label}</span>
                    <span className="text-[10px] text-muted-foreground">{model.description}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
