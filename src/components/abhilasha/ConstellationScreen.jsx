"use client";
import { useState } from "react";

export default function ConstellationScreen() {
  const [activeStar, setActiveStar] = useState(null);

  const stars = [
    {
      id: 1,
      top: "85px", left: "145px",
      date: "June 12", description: "Where it all began.",
      size: "w-2 h-2", colorClass: "bg-primary shadow-[0_0_12px_#ffbac3] star-glow",
      tooltipPos: "top-6 -left-16 w-32"
    },
    {
      id: 2,
      top: "85px", left: "175px",
      size: "w-1.5 h-1.5", colorClass: "bg-secondary shadow-[0_0_8px_#c9bfff]"
    },
    {
      id: 3,
      top: "105px", left: "205px",
      description: `"The way you laughed at the moon."`,
      size: "w-2 h-2", colorClass: "bg-primary-container shadow-[0_0_10px_#ff8fa3] star-glow",
      tooltipPos: "top-6 -left-24 w-40",
      italic: true
    },
    {
      id: 4,
      top: "145px", left: "205px",
      size: "w-1 h-1", colorClass: "bg-white opacity-60"
    },
    {
      id: 5,
      top: "215px", left: "145px",
      date: "Soul Link", description: "Your heart is my favorite constellation.",
      size: "w-3 h-3", colorClass: "bg-tertiary shadow-[0_0_15px_#e6bcff] star-glow",
      tooltipPos: "top-8 -left-20 w-48"
    },
    {
      id: 6,
      top: "145px", left: "85px",
      size: "w-1.5 h-1.5", colorClass: "bg-secondary-fixed-dim shadow-[0_0_8px_#c9bfff]"
    },
    {
      id: 7,
      top: "105px", left: "85px",
      size: "w-2 h-2", colorClass: "bg-primary shadow-[0_0_10px_#ffbac3] star-glow"
    },
    {
      id: 8,
      top: "85px", left: "115px",
      size: "w-1.5 h-1.5", colorClass: "bg-white opacity-40"
    },
    {
      id: 9,
      top: "315px", left: "85px",
      description: "The first rainy drive home...",
      size: "w-2 h-2", colorClass: "bg-secondary/40 shadow-[0_0_6px_#c9bfff]",
      tooltipPos: "-top-16 -left-4 w-36"
    },
    {
      id: 10,
      top: "265px", left: "255px",
      size: "w-1.5 h-1.5", colorClass: "bg-primary/30"
    }
  ];

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body selection:bg-primary-container/30 min-h-[100dvh]">
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0f131e]/60 backdrop-blur-xl">
        <div className="flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden flex items-center justify-center">
                <img alt="Abhilasha's profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArQDQ1UKCNqimJTr63Fw5rDdJFBeQFQzQ5g2mrTQ5xLwupqfjiomWDZion_QEkX83Vj7b03316NoGj-7Fzc93lek1e0Kjp9lq9l-klgqJxPZSW3GzAA9FMeLavtkCO8DR6aCS5z4e7ylm38jAa2K2EIJajcq976F1bC7Y1dOO3ws8WSE_qBz1_5QDAs4rETjK21nB7wnG16GbwmJkg3FqC8EA417PXdWDaDs3pugS2O8d9x0ImzOcOd1Y7fcYpsG_jUiaveSUITXU"/>
              </div>
              <div>
                <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">Hey Abhilasha</h1>
                <p className="font-body text-sm opacity-80 text-slate-400">Under our shared sky</p>
              </div>
            </div>
            <button className="text-[#FF8FA3] hover:opacity-80 transition-opacity duration-500">
              <span className="material-symbols-outlined text-3xl">music_note</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative min-h-[100dvh] pb-32 pt-28 w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0e19] pointer-events-none" style={{background: 'radial-gradient(circle at center, #1b1f2b 0%, #0a0e19 100%)'}}></div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0xY8JQvqiz3u7-6W77cp0Pf6T4u7TtZ9yGuknxy2F01JGGbr0fDeiARyRzNUCmLUeKPXgZ4PwADDHotOTndLDiZNtO4kOpUs9CD7xcJZdF7VrkqPOTP9ogbdQpZ9ekXsYuBKQWzZl9rJl-QaZKxlI_vQELQ2tMRXlmyG_xyoUolwLA01hhRGKuerIwNtmcDfyEwDISY_uVKDpDyV9GhoM9tHW3XNd91iQYNMf-eXCisG_k9wB4ChKWZJn6HSYW2jsjoKqn3Nrjag")' }}></div>

        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative w-full max-w-lg aspect-[3/4] mx-auto z-10 scale-110 sm:scale-100">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 400">
            <path d="M150 120 L180 90 L210 110 L210 150 L150 220 L90 150 L90 110 L120 90 Z" fill="none" stroke="#ff8fa3" strokeWidth="0.5" strokeDasharray="4" opacity="0.15" strokeLinejoin="round"></path>
            <line x1="50" x2="90" y1="280" y2="320" stroke="#ff8fa3" strokeWidth="0.5" strokeDasharray="4" opacity="0.1"></line>
            <line x1="220" x2="260" y1="300" y2="270" stroke="#ff8fa3" strokeWidth="0.5" strokeDasharray="4" opacity="0.1"></line>
          </svg>

          {stars.map((star) => (
            <div key={star.id} className="absolute group z-20" style={{ top: star.top, left: star.left }}>
              <div 
                 onClick={() => setActiveStar(star.id === activeStar ? null : star.id)}
                 className={`${star.size} rounded-full cursor-pointer hover:scale-150 transition-transform duration-500 ${star.colorClass}`}
              ></div>
              
              {(star.date || star.description) && (
                <div className={`absolute ${star.tooltipPos} transition-opacity duration-700 pointer-events-none ${activeStar === star.id ? 'opacity-100 z-50' : 'opacity-0'}`}>
                  <div className="bg-surface-variant/80 backdrop-blur-xl p-3 rounded-lg border border-outline-variant/30 shadow-2xl">
                    {star.date && <p className="text-[10px] font-label uppercase tracking-widest text-[#FF8FA3] mb-1">{star.date}</p>}
                    <p className={`text-xs text-on-surface leading-relaxed ${star.italic ? 'italic' : ''}`}>{star.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="absolute bottom-32 left-0 w-full flex justify-center pointer-events-none z-10">
          <p className="font-body text-[10px] tracking-[0.3em] uppercase opacity-40 animate-pulse">Tap a star to reveal a memory</p>
        </div>
      </main>
    </div>
  );
}
