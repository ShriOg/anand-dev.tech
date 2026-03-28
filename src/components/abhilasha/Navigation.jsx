import { motion } from 'framer-motion';

export default function Navigation({ currentScreen, navigateTo }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'letters', label: 'For You', icon: 'favorite' },
    { id: 'memories', label: 'Memories', icon: 'collections' },
    { id: 'voice', label: 'Hear Me', icon: 'mic' },
    // More could either open a drawer or navigate to a hub, let's map it to mind or just constellation for now
    { id: 'mind', label: 'More', icon: 'more_horiz' } 
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-[100] flex justify-around items-center px-6 pb-8 pt-4 bg-[#0f131e]/80 backdrop-blur-2xl rounded-t-[3rem] shadow-[0_-10px_40px_rgba(15,19,30,0.5)]">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-500 ${
              isActive 
                ? 'text-[#FF8FA3] scale-110' 
                : 'text-slate-500 opacity-60 hover:text-[#c9bfff]'
            }`}
          >
            <span 
              className="material-symbols-outlined text-2xl mb-1" 
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
            <span className="font-['manrope'] text-[10px] tracking-widest uppercase">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
