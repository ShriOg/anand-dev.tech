"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1 0.5"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <section id="about" className="py-32 relative bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div 
          ref={ref}
          style={{ y, opacity }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-outfit font-bold mb-8 text-white">
              Engineering <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Systems</span>, <br />
              Designing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Experiences</span>.
            </h2>
            
            <div className="space-y-6 text-zinc-400 text-lg font-light leading-relaxed">
              <p>
                I am a student developer and the founder of <strong className="text-white font-medium">MenuNova</strong>. My journey is defined by an obsession with product design and systems thinking. I build tools that feel alive, intuitive, and relentlessly polished.
              </p>
              <p>
                I believe that software shouldn&apos;t just solve problems—it should evoke an emotion. Bridging the gap between deeply technical infrastructure and stunning user interfaces is where I thrive.
              </p>
              <p>
                From architecting scalable microservices to crafting buttery-smooth frontend animations, my focus remains singular: delivering world-class digital products that push the boundaries of what the web can do.
              </p>
            </div>
            
            <div className="mt-12 flex items-center gap-8">
              <div>
                <div className="text-4xl font-outfit font-bold text-white mb-1">5+</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest">Projects Built</div>
              </div>
              <div className="w-[1px] h-12 bg-zinc-800" />
              <div>
                <div className="text-4xl font-outfit font-bold text-white mb-1">100%</div>
                <div className="text-sm text-zinc-500 uppercase tracking-widest">Founder Energy</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden relative glass-card p-2 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="w-full h-full rounded-2xl bg-zinc-900 border border-zinc-800/50 relative overflow-hidden flex items-center justify-center">
                {/* Abstract visualization replacing image */}
                <div className="absolute inset-0 mesh-bg opacity-30" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-64 h-64 rounded-full border border-zinc-800 border-dashed absolute"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="w-48 h-48 rounded-full border border-zinc-700 absolute"
                />
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-[40px] animate-pulse" />
                <div className="text-zinc-500 font-outfit font-light tracking-widest uppercase z-10 text-sm glass px-4 py-2 rounded-full">
                  Systems Thinker
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 glass-card p-4 rounded-2xl flex items-center gap-3 border border-zinc-800/50 shadow-xl"
            >
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-sm font-medium text-zinc-300">Building the future</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
