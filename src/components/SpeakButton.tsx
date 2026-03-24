import { motion } from "framer-motion";
import { Volume2, Pause, Square } from "lucide-react";

interface SpeakButtonProps {
  isPlaying: boolean;
  isPaused: boolean;
  onSpeak: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function SpeakButton({ isPlaying, isPaused, onSpeak, onPause, onResume, onStop }: SpeakButtonProps) {
  if (!isPlaying) {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onSpeak}
        className="surface-chip mt-1.5 flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground"
        aria-label="Read aloud"
      >
        <Volume2 className="h-3 w-3" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-1.5 flex items-center gap-0.5"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={isPaused ? onResume : onPause}
        className="icon-button h-7 w-7 rounded-full text-primary/70 hover:bg-primary/10 hover:text-primary"
        aria-label={isPaused ? "Resume" : "Pause"}
      >
        {isPaused ? <Volume2 className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onStop}
        className="icon-button h-7 w-7 rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
        aria-label="Stop"
      >
        <Square className="h-2.5 w-2.5" />
      </motion.button>
    </motion.div>
  );
}
