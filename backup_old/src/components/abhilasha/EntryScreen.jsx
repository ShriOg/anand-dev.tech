import contentData from "../../data/abhilasha/content.json";

export default function EntryScreen({ onEnter }) {
  const name = contentData?.name || "Abhilasha";

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center bg-[#0f131e]">
      {/* Atmospheric Layer: Light Leaks & Stars */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="light-leak absolute -top-20 -left-20 w-[500px] h-[500px]"></div>
        <div className="light-leak absolute -bottom-40 -right-20 w-[600px] h-[600px]"></div>
        <div className="star-field">
          <div className="star w-0.5 h-0.5" style={{ top: '15%', left: '25%' }}></div>
          <div className="star w-1 h-1" style={{ top: '45%', left: '10%' }}></div>
          <div className="star w-0.5 h-0.5" style={{ top: '80%', left: '35%' }}></div>
          <div className="star w-1 h-1" style={{ top: '20%', left: '75%' }}></div>
          <div className="star w-0.5 h-0.5" style={{ top: '65%', left: '85%' }}></div>
          <div className="star w-0.5 h-0.5" style={{ top: '90%', left: '60%' }}></div>
          <div className="star w-1 h-1" style={{ top: '10%', left: '50%' }}></div>
        </div>
      </div>

      <header className="z-50 flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto fixed top-0 left-0 right-0">
        <div className="flex justify-between items-center w-full">
          <div className="text-[#FF8FA3] font-headline italic text-xl tracking-tight opacity-40"></div>
          <button className="bg-[#171b27]/40 backdrop-blur-xl p-3 rounded-full text-[#FF8FA3] hover:opacity-80 transition-opacity duration-500 flex items-center justify-center">
            <span className="material-symbols-outlined">music_note</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 text-center relative w-full">
        <div className="max-w-xl space-y-12">
          {/* Hero Typography */}
          <div className="space-y-6">
            <h1 className="font-headline text-4xl md:text-6xl tracking-tight leading-tight text-on-surface">
              This space exists because <span className="text-primary italic">you</span> do.
            </h1>
            <p className="font-body text-lg md:text-xl opacity-60 max-w-md mx-auto leading-relaxed">
              And because you mean more than you think, {name}.
            </p>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col items-center pt-8">
            <button 
              onClick={onEnter}
              className="group relative px-12 py-5 bg-gradient-to-r from-primary-container to-secondary rounded-xl text-on-primary font-body font-semibold text-lg tracking-wide shadow-[0_20px_40px_rgba(155,64,83,0.3)] transition-all duration-700 hover:scale-105 active:scale-95"
            >
              <span className="relative z-10">Enter</span>
              {/* Soft Glow Aura */}
              <div className="absolute inset-0 bg-primary opacity-20 blur-xl rounded-xl group-hover:opacity-40 transition-opacity"></div>
            </button>
            {/* Secondary Hint */}
            <div className="mt-12 opacity-30 flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-sm">keyboard_double_arrow_down</span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-label">A quiet Sanctuary</span>
            </div>
          </div>
        </div>

        {/* Signature Asymmetric Decorative Element */}
        <div className="absolute bottom-[10%] right-[5%] md:right-[15%] w-32 h-32 opacity-20 hidden md:block">
          <div className="w-full h-full border-t border-r border-primary-container rounded-tr-[4rem] rotate-12"></div>
        </div>
        <div className="absolute top-[20%] left-[5%] md:left-[10%] w-24 h-24 opacity-10 hidden md:block">
          <div className="w-full h-full border-b border-l border-secondary rounded-bl-[3rem] -rotate-12"></div>
        </div>
      </main>

      {/* Background Decoration Image */}
      <div className="fixed inset-0 -z-10 opacity-30 mix-blend-soft-light pointer-events-none">
        <img 
          alt="" 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJqh4HqO5cx9hePT_7q0_jq64vSusz9z6_P3kJcOlpx2oWiBsviV0PTP04-9UAVRKCgRttEUdFrL68cYRujYeVXTpyUcrjHAvefSn9hy9YfntcKrn4gXt8OS145BXPyczBtmg6K6F0CoNaPLIqbI6G00-P-MEKT74M8lvSjKnyjvhTEMDqS94A-c1koMP3bLKJP57SrZhjDiNv3-t-9zgzCsacaLXv7njwEUORSmebdiYsK5eGfQXUH5X4vwT6g4vlL8dO7_ML3Vk"
        />
      </div>
    </div>
  );
}
