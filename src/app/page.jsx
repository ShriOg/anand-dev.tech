"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const orbRef = useRef(null);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    const onMouseMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;

      window.requestAnimationFrame(() => {
        orb.style.transform = `translate(calc(-50% + ${x * 80}px), calc(${y * 80}px)) scale(1.05)`;
      });
    };

    if (window.matchMedia("(pointer: fine)").matches) {
      document.addEventListener("mousemove", onMouseMove);
    }

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <>
      <div className="glow-orb" ref={orbRef}></div>
      <main className="content-wrapper">
        <nav className="glass-nav">
          <div className="logo">anand.dev</div>
          <ul className="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#work">Work</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>

        <section className="hero" id="about">
          <h1 className="hero-title animate-in">Building <span className="highlight">Systems</span>.<br />Not Just Websites.</h1>
          <p className="hero-subtitle animate-in" style={{ animationDelay: "0.1s" }}>
            Crafting highly performant, visually stunning web experiences from scratch.
          </p>
          <a href="#work" className="btn primary animate-in" style={{ animationDelay: "0.2s" }}>
            Explore Work
          </a>
        </section>

        <section id="work" className="projects-section">
          <h2 className="section-title">Functional Apps</h2>
          <div className="cards-grid">
            <a href="/webos" className="app-card">
              <div className="card-icon">💻</div>
              <h3>Web OS</h3>
              <p>A complete operating system in your browser. Functional notepad, draggable windows, and persistent logic.</p>
            </a>
            <a href="/domainbattle" className="app-card">
              <div className="card-icon">⚔️</div>
              <h3>Domain Battle</h3>
              <p>Real-time territory conquest game. Play locally against an automated AI bot directly in the browser.</p>
            </a>
            <a href="/portfolio" className="app-card">
              <div className="card-icon">📁</div>
              <h3>Portfolio Hub</h3>
              <p>Data-driven project grid with functional category filtering and immersive layout modals.</p>
            </a>
          </div>
        </section>

        <section id="contact" className="projects-section">
          <h2 className="section-title">Contact</h2>
          <p className="hero-subtitle" style={{ margin: "0 auto", textAlign: "center" }}>
            Reach out via your preferred channel.
          </p>
        </section>
      </main>
    </>
  );
}
