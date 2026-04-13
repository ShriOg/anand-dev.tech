"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import contentData from "../../data/abhilasha/content.json";

export default function MemoriesScreen() {
  const [expandedMemoryId, setExpandedMemoryId] = useState(null);

  const memories = contentData?.memories || [];
  const profileImage = contentData?.profileImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ccircle cx='100' cy='100' r='100' fill='%23e8a4b8'/%3E%3C/svg%3E";
  const name = contentData?.name || "Abhilasha";

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-[100dvh]">
      <style dangerouslySetInnerHTML={{__html: `
        .bg-grain { background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuCLTV8GuWtz1WQLhdANWKDDcWXA364VQbUq9muxtMX3Uef6-_YDwd_j3aWtge5pa2jZ2-2l8z2cajqxveHZraScx-kKmwGEq6PN0SiriZjKTF7x0EcJx4MficOG3VMKzV51VLZSe6yynXQiQatkZgIaGv7APedCbibIfm60N4bxDC_7jSiZxoN6EcsXqRH4W8UKnjdnbyxriCJYGbC4Ogc5G-dQoggceVyVpy9xOoKPXyNvccuBx75lBBv6OcSVC2yxZo2tAQb2Te8"); opacity: 0.03; }
        .asymmetric-float { animation: float 6s ease-in-out infinite; }
        .reverse-float { animation: float 7s ease-in-out infinite reverse; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}} />
      
      {/* Atmospheric Background Elements */}
      <div className="fixed inset-0 bg-grain pointer-events-none z-0"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-tertiary/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
      
      <header className="sticky top-0 z-40 bg-[#0f131e]/60 backdrop-blur-xl flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20">
              <img alt={`${name}'s profile`} className="w-full h-full object-cover" src={profileImage}/>
            </div>
            <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">Hey {name}</h1>
          </div>
          <div className="text-[#FF8FA3] transition-opacity duration-500 hover:opacity-80 cursor-pointer">
            <span className="material-symbols-outlined text-2xl">music_note</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-lg mx-auto px-6 pb-32">
        <div className="py-10 text-center">
          <h2 className="font-headline italic text-4xl text-primary mb-2">Memories</h2>
          <p className="font-body text-sm opacity-60 tracking-widest uppercase">Our shared timeline</p>
        </div>

        <div className="relative space-y-16">
          {/* Central Timeline Path */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-outline-variant/30 to-transparent transform -translate-x-1/2"></div>
          
          {memories.length === 0 ? (
            <div className="text-center text-slate-400 p-8 pt-16 font-body w-full">Content coming soon...</div>
          ) : (
            memories.map((m) => {
            if (m.isFeatured) {
              const isExpanded = expandedMemoryId === m.id;
              return (
                <div key={m.id} className="relative w-full z-30 py-8">
                  <motion.div 
                    layoutId={`memory-${m.id}`}
                    onClick={() => setExpandedMemoryId(isExpanded ? null : m.id)}
                    className="cursor-pointer bg-surface-bright/20 backdrop-blur-[40px] rounded-xl border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                          <h3 className="font-headline text-xl">{m.title}</h3>
                        </div>
                        <span className="font-label text-[10px] text-outline">{m.date}</span>
                      </div>
                      
                      <motion.img 
                         layoutId={`image-${m.id}`}
                         alt={m.title} 
                         className={`w-full object-cover rounded-lg shadow-inner transition-all duration-500 ${isExpanded ? 'h-96' : 'h-64'} mb-6`} 
                         src={m.image}
                      />
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <p className="font-body text-base leading-relaxed opacity-80 mt-4">
                              {m.description}
                            </p>
                            <div className="bg-surface-container-low/80 rounded-full p-3 flex items-center gap-4 border border-outline-variant/10">
                              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg active:scale-95 transition-transform">
                                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
                              </button>
                              <div className="flex-1 h-1 bg-surface-variant rounded-full relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary-container"></div>
                              </div>
                              <span className="font-label text-[10px] text-outline mr-2">1:24</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {!isExpanded && (
                          <p className="text-xs text-primary mt-2 text-center opacity-70">Tap to expand</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              )
            }

            return m.align === "left" ? (
              <div key={m.id} className="relative flex justify-start w-full pr-12">
                <div className={`absolute right-0 top-10 w-4 h-4 rounded-full bg-surface border-2 ${m.colorClass} z-20 translate-x-1/2`}></div>
                <div className="w-full sm:w-[90%] bg-surface-variant/40 backdrop-blur-2xl rounded-lg p-4 border border-outline-variant/10 shadow-2xl asymmetric-float">
                  <div className="relative rounded-md overflow-hidden mb-4 group">
                    <img alt={m.title} className="w-full h-56 object-cover opacity-90 group-hover:scale-105 transition-transform duration-[2000ms]" src={m.image}/>
                    {m.hasAudio && (
                      <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md rounded-full p-2">
                        <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>mic</span>
                      </div>
                    )}
                  </div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary mb-1 block">{m.date}</span>
                  <p className="font-headline text-lg leading-relaxed text-on-surface/90 italic">{m.description}</p>
                </div>
              </div>
            ) : (
              <div key={m.id} className="relative flex justify-end w-full pl-12">
                <div className={`absolute left-0 top-10 w-4 h-4 rounded-full bg-surface border-2 ${m.colorClass} z-20 -translate-x-1/2`}></div>
                <div className="w-full sm:w-[90%] bg-surface-container-low/60 backdrop-blur-2xl rounded-lg p-4 border border-outline-variant/5 shadow-2xl reverse-float">
                  <div className="relative rounded-md overflow-hidden mb-4 group">
                    <img alt={m.title} className="w-full h-64 object-cover opacity-90 group-hover:scale-105 transition-transform duration-[2000ms]" src={m.image}/>
                  </div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-tertiary mb-1 block">{m.date}</span>
                  <p className="font-headline text-lg leading-relaxed text-on-surface/90 italic">{m.description}</p>
                </div>
              </div>
            );
          }))}
        </div>

        <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
          <div className="w-1 h-12 bg-gradient-to-b from-outline-variant to-transparent"></div>
          <span className="material-symbols-outlined text-4xl">history</span>
          <p className="font-headline italic">More magic to be made...</p>
        </div>
      </main>
    </div>
  );
}
