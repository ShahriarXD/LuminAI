import { motion } from "framer-motion";
import orbImage from "@/assets/orb.png";

export function HeroOrb() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow behind orb */}
      <div className="absolute h-72 w-72 rounded-full orb-glow animate-pulse-soft" />

      {/* Orb */}
      <motion.img
        src={orbImage}
        alt="AI Orb"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 h-56 w-56 object-contain animate-float drop-shadow-2xl sm:h-64 sm:w-64"
      />

      {/* Reflection */}
      <motion.img
        src={orbImage}
        alt=""
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute -bottom-16 z-0 h-40 w-40 scale-y-[-1] object-contain blur-sm"
      />
    </div>
  );
}
