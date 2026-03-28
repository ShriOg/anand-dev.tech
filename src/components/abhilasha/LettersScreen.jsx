"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import contentData from "../../data/abhilasha/content.json";

export default function LettersScreen() {
  const [activeLetter, setActiveLetter] = useState(null);

  const letters = contentData?.letters || [];
  const profileImage = contentData?.profileImage || "/abhilasha.jpg";
  const name = contentData?.name || "Abhilasha";

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container min-h-[100dvh]">
      {/* Top Navigation Anchor */}
      <header className="fixed top-0 left-0 w-full z-40 bg-[#0f131e]/60 backdrop-blur-xl">
        <div className="flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                <img 
                  alt={`${name}'s profile`} 
                  className="w-full h-full object-cover" 
                  src={profileImage}
                />
              </div>
              <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">Hey {name}</h1>
            </div>
            <div className="text-[#FF8FA3] hover:opacity-80 transition-opacity duration-500 cursor-pointer">
              <span className="material-symbols-outlined text-2xl">music_note</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-32 min-h-screen light-leak px-6 max-w-lg mx-auto relative">
        {/* Emotional Filter Tabs */}
        <nav className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
          <button className="flex-shrink-0 px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold tracking-wide shadow-lg shadow-primary/10">Good days</button>
          <button className="flex-shrink-0 px-6 py-2.5 rounded-full bg-surface-container-low text-slate-400 text-sm hover:bg-surface-container-high transition-colors">Hard days</button>
          <button className="flex-shrink-0 px-6 py-2.5 rounded-full bg-surface-container-low text-slate-400 text-sm hover:bg-surface-container-high transition-colors">When you miss me</button>
          <button className="flex-shrink-0 px-6 py-2.5 rounded-full bg-surface-container-low text-slate-400 text-sm hover:bg-surface-container-high transition-colors">When you overthink</button>
        </nav>

        {/* Bento Grid Letters */}
        <div className="grid grid-cols-1 gap-6">
          {letters.map((letter) => {
            if (letter.isLocked) {
              return (
                <div key={letter.id} className="relative bg-surface-container-low/40 p-6 rounded-lg overflow-hidden group">
                  <div className="absolute inset-0 backdrop-blur-[6px] bg-background/40 flex flex-col items-center justify-center z-10 transition-all group-hover:backdrop-blur-[2px]">
                    <span className="material-symbols-outlined text-primary/40 text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    <span className="text-[10px] tracking-widest uppercase text-primary/60 font-bold">{letter.status}</span>
                  </div>
                  <div className="opacity-30 select-none">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-headline text-xl">{letter.title}</h3>
                      <span className="text-[10px] tracking-widest uppercase">{letter.date}</span>
                    </div>
                    <p className="text-sm line-clamp-2 leading-relaxed">{letter.preview}</p>
                  </div>
                </div>
              );
            }

            if (letter.id === 1) {
              return (
                <div key={letter.id} className="glass-card p-8 rounded-lg relative overflow-hidden group border border-outline-variant/10">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                  <div className="mb-6 flex justify-between items-start">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-primary/60 font-bold">{letter.status} {letter.date}</span>
                    <span className="material-symbols-outlined text-primary text-xl">favorite</span>
                  </div>
                  <h2 className="font-headline text-2xl mb-4 leading-snug">{letter.title}</h2>
                  <p className="font-headline text-lg italic text-on-surface-variant/80 leading-relaxed mb-8">
                    {letter.preview}
                  </p>
                  <div className="flex justify-end">
                    <button onClick={() => setActiveLetter(letter)} className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline transition-all group">
                      Read full letter
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={letter.id} 
                onClick={() => setActiveLetter(letter)}
                className="bg-surface-container-low p-6 rounded-lg hover:bg-surface-container-high transition-all duration-500 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-headline text-xl">{letter.title}</h3>
                  <span className="text-[10px] tracking-widest uppercase text-slate-500">{letter.date}</span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {letter.preview}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Full Screen Reading View (Modal) */}
      <AnimatePresence>
        {activeLetter && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }} 
            className="fixed inset-0 z-50 bg-[#0f131e]/95 backdrop-blur-2xl flex flex-col pt-16 px-6 overflow-y-auto"
          >
            <div className="max-w-lg mx-auto w-full pb-20">
              <button 
                onClick={() => setActiveLetter(null)}
                className="mb-8 w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-outline-variant/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="text-center mb-12">
                <span className="material-symbols-outlined text-primary-container/40 text-4xl mb-4">auto_stories</span>
                <h4 className="font-headline text-sm text-primary/60 tracking-widest uppercase">Currently Reading</h4>
              </div>

              <div className="relative p-10 glass-card rounded-lg shadow-2xl">
                <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(255,143,163,0.05)_0%,transparent_70%)]"></div>
                </div>
                <article className="relative z-10">
                  <header className="mb-10 text-center">
                    <h2 className="font-headline text-3xl text-primary mb-2">{activeLetter.title}</h2>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{activeLetter.date}</p>
                  </header>

                  <div className="font-headline text-xl leading-[2] text-on-surface/90 space-y-8 italic text-center max-w-sm mx-auto">
                    {activeLetter.fullText.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  <footer className="mt-12 text-center">
                    <div className="w-12 h-px bg-primary/30 mx-auto mb-6"></div>
                    <p className="font-headline text-lg text-primary/80 italic">Always yours,</p>
                    <p className="font-headline text-xl text-primary mt-1">Me</p>
                  </footer>
                </article>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
