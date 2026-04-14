"use client";

import { useState } from "react";
import contentData from "../../data/abhilasha/content.json";

export default function AbhilashaPage() {
  const [isForgiven, setIsForgiven] = useState(false);
  const [noCount, setNoCount] = useState(0);

  // Parse original content data for the base or success states
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

  const currentStageIndex = Math.min(noCount, noStages.length - 1);
  const currentStage = noStages[currentStageIndex];

  const handleNoClick = () => {
    setNoCount((prev) => prev + 1);
  };

  const handleYesClick = () => {
    setIsForgiven(true);
  };

  // Dynamically calculate sizes
  // Yes button grows dramatically with each "No" click.
  const yesButtonScale = 1 + (noCount * 0.3); 
  const yesButtonBaseWidth = 120 + (noCount * 30);
  
  // No button shrinks and gets faint
  const noButtonScale = Math.max(0.3, 1 - (noCount * 0.15));

  return (
    <>
      <div className="floating-hearts-bg">
        {/* Generate some background floating hearts */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="floating-heart"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
              fontSize: `${1 + Math.random()}rem`
            }}
          >
            {isForgiven ? "💖" : "✨"}
          </div>
        ))}
      </div>

      <div className="abhilasha-container">
        <div className={`abhilasha-card ${isForgiven ? "success-view" : ""}`} style={{ overflow: "hidden" }}>
          <div className="abhilasha-icon-container">
            {isForgiven ? "🥺💖" : currentStage.icon}
          </div>
          
          <h1 className="abhilasha-title" style={{ transition: "color 0.4s ease" }}>
            {isForgiven ? "YAY!" : currentStage.title}
          </h1>
          
          {!isForgiven && (
            <h2 className="abhilasha-subtitle">{currentStage.subtitle}</h2>
          )}

          <p className="abhilasha-message" style={{ minHeight: "60px" }}>
            {isForgiven ? successMessage : currentStage.message}
          </p>

          {!isForgiven && (
            <>
              <div className="abhilasha-actions" style={{ 
                flexDirection: noCount > 3 ? "column" : "row",
                marginTop: noCount > 3 ? "2rem" : "0"
              }}>
                <button 
                  className="abhilasha-btn abhilasha-btn-yes"
                  onClick={handleYesClick}
                  style={{
                    transform: `scale(${yesButtonScale})`,
                    minWidth: `${yesButtonBaseWidth}px`,
                    zIndex: 10, // Ensure it overlaps other things if it gets huge
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    position: noCount > 5 ? "absolute" : "relative",
                    width: noCount > 5 ? "200%" : "auto",
                    height: noCount > 5 ? "200%" : "auto",
                    fontSize: noCount > 5 ? "2rem" : "1.1rem",
                  }}
                >
                  {currentStage.yesLabel}
                </button>
                <button 
                  className="abhilasha-btn abhilasha-btn-no"
                  onClick={handleNoClick} 
                  style={{
                    transform: `scale(${noButtonScale})`,
                    opacity: Math.max(0.2, 1 - (noCount * 0.15)),
                    position: "relative", // Revert to relative from previous hover dodge
                    left: 0,
                    top: 0,
                    zIndex: 5,
                    pointerEvents: noCount >= noStages.length - 1 ? "none" : "auto",
                  }}
                >
                  {currentStage.noLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
