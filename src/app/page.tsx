import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { Timeline } from "@/components/sections/Timeline";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      {/* Section 1 — The Builder Engine */}
      <Hero />

      {/* Section 2 — About / Terminal */}
      <About />

      {/* Section 3 — Project Solar System */}
      <Projects />

      {/* Section 4 — Skills Constellation */}
      <Skills />

      {/* Section 6 — Timeline / Build Log */}
      <Timeline />

      {/* Section 7 — Contact Terminal */}
      <Contact />

      {/* Footer */}
      <footer
        style={{
          background: "var(--bg-deep)",
          borderTop: "1px solid rgba(99,102,241,0.08)",
          padding: "32px clamp(24px, 5vw, 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: 900,
            color: "#fff",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            A
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "#475569",
            letterSpacing: "0.1em",
          }}>
            Anand Shukla
          </span>
        </div>

        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "#334155",
          letterSpacing: "0.1em",
        }}>
          © {new Date().getFullYear()} — built with intent.
        </span>
      </footer>
    </>
  );
}
