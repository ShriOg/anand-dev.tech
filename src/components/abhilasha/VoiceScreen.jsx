"use client";
import { useState } from "react";

export default function VoiceScreen() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="font-body selection:bg-primary/30 min-h-screen pb-40 text-[#dfe2f2]">
      <header className="bg-[#0f131e]/60 backdrop-blur-xl sticky top-0 z-50 w-full max-w-lg mx-auto px-8 py-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
            <img alt="Abhilasha's profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvyYS96teWay0H-OZB1EdBnkLAvV6jpOesE_Lymo2NDSLeACfpmzngulKI4V7rDeyoB_jgZCmvRIBw3pBDRpwgX4W-KJwWcXkfl8_me4tQfnLZWpQdzEM24T1Y645G4m_JHYBWgk1tR-dKw7QD0h_fRHeJjz8ygiLBIds7fCio-Bgf84Z0QTZB0lVWFM4CQrBamQD23xWEV19f14uBBXLdtYO7IPr6T_m7pW0z3NVI25jMb68IRloZfAr_l06UUGm24JF3VnieSn8"/>
          </div>
          <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">Hey Abhilasha</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[#FF8FA3] hover:opacity-80 transition-opacity duration-500">
            <span className="material-symbols-outlined">music_note</span>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 pt-4">
        {/* Category Selection */}
        <div className="flex gap-4 mb-10 overflow-x-auto pb-2 no-scrollbar">
          <button className="px-6 py-2 rounded-full backdrop-blur-2xl bg-[#313441]/40 border border-primary/20 text-primary text-sm font-medium transition-all duration-500 hover:bg-primary/10">
            Calm
          </button>
          <button className="px-6 py-2 rounded-full bg-surface-container-low text-on-surface/60 text-sm font-medium transition-all duration-500 hover:text-primary">
            Reassuring
          </button>
          <button className="px-6 py-2 rounded-full bg-surface-container-low text-on-surface/60 text-sm font-medium transition-all duration-500 hover:text-primary">
            Playful
          </button>
        </div>

        {/* Featured Section */}
        <section className="mb-12">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-container/20 to-tertiary-container/20 rounded-lg blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative backdrop-blur-2xl bg-[#313441]/40 rounded-lg p-8 flex flex-col gap-6">
              <span className="text-xs uppercase tracking-[0.2em] text-tertiary-container font-semibold">Tonight's Focus</span>
              <h2 className="font-headline text-4xl text-on-surface leading-tight italic">Whispers of the <br/>Rain Forest</h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-on-surface/70 font-light max-w-[200px]">A 12-minute deep immersion into soft evening showers.</p>
                <button 
                   onClick={() => setIsPlaying(!isPlaying)}
                   className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-[0_0_30px_rgba(255,143,163,0.15)] transition-transform hover:scale-110 active:scale-95 duration-500"
                >
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>
                    {isPlaying ? "pause" : "play_arrow"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Audio List */}
        <div className="space-y-4">
          {/* Audio Cards */}
          {[
            { title: "The Shoreline Drift", type: "CALM • 08:45", icon: "waves", color: "text-primary-container" },
            { title: "Safe At Home", type: "REASSURING • 05:20", icon: "flare", color: "text-secondary" },
            { title: "Morning Giggle", type: "PLAYFUL • 03:12", icon: "sentiment_satisfied", color: "text-tertiary" },
            { title: "Moonlight Hum", type: "CALM • 15:00", icon: "nights_stay", color: "text-primary-container" }
          ].map((item, i) => (
            <div key={i} className="flex items-center p-5 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-all duration-500 cursor-pointer group">
              <div className={`w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center ${item.color}`}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-headline text-lg text-on-surface">{item.title}</h3>
                <p className="text-xs text-on-surface/50 font-medium tracking-wide">{item.type}</p>
              </div>
              <button className="text-on-surface/30 group-hover:text-primary transition-colors duration-300">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Minimal Player UI */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-40">
        <div className="backdrop-blur-2xl bg-[#313441]/40 rounded-xl p-4 flex flex-col gap-3 shadow-2xl border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center relative overflow-hidden">
                <img className="absolute inset-0 object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpYAauAIZrHKasZXjIgVMltVLCjyPTJNSMVxgtxvIzXORTo742W8RoeNauvS4Zx2MVf6ieTtI1jj7R3GTg4vXTLHgcv_c-MhGVt-1p2DeM14CFD5DZ7vbcYJIoxV1tBQv_Z2jgrQHRJET-9htC5mEm8DTxb-n1TMk54rZ-O_AXrEY4qW3_C1lYzoR1fDmECn0fFJMNqPbM-DBQ0FqLtNetuHwrNIw4QvemqUz9OBSKTKOlVRajG_m31TOjRXWgqQspiW4iTACWvx8"/>
                <span className="material-symbols-outlined text-primary text-sm relative z-10" style={{fontVariationSettings: "'FILL' 1"}}>volume_up</span>
              </div>
              <div>
                <h4 className="font-headline text-sm text-on-surface">Whispers of the Rain Forest</h4>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Now Playing</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-on-surface hover:text-primary transition-colors">
                <span className="material-symbols-outlined">skip_previous</span>
              </button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>{isPlaying ? "pause" : "play_arrow"}</span>
              </button>
              <button className="text-on-surface hover:text-primary transition-colors">
                <span className="material-symbols-outlined">skip_next</span>
              </button>
            </div>
          </div>
          <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-primary rounded-full"></div>
          </div>
          <div className="flex justify-between text-[8px] text-on-surface/40 font-mono">
            <span>04:12</span>
            <span>12:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
