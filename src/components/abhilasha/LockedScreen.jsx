"use client";
import { useState } from "react";

export default function LockedScreen({ unlockSpecial }) {
  // Option A implementation: a long press or specific tap sequence. 
  // We'll use a double-click / multiple clicks on a "hidden" element or a long press via touch/mouse events.
  const [tapCount, setTapCount] = useState(0);

  const handleSecretTap = () => {
    setTapCount(prev => {
      const newCount = prev + 1;
      if (newCount === 3) {
        console.log("Secret unlock triggered!");
        setTimeout(() => {
          unlockSpecial();
        }, 500); // slight delay for dramatic effect
      }
      return newCount;
    });
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-[100dvh] selection:bg-primary-container/30">
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0f131e]/60 backdrop-blur-xl">
        <div className="flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20">
                <img alt="Abhilasha" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt1HFHm0yo_PPY5V2uABbGhFtMfjBLEhMbIzAvQ8Vbe4eXeq2IJuyQRCPIp_fk7JKHTXj_YVxuGigZDSUbpHgqpc0Wvb8RNhbweAG-Jza0BoogdXPOj2cIqfFnOq3o1rUVrHz36tS2V141bifniuvcH-OETcWPPuaCvu6Ew6PgSE7QgPrkG0yeDwMRWt5tJS9HqlH2726U8Ekr_83imTAkWaFO-L3iNOzf4N0mFJm2Boor63zvIH-BRKl47Iysy8r1OfHSgRiSR_Q"/>
              </div>
              <div>
                <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">Hey Abhilasha</h1>
                <p className="font-body text-sm opacity-60">Patience is a quiet beauty</p>
              </div>
            </div>
            <button className="text-[#FF8FA3] hover:opacity-80 transition-opacity duration-500">
              <span className="material-symbols-outlined text-2xl">music_note</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-32 px-6 max-w-lg mx-auto relative min-h-[100dvh]">
        <div className="fixed top-20 -left-20 w-80 h-80 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(230, 188, 255, 0.08) 0%, transparent 70%)' }}></div>
        <div className="fixed bottom-40 -right-20 w-96 h-96 pointer-events-none" style={{background: 'radial-gradient(circle at center, rgba(255, 143, 163, 0.05) 0%, transparent 70%)'}}></div>

        <div className="mb-10 animate-fade-in relative z-10">
          <h2 className="font-headline text-4xl mb-3 leading-tight italic">Locked Treasures</h2>
          <p className="text-on-surface-variant font-body leading-relaxed max-w-[80%] opacity-80">
            The most beautiful stories are the ones that take their time to unfold. 
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          {/* Card 1: Anticipation */}
          <div className="backdrop-blur-2xl bg-[#313441]/40 rounded-lg p-6 flex flex-col justify-between aspect-square border border-outline-variant/10">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-outline">lock</span>
              <span className="text-[10px] uppercase tracking-widest text-outline">Day 12</span>
            </div>
            <div>
              <p className="font-headline text-xl mb-2 italic">Not yet…</p>
              <div className="flex items-center gap-2">
                <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container/20 w-2/3"></div>
                </div>
                <span className="text-[10px] text-outline">64%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Wide Editorial */}
          <div className="col-span-1 backdrop-blur-2xl bg-[#313441]/40 rounded-lg p-6 flex flex-col border border-outline-variant/5">
            <span className="material-symbols-outlined text-outline/40 mb-4">hourglass_top</span>
            <p className="font-body text-sm leading-relaxed opacity-60">Wait for the right time…</p>
            <div className="mt-auto pt-6">
              <span className="text-2xl font-headline tracking-tighter">04:12:08</span>
              <p className="text-[10px] uppercase tracking-widest text-outline mt-1">Until release</p>
            </div>
          </div>

          {/* Card 3: Deep Sentiment */}
          <div className="col-span-2 backdrop-blur-2xl bg-[#313441]/40 rounded-lg p-8 flex items-center gap-6 border border-outline-variant/10 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 143, 163, 0.05), transparent)', backgroundSize: '200% 100%' }}></div>
            <div className="relative z-10 w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-3xl">sentiment_satisfied</span>
            </div>
            <div className="relative z-10">
              <p className="font-headline text-lg leading-snug">Some things arrive when they’re meant to…</p>
              <p className="text-xs text-outline mt-2 italic font-body">A whisper from the future</p>
            </div>
          </div>

          {/* Card 4: Highlighted Birthday Card with Secret Tap Trigger */}
          <div className="col-span-2 relative group cursor-pointer" onClick={handleSecretTap}>
            <div className={`absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-lg blur transition duration-1000 ${tapCount > 0 ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'}`}></div>
            <div className="relative backdrop-blur-2xl rounded-lg p-8 border border-primary/20 bg-surface-container-low/80 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden transition-all">
              <div className="absolute top-0 right-0 p-4">
                <span className={`material-symbols-outlined text-primary-container ${tapCount > 1 ? 'animate-bounce' : 'animate-pulse'}`} style={{fontVariationSettings: "'FILL' 1"}}>cake</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] uppercase font-bold tracking-widest">Priority</span>
                  <span className="text-xs text-on-surface-variant">November 24</span>
                </div>
                <h3 className="font-headline text-3xl text-primary mb-2">🎂 Birthday</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-80">
                  The ultimate treasure. A day of celebration, laughter, and a gift that carries the weight of a thousand words.
                </p>
              </div>
              <div className={`flex flex-col items-center justify-center p-4 rounded-xl border min-w-[120px] transition-colors ${tapCount === 2 ? 'bg-primary/20 border-primary' : 'bg-surface-container-highest/40 border-outline-variant/10'}`}>
                <span className="material-symbols-outlined text-secondary text-3xl mb-1">lock</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-outline text-center">Tap 3x to Reveal</span>
              </div>
            </div>
          </div>

          {/* Card 5: Small Square Mystery */}
          <div className="backdrop-blur-2xl bg-[#313441]/40 rounded-lg p-6 flex flex-col justify-center items-center aspect-square border border-outline-variant/5">
            <span className="material-symbols-outlined text-outline/30 text-4xl mb-2">fingerprint</span>
            <p className="text-[10px] uppercase tracking-widest text-outline text-center">Identity Lock</p>
          </div>

          {/* Card 6: Small Square Mystery 2 */}
          <div className="backdrop-blur-2xl bg-[#313441]/40 rounded-lg p-6 flex flex-col justify-between aspect-square border border-outline-variant/5">
            <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant/20"></div>
            <p className="font-body text-xs opacity-40 italic">Coming soon to your heart.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
