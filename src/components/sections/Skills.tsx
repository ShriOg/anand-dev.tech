"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  r: number;
  color: string;
  category: string;
}

interface Connection {
  from: string;
  to: string;
}

const NODES: Node[] = [
  { id: "nextjs", name: "Next.js", x: 180, y: 150, r: 42, color: "#00e5ff", category: "Core Frontend" },
  { id: "react", name: "React", x: 290, y: 110, r: 40, color: "#00e5ff", category: "Core Frontend" },
  { id: "typescript", name: "TypeScript", x: 220, y: 240, r: 38, color: "#00e5ff", category: "Core Frontend" },
  { id: "tailwind", name: "TailwindCSS", x: 330, y: 210, r: 30, color: "#00e5ff", category: "Core Frontend" },

  { id: "nodejs", name: "Node.js", x: 440, y: 150, r: 42, color: "#6366f1", category: "Backend & Systems" },
  { id: "mongodb", name: "MongoDB", x: 530, y: 250, r: 36, color: "#6366f1", category: "Backend & Systems" },
  { id: "apis", name: "REST APIs", x: 390, y: 270, r: 32, color: "#6366f1", category: "Backend & Systems" },

  { id: "ai", name: "AI Systems", x: 640, y: 160, r: 45, color: "#c084fc", category: "Groq, LLMs, AI" },
  { id: "groq", name: "Groq API", x: 760, y: 130, r: 34, color: "#c084fc", category: "Groq, LLMs, AI" },
  { id: "llms", name: "LLMs / RAG", x: 710, y: 240, r: 38, color: "#c084fc", category: "Groq, LLMs, AI" },

  { id: "python", name: "Python", x: 540, y: 370, r: 38, color: "#00e676", category: "Computer Vision" },
  { id: "opencv", name: "OpenCV", x: 650, y: 350, r: 30, color: "#00e676", category: "Computer Vision" },
  { id: "mediapipe", name: "MediaPipe", x: 440, y: 380, r: 28, color: "#00e676", category: "Computer Vision" },

  { id: "arduino", name: "Arduino", x: 280, y: 370, r: 36, color: "#ff8c00", category: "Hardware & IoT" },
  { id: "esp32", name: "ESP32 / IoT", x: 180, y: 350, r: 32, color: "#ff8c00", category: "Hardware & IoT" },
  { id: "cpp", name: "C++", x: 360, y: 400, r: 30, color: "#ff8c00", category: "Hardware & IoT" },

  { id: "linux", name: "Linux OS", x: 110, y: 250, r: 35, color: "#ffd600", category: "Environment" }
];

const CONNECTIONS: Connection[] = [
  { from: "nextjs", to: "react" },
  { from: "nextjs", to: "typescript" },
  { from: "react", to: "typescript" },
  { from: "react", to: "tailwind" },
  { from: "typescript", to: "nodejs" },
  { from: "nodejs", to: "apis" },
  { from: "nodejs", to: "mongodb" },
  { from: "nodejs", to: "ai" },
  { from: "ai", to: "groq" },
  { from: "ai", to: "llms" },
  { from: "apis", to: "python" },
  { from: "python", to: "opencv" },
  { from: "python", to: "mediapipe" },
  { from: "arduino", to: "esp32" },
  { from: "arduino", to: "cpp" },
  { from: "esp32", to: "cpp" },
  { from: "linux", to: "python" },
  { from: "linux", to: "arduino" }
];

export function Skills() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle drift & rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Precalculate node positions with unique sine drift
      const positions = NODES.map((node, i) => {
        const driftX = Math.sin(time + i * 1.5) * 5;
        const driftY = Math.cos(time + i * 2.1) * 5;
        
        let scale = 1.0;
        if (hoveredNode && hoveredNode.id === node.id) {
          scale = 1.4;
        }

        return {
          ...node,
          x: node.x + driftX,
          y: node.y + driftY,
          r: node.r * scale,
        };
      });

      // Draw Connections (lines)
      CONNECTIONS.forEach((conn) => {
        const fromNode = positions.find((n) => n.id === conn.from);
        const toNode = positions.find((n) => n.id === conn.to);
        if (!fromNode || !toNode) return;

        const isHoveredConnection =
          hoveredNode &&
          (hoveredNode.id === conn.from || hoveredNode.id === conn.to);

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.lineWidth = isHoveredConnection ? 2.5 : 1.2;
        ctx.strokeStyle = isHoveredConnection
          ? "rgba(255, 255, 255, 0.4)"
          : "rgba(255, 255, 255, 0.08)";
        ctx.stroke();
      });

      // Draw Nodes (circles)
      positions.forEach((node) => {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isConnected =
          hoveredNode &&
          CONNECTIONS.some(
            (c) =>
              (c.from === hoveredNode.id && c.to === node.id) ||
              (c.to === hoveredNode.id && c.from === node.id)
          );

        // Draw outer spectrum glowing circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        
        // Inner gradient
        const radGrad = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.r
        );
        
        if (isHovered) {
          radGrad.addColorStop(0, `${node.color}ff`);
          radGrad.addColorStop(1, `${node.color}55`);
        } else if (isConnected) {
          radGrad.addColorStop(0, `${node.color}bb`);
          radGrad.addColorStop(1, `${node.color}22`);
        } else {
          radGrad.addColorStop(0, `${node.color}44`);
          radGrad.addColorStop(1, `${node.color}08`);
        }

        ctx.fillStyle = radGrad;
        ctx.fill();

        // Stroke border
        ctx.lineWidth = isHovered ? 2.5 : 1;
        ctx.strokeStyle = isHovered
          ? "#ffffff"
          : isConnected
          ? "rgba(255, 255, 255, 0.4)"
          : "rgba(255, 255, 255, 0.15)";
        ctx.stroke();

        // White center dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Text labels inside / below node
        ctx.fillStyle = isHovered ? "#ffffff" : isConnected ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)";
        ctx.font = isHovered ? "bold 12px 'JetBrains Mono', monospace" : "11px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y + node.r + 16);
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [hoveredNode]);

  // Handle mouse moves for hit testing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check hit test
    let found: Node | null = null;
    for (const node of NODES) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist <= node.r + 20) {
        found = node;
        break;
      }
    }

    setHoveredNode(found);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  return (
    <section
      id="skills"
      ref={containerRef}
      style={{
        background: "var(--bg-deep)",
        padding: "100px clamp(24px, 8vw, 120px)",
        position: "relative",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      {/* Absolute bloom background */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.16, scale: 4.5 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: hoveredNode.x,
              top: hoveredNode.y,
              width: "250px",
              height: "250px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hoveredNode.color} 0%, transparent 70%)`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ position: "relative", zIndex: 5, maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "50px" }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "#6366f1",
            marginBottom: "8px",
          }}>
            04 / EXPERTISE
          </p>
          <h2 style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.03em",
          }}>
            Technology Constellation.
          </h2>
          <p style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.4)",
            fontFamily: "'JetBrains Mono', monospace",
            marginTop: "8px",
          }}>
            Hover nodes to bloom core frequencies →
          </p>
        </div>

        {/* Canvas Area */}
        <div style={{
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          background: "rgba(255,255,255,0.01)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "20px",
          backdropFilter: "blur(8px)",
          overflow: "hidden",
        }}>
          <canvas
            ref={canvasRef}
            width={900}
            height={500}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            data-cursor-color={hoveredNode ? hoveredNode.color : "#6366f1"}
            style={{
              width: "100%",
              maxWidth: "900px",
              height: "auto",
              display: "block",
              cursor: hoveredNode ? "pointer" : "default",
            }}
          />

          {/* Frosted Glass Tooltip Pill */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  position: "absolute",
                  left: mousePos.x,
                  top: mousePos.y - 65,
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: `1px solid ${hoveredNode.color}66`,
                  backdropFilter: "blur(12px)",
                  borderRadius: "100px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 16px ${hoveredNode.color}22`,
                }}
              >
                <span style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#ffffff",
                }}>
                  {hoveredNode.name}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "rgba(255, 255, 255, 0.6)",
                  letterSpacing: "1px",
                  marginTop: "2px",
                }}>
                  {hoveredNode.category.toUpperCase()}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
