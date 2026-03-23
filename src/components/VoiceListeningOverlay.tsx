import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface VoiceListeningOverlayProps {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  onStop: () => void;
  onCancel: () => void;
}

export function VoiceListeningOverlay({ isListening, transcript, interimTranscript, onStop, onCancel }: VoiceListeningOverlayProps) {
  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl"
        >
          {/* Animated orb */}
          <div className="relative mb-8">
            {/* Outer rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute inset-0 rounded-full"
                style={{
                  width: 120 + ring * 40,
                  height: 120 + ring * 40,
                  left: -(ring * 20),
                  top: -(ring * 20),
                  border: `1px solid hsl(330 60% 70% / ${0.15 - ring * 0.03})`,
                  background: `radial-gradient(circle, hsl(330 60% 80% / ${0.05 - ring * 0.01}) 0%, transparent 70%)`,
                }}
                animate={{
                  scale: [1, 1.08 + ring * 0.04, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2 + ring * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: ring * 0.2,
                }}
              />
            ))}

            {/* Core orb */}
            <motion.div
              className="relative z-10 flex h-[120px] w-[120px] items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, hsl(330 70% 65%), hsl(270 60% 70%), hsl(195 70% 65%))",
                boxShadow: "0 0 60px hsl(330 60% 70% / 0.4), 0 0 120px hsl(270 50% 70% / 0.2), inset 0 0 30px hsl(0 0% 100% / 0.2)",
              }}
              animate={{
                scale: [1, 1.06, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Inner shimmer */}
              <motion.div
                className="absolute inset-2 rounded-full"
                style={{
                  background: "linear-gradient(135deg, hsl(0 0% 100% / 0.3), transparent, hsl(0 0% 100% / 0.15))",
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />

              {/* Waveform bars */}
              <div className="relative z-10 flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-white/90"
                    animate={{
                      height: [8, 24 + Math.random() * 16, 8],
                    }}
                    transition={{
                      duration: 0.6 + Math.random() * 0.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Status text */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 font-display text-lg font-semibold text-foreground"
          >
            Listening...
          </motion.p>

          {/* Live transcript */}
          <div className="mx-auto mb-8 max-w-md px-4 text-center">
            <p className="text-sm text-foreground min-h-[1.5em]">
              {transcript}
              <span className="text-muted-foreground">{interimTranscript}</span>
              {!transcript && !interimTranscript && (
                <span className="text-muted-foreground italic">Start speaking...</span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              className="rounded-full gradient-send px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:brightness-110"
            >
              Done
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </motion.button>
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground">Tap Done to insert transcript</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
