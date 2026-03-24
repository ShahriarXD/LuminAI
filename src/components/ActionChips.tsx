import { motion } from "framer-motion";
import { Lightbulb, Code, PenLine, Zap } from "lucide-react";

const chips = [
  { icon: Lightbulb, label: "Explain a concept" },
  { icon: Code, label: "Write code" },
  { icon: PenLine, label: "Help me write" },
  { icon: Zap, label: "Brainstorm ideas" },
];

interface ActionChipsProps {
  onSelect: (label: string) => void;
}

export function ActionChips({ onSelect }: ActionChipsProps) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-center justify-center gap-2 px-2"
    >
      {chips.map((chip, i) => (
        <motion.button
          key={chip.label}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(chip.label)}
          className="surface-chip flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-card/85 sm:px-4 sm:text-sm"
        >
          <chip.icon className="h-3.5 w-3.5 text-muted-foreground" />
          {chip.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
