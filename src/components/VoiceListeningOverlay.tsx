import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useMemo } from "react";

interface VoiceListeningOverlayProps {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  onStop: () => void;
  onCancel: () => void;
}

// Deterministic bar configs to avoid re-randomizing on each render
const BAR_CONFIGS = [
  { baseHeight: 10, maxHeight: 32, duration: 0.7, delay: 0 },
  { baseHeight: 8, maxHeight: 38, duration: 0.55, delay: 0.08 },
  { baseHeight: 12, maxHeight: 44, duration: 0.65, delay: 0.16 },
  { baseHeight: 8, maxHeight: 36, duration: 0.5, delay: 0.24 },
  { baseHeight: 10, maxHeight: 30, duration: 0.72, delay: 0.12 },
];

const RING_COUNT = [1, 2, 3, 4];

export function VoiceListeningOverlay({ isListening, transcript, interimTranscript, onStop, onCancel }: VoiceListeningOverlayProps) {
  const rings = useMemo(() => RING_COUNT.map((ring) => ({
    ring,
    size: 140 + ring * 36,
    offset: -(ring * 18),
    borderOpacity: 0.18 - ring * 0.03,
    bgOpacity: 0.06 - ring * 0.012,
    scaleMax: 1.06 + ring * 0.03,
    duration: 2.5 + ring * 0.6,
    delay: ring * 0.15,
  })), []);

  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(180deg, hsl(var(--background) / 0.92) 0%, hsl(var(--background) / 0.97) 100%)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: 500,
                height: 500,
                background: "radial-gradient(circle, hsl(330 60% 75% / 0.12) 0%, hsl(270 50% 75% / 0.06) 40%, transparent 70%)",
                filter: "blur(60px)",
              }}
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Animated orb */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-10"
          >
            {/* Outer concentric rings */}
            {rings.map(({ ring, size, offset, borderOpacity, scaleMax, duration, delay }) => (
              <motion.div
                key={ring}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  left: offset,
                  top: offset,
                  border: `1px solid hsl(330 50% 75% / ${borderOpacity})`,
                }}
                animate={{
                  scale: [1, scaleMax, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay,
                }}
              />
            ))}

            {/* Soft glow behind orb */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 180,
                height: 180,
                left: -20,
                top: -20,
                background: "radial-gradient(circle, hsl(330 60% 75% / 0.25) 0%, hsl(270 50% 70% / 0.1) 50%, transparent 70%)",
                filter: "blur(20px)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.9, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Core orb */}
            <motion.div
              className="relative z-10 flex h-[140px] w-[140px] items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(145deg, hsl(330 65% 72%), hsl(280 50% 72%), hsl(210 55% 72%))",
                boxShadow: `
                  0 0 40px hsl(330 50% 70% / 0.3),
                  0 0 80px hsl(270 40% 70% / 0.15),
                  inset 0 -8px 24px hsl(270 40% 50% / 0.15),
                  inset 0 8px 24px hsl(0 0% 100% / 0.25)
                `,
              }}
              animate={{
                scale: [1, 1.04, 1.02, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Glass highlight / reflection */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: "70%",
                  height: "40%",
                  top: "8%",
                  left: "15%",
                  background: "linear-gradient(180deg, hsl(0 0% 100% / 0.35) 0%, hsl(0 0% 100% / 0.05) 100%)",
                  borderRadius: "50%",
                  filter: "blur(2px)",
                }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Inner shimmer rotation */}
              <motion.div
                className="absolute inset-3 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, hsl(0 0% 100% / 0.12), transparent 30%, hsl(0 0% 100% / 0.08), transparent 70%, hsl(0 0% 100% / 0.12))",
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />

              {/* Waveform bars */}
              <div className="relative z-10 flex items-center gap-[3px]">
                {BAR_CONFIGS.map((bar, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 3,
                      background: "hsl(0 0% 100% / 0.85)",
                      boxShadow: "0 0 6px hsl(0 0% 100% / 0.3)",
                    }}
                    animate={{
                      height: [bar.baseHeight, bar.maxHeight, bar.baseHeight * 1.3, bar.maxHeight * 0.8, bar.baseHeight],
                    }}
                    transition={{
                      duration: bar.duration,
                      repeat: Infinity,
                      ease: [0.42, 0, 0.58, 1],
                      delay: bar.delay,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Status text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-3 font-display text-lg font-semibold text-foreground tracking-tight"
          >
            Listening...
          </motion.p>

          {/* Live transcript */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mx-auto mb-10 max-w-md px-6 text-center"
          >
            <p className="text-sm text-foreground/80 min-h-[1.5em] leading-relaxed">
              {transcript}
              {interimTranscript && (
                <span className="text-muted-foreground/70">{interimTranscript}</span>
              )}
              {!transcript && !interimTranscript && (
                <span className="text-muted-foreground/50 italic">Start speaking...</span>
              )}
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStop}
              className="rounded-full gradient-send px-7 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-all duration-300"
              style={{
                boxShadow: "0 4px 24px hsl(330 60% 60% / 0.3), 0 1px 3px hsl(0 0% 0% / 0.1)",
              }}
            >
              Done
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-full border border-border/60 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-muted/50 hover:text-foreground hover:border-border"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </motion.button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-[10px] text-muted-foreground/60"
          >
            Tap Done to insert transcript
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
