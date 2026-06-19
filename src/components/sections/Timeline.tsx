"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

const MILESTONES = [
  {
    year: "2025",
    tag: "SHIPPED",
    tagColor: "#6366f1",
    title: "Launched Nova Companion",
    description: "Live AI companion with real users. Full-stack with Next.js 15, MongoDB, Groq AI, JWT auth, and Vercel deployment.",
    side: "right",
  },
  {
    year: "2025",
    tag: "FOUNDER",
    tagColor: "#ff8c00",
    title: "Founded MenuNova",
    description: "Restaurant tech startup built from scratch. Digital menus, cart system, admin dashboard, and QR-code ordering.",
    side: "left",
  },
  {
    year: "2024",
    tag: "CV PROJECT",
    tagColor: "#00e5ff",
    title: "Hand Gesture Control System",
    description: "Real-time computer vision with MediaPipe and OpenCV. Controls your computer without touching it.",
    side: "right",
  },
  {
    year: "2024",
    tag: "IOT",
    tagColor: "#00e676",
    title: "Smart Dustbin System",
    description: "Arduino + ESP32 sensor array. Automatic lid control and fill-level monitoring. Presented at school science expo.",
    side: "left",
  },
];

function MilestoneCard({
  milestone,
  index,
}: { milestone: typeof MILESTONES[0]; index: number }) {
  const isLeft = milestone.side === "left";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 40px 1fr",
        gap: "32px",
        alignItems: "center",
        marginBottom: "100px",
        position: "relative",
      }}
    >
      {/* Left slot */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {isLeft ? (
          <CardContent milestone={milestone} direction={-1} />
        ) : (
          <YearBadge year={milestone.year} align="right" />
        )}
      </div>

      {/* Center dot */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: milestone.tagColor,
            boxShadow: `0 0 20px ${milestone.tagColor}`,
            border: "3px solid #03020a",
            zIndex: 5,
          }}
        />
      </div>

      {/* Right slot */}
      <div>
        {!isLeft ? (
          <CardContent milestone={milestone} direction={1} />
        ) : (
          <YearBadge year={milestone.year} align="left" />
        )}
      </div>
    </div>
  );
}

function CardContent({
  milestone,
  direction,
}: { milestone: typeof MILESTONES[0]; direction: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction * 50, y: 15 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "16px",
        padding: "28px",
        maxWidth: "420px",
        position: "relative",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
      }}
      whileHover={{
        borderColor: milestone.tagColor,
        y: -4,
        boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${milestone.tagColor}15`,
      }}
    >
      {/* Colored top corner pill */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.25em",
        color: milestone.tagColor,
        background: `${milestone.tagColor}12`,
        padding: "4px 8px",
        borderRadius: "4px",
        display: "inline-block",
        marginBottom: "14px",
      }}>
        {milestone.tag}
      </span>

      <h3 style={{
        fontSize: "20px",
        fontWeight: 700,
        color: "#ffffff",
        letterSpacing: "-0.02em",
        marginBottom: "12px",
        lineHeight: 1.3,
        fontFamily: "'Outfit', sans-serif",
      }}>
        {milestone.title}
      </h3>

      <p style={{
        fontSize: "14px",
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.65,
        fontWeight: 300,
      }}>
        {milestone.description}
      </p>
    </motion.div>
  );
}

function YearBadge({ year, align }: { year: string; align: "left" | "right" }) {
  return (
    <span
      style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: "36px",
        fontWeight: 900,
        letterSpacing: "-1px",
        color: "rgba(255, 255, 255, 0.06)",
        textAlign: align,
        display: "block",
        userSelect: "none",
      }}
    >
      {year}
    </span>
  );
}

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section
      ref={containerRef}
      id="timeline"
      style={{
        background: "var(--bg-deep)",
        padding: "120px clamp(24px, 8vw, 120px)",
        position: "relative",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      {/* Section label */}
      <div style={{ textAlign: "center", marginBottom: "100px" }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          letterSpacing: "0.3em",
          color: "#6366f1",
          marginBottom: "16px",
        }}>
          05 / TIMELINE
        </p>
        <h2 style={{
          fontSize: "clamp(32px, 4vw, 52px)",
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.03em",
        }}>
          The Build Log.
        </h2>
      </div>

      <div style={{ position: "relative", maxWidth: "1000px", margin: "0 auto" }}>
        {/* Static background trace */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: "2px",
            background: "rgba(255,255,255,0.03)",
            transform: "translateX(-50%)",
          }}
        />

        {/* Dynamic rainbow timeline line drawing on scroll */}
        <motion.div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: "2px",
            background: "linear-gradient(to bottom, #ff4d4d, #ff8c00, #ffd600, #00e676, #00e5ff, #6366f1, #c084fc)",
            scaleY,
            transformOrigin: "top",
            transform: "translateX(-50%)",
          }}
        />

        {/* Milestone cards */}
        {MILESTONES.map((m, i) => (
          <MilestoneCard key={i} milestone={m} index={i} />
        ))}
      </div>
    </section>
  );
}
