"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function Projects() {
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

  const projects = [
    {
      title: "MenuNova",
      description: "A premium, business-centric restaurant operating system and digital menu platform. Architected with high-end resilient PWA capabilities, real-time sync, and an immersive dashboard.",
      tags: ["Next.js", "TypeScript", "Tailwind", "Socket.io", "PostgreSQL"],
      link: "https://menunova.me",
      featured: true,
      year: "2026",
      role: "Founder & Lead Developer"
    },
    {
      title: "Nexus Engine",
      description: "High-performance data visualization dashboard tailored for enterprise analytics. Features smooth interactive charts and sub-millisecond data fetching.",
      tags: ["React", "Framer Motion", "D3.js", "tRPC"],
      link: "#",
      featured: false,
      year: "2025",
      role: "Full Stack Engineer"
    },
    {
      title: "Aura UI",
      description: "An experimental, deeply animated React component library focusing on tactile interactions, physics-based motion, and absolute developer experience.",
      tags: ["React", "Radix", "Framer Motion", "CSS Variables"],
      link: "#",
      featured: false,
      year: "2025",
      role: "Creator"
    }
  ];

  return (
    <section id="projects" className="py-32 relative bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-20">
          <h2 className="text-sm uppercase tracking-widest text-brand-blue font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-[1px] bg-brand-blue" />
            Selected Work
          </h2>
          <h3 className="text-4xl md:text-6xl font-outfit font-bold text-white tracking-tight">
            Featured <span className="text-zinc-600">Projects</span>
          </h3>
        </div>

        <div className="space-y-12">
          {projects.map((project, index) => (
            <ProjectCard 
              key={index} 
              project={project} 
              isHovered={hoveredProject === index}
              onHover={() => setHoveredProject(index)}
              onLeave={() => setHoveredProject(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project, isHovered, onHover, onLeave }: { project: any, isHovered: boolean, onHover: () => void, onLeave: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1", "1 0.8"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.2, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative group rounded-[2rem] overflow-hidden transition-all duration-700 ease-out border border-zinc-800/40 bg-zinc-900/20 backdrop-blur-sm ${
        project.featured ? "p-1" : "p-0"
      }`}
    >
      {project.featured && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-20 group-hover:opacity-100 transition-opacity duration-1000 blur-xl" />
      )}
      
      <div className={`relative h-full flex flex-col lg:flex-row bg-zinc-950/80 rounded-[1.8rem] overflow-hidden z-10 border ${project.featured ? 'border-zinc-800/80' : 'border-transparent'}`}>
        
        {/* Project Info */}
        <div className="w-full lg:w-5/12 p-8 lg:p-12 flex flex-col justify-between z-20 relative">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {project.featured && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-brand-blue text-xs font-semibold tracking-wider uppercase border border-blue-500/20">
                    Flagship
                  </span>
                )}
                <span className="text-zinc-500 text-sm font-medium">{project.year}</span>
              </div>
              <Link href={project.link} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-zinc-950 transition-colors duration-300">
                <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform duration-300" />
              </Link>
            </div>
            
            <h4 className="text-3xl lg:text-4xl font-outfit font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-500 transition-all duration-300">
              {project.title}
            </h4>
            <div className="text-sm text-zinc-400 mb-6 font-medium">{project.role}</div>
            
            <p className="text-zinc-400 font-light leading-relaxed mb-8">
              {project.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag: string, i: number) => (
              <span key={i} className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium tracking-wide">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Visual Preview */}
        <div className="w-full lg:w-7/12 relative min-h-[300px] lg:min-h-0 bg-zinc-900/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 lg:hidden" />
          
          <motion.div 
            className="absolute inset-0 w-full h-full bg-zinc-800 flex items-center justify-center p-8"
            animate={{ 
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Abstract UI representation */}
            <div className="w-full h-full max-h-[400px] bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col relative group/ui">
              {/* Header */}
              <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 p-6 flex flex-col gap-4 relative">
                <div className="w-1/3 h-6 rounded bg-zinc-800/50" />
                <div className="flex gap-4">
                  <div className="w-1/2 h-24 rounded-lg bg-zinc-900 border border-zinc-800/50" />
                  <div className="w-1/2 h-24 rounded-lg bg-blue-900/20 border border-blue-500/20" />
                </div>
                <div className="w-full flex-1 rounded-lg bg-zinc-900/50 border border-zinc-800/50" />
                
                {project.title === "MenuNova" && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-purple-600/10 pointer-events-none"
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </motion.div>
  );
}
