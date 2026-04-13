import contentData from "../../data/abhilasha/content.json";
import { motion } from "framer-motion";

export default function BirthdayScreen({ onComplete }) {
  const birthdayData = contentData?.birthday || {
    title: "Happy Birthday!",
    message: "Today is your special day.",
    buttonText: "Continue"
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-8 text-center bg-[#0a0c16] overflow-hidden">
      {/* Dynamic Confetti & Stars Background Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="light-leak absolute top-10 left-[-20%] w-[500px] h-[500px] bg-secondary/20 blur-[100px] rounded-full mix-blend-screen"></div>
        <div className="light-leak absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="star-field">
          <div className="star w-2 h-2 bg-yellow-300 shadow-[0_0_10px_#fde047] rounded-full absolute" style={{ top: '25%', left: '15%', animationDelay: '0s' }}></div>
          <div className="star w-1.5 h-1.5 bg-pink-300 shadow-[0_0_8px_#f9a8d4] rounded-full absolute" style={{ top: '65%', left: '80%', animationDelay: '1s' }}></div>
          <div className="star w-2 h-2 bg-blue-300 shadow-[0_0_12px_#93c5fd] rounded-full absolute" style={{ top: '10%', left: '75%', animationDelay: '2s' }}></div>
          <div className="star w-1 h-1 bg-white shadow-[0_0_5px_#fff] rounded-full absolute" style={{ top: '80%', left: '20%', animationDelay: '3s' }}></div>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center px-8 z-10 text-center relative w-full h-full">
        <motion.div 
          className="max-w-2xl space-y-10 bg-[#141925]/80 backdrop-blur-2xl p-10 md:p-16 rounded-[2.5rem] border border-white/5 shadow-2xl relative"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Decorative Top Icon */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-[#FF8FA3] to-[#FFB3C1] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(255,143,163,0.4)]">
            <span className="material-symbols-outlined text-white text-4xl">celebration</span>
          </div>

          <div className="space-y-6 pt-6">
            <motion.h1 
              className="font-headline text-5xl md:text-7xl tracking-tighter leading-tight bg-gradient-to-r from-[#FF8FA3] via-[#FFB3C1] to-white bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {birthdayData.title}
            </motion.h1>
            
            <motion.p 
              className="font-body text-xl md:text-2xl text-white/80 max-w-lg mx-auto leading-relaxed font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              {birthdayData.message}
            </motion.p>
          </div>

          <motion.div 
            className="pt-10 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            <button 
              onClick={onComplete}
              className="group relative px-10 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-body font-medium text-lg tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center gap-3 backdrop-blur-md"
            >
              <span>{birthdayData.buttonText}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 opacity-40 mix-blend-soft-light pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,143,163,0.1)_0%,rgba(10,12,22,1)_100%)]"></div>
      </div>
    </div>
  );
}
