"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const PROJECTS = [
  {
    id: "menunova",
    name: "MenuNova",
    status: "live",
    description: "A restaurant tech startup I founded from scratch. Digital menus, cart system, admin dashboard, and QR ordering.",
    stack: ["Next.js", "MongoDB", "Tailwind", "Vercel", "JWT"],
    link: "https://menunova.vercel.app",
    color: "#ff8c00",
    bg: "radial-gradient(ellipse at 30% 60%, #ff8c00 0%, #7c2d00 40%, #1a0800 100%)"
  },
  {
    id: "nova",
    name: "Nova Companion",
    status: "live",
    description: "Live AI companion with real users. Full-stack with Next.js 15, MongoDB, Groq AI, JWT auth, and Vercel deployment.",
    stack: ["Next.js 15", "MongoDB", "Groq AI", "JWT", "Vercel"],
    link: "https://anand-dev.tech/nova",
    color: "#6366f1",
    bg: "radial-gradient(ellipse at 70% 40%, #6366f1 0%, #1e1b4b 40%, #030308 100%)"
  },
  {
    id: "gesture",
    name: "Gesture Control",
    status: "live",
    description: "Real-time computer vision system that controls your computer with hand gestures. Built with MediaPipe and OpenCV.",
    stack: ["Python", "MediaPipe", "OpenCV", "NumPy"],
    link: "https://github.com/ShriOg/gesture-control",
    color: "#00e5ff",
    bg: "radial-gradient(ellipse at 50% 50%, #00e5ff 0%, #0c4a6e 35%, #010d14 100%)"
  },
  {
    id: "dustbin",
    name: "Smart Dustbin",
    status: "wip",
    description: "IoT smart waste management system with Arduino and ESP32. Sensor-based lid control and fill-level monitoring.",
    stack: ["Arduino", "ESP32", "C++", "IoT"],
    link: "https://github.com/ShriOg/smart-dustbin",
    color: "#00e676",
    bg: "radial-gradient(ellipse at 40% 60%, #00e676 0%, #064e3b 40%, #01100a 100%)"
  }
];

export function Projects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Framer Motion Scroll setup for horizontal translation on desktop
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  // Calculate active index on scroll
  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      // Divide the progress space into 4 steps
      const idx = Math.min(
        PROJECTS.length - 1,
        Math.floor(latest * PROJECTS.length)
      );
      setActiveIndex(idx);
    });
  }, [scrollYProgress]);

  if (isMobile) {
    return (
      <section
        id="projects"
        style={{
          background: "var(--bg-deep)",
          padding: "60px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: "40px" }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "#6366f1",
            marginBottom: "8px",
          }}>
            03 / PROJECTS
          </p>
          <h2 style={{
            fontSize: "32px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.03em",
          }}>
            Selected Work.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {PROJECTS.map((proj) => (
            <div
              key={proj.id}
              data-cursor-color={proj.color}
              style={{
                background: proj.bg,
                borderRadius: "20px",
                padding: "32px 24px",
                minHeight: "450px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    color: proj.status === "live" ? "#00e676" : "#ffd600",
                    background: "rgba(0,0,0,0.4)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}>
                    ● {proj.status.toUpperCase()}
                  </span>
                </div>
                <h3 style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  color: "#ffffff",
                  marginBottom: "12px",
                  lineHeight: 1.1,
                }}>
                  {proj.name}
                </h3>
                <p style={{
                  fontSize: "15px",
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: 1.6,
                  marginBottom: "24px",
                }}>
                  {proj.description}
                </p>
              </div>

              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                  {proj.stack.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        fontSize: "11px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#ffffff",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        padding: "4px 10px",
                        borderRadius: "100px",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={proj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "14px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: "bold",
                    borderBottom: "2px solid #ffffff",
                    paddingBottom: "2px",
                    display: "inline-block",
                  }}
                >
                  View Project ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div ref={containerRef} style={{ height: "400vh", position: "relative" }}>
      {/* Sticky viewports */}
      <div style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        {/* Title overlay */}
        <div style={{
          position: "absolute",
          top: "6vh",
          left: "clamp(24px, 8vw, 120px)",
          zIndex: 20,
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "#6366f1",
            marginBottom: "8px",
          }}>
            03 / PROJECTS
          </p>
          <h2 style={{
            fontSize: "clamp(32px, 3.5vw, 48px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.03em",
          }}>
            Selected Work.
          </h2>
        </div>

        {/* Sliding flex row container */}
        <motion.div
          style={{
            display: "flex",
            width: "400vw",
            height: "80vh",
            x,
          }}
        >
          {PROJECTS.map((proj, i) => (
            <div
              key={proj.id}
              style={{
                width: "100vw",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 10vw",
                boxSizing: "border-box",
              }}
            >
              <div
                data-cursor-color={proj.color}
                style={{
                  width: "100%",
                  maxWidth: "1100px",
                  height: "85%",
                  background: proj.bg,
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
                  padding: "60px",
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr",
                  gap: "40px",
                  alignItems: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      letterSpacing: "2.5px",
                      color: proj.status === "live" ? "#00e676" : "#ffd600",
                      background: "rgba(0,0,0,0.5)",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontWeight: "bold",
                    }}>
                      ● {proj.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: "clamp(36px, 4vw, 56px)",
                    fontWeight: 900,
                    letterSpacing: "-2px",
                    color: "#ffffff",
                    marginBottom: "20px",
                    lineHeight: 1.05,
                  }}>
                    {proj.name}
                  </h3>
                  <p style={{
                    fontSize: "17px",
                    color: "rgba(255, 255, 255, 0.85)",
                    lineHeight: 1.7,
                    maxWidth: "520px",
                  }}>
                    {proj.description}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: "32px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {proj.stack.map((tech) => (
                      <span
                        key={tech}
                        style={{
                          fontSize: "12px",
                          fontFamily: "'JetBrains Mono', monospace",
                          color: "#ffffff",
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          padding: "6px 12px",
                          borderRadius: "100px",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "15px",
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontWeight: "bold",
                      borderBottom: "2px solid #ffffff",
                      paddingBottom: "4px",
                      display: "inline-block",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    View Project ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Horizontal scroll indicator (dots) */}
        <div
          style={{
            position: "absolute",
            bottom: "6vh",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "16px",
            zIndex: 20,
          }}
        >
          {PROJECTS.map((proj, idx) => (
            <button
              key={proj.id}
              onClick={() => {
                // Scroll to corresponding page section
                window.scrollTo({
                  top: containerRef.current
                    ? containerRef.current.offsetTop + (idx * window.innerHeight)
                    : 0,
                  behavior: "smooth"
                });
              }}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: activeIndex === idx ? proj.color : "rgba(255, 255, 255, 0.2)",
                boxShadow: activeIndex === idx ? `0 0 12px ${proj.color}` : "none",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              aria-label={`Go to project ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
