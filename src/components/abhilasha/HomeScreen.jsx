export default function HomeScreen({ navigateTo }) {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen overflow-x-hidden light-leak">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0f131e]/60 backdrop-blur-xl">
        <div className="flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20">
                <img 
                  alt="Abhilasha's profile" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCABZDvuseFCoBV96yPekIJN_9zcBRL-66U_hlaE4X1X9XN0dP8-qSTB_9-Dgt0qvcFdCKBHj7GZ5qI9LdJVHbrbyhPqjXE7JMkaFom5W1ZdrdZ3Pn9ehRbuM_1HFkAl7XCUCV_Zq4JMDJpNc231o6QZsxsTerL-ADL38nzfAUYXnBlZyzDJn0dFkaaXzF--IysAgG3j5QdUQMM5CKPqAA1Foj-Oj8yoTb2_eyiMovj5epCwfG23b3wBwPb49aBUjeLQDH9D5e9HUY"
                />
              </div>
              <div>
                <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">Hey Abhilasha</h1>
                <p className="font-body text-sm opacity-60 italic">Take your time… everything here is for you.</p>
              </div>
            </div>
            <button className="text-[#FF8FA3] hover:opacity-80 transition-opacity duration-500">
              <span className="material-symbols-outlined">music_note</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-32 px-6 max-w-lg mx-auto space-y-10 relative z-10">
        {/* Mood Selector */}
        <section className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 pl-2">Current Heartbeat</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2.5 rounded-full bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/10 text-sm font-medium hover:bg-primary/10 transition-all duration-500">
                I feel low
            </button>
            <button className="px-5 py-2.5 rounded-full bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/10 text-sm font-medium hover:bg-primary/10 transition-all duration-500">
                I miss you
            </button>
            <button className="px-5 py-2.5 rounded-full bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/10 text-sm font-medium hover:bg-primary/10 transition-all duration-500">
                I’m okay
            </button>
          </div>
        </section>

        {/* Bento Grid Main Content */}
        <section className="grid grid-cols-2 gap-4">
          {/* For You */}
          <div onClick={() => navigateTo('letters')} className="col-span-2 relative group cursor-pointer overflow-hidden rounded-lg bg-surface-variant/40 backdrop-blur-xl aspect-[16/9] flex flex-col justify-end p-6 border border-outline-variant/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent opacity-60 z-10"></div>
            <img 
              alt="For You" 
              className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-1000" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUOoEnUjQd1pUva_cw5hz8aieoLeGgGY3nE4qlZaAAXls9KFoKkKS3xV7AwqqXO-ko7meZsVkJ95m42v3L0_3_Glv0SHlbclwcK1R8v4aoUEg3M0Jbv5ipwCSJTrI0zLzMyWz7XF1hTP8gBK4zu2-Deor55xQmr1tmkIUyARPmatUqlEBBdY3-kGBaSUz7d2NxuYYlL07StgBVpBaqq23Qkic_bHZGnWTjPzcmERNuaWZ6DrjKfA8we4GKxlK38EGP5X3_XaqqwBw"
            />
            <div className="relative z-20">
              <span className="material-symbols-outlined text-primary mb-2">favorite</span>
              <h2 className="font-headline text-2xl text-white">For You</h2>
              <p className="text-xs text-white/60 font-light mt-1">A curated collection of digital love.</p>
            </div>
          </div>

          {/* Memories */}
          <div onClick={() => navigateTo('memories')} className="relative group cursor-pointer overflow-hidden rounded-lg bg-surface-variant/40 backdrop-blur-xl aspect-square flex flex-col justify-end p-4 border border-outline-variant/5">
            <img 
              alt="Memories" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 z-0 group-hover:scale-110 transition-transform duration-1000" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQxR4bx7gU_ci5s7sPO0StxJAaWS_i4jlt6F0hLS3glFPh8Bt4H-kVnBO1df_kKtNYEQtofZrJbhXpwtHGM5lxNHYR-N4V72mbEJp1YXQbAdrjDyWkaViLMZJOKHnj6GyCmJdgAjrm9UmPdADoRf12TJB77Vbr0iSOVEBS6A0G0coAd_uGMh7Ft9s-4H2zMo731BERBZqAt5DT2SVrejzD5rWtz4xGkNlGuqOez5qhGb_q0JAitNeSxjQ3qDhWGQ2Xib3YNSoGZgg"
            />
            <div className="relative z-20">
              <span className="material-symbols-outlined text-secondary text-xl">collections</span>
              <h2 className="font-headline text-lg text-white">Memories</h2>
            </div>
          </div>

          {/* Hear Me */}
          <div onClick={() => navigateTo('voice')} className="relative group cursor-pointer overflow-hidden rounded-lg bg-surface-variant/40 backdrop-blur-xl aspect-square flex flex-col justify-end p-4 border border-outline-variant/5">
            <img 
              alt="Hear Me" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 z-0 group-hover:scale-110 transition-transform duration-1000" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDotGgkAigZvJtl70QmCW-rDJmMWqNKSsqlDlgdbOUYhAheaCBUtkbSWrfiXPYalk29oC-_c8Vfa3NvarIF7KbUb7xKOTp1yU-ophVVzAuF_fbSID44x9782lkwxbKL_qEiC5TaFvwCgKe6UhqvJ6zmbNv1n8MGOgRJ88vPCcb7wzF0I4a-RQe1ZEF1faD-0-0Qx4c9B3nyOKncj6Uehp1sePrvoQf-D4Z195-5YDupsH2_Y-FHCa7I-YWoqafEqVlOVjY-MQeh6k"
            />
            <div className="relative z-20">
              <span className="material-symbols-outlined text-tertiary text-xl">mic</span>
              <h2 className="font-headline text-lg text-white">Hear Me</h2>
            </div>
          </div>

          {/* What I Feel But Don’t Say */}
          <div onClick={() => navigateTo('mind')} className="col-span-2 relative group cursor-pointer overflow-hidden rounded-lg bg-surface-variant/40 backdrop-blur-xl p-6 border border-outline-variant/5 bg-gradient-to-br from-surface-container-low to-surface-container-high z-20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="font-headline text-xl text-white">What I Feel But Don’t Say</h2>
                <p className="text-xs text-slate-400 font-body">Unspoken whispers kept for midnight.</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-variant/40 backdrop-blur-xl flex items-center justify-center border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary-container">auto_awesome</span>
              </div>
            </div>
          </div>

          {/* Our Sky */}
          <div onClick={() => navigateTo('constellation')} className="col-span-2 relative group cursor-pointer overflow-hidden rounded-lg bg-surface-variant/40 backdrop-blur-xl aspect-[21/9] flex flex-col justify-center items-center p-6 border border-outline-variant/5">
            <img 
              alt="Our Sky" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 group-hover:scale-105 transition-transform duration-1000" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlYhdnqTPLqsOxfrihRMtzSl9bVwhbO7oFe0kJqNqs_s_h_Pw5cNp8izNIrJZAjhpT_BbIWonbul0E1AhPlaWtRF3Qq2SJZtelYcQlf1BJThPwiZZ0WHmn9nz3H90O6JYZL6_5GsFiuoqoaq6CFxT8s4mLGtFuAnokldKbwp1xVZVE8A1nq2gJpOhlknqOhmHpyHBnxt_a1LzIHoFQeWq8hov-9poedKhKGb4vrb1dsYAecjDEPd9fY1EidZ7TQAnoazaEcY3lJyY"
            />
            <div className="text-center z-20">
              <h2 className="font-headline text-2xl text-white tracking-widest">Our Sky</h2>
              <p className="text-[10px] uppercase tracking-[0.3em] text-secondary-fixed-dim mt-2">Connecting us, always</p>
            </div>
          </div>
        </section>

        {/* Lock Section */}
        <section onClick={() => navigateTo('locked')} className="py-12 flex flex-col items-center text-center space-y-4 opacity-40 cursor-pointer hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-3xl">lock_open</span>
          <p className="font-headline italic text-lg text-slate-400">“Not everything opens at once…”</p>
          <div className="w-1 h-12 rounded-full bg-gradient-to-b from-outline-variant/40 to-transparent"></div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-28 right-6 z-50">
        <button className="group relative flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary-container to-secondary shadow-[0_0_40px_rgba(255,143,163,0.3)] hover:scale-110 transition-transform duration-700">
          <span className="material-symbols-outlined text-on-primary">spa</span>
          <span className="absolute right-full mr-4 bg-surface-container-highest/80 backdrop-blur px-4 py-2 rounded-full text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-outline-variant/10">
              When it’s too much… come here
          </span>
        </button>
      </div>
    </div>
  );
}
