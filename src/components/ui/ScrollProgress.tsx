"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "3px",
        zIndex: 100,
        background: "rgba(255, 255, 255, 0.03)",
        pointerEvents: "none",
      }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(to bottom, #ff4d4d, #ff8c00, #ffd600, #00e676, #00e5ff, #6366f1, #c084fc)",
          scaleY,
          transformOrigin: "top",
        }}
      />
    </div>
  );
}
