"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MindScreen() {
  const [expandedCard, setExpandedCard] = useState(null);

  const thoughts = [
    {
      id: 1,
      preview: "I don’t say this enough, but your presence is the quietest comfort I’ve ever known.",
      highlight: "quietest comfort",
      fullText: "There is a chaos in the world that never seems to stop. But when I am around you, even if we aren't speaking, the noise settles. It's the most profound peace I have ever experienced. I don't know how you do it, but you make my heart feel safe.",
      top: "0",
      left: "4%",
      width: "85%",
      zIndex: 10,
      animationClasses: "floating-1",
      hoverClass: "hover:border-primary/20",
      icon: "format_quote",
      iconColor: "text-primary/40",
      delay: 0
    },
    {
      id: 2,
      preview: "You matter more than you think. In the spaces between our words, I’m always choosing you.",
      highlight: "spaces between",
      fullText: "Sometimes I wonder if you know how deeply you are loved. Even when I am quiet, or when distance separates us, every silent thought is gravitating towards you. You are my constant choice.",
      top: "32%",
      right: "0",
      width: "80%",
      zIndex: 20,
      animationClasses: "floating-2",
      hoverClass: "hover:border-secondary/20",
      icon: "favorite",
      iconColor: "text-secondary",
      delay: 0.2
    },
    {
      id: 3,
      preview: "I notice things about you that you haven’t forgiven in yourself yet. And I love them all.",
      highlight: "forgiven",
      fullText: "You are harder on yourself than anyone else. I see the little flaws you try to hide, the moments you doubt yourself, the parts you think are unlovable. And Abhilasha, those are exactly the parts I fall in love with the hardest.",
      top: "60%",
      left: "0",
      width: "90%",
      zIndex: 10,
      animationClasses: "floating-1",
      hoverClass: "hover:border-tertiary/20",
      icon: "arrow_forward_ios",
      iconColor: "text-on-surface-variant",
      delay: 0.4
    }
  ];

  return (
    <div className="bg-surface text-on-surface font-body min-h-[100dvh] overflow-x-hidden selection:bg-primary-container/30">
      <style dangerouslySetInnerHTML={{__html: `
        .floating-1 { animation: float-1 4s ease-in-out infinite; }
        .floating-2 { animation: float-2 5s ease-in-out infinite; }
        @keyframes float-1 { 0%, 100% { transform: translateY(-8px); } 50% { transform: translateY(8px); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(5px); } 50% { transform: translateY(-5px); } }
      `}} />

      <header className="fixed top-0 left-0 w-full z-40 bg-[#0f131e]/60 backdrop-blur-xl">
        <div className="flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20">
                <img alt="Abhilasha's profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB3PK1RkR2yuri4pTfKBtkobaf_HQGfRQMhekQExMieKbliuzcqMzdRZHjHlEqOtseWjF3erGPPzGLCerph9stcJwB1EdIZtaZSfGveq9aUjDDvrbIyHItKYFzGoJ45lLUg_R0npHf3jpRX-HpJfdNIptR5UAVw4hVlSFfZKsHmDG0PV1uAKyeNPAOf5K2tshzzT2_E6lAMTuQLps9hs2aFD5H3Q8Q1yu3ClD1P8ygAuruPsj-LEyLwGW3QznIoRmKiAPub3KfNQ8"/>
              </div>
              <h1 className="text-[#FF8FA3] font-headline text-3xl tracking-tight">Hey Abhilasha</h1>
            </div>
            <button className="text-[#FF8FA3] hover:opacity-80 transition-opacity duration-500">
              <span className="material-symbols-outlined text-3xl">music_note</span>
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen pt-32 pb-40 px-6 relative max-w-lg mx-auto overflow-visible">
        {/* Atmospheric Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] -left-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-[10%] -right-20 w-80 h-80 bg-tertiary/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 mb-12 space-y-2 px-2">
          <span className="text-secondary font-label text-[10px] tracking-[0.3em] uppercase opacity-60">Deep Reflections</span>
          <h2 className="font-headline text-4xl leading-tight">What I feel but <span className="italic text-primary">don’t say.</span></h2>
        </div>

        {/* Scattered Thought Cards */}
        <div className="relative min-h-[600px] w-full z-10">
          {thoughts.map((thought) => {
            const isExpanded = expandedCard === thought.id;
            
            // Format preview with highlight
            const parts = thought.preview.split(thought.highlight);
            const formattedPreview = parts.length === 2 ? (
              <>
                 {parts[0]}<span className="text-primary-container italic">{thought.highlight}</span>{parts[1]}
              </>
            ) : thought.preview;

            return (
              <motion.div 
                key={thought.id}
                layoutId={`card-${thought.id}`}
                onClick={() => setExpandedCard(isExpanded ? null : thought.id)}
                className={`absolute ${thought.animationClasses}`}
                style={{
                   top: isExpanded ? '10%' : thought.top,
                   left: isExpanded ? '0' : thought.left,
                   right: isExpanded ? '0' : thought.right,
                   width: isExpanded ? '100%' : thought.width,
                   zIndex: isExpanded ? 50 : thought.zIndex
                }}
              >
                <div className={`p-8 rounded-lg shadow-[0_20px_40px_rgba(11,15,26,0.4)] border border-outline-variant/10 transition-all duration-700 cursor-pointer group ${isExpanded ? 'bg-surface-container-high/95 backdrop-blur-3xl' : 'backdrop-blur-2xl bg-[#313441]/40 ' + thought.hoverClass}`}>
                  {thought.id === 1 && <span className={`material-symbols-outlined ${thought.iconColor} mb-4 block group-hover:scale-110 transition-transform duration-500`}>{thought.icon}</span>}
                  
                  <p className="font-headline text-xl lg:text-2xl leading-relaxed text-on-surface/90">
                    {formattedPreview}
                  </p>

                  <AnimatePresence>
                    {isExpanded && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: 'auto' }}
                         exit={{ opacity: 0, height: 0 }}
                         className="mt-6 font-body text-sm text-on-surface-variant leading-relaxed opacity-90 border-t border-outline-variant/20 pt-6"
                       >
                         {thought.fullText}
                       </motion.div>
                    )}
                  </AnimatePresence>

                  {!isExpanded && (
                    <div className={`mt-6 flex ${thought.id === 1 ? 'justify-end' : thought.id === 2 ? 'items-center gap-3' : 'items-center justify-between'}`}>
                       {thought.id === 1 && <span className="text-[10px] font-label uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">Tap to read more</span>}
                       {thought.id === 2 && (
                         <>
                           <div className="h-[1px] w-8 bg-outline-variant/30"></div>
                           <span className="material-symbols-outlined text-sm text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
                         </>
                       )}
                       {thought.id === 3 && (
                         <>
                           <span className="bg-tertiary-container/10 text-tertiary text-[10px] font-label px-3 py-1 rounded-full uppercase tracking-widest border border-tertiary/20">Memory Chip</span>
                           <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                         </>
                       )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {/* Decorative Elements */}
          <div className="absolute top-[15%] right-[10%] w-12 h-12 rounded-full backdrop-blur-2xl bg-[#313441]/40 border border-outline-variant/20 flex items-center justify-center opacity-40">
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
          </div>
          <div className="absolute bottom-[5%] right-[20%] w-16 h-16 rounded-full backdrop-blur-2xl bg-[#313441]/40 border border-outline-variant/20 flex items-center justify-center opacity-20">
            <span className="material-symbols-outlined text-sm">filter_vintage</span>
          </div>
        </div>

        <div className="text-center mt-12 opacity-40 font-body text-xs tracking-widest uppercase italic">
            Tap a thought to read more
        </div>
      </main>
      
      {/* Dim overlay when card is expanded */}
      <AnimatePresence>
        {expandedCard && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setExpandedCard(null)}
             className="fixed inset-0 bg-[#0f131e]/80 backdrop-blur-sm z-30"
           />
        )}
      </AnimatePresence>
    </div>
  );
}
