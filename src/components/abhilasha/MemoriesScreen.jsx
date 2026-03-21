"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MemoriesScreen() {
  const [expandedMemoryId, setExpandedMemoryId] = useState(null);

  const memories = [
    {
      id: 1,
      date: "November 12, 2023",
      title: "Rainy cafe date",
      description: "The way the rain sounded against the window while we hid in that tiny cafe.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC991OKKp6qvGBZdmom3CvuadHWcl36WV22eozhIlRBGZB9UCCszEqEXjA_PP5W0VwmlV1i_l8bqfolFJYJUc-3s-gp4K4UUSBAilUeDyi_X0RdQieIxW2vcVzoLL1VZM2PaoRLt46FB11MY8l-drZj0YMzzu0K7nTPYd6Qz57cZK-tQKQyMfnuomDHAcMnyRG-ZwWog19sGUToXUtXbdWz7vTQU5axLAYmqqDyDgxbKd6wjQguvS7m0uVNic5K_U2xIgNewA6hTaE",
      align: "left",
      colorClass: "border-primary-container",
      hasAudio: true
    },
    {
      id: 2,
      date: "October 04, 2023",
      title: "Sunset walk",
      description: "Golden hour looked better on you than it did on the horizon.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCl6QW3M2-uWueDPiKCfx_djzMdSe6euCLfGnPrXY0_3aHwRjDYjRJM6MIkqHwDpoxLvs1hbZhRbs1xgxcEIA7LBJf52gOKR7UGoLKfgaPJOzdHcte1bRe_DwpBq47KDnCQZooOEmDxDjOdklZ6u6dccNMtiX_PRaXeUdlEISA2NAMb69hpo1oPIjDhnt5rFF-zs0OSY7WTYcooZMNg7EkNV1cGBZ_nmbMvEPOGcxbeJWQVfsdZ-Qce2qlhnkcb03H_ggtA8vn3_hQ",
      align: "right",
      colorClass: "border-secondary-fixed-dim",
      hasAudio: false
    },
    {
      id: "featured",
      date: "SEPTEMBER 21",
      title: "The Midnight Letter",
      description: "I found this note tucked away. It reminded me of the night we sat by the water and talked until the stars began to fade into the dawn. You said you felt at peace for the first time in years. I hope you still feel that way whenever you think of us.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP60BJglDSJqx1ZSNtnQn7P_vmKhXzQ1RM58v8D5_PzjGCsHkP7DRsZ8ROyXCos1eCUoipx7frLtMOJvhlzy7kzK2SzCIKHCnhcBQXR1gFxixzzKqLaUyIQK4wqgdt5KzNnprFX1A9Oyekf6txbEq6ZhTjc0fcx6UaAJXCxpFhcPMOyVtAbseY-fgQQlCiY3nvQlvSKTQF-Lcb2uSUya4sUmX2Nut0YUUfGL6h614TEq-0ABEcQ4y_vgEnFgKbkf1nF92Qy5GpPu0",
      align: "center",
      isFeatured: true
    },
    {
      id: 3,
      date: "August 15, 2023",
      title: "Flower fields",
      description: "The day the world smelled like wildflowers and possibilities.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCr0oVGapFNcTNCzVCfSwXYaQevTVLaVziFAFmxcoa0r54F3dsM0yv0lhiXfPKqpCYiq0YMssWAD5e5vzMyrHGWZP5nUqlYv5f4ttFZJNE0dZpRf3z3DfVhXL4TYaZXks48g9HL18IFr5mov4t7fcM6hXWkSd2JQrH_I5slf13PHpUu3JSYg8eMJ7eqKX5AjziHi6Ay9IX50ga1VeEoOvmpHE2O33J7Zl_XQkIAaIvvT-gqRzevIcEUVc_SsXGHmx2v2sHYlwb6Cbs",
      align: "left",
      colorClass: "border-tertiary",
      hasAudio: false
    }
  ];

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
              <img alt="Abhilasha's profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBqqRYe8aTbGej1pbj8Mca9ZzjZtAH5xUByuyPakLfvQLKmFZru-UExKaJbQI9x77hKpkQFrj8sV982qLUgh3EORzM2EftuGzz-mjhori2TJ3-AGRGYdIBG7IGwqKdtQZYjkq12OU1H26Ziz7_BPVBQbYay6bjE4MGYoKESHai-xOjsDz9C_O_88J6cwVm0YClOR3YwV_gr-MH4BNgS6g7EdUVaoUwkP_rCgW8Kyw6C6ww3B2zyt-utFyQurzlXdtU7oGzEwkiXyw"/>
            </div>
            <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">Hey Abhilasha</h1>
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
          
          {memories.map((m) => {
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
          })}
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
