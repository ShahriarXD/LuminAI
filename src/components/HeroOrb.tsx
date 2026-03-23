import { Suspense, useRef, useMemo, useCallback, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/* ── Glass Sphere ────────────────────────────────── */
function GlassOrb({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  // Gradient map texture – pink → cyan
  const gradientMap = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "hsl(330, 65%, 60%)");
    gradient.addColorStop(0.5, "hsl(280, 50%, 55%)");
    gradient.addColorStop(1, "hsl(195, 70%, 55%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    uniforms.uTime.value += delta;

    // Gentle idle rotation
    meshRef.current.rotation.y += delta * 0.15;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      mouse.current.y * 0.3,
      0.05
    );

    // Mouse tilt
    const targetRotY = meshRef.current.rotation.y + mouse.current.x * 0.2;
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotY,
      0.02
    );
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.6} floatingRange={[-0.08, 0.08]}>
      <mesh ref={meshRef} scale={1.6}>
        <sphereGeometry args={[1, 128, 128]} />
        <meshPhysicalMaterial
          ref={matRef}
          map={gradientMap}
          transmission={0.92}
          roughness={0.05}
          metalness={0.05}
          thickness={2.5}
          ior={1.8}
          envMapIntensity={1.2}
          clearcoat={1}
          clearcoatRoughness={0.02}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          attenuationColor={new THREE.Color("hsl(330, 60%, 60%)")}
          attenuationDistance={3}
        />
      </mesh>
    </Float>
  );
}

/* ── Glow ring under orb ─────────────────────────── */
function GlowPlane() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    ref.current.scale.set(s, s, 1);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
      <planeGeometry args={[5, 5]} />
      <meshBasicMaterial
        transparent
        opacity={0.25}
        color={new THREE.Color("hsl(330, 60%, 70%)")}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Fallback static orb ─────────────────────────── */
function StaticFallback() {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          background: "var(--gradient-orb-glow)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="h-48 w-48 rounded-full sm:h-56 sm:w-56 md:h-64 md:w-64"
        style={{
          background: "linear-gradient(135deg, hsl(330 65% 60%), hsl(280 50% 55%), hsl(195 70% 55%))",
          boxShadow: "0 20px 60px hsl(330 60% 50% / 0.3), inset 0 -10px 30px hsl(195 70% 55% / 0.2)",
          animation: "float 6s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ── Main export ──────────────────────────────────── */
export function HeroOrb() {
  const mouse = useRef({ x: 0, y: 0 });
  const [webGLSupported, setWebGLSupported] = useState(true);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouse.current.x = (e.clientX - cx) / cx;
    mouse.current.y = (e.clientY - cy) / cy;
  }, []);

  useEffect(() => {
    // Check WebGL support
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      if (!gl) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  if (!webGLSupported) {
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <StaticFallback />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
      style={{ width: "min(320px, 70vw)", height: "min(320px, 70vw)" }}
    >
      {/* Ambient glow behind */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "var(--gradient-orb-glow)",
          filter: "blur(50px)",
          transform: "scale(1.4)",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.3, 1.5, 1.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-3, 2, 4]} intensity={0.5} color="hsl(330, 65%, 60%)" />
          <pointLight position={[3, -2, 4]} intensity={0.3} color="hsl(195, 70%, 65%)" />
          <Environment preset="studio" />
          <GlassOrb mouse={mouse} />
          <GlowPlane />
        </Suspense>
      </Canvas>

      {/* Reflection below */}
      <div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "60%",
          height: 40,
          background: "linear-gradient(180deg, hsl(330 60% 70% / 0.15), transparent)",
          filter: "blur(12px)",
          borderRadius: "50%",
        }}
      />
    </motion.div>
  );
}
