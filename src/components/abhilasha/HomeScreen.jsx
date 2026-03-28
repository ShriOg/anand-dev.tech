import contentData from "../../data/abhilasha/content.json";

export default function HomeScreen({ navigateTo }) {
  const data = contentData?.home || {};
  const profileImage = contentData?.profileImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Ccircle cx='100' cy='100' r='100' fill='%23e8a4b8'/%3E%3C/svg%3E";
  const name = contentData?.name || "Abhilasha";

  if (!contentData) {
    return <div className="min-h-screen flex items-center justify-center text-white">Content coming soon...</div>;
  }

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary/30 min-h-screen overflow-x-hidden light-leak">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0f131e]/60 backdrop-blur-xl">
        <div className="flex flex-col justify-center px-8 py-6 w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20">
                <img 
                  alt={`${name}'s profile`} 
                  className="w-full h-full object-cover" 
                  src={profileImage}
                />
              </div>
              <div>
                <h1 className="font-headline text-3xl tracking-tight text-[#FF8FA3]">{data.greeting || `Hey ${name}`}</h1>
                <p className="font-body text-sm opacity-60 italic">{data.subtitle || "Take your time… everything here is for you."}</p>
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
            {(data.moods || ["I feel low", "I miss you", "I’m okay"]).map((mood, idx) => (
              <button key={idx} className="px-5 py-2.5 rounded-full bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/10 text-sm font-medium hover:bg-primary/10 transition-all duration-500">
                  {mood}
              </button>
            ))}
          </div>
        </section>

        {/* Bento Grid Main Content */}
        <section className="grid grid-cols-2 gap-4">
          {(data.cards || []).length === 0 ? (
             <div className="col-span-2 text-center text-slate-400 p-8">Content coming soon...</div>
          ) : (
            data.cards.map((card) => (
              <div 
                key={card.id}
                onClick={() => navigateTo(card.id)} 
                className={`relative group cursor-pointer overflow-hidden rounded-lg bg-surface-variant/40 backdrop-blur-xl p-6 border border-outline-variant/5 shadow-2xl ${card.colSpan === 2 ? 'col-span-2' : 'col-span-1'} ${card.aspect || ''} ${card.gradient || 'flex flex-col justify-end'}`}
              >
                {!card.gradient && card.image && (
                  <>
                    {card.colSpan === 2 && <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent opacity-60 z-10"></div>}
                    <img 
                      alt={card.title} 
                      className={`absolute inset-0 w-full h-full object-cover ${card.colSpan === 2 ? 'z-0' : 'opacity-40 z-0'} group-hover:scale-105 transition-transform duration-1000`} 
                      src={card.image}
                    />
                  </>
                )}
                
                {card.gradient ? (
                  <div className="flex items-center justify-between h-full z-20">
                    <div className="space-y-1">
                      <h2 className="font-headline text-xl text-white">{card.title}</h2>
                      <p className="text-xs text-slate-400 font-body">{card.subtitle}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-surface-variant/40 backdrop-blur-xl flex items-center justify-center border border-outline-variant/20">
                      <span className={`material-symbols-outlined text-primary-container`}>{card.icon}</span>
                    </div>
                  </div>
                ) : card.icon ? (
                  <div className={`relative z-20 ${card.colSpan === 2 ? '' : ''}`}>
                    <span className={`material-symbols-outlined ${card.iconColor || 'text-primary'} ${card.colSpan === 1 ? 'text-xl' : 'mb-2'}`}>{card.icon}</span>
                    <h2 className={`font-headline text-white ${card.colSpan === 2 ? 'text-2xl' : 'text-lg'}`}>{card.title}</h2>
                    {card.subtitle && <p className="text-xs text-white/60 font-light mt-1">{card.subtitle}</p>}
                  </div>
                ) : (
                  <div className="text-center z-20 h-full flex flex-col justify-center items-center">
                    <h2 className="font-headline text-2xl text-white tracking-widest">{card.title}</h2>
                    {card.subtitle && <p className="text-[10px] uppercase tracking-[0.3em] text-secondary-fixed-dim mt-2">{card.subtitle}</p>}
                  </div>
                )}
              </div>
            ))
          )}
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
