"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  stack: string[];
  links: { label: string; url: string }[];
  status: string;
}

interface ProjectDetailProps {
  project: Project | null;
  onClose: () => void;
}

/**
 * ProjectDetail — slides up from bottom when a planet is clicked.
 * Background tints to the planet's atmosphere color.
 */
export function ProjectDetail({ project, onClose }: ProjectDetailProps) {
  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop tint */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 30,
              background: `radial-gradient(ellipse at center, ${project.color}08 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="project-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              padding: "40px clamp(24px, 5vw, 80px)",
              maxHeight: "55vh",
              overflowY: "auto",
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close project detail"
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "#475569",
                background: "transparent",
                border: "1px solid rgba(71,85,105,0.3)",
                padding: "6px 12px",
                letterSpacing: "0.1em",
              }}
            >
              [ ESC ]
            </button>

            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "24px" }}>
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: project.color,
                  flexShrink: 0,
                  marginTop: "4px",
                }} />
                <div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    color: project.color,
                    display: "block",
                    marginBottom: "6px",
                  }}>
                    {project.status.toUpperCase()}
                  </span>
                  <h2 style={{
                    fontSize: "clamp(28px, 4vw, 48px)",
                    fontWeight: 900,
                    color: "#f8fafc",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}>
                    {project.name}
                  </h2>
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontSize: "16px",
                color: "#94a3b8",
                lineHeight: 1.7,
                maxWidth: "600px",
                marginBottom: "28px",
              }}>
                {project.description}
              </p>

              {/* Stack */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                {project.stack.map(tech => (
                  <span
                    key={tech}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      color: project.color,
                      border: `1px solid ${project.color}40`,
                      padding: "4px 10px",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Links */}
              <div style={{ display: "flex", gap: "16px" }}>
                {project.links.map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="hover"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      letterSpacing: "0.15em",
                      color: "#f8fafc",
                      textDecoration: "none",
                      padding: "10px 20px",
                      border: "1px solid rgba(248,250,252,0.15)",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
