import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useCallback } from "react";
import orbImage from "@/assets/orb.png";

export function HeroOrb() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-8, 8]), springConfig);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  }, [mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{
        perspective: 800,
      }}
    >
      {/* Deep ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          background: "var(--gradient-orb-glow)",
          filter: "blur(40px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb container with 3D transforms */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10"
      >
        <motion.img
          src={orbImage}
          alt="AI Orb"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 h-48 w-48 object-contain drop-shadow-2xl sm:h-56 sm:w-56 md:h-64 md:w-64"
          style={{
            animation: "float 6s ease-in-out infinite",
            filter: "drop-shadow(0 20px 40px hsl(330 60% 50% / 0.2))",
          }}
        />

        {/* Gloss highlight overlay */}
        <motion.div
          className="absolute top-[10%] left-[20%] z-20 rounded-full pointer-events-none"
          style={{
            width: "55%",
            height: "30%",
            background: "linear-gradient(180deg, hsl(0 0% 100% / 0.3) 0%, hsl(0 0% 100% / 0) 100%)",
            filter: "blur(4px)",
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Reflection */}
      <motion.img
        src={orbImage}
        alt=""
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute -bottom-14 z-0 h-32 w-32 scale-y-[-1] object-contain blur-md sm:h-36 sm:w-36"
      />
    </motion.div>
  );
}
