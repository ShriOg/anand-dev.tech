"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

type CursorState = "default" | "hover" | "planet" | "terminal" | "click";

export function HUDCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springX = useSpring(mouseX, { stiffness: 250, damping: 24 });
  const springY = useSpring(mouseY, { stiffness: 250, damping: 24 });

  const [state, setState] = useState<CursorState>("default");
  const [isClicking, setIsClicking] = useState(false);
  const [color, setColor] = useState("#6366f1");

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const down = () => {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 300);
    };

    const detectState = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target) {
        setState("default");
        setColor("#6366f1");
        return;
      }

      // Check state
      if (target.closest("[data-cursor='planet']")) {
        setState("planet");
      } else if (target.closest("[data-cursor='terminal']")) {
        setState("terminal");
      } else if (target.closest("a, button, [role='button'], [data-cursor='hover']")) {
        setState("hover");
      } else {
        setState("default");
      }

      // Check dynamic color sampling
      const colorEl = target.closest("[data-cursor-color]") as HTMLElement | null;
      if (colorEl) {
        const customColor = colorEl.getAttribute("data-cursor-color");
        if (customColor) {
          setColor(customColor);
          return;
        }
      }

      // Fallback colors based on state
      if (target.closest("[data-cursor='planet']")) {
        setColor("#f59e0b");
      } else {
        setColor("#6366f1");
      }
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mousemove", detectState);
    window.addEventListener("mousedown", down);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousemove", detectState);
      window.removeEventListener("mousedown", down);
    };
  }, [mouseX, mouseY]);

  const labels: Record<CursorState, string> = {
    default: "[ EXPLORE ]",
    hover: "[ OPEN ]",
    planet: "[ ENTER ]",
    terminal: "[ TYPE ]",
    click: "[ SELECT ]",
  };

  const ringScale = state === "planet" ? 1.3 : state === "hover" ? 1.15 : 1;
  const bracketScale = state === "hover" || state === "planet" ? 0.6 : 1;
  const sweepDuration = state === "hover" ? "1s" : state === "terminal" ? "9999s" : "3s";

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none hidden md:block"
      style={{
        x: springX,
        y: springY,
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 1000,
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="-40 -40 80 80"
        overflow="visible"
      >
        {/* Outer glowing ring */}
        <motion.circle
          r={28}
          fill="none"
          stroke={color}
          strokeWidth={state === "hover" ? 1.2 : 0.6}
          style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
          animate={{ scale: ringScale }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />

        {/* Radar sweep */}
        <motion.line
          x1={0}
          y1={0}
          x2={0}
          y2={-28}
          stroke={color}
          strokeWidth={0.8}
          opacity={state === "terminal" ? 0 : 0.3}
          style={{
            transformOrigin: "0 0",
            animation: `radarSweep ${sweepDuration} linear infinite`,
          }}
        />

        {/* NW bracket */}
        <motion.path
          d="M -18 -10 L -18 -18 L -10 -18"
          fill="none"
          stroke={color}
          strokeWidth={0.8}
          opacity={0.8}
          animate={{ scale: bracketScale }}
          style={{ transformOrigin: "-14 -14" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {/* NE bracket */}
        <motion.path
          d="M 18 -10 L 18 -18 L 10 -18"
          fill="none"
          stroke={color}
          strokeWidth={0.8}
          opacity={0.8}
          animate={{ scale: bracketScale }}
          style={{ transformOrigin: "14 -14" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {/* SW bracket */}
        <motion.path
          d="M -18 10 L -18 18 L -10 18"
          fill="none"
          stroke={color}
          strokeWidth={0.8}
          opacity={0.8}
          animate={{ scale: bracketScale }}
          style={{ transformOrigin: "-14 14" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {/* SE bracket */}
        <motion.path
          d="M 18 10 L 18 18 L 10 18"
          fill="none"
          stroke={color}
          strokeWidth={0.8}
          opacity={0.8}
          animate={{ scale: bracketScale }}
          style={{ transformOrigin: "14 14" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />

        {/* Center dot */}
        <motion.circle
          r={2.5}
          fill={color}
          animate={{ scale: isClicking ? [1, 2, 1] : 1 }}
          transition={{ duration: 0.15 }}
        />

        {/* Click flash ring */}
        {isClicking && (
          <motion.circle
            r={28}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </svg>

      {/* Label above cursor */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            top: -50,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            letterSpacing: "0.12em",
            color: color,
            whiteSpace: "nowrap",
            textShadow: `0 0 6px ${color}44`,
          }}
        >
          {labels[state]}
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
