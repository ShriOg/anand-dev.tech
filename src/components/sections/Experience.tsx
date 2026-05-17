"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const journey = [
    {
      year: "2025 - Present",
      title: "Founder & Lead Developer",
      company: "MenuNova",
      description: "Building the next-generation operating system for restaurants. Architecting a full-stack Next.js ecosystem with real-time data sync, PWA resilience, and a stunning interface."
    },
    {
      year: "2024 - 2025",
      title: "Student Developer",
      company: "Independent / Open Source",
      description: "Focused heavily on mastering the modern web. Built numerous deep-dive projects exploring React server components, advanced Framer Motion physics, and systems design."
    },
    {
      year: "2023 - 2024",
      title: "The Beginning",
      company: "Self-Taught",
      description: "Fell in love with programming. Started with basic HTML/CSS and quickly progressed to full-stack JavaScript, driven by the desire to build products that look and feel incredible."
    }
  ];

  return (
    <section className="py-32 relative bg-zinc-950" ref={containerRef}>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative">
        
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-outfit font-bold text-white mb-4">The Journey</h2>
          <p className="text-zinc-500 font-light">A timeline of building, learning, and obsessing over details.</p>
        </div>

        <div className="relative">
          {/* Animated Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-[1px] bg-zinc-800 -translate-x-1/2">
            <motion.div 
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-blue-500 to-purple-500 origin-top"
            />
          </div>

          {/* Timeline Items */}
          <div className="space-y-24">
            {journey.map((item, idx) => (
              <TimelineItem key={idx} item={item} index={idx} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

function TimelineItem({ item, index }: { item: { year: string; title: string; company: string; description: string }, index: number }) {
  const isEven = index % 2 === 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col md:flex-row items-center justify-between w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Node */}
      <div className="absolute left-0 md:left-1/2 top-0 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 w-10 h-10 rounded-full bg-zinc-950 border-4 border-zinc-900 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="w-3 h-3 rounded-full bg-zinc-600 transition-colors duration-500" />
      </div>

      {/* Content */}
      <div className={`w-full md:w-5/12 ml-12 md:ml-0 ${isEven ? 'md:pl-12' : 'md:pr-12 md:text-right'}`}>
        <div className="glass-card p-8 rounded-3xl border border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-300 group">
          <div className="text-brand-blue text-sm font-bold tracking-widest uppercase mb-2">{item.year}</div>
          <h3 className="text-2xl font-outfit font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-500 transition-all duration-300">{item.title}</h3>
          <div className="text-zinc-500 text-sm font-medium mb-4">{item.company}</div>
          <p className="text-zinc-400 font-light leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
