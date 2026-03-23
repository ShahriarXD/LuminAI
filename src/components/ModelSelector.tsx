import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AVAILABLE_MODELS, type ModelId } from "@/lib/chat-api";

interface ModelSelectorProps {
  value: ModelId;
  onChange: (model: ModelId) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = AVAILABLE_MODELS.find((m) => m.id === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-secondary-foreground shadow-soft backdrop-blur-sm transition-all duration-200 hover:shadow-glass active:scale-[0.97]"
      >
        {selected.label}
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
              className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl glass-strong shadow-glass overflow-hidden"
            >
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => { onChange(model.id); setOpen(false); }}
                  className={`flex w-full flex-col px-3 py-2.5 text-left transition-colors duration-100 ${
                    value === model.id ? "bg-primary/10" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xs font-medium text-foreground">{model.label}</span>
                  <span className="text-[10px] text-muted-foreground">{model.description}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
