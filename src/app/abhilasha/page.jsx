"use client";

import { useState } from "react";
import contentData from "../../data/abhilasha/content.json";

export default function AbhilashaPage() {
  const [isForgiven, setIsForgiven] = useState(false);
  const [noCount, setNoCount] = useState(0);

  const { successMessage } = contentData;

  const noStages = [
    {
      icon: "🥺💔",
      title: contentData.title,
      subtitle: contentData.subtitle,
      message: contentData.message,
      yesLabel: contentData.yesLabel,
      noLabel: contentData.noLabel,
    },
    {
      icon: "🤔",
      title: "Really?",
      subtitle: "Are you absolutely sure?",
      message: "I promise I'll make it up to you! Just give me a chance.",
      yesLabel: "Yes, I forgive you",
      noLabel: "Still No",
    },
    {
      icon: "😭",
      title: "Please think again!",
      subtitle: "Give me one more chance",
      message: "I'll do anything! I'll buy you your favorite food, I'll watch whatever you want...",
      yesLabel: "Okay, fine 😒",
      noLabel: "Nope",
    },
    {
      icon: "💔💔",
      title: "You're breaking my heart...",
      subtitle: "Actually in pieces",
      message: "Have some mercy on me! Please? 🥺",
      yesLabel: "Fine, yes!",
      noLabel: "Never",
    },
    {
      icon: "😤",
      title: "I won't give up!",
      subtitle: "I am going to keep asking!",
      message: "You can't say no forever! See, your 'yes' button is getting bigger!",
      yesLabel: "YES!",
      noLabel: "No...",
    },
    {
      icon: "🥺✨",
      title: "You have no choice now!",
      subtitle: "Accept my apology",
      message: "Just click the giant button. You know you want to.",
      yesLabel: "YES YES YES!",
      noLabel: "no",
    }
  ];

  const maxStageIndex = noStages.length - 1;
  const currentStageIndex = Math.min(noCount, maxStageIndex);
  const currentStage = noStages[currentStageIndex];
  const isFinalStage = noCount >= maxStageIndex;

  const handleNoClick = () => {
    setNoCount((prev) => prev + 1);
  };

  const handleYesClick = () => {
    setIsForgiven(true);
  };

  // Mobile-first dynamic calculations
  const yesButtonScale = 1 + (noCount * 0.2); 
  const noButtonScale = Math.max(0.4, 1 - (noCount * 0.15));

  return (
    <>
      <div className="floating-hearts-bg">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="floating-heart"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 4}s`,
              fontSize: `${1 + Math.random() * 1.5}rem`
            }}
          >
            {isForgiven ? "💖" : "✨"}
          </div>
        ))}
      </div>

      <div className="abhilasha-container">
        <div className={`abhilasha-card ${isForgiven ? "success-view" : ""}`}>
          <div className="abhilasha-icon-container">
            {isForgiven ? "🥺💖" : currentStage.icon}
          </div>
          
          <h1 className="abhilasha-title" style={{ transition: "all 0.4s ease" }}>
            {isForgiven ? "YAY!" : currentStage.title}
          </h1>
          
          {!isForgiven && (
            <h2 className="abhilasha-subtitle">{currentStage.subtitle}</h2>
          )}

          <p className="abhilasha-message" style={{ minHeight: "clamp(60px, 15vw, 80px)" }}>
            {isForgiven ? successMessage : currentStage.message}
          </p>

          {!isForgiven && (
            <div className="abhilasha-actions" style={{ 
              flexDirection: noCount > 3 ? "column" : "row",
            }}>
              <button 
                className="abhilasha-btn abhilasha-btn-yes"
                onClick={handleYesClick}
                style={{
                  transform: isFinalStage ? "scale(1)" : `scale(${yesButtonScale})`,
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  position: isFinalStage ? "fixed" : "relative",
                  width: isFinalStage ? "100vw" : "auto",
                  height: isFinalStage ? "100dvh" : "auto",
                  top: isFinalStage ? 0 : "auto",
                  left: isFinalStage ? 0 : "auto",
                  borderRadius: isFinalStage ? 0 : "999px",
                  fontSize: isFinalStage ? "clamp(2rem, 8vw, 4rem)" : "auto",
                  margin: 0,
                }}
              >
                {currentStage.yesLabel}
              </button>

              <button 
                className="abhilasha-btn abhilasha-btn-no"
                onClick={handleNoClick} 
                style={{
                  transform: `scale(${noButtonScale})`,
                  opacity: isFinalStage ? 0 : Math.max(0.3, 1 - (noCount * 0.2)),
                  pointerEvents: isFinalStage ? "none" : "auto",
                  position: "relative",
                  marginTop: noCount > 3 ? "1rem" : "0",
                  visibility: isFinalStage ? "hidden" : "visible" // remove from a11y completely in final
                }}
              >
                {currentStage.noLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
