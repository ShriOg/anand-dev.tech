"use client";

import { useState, useRef, useEffect } from "react";
import contentData from "../../data/abhilasha/content.json";

export default function AbhilashaPage() {
  const [isForgiven, setIsForgiven] = useState(false);
  const [noButtonStyle, setNoButtonStyle] = useState({});
  const noBtnRef = useRef(null);

  // Parse content data
  const { title, subtitle, message, question, yesLabel, noLabel, successMessage } = contentData;

  const handleNoHover = () => {
    // Calculate random position within viewport boundaries
    if (typeof window === "undefined") return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Keep button somewhat within safe bounds so it doesn't leave the screen completely
    const safeZoneX = viewportWidth - 150; 
    const safeZoneY = viewportHeight - 60;
    
    const randomX = Math.max(10, Math.floor(Math.random() * safeZoneX));
    const randomY = Math.max(10, Math.floor(Math.random() * safeZoneY));

    setNoButtonStyle({
      position: "fixed",
      left: `${randomX}px`,
      top: `${randomY}px`,
    });
  };

  const handleYesClick = () => {
    setIsForgiven(true);
  };

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
        <div className={`abhilasha-card ${isForgiven ? "success-view" : ""}`}>
          <div className="abhilasha-icon-container">
            {isForgiven ? "🥺💖" : "🥺💔"}
          </div>
          
          <h1 className="abhilasha-title">
            {isForgiven ? "YAY!" : title}
          </h1>
          
          {!isForgiven && (
            <h2 className="abhilasha-subtitle">{subtitle}</h2>
          )}

          <p className="abhilasha-message">
            {isForgiven ? successMessage : message}
          </p>

          {!isForgiven && (
            <>
              <h3 className="abhilasha-question">{question}</h3>
              <div className="abhilasha-actions">
                <button 
                  className="abhilasha-btn abhilasha-btn-yes"
                  onClick={handleYesClick}
                >
                  {yesLabel}
                </button>
                <button 
                  ref={noBtnRef}
                  className="abhilasha-btn abhilasha-btn-no"
                  onMouseEnter={handleNoHover}
                  onClick={handleNoHover} // For mobile taps
                  style={noButtonStyle}
                >
                  {noLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
