"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, MessageSquare, Briefcase, Code2, ArrowRight } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="py-32 bg-zinc-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-outfit font-bold text-white mb-6 tracking-tight"
            >
              Let&apos;s build <br />
              something <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">incredible.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 text-xl font-light mb-12 max-w-md"
            >
              Whether you have a revolutionary idea, need a technical co-founder, or just want to chat about the future of the web.
            </motion.p>
            
            <div className="space-y-6">
              <motion.a 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                href="mailto:anand@anand-dev.tech"
                className="flex items-center gap-4 text-zinc-300 hover:text-white transition-colors group w-fit"
              >
                <div className="w-12 h-12 rounded-full glass border border-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                  <Mail size={20} />
                </div>
                <span className="text-lg font-medium">anand@anand-dev.tech</span>
              </motion.a>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 text-zinc-400 w-fit"
              >
                <div className="w-12 h-12 rounded-full glass border border-zinc-800/50 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <span className="text-lg font-medium">Global</span>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 mt-12"
            >
              {[
                { 
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ), 
                  href: "https://x.com/AnandShukl76825" 
                },
                { 
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  ), 
                  href: "https://linkedin.com/in/anand-shukla-0ab31b388/" 
                },
                { 
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  ), 
                  href: "https://github.com/ShriOg" 
                }
              ].map((social, idx) => (
                <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-300 hover:scale-110">
                  {social.icon}
                </a>
              ))}
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <form className="glass-card p-8 md:p-10 rounded-3xl border border-zinc-800/60 flex flex-col gap-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-zinc-400 ml-1">Name</label>
                  <input type="text" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" placeholder="John Doe" />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-zinc-400 ml-1">Email</label>
                  <input type="email" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" placeholder="john@example.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Message</label>
                <textarea rows={5} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none" placeholder="Tell me about your project..." />
              </div>
              
              <button type="button" className="w-full mt-4 bg-white text-zinc-950 font-medium text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors group/btn relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Send Message
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
