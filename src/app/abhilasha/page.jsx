"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import EntryScreen from "../../components/abhilasha/EntryScreen";
import HomeScreen from "../../components/abhilasha/HomeScreen";
import Navigation from "../../components/abhilasha/Navigation";

// Shells for other screens will be imported here
// For now, we stub them to prevent errors during early build
const LettersScreen = () => <div className="text-white pt-32 text-center">Letters Screen</div>;
const MemoriesScreen = () => <div className="text-white pt-32 text-center">Memories Screen</div>;
const VoiceScreen = () => <div className="text-white pt-32 text-center">Voice Screen</div>;
const MindScreen = () => <div className="text-white pt-32 text-center">Mind Screen</div>;
const ConstellationScreen = () => <div className="text-white pt-32 text-center">Constellation Screen</div>;
const LockedScreen = ({ unlockSpecial }) => (
  <div className="text-white pt-32 text-center">
     Locked Screen 
     <button onClick={unlockSpecial} className="mt-4 p-2 bg-white/10 rounded">Secret Unlock</button>
  </div>
);
const SpecialScreen = () => <div className="text-white pt-32 text-center">Special Screen! Happy Birthday!</div>;

export default function AbhilashaApp() {
  const [currentScreen, setCurrentScreen] = useState("entry");
  const [isSpecialUnlocked, setIsSpecialUnlocked] = useState(false);

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  const unlockSpecial = () => {
    setIsSpecialUnlocked(true);
    setCurrentScreen("special");
  };

  // The animation variants
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.02 }
  };
  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  };

  return (
    <div className="relative w-full min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
           key={currentScreen}
           initial="initial"
           animate="in"
           exit="out"
           variants={pageVariants}
           transition={pageTransition}
           className="w-full h-full absolute inset-0"
        >
          {currentScreen === "entry" && <EntryScreen onEnter={() => navigateTo("home")} />}
          {currentScreen === "home" && <HomeScreen navigateTo={navigateTo} />}
          {currentScreen === "letters" && <LettersScreen />}
          {currentScreen === "memories" && <MemoriesScreen />}
          {currentScreen === "voice" && <VoiceScreen />}
          {currentScreen === "mind" && <MindScreen />}
          {currentScreen === "constellation" && <ConstellationScreen />}
          {currentScreen === "locked" && <LockedScreen unlockSpecial={unlockSpecial} />}
          {currentScreen === "special" && isSpecialUnlocked && <SpecialScreen />}
        </motion.div>
      </AnimatePresence>
      
      {currentScreen !== "entry" && (
        <Navigation 
           currentScreen={currentScreen} 
           navigateTo={navigateTo} 
           isSpecialUnlocked={isSpecialUnlocked} 
        />
      )}
    </div>
  );
}
