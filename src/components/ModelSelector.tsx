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
        className="control-pill min-w-0 pr-2"
      >
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="truncate">{selected?.label || "Select model"}</span>
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
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="surface-panel absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden"
            >
              <div className="p-1">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { onChange(model.id, model.provider); setOpen(false); }}
                    className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                      value === model.id ? "bg-primary/10 shadow-soft" : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground">{model.label}</span>
                    </div>
                    <span className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{model.description}</span>
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
