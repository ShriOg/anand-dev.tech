"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

export function TechStack() {
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = [
    { 
      name: "Core Frontend", 
      items: ["Next.js", "React", "TypeScript", "TailwindCSS"],
      color: "from-blue-500/20 to-blue-500/0",
      borderColor: "border-blue-500/30"
    },
    { 
      name: "Motion & UI", 
      items: ["Framer Motion", "GSAP", "Lenis", "shadcn/ui", "Radix"],
      color: "from-purple-500/20 to-purple-500/0",
      borderColor: "border-purple-500/30"
    },
    { 
      name: "Backend & Systems", 
      items: ["Node.js", "PostgreSQL", "Prisma", "Socket.io", "Redis"],
      color: "from-emerald-500/20 to-emerald-500/0",
      borderColor: "border-emerald-500/30"
    },
    { 
      name: "Design & Tools", 
      items: ["Figma", "Linear", "Vercel", "Git", "Framer"],
      color: "from-orange-500/20 to-orange-500/0",
      borderColor: "border-orange-500/30"
    }
  ];

  return (
    <section id="stack" ref={containerRef} className="py-32 bg-zinc-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-brand-blue/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-4xl md:text-6xl font-outfit font-bold text-white mb-6"
          >
            The Engine Room
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg md:text-xl font-light max-w-2xl mx-auto"
          >
            My arsenal of tools, carefully selected for building scalable, high-performance, and visually stunning digital products.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className={`group relative p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm overflow-hidden hover:border-zinc-700/80 transition-colors duration-500`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl border ${category.borderColor} bg-zinc-950/50 mb-6 flex items-center justify-center`}>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
                
                <h3 className="text-xl font-outfit font-semibold text-white mb-6">{category.name}</h3>
                
                <ul className="space-y-4">
                  {category.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-center gap-3 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-brand-blue transition-colors duration-300" />
                      <span className="font-medium text-sm tracking-wide">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
