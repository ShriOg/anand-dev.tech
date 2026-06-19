"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const COMMANDS: Record<string, (args?: string) => string | string[]> = {
  help: () => [
    "Available commands:",
    "  whoami     — who am I?",
    "  github     — open GitHub profile",
    "  linkedin   — open LinkedIn profile",
    "  email      — copy email to clipboard",
    "  menunova   — launch MenuNova",
    "  contact    — contact info",
    "  clear      — clear terminal",
    "  ls         — list directory",
    "  sudo make me a sandwich — ...",
  ],
  whoami: () => "Anand Shukla — builder, founder, developer.",
  contact: () => [
    "Email: anandshukla.dev@gmail.com",
    "GitHub: github.com/ShriOg",
    "LinkedIn: linkedin.com/in/anand-shukla",
  ],
  github: () => {
    if (typeof window !== "undefined") window.open("https://github.com/ShriOg", "_blank");
    return "→ opening github.com/ShriOg...";
  },
  linkedin: () => {
    if (typeof window !== "undefined") window.open("https://linkedin.com/in/anand-shukla", "_blank");
    return "→ opening linkedin.com/in/anand-shukla...";
  },
  email: () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText("anandshukla.dev@gmail.com")
        .then(() => {})
        .catch(() => {});
    }
    return "→ email copied to clipboard.";
  },
  menunova: () => {
    if (typeof window !== "undefined") window.open("https://menunova.vercel.app", "_blank");
    return "→ launching MenuNova...";
  },
  clear: () => "__CLEAR__",
  ls: () => "idea_1.txt  idea_2.txt  idea_3.txt  ...  idea_247.txt",
  "sudo make me a sandwich": () => "nice try. (you need root access to request sandwiches)",
};

type Line = { type: "cmd" | "out" | "err"; text: string };

const WELCOME: Line[] = [
  { type: "out", text: "Anand Shukla — terminal v2.0.0" },
  { type: "out", text: "Type 'help' to see available commands." },
  { type: "out", text: "" },
];

export function Contact() {
  const [lines, setLines] = useState<Line[]>(WELCOME);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  const runCommand = useCallback((raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    setHistory(h => [cmd, ...h]);
    setHistIdx(-1);

    setLines(prev => [...prev, { type: "cmd", text: cmd }]);

    let handler = COMMANDS[cmd];
    if (!handler) {
      const word = cmd.split(" ")[0];
      handler = COMMANDS[word];
    }

    if (!handler) {
      setLines(prev => [...prev, { type: "err", text: `command not found: ${cmd}. Try 'help'.` }]);
      return;
    }

    const result = handler();
    if (result === "__CLEAR__") {
      setLines(WELCOME);
      return;
    }

    const outputs = Array.isArray(result) ? result : [result as string];
    setLines(prev => [...prev, ...outputs.map(t => ({ type: "out" as const, text: t })), { type: "out", text: "" }]);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistIdx(i => {
        const next = Math.min(i + 1, history.length - 1);
        setInput(history[next] ?? "");
        return next;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistIdx(i => {
        const next = Math.max(i - 1, -1);
        setInput(next === -1 ? "" : history[next]);
        return next;
      });
    }
  };

  return (
    <section
      id="contact"
      style={{
        minHeight: "100vh",
        background: "var(--bg-deep)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px clamp(24px, 8vw, 120px)",
        position: "relative",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      <style>{`
        @keyframes hueRotateAnimation {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .hue-animated-glow {
          animation: hueRotateAnimation 16s linear infinite;
        }
      `}</style>

      {/* Background soft ambient radial gradient glow */}
      <div className="hue-animated-glow" style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      <div style={{ maxWidth: "760px", width: "100%", position: "relative", zIndex: 10 }}>
        {/* Label */}
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          letterSpacing: "0.3em",
          color: "#6366f1",
          marginBottom: "20px",
          textAlign: "center",
        }}>
          06 / CONTACT
        </p>

        {/* Heading */}
        <h2 style={{
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.03em",
          textAlign: "center",
          marginBottom: "16px",
          lineHeight: 1.1,
          fontFamily: "'Outfit', sans-serif",
        }}>
          Let's build something.
        </h2>
        <p style={{
          fontSize: "16px",
          color: "rgba(255, 255, 255, 0.5)",
          textAlign: "center",
          marginBottom: "48px",
          fontWeight: 300,
        }}>
          Open to collaborations, freelance, and interesting systems problems.
        </p>

        {/* Frosted Terminal Window */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            background: "rgba(255, 255, 255, 0.01)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            cursor: "text",
            position: "relative",
          }}
        >
          {/* Subtle hue-rotating edge highlight */}
          <div className="hue-animated-glow" style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "16px",
            border: "1px solid transparent",
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(0,229,255,0.2)) border-box",
            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            opacity: 0.8,
          }} />

          {/* Terminal bar */}
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div className="traffic-light red" style={{ width: 10, height: 10 }} />
            <div className="traffic-light yellow" style={{ width: 10, height: 10 }} />
            <div className="traffic-light green" style={{ width: 10, height: 10 }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              marginLeft: "12px",
            }}>
              terminal — anand@dev: ~
            </span>
          </div>

          {/* Body */}
          <div
            ref={bodyRef}
            style={{
              padding: "24px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
              lineHeight: "1.75",
              color: "rgba(255,255,255,0.7)",
              height: "360px",
              overflowY: "auto",
            }}
          >
            {lines.map((line, i) => (
              <div key={i} style={{ marginBottom: "4px" }}>
                {line.type === "cmd" && (
                  <>
                    <span style={{ color: "#6366f1", marginRight: "8px" }}>anand@dev:~$</span>
                    <span style={{ color: "#ffffff", fontWeight: 500 }}>{line.text}</span>
                  </>
                )}
                {line.type === "out" && (
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{line.text}</span>
                )}
                {line.type === "err" && (
                  <span style={{ color: "#ff4d4d" }}>{line.text}</span>
                )}
              </div>
            ))}

            {/* Input line */}
            <div style={{ display: "flex", alignItems: "center", marginTop: "4px" }}>
              <span style={{ color: "#6366f1", marginRight: "8px" }}>anand@dev:~$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                spellCheck={false}
                aria-label="Terminal input"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  flex: 1,
                  caretColor: "#6366f1",
                  padding: 0,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
