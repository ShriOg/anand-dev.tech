"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Typewriter sequence ──────────────────────────────────
const TERMINAL_SEQUENCE = [
  { type: "cmd",  text: "whoami" },
  { type: "out",  text: "> Anand Shukla" },
  { type: "gap" },
  { type: "cmd",  text: "describe --full" },
  { type: "out",  text: "> Class 11 student." },
  { type: "out",  text: "> Founder of MenuNova." },
  { type: "out",  text: "> Full-stack developer." },
  { type: "out",  text: "> AI builder. Linux enthusiast." },
  { type: "out",  text: "> Ships real products at 2am." },
  { type: "gap" },
  { type: "cmd",  text: "uptime" },
  { type: "out",  text: "> building for 2+ years, no signs of stopping" },
  { type: "gap" },
  { type: "cmd",  text: "ls ~/projects" },
  { type: "out",  text: "> MenuNova  NovaCompanion  GestureControl  SmartDustbin  ..." },
  { type: "gap" },
  { type: "cursor" },
];

const CHAR_DELAY = 38; // ms per character
const LINE_GAP   = 320; // ms between lines

const STATS = [
  { label: "Projects", value: 10, suffix: "+", color: "rgba(255, 140, 0, 0.3)" },  // orange
  { label: "Live",     value: 3,  suffix: "",  color: "rgba(0, 229, 255, 0.3)" },  // cyan
  { label: "Startup",  value: 1,  suffix: "",  color: "rgba(99, 102, 241, 0.3)" }, // indigo
  { label: "Ideas",    value: "∞", suffix: "",  color: "rgba(192, 132, 252, 0.3)" } // violet
];

function useCountUp(end: number | string, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || typeof end !== "number") return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, end, duration]);
  return typeof end === "string" ? end : count;
}

function StatCard({ label, value, suffix, color, active }: {
  label: string; value: number | string; suffix: string; color: string; active: boolean;
}) {
  const count = useCountUp(value, 1200, active);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      style={{
        background: "rgba(3, 2, 10, 0.65)",
        border: `1px solid ${color}`,
        borderRadius: "12px",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        fontSize: "clamp(36px, 4vw, 48px)",
        fontWeight: 900,
        color: "#ffffff",
        letterSpacing: "-0.03em",
        lineHeight: 1,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {count}{suffix}
      </div>
      <div style={{
        fontSize: "11px",
        color: "rgba(255, 255, 255, 0.4)",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontFamily: "'JetBrains Mono', monospace",
        marginTop: "8px",
      }}>
        {label}
      </div>
    </motion.div>
  );
}

export function About() {
  const [lines, setLines] = useState<{ type: string; text: string }[]>([]);
  const [statsActive, setStatsActive] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Trigger when section enters viewport
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  // Typewriter engine
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    async function runSequence() {
      for (let i = 0; i < TERMINAL_SEQUENCE.length; i++) {
        if (cancelled) return;
        const item = TERMINAL_SEQUENCE[i];

        if (item.type === "gap") {
          await delay(LINE_GAP);
          continue;
        }
        if (item.type === "cursor") {
          setLines(prev => [...prev, { type: "cursor", text: "" }]);
          setStatsActive(true);
          return;
        }

        const text = item.text!;
        setLines(prev => [...prev, { type: item.type, text: "" }]);
        for (let c = 0; c <= text.length; c++) {
          if (cancelled) return;
          setLines(prev => {
            const next = [...prev];
            next[next.length - 1] = { type: item.type, text: text.slice(0, c) };
            return next;
          });
          await delay(CHAR_DELAY);
        }
        await delay(80);

        if (i === Math.floor(TERMINAL_SEQUENCE.length / 2)) {
          setStatsActive(true);
        }
      }
    }

    runSequence();
    return () => { cancelled = true; };
  }, [visible]);

  return (
    <section
      ref={sectionRef}
      id="about"
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px",
      }}
    >
      {/* Absolute container grid background */}
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />

      {/* Stark Frosted Glass Container wrapping the entire section content */}
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          background: "rgba(3, 2, 10, 0.75)",
          backdropFilter: "blur(40px) saturate(1.5)",
          WebkitBackdropFilter: "blur(40px) saturate(1.5)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "24px",
          padding: "clamp(24px, 6vw, 48px)",
          position: "relative",
          zIndex: 10,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Title Label */}
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          letterSpacing: "0.3em",
          color: "#6366f1",
          marginBottom: "32px",
        }}>
          02 / ABOUT
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "48px",
          }}
          className="md:grid-cols-2"
        >
          {/* ── Left: Typewriter Terminal ── */}
          <div>
            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    background: "rgba(0, 0, 0, 0.4)", // transparent black for spectrum bleed
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {/* Traffic lights */}
                  <div
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <button
                      className="traffic-light red"
                      style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57", border: "none" }}
                      aria-label="Close terminal"
                    />
                    <button
                      className="traffic-light yellow"
                      style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e", border: "none" }}
                      onClick={() => setMinimized(true)}
                      aria-label="Minimize terminal"
                    />
                    <button
                      className="traffic-light green"
                      style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840", border: "none" }}
                      aria-label="Maximize terminal"
                    />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.3)",
                      marginLeft: "8px",
                    }}>
                      terminal — anand@dev: ~
                    </span>
                  </div>

                  {/* Terminal body */}
                  <div
                    style={{
                      padding: "20px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "13px",
                      lineHeight: "1.7",
                      color: "rgba(255, 255, 255, 0.7)",
                      minHeight: "260px",
                    }}
                  >
                    {lines.map((line, i) => {
                      if (line.type === "cursor") {
                        return (
                          <div key={i}>
                            <span className="terminal-prompt" style={{ color: "#6366f1" }}>anand@dev:~$ </span>
                            <span className="terminal-cursor" style={{
                              display: "inline-block",
                              width: "8px",
                              height: "14px",
                              background: "#6366f1",
                              animation: "blink 1s step-end infinite",
                              verticalAlign: "middle"
                            }} />
                          </div>
                        );
                      }
                      if (line.type === "cmd") {
                        return (
                          <div key={i}>
                            <span className="terminal-prompt" style={{ color: "#6366f1" }}>anand@dev:~$ </span>
                            <span style={{ color: "#ffffff" }}>{line.text}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={i} style={{ color: "rgba(255,255,255,0.6)" }}>{line.text}</div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimized restored icon */}
            {minimized && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setMinimized(false)}
                style={{
                  width: "44px",
                  height: "44px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
                aria-label="Restore terminal"
              >
                <span>[ restored ]</span>
              </motion.button>
            )}
          </div>

          {/* ── Right: Stats Grid & Bio ── */}
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "32px",
            }}>
              {STATS.map((s) => (
                <StatCard key={s.label} {...s} active={statsActive} />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={statsActive ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h2 style={{
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
                marginBottom: "16px",
              }}>
                I skipped tutorials and started shipping.
              </h2>
              <p style={{
                fontSize: "15px",
                color: "rgba(255, 255, 255, 0.6)",
                lineHeight: 1.7,
              }}>
                I'm a Class 11 student who founded MenuNova, built an AI companion
                with real users, and made a computer understand hands.
                I build things that feel like they were made by a team of ten.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
