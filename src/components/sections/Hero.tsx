"use client";

import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};
const container: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.9 } },
};

export function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t); }, []);

  return (
    <section
      id="hero"
      style={{ height: "100vh", position: "relative", display: "flex", alignItems: "center" }}
    >
      {/* Left-side dark scrim so text is always readable */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to right, rgba(3,2,10,0.72) 0%, rgba(3,2,10,0.4) 55%, transparent 100%)",
        zIndex: 1,
      }} />

      {/* Main copy */}
      <div style={{ position: "relative", zIndex: 10, paddingLeft: "clamp(28px, 8vw, 120px)", maxWidth: 620 }}>
        {ready && (
          <motion.div variants={container} initial="hidden" animate="show">
            {/* Label */}
            <motion.p variants={item} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              letterSpacing: 3, color: "rgba(255,255,255,0.38)", marginBottom: 22,
            }}>
              // anand.shukla
            </motion.p>

            {/* ANAND */}
            <div style={{ overflow: "hidden" }}>
              <motion.h1 variants={item} style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontSize: "clamp(64px, 9.5vw, 100px)", fontWeight: 900,
                letterSpacing: "-5px", lineHeight: 0.88, color: "#fff",
                textShadow: "0 0 90px rgba(255,255,255,0.12)", marginBottom: 0,
              }}>
                ANAND
              </motion.h1>
            </div>

            {/* SHUKLA – outlined */}
            <div style={{ overflow: "hidden", marginBottom: 32 }}>
              <motion.h1 variants={item} style={{
                fontFamily: "'Outfit', 'Inter', sans-serif",
                fontSize: "clamp(64px, 9.5vw, 100px)", fontWeight: 900,
                letterSpacing: "-5px", lineHeight: 0.88,
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(255,255,255,0.22)",
              }}>
                SHUKLA
              </motion.h1>
            </div>

            {/* Roles */}
            <motion.div variants={item} style={{ marginBottom: 28 }}>
              {[
                { text: "Developer.",   color: "rgba(255,255,255,0.88)" },
                { text: "Founder.",     color: "rgba(255,200,100,0.82)" },
                { text: "AI Builder.",  color: "rgba(150,220,255,0.82)" },
              ].map(r => (
                <p key={r.text} style={{ fontSize: 22, fontWeight: 300, color: r.color, lineHeight: 1.45 }}>
                  {r.text}
                </p>
              ))}
            </motion.div>

            {/* Description */}
            <motion.p variants={item} style={{
              fontSize: 14, fontWeight: 300,
              color: "rgba(255,255,255,0.42)", lineHeight: 1.65,
              maxWidth: 380, marginBottom: 36,
            }}>
              Creating software, AI systems, and startups from ideas.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={item} style={{ display: "flex", gap: 14 }}>
              <a href="#projects" style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                color: "#fff", textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.28)",
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
                padding: "11px 24px", borderRadius: 3,
                transition: "background 0.2s, border-color 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
              >
                View Work ↓
              </a>
              <a href="https://github.com/ShriOg" target="_blank" rel="noopener noreferrer" style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                color: "rgba(255,255,255,0.65)", textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(12px)",
                padding: "11px 24px", borderRadius: 3,
                transition: "background 0.2s, border-color 0.2s, color 0.2s",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.07)";
                  el.style.color = "#fff";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.02)";
                  el.style.color = "rgba(255,255,255,0.65)";
                }}
              >
                GitHub ↗
              </a>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Available badge – bottom right */}
      <div style={{
        position: "absolute", right: "clamp(28px,6vw,80px)", bottom: 44,
        zIndex: 10, display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#00e676", boxShadow: "0 0 10px #00e676",
          display: "inline-block",
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
          color: "#00e676", letterSpacing: "2.5px",
        }}>AVAILABLE</span>
      </div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        style={{
          position: "absolute", bottom: 44, left: "50%",
          transform: "translateX(-50%)", zIndex: 10,
        }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          letterSpacing: "0.22em", color: "rgba(255,255,255,0.22)",
        }}>scroll to explore</span>
      </motion.div>
    </section>
  );
}
