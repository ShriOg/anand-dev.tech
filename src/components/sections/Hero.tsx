"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Code, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950 pt-20"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 mesh-bg opacity-40" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] animate-blob animation-delay-4000 mix-blend-screen" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full flex flex-col items-center text-center mt-12"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-zinc-800/80 mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          <span className="text-sm font-medium text-zinc-300">Available for new opportunities</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden mb-4"
        >
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[140px] font-outfit font-bold tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500 py-2">
            Anand Shukla
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-10"
        >
          <p className="text-xl md:text-3xl font-light text-zinc-400 tracking-tight leading-snug">
            Building digital experiences, systems, and <br className="hidden md:block"/> 
            <span className="text-white font-medium relative inline-block">
              future-ready products.
              <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
            </span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link href="#projects">
            <button className="relative group px-8 py-4 rounded-full bg-white text-zinc-950 font-medium text-lg flex items-center gap-2 overflow-hidden hover:scale-105 transition-transform duration-300">
              <span className="relative z-10">Explore Work</span>
              <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </Link>
          <Link href="#contact">
            <button className="px-8 py-4 rounded-full glass border border-zinc-700 text-white font-medium text-lg hover:bg-zinc-800/50 transition-colors duration-300">
              Contact Me
            </button>
          </Link>
        </motion.div>

        {/* Tech Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 flex flex-wrap justify-center gap-4 max-w-2xl"
        >
          {[
            { name: "Developer", icon: <Code size={16} /> },
            { name: "Founder of MenuNova", icon: <Zap size={16} /> },
            { name: "Creative Engineer", icon: <Sparkles size={16} /> }
          ].map((pill, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-zinc-800/50 text-sm text-zinc-400 hover:text-white transition-colors duration-300 cursor-default">
              <span className="text-brand-blue">{pill.icon}</span>
              {pill.name}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-zinc-500 to-transparent relative overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 w-full h-1/2 bg-white"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
