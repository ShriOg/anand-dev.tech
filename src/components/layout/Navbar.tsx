"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Work", href: "#projects" },
    { name: "Stack", href: "#stack" },
    { name: "Contact", href: "#contact" },
    { name: "Clock", href: "/clock" },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? "py-4" : "py-6"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div
            className={`flex items-center justify-between rounded-full transition-all duration-500 ${
              isScrolled
                ? "glass px-6 py-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-zinc-800/80 bg-zinc-950/60"
                : "px-2 py-2"
            }`}
          >
            <Link href="/" className="relative z-10 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500">
                <span className="text-zinc-950 font-bold font-outfit text-xl tracking-tighter group-hover:scale-110 transition-transform duration-300">A</span>
              </div>
              <div className="flex flex-col hidden sm:flex">
                <span className="font-outfit font-semibold text-lg tracking-tight text-zinc-100 leading-none">
                  Anand Shukla
                </span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Founder & Developer</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/40 p-1.5 rounded-full border border-zinc-800/60 backdrop-blur-md">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative px-6 py-2.5 rounded-full text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors duration-300 group overflow-hidden"
                >
                  <span className="relative z-10">{link.name}</span>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                </Link>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Link href="#contact" className="relative group overflow-hidden rounded-full p-[1px]">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full opacity-70 group-hover:opacity-100 animate-pulse transition-opacity duration-500" />
                <div className="relative bg-zinc-950 px-6 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300 group-hover:bg-zinc-900">
                  <span className="text-sm font-medium text-white">Let&apos;s Talk</span>
                  <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                </div>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden relative z-10 p-2 text-zinc-400 hover:text-white transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-2xl pt-32 px-6 flex flex-col justify-between pb-12 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-5xl font-outfit font-light tracking-tight text-zinc-400 hover:text-white transition-colors block"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="border-t border-zinc-800 pt-8"
            >
              <Link 
                href="#contact"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 py-4 rounded-full font-medium text-lg"
              >
                Let&apos;s Build Together
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
