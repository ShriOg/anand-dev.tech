"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import contentData from "../../data/abhilasha/content.json";

import EntryScreen from "../../components/abhilasha/EntryScreen";
import HomeScreen from "../../components/abhilasha/HomeScreen";
import Navigation from "../../components/abhilasha/Navigation";

import LettersScreen from "../../components/abhilasha/LettersScreen";
import MemoriesScreen from "../../components/abhilasha/MemoriesScreen";
import VoiceScreen from "../../components/abhilasha/VoiceScreen";
import MindScreen from "../../components/abhilasha/MindScreen";
import ConstellationScreen from "../../components/abhilasha/ConstellationScreen";
import LockedScreen from "../../components/abhilasha/LockedScreen";
import SpecialScreen from "../../components/abhilasha/SpecialScreen";

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
        />
      )}
    </div>
  );
}
