"use client";
import { motion } from "framer-motion";
import contentData from "../../data/abhilasha/content.json";

export default function SpecialScreen() {
  const name = contentData?.name || "Abhilasha";

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body min-h-[100dvh] overflow-hidden selection:bg-primary-container/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 100%, #cd9eec 0%, transparent 60%)' }}></div>
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: 'linear-gradient(180deg, #0a0e19 0%, transparent 50%, #0a0e19 100%)' }}></div>
      </div>

      <header className="fixed top-0 left-0 w-full z-40 bg-transparent flex flex-col justify-center px-8 py-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: 0.5 }}
             className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30"
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>cake</span>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6 max-w-lg mx-auto py-20">
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1.2, ease: "easeOut" }}
           className="relative w-full max-w-sm aspect-[3/4]"
        >
          {/* Glowing Aura behind card */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 via-tertiary/20 to-secondary/30 rounded-[3rem] blur-3xl opacity-50 animate-pulse"></div>

          {/* The Glass Card */}
          <div className="relative w-full h-full backdrop-blur-2xl bg-[#171b27]/60 rounded-[2rem] border border-outline-variant/20 shadow-[0_20px_60px_rgba(11,15,26,0.6)] p-8 flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(45deg, transparent, rgba(255,143,163,0.3), transparent)', animation: 'float 8s infinite linear' }}></div>
            
            <div className="relative z-10 space-y-8">
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.8 }}
              >
                <h2 className="font-headline text-5xl leading-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-secondary">
                  Happy <br/>Birthday
                </h2>
                <h3 className="font-headline text-2xl mt-2 text-white italic">{name}</h3>
              </motion.div>

              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 1.5, delay: 1.5 }}
                 className="space-y-6"
              >
                <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto"></div>
                
                <p className="font-body text-sm leading-relaxed text-on-surface/80">
                  This entire sanctuary exists because words alone could never hold everything I wanted to say.
                </p>
                <p className="font-body text-sm leading-relaxed text-on-surface/80">
                  Today is for you. Every star, every letter, every quiet moment. May your day be as beautiful and profound as the peace you bring to my life.
                </p>

                <div className="pt-6">
                  <p className="font-headline text-lg italic text-primary/80">You are the treasure.</p>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-primary/30 rounded-tl-lg"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-secondary/30 rounded-br-lg"></div>
          </div>
        </motion.div>

        {/* Floating Particles */}
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 2 }}
           className="absolute inset-0 pointer-events-none"
        >
           <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-primary rounded-full blur-[2px] animate-bounce" style={{ animationDuration: '3s' }}></div>
           <div className="absolute bottom-[30%] right-[15%] w-3 h-3 bg-secondary rounded-full blur-[3px]" style={{ animation: 'float 5s ease-in-out infinite' }}></div>
           <div className="absolute top-[60%] left-[20%] w-1.5 h-1.5 bg-white rounded-full blur-[1px] opacity-60"></div>
        </motion.div>
      </main>
    </div>
  );
}
