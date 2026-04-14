"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import "./style.css";

// ==========================================
// 🎂 EDIT EVERYTHING IN THIS BLOCK BELOW
// ==========================================
export const CONTENT_CONFIG = {
  // Password MUST be exactly as spelled here (lowercase)
  password: "abhilasha",
  
  // Dates (Used for the live counter)
  anniversaryDate: "2023-01-01T00:00:00",

  // Typewriter intro messages (Array of strings)
  typewriterLines: [
    "Loading our memories...",
    "Finding the perfect words...",
    "Welcome to your special place, Abhilasha."
  ],

  // Envelope Lock Screen
  envelopeHeader: "You have a message...",
  envelopeTitle: "For Abhilasha",
  envelopeSubtitle: "A secret birthday wish.",

  // Hero Section
  heroTitle: "Happy Birthday ❤️",
  heroSubtitle: "To the most special person in my life.",
  heroButtonText: "Start the Journey",

  // Personal Message Section
  personalMessage: "You came into my life and made everything entirely better... \n\nI don’t say it as often as I should, but you mean the whole world to me. Thank you for simply being you.",

  // Memories Section (Interactive Polaroids)
  memoriesTitle: "Our Memories",
  memoriesSubtitle: "(Tap to flip the photos)",
  flipCards: [
    {
      img: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      caption: "Our first trip",
      note: "I'll never forget the way you laughed when we got lost that day. You make any detour an adventure."
    },
    {
      img: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      caption: "Random dates",
      note: "Even the most ordinary coffee dates feel like a movie scene when I'm sitting across from you."
    },
    {
      img: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      caption: "You & Me",
      note: "Just a reminder that you are the most beautiful person I know, inside and out. I'm so lucky."
    }
  ],

  // Surprise Section
  surpriseHeadline: "Surprise! 🎉",
  surpriseMessage: "I love you more than words can explain. Here is to a hundred more birthdays together 💖",
  surpriseButton: "Tap to unwrap surprise 🎁",

  // Final Screen
  finalHeadline: "Once again… Happy Birthday ❤️",
  finalSubtitle: "Stay with me forever?"
};
// ==========================================
// END OF EDITABLE BLOCK
// ==========================================

/* --- REUSABLE COMPONENTS (Not inside the main render so they don't reset) --- */

const Confetti = ({ active }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      const colors = ['#f8bbd0', '#f48fb1', '#f06292', '#e91e63', '#c2185b', '#fff'];
      const newPieces = Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'circle' : 'square',
        delay: Math.random() * 0.5,
        duration: Math.random() * 2.5 + 2,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);
    } else {
      setPieces([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: '10px',
            height: '10px',
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animation: `fall ${p.duration}s ${p.delay}s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
            transform: `rotate(${p.rotation}deg)`
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fall {
          to {
            transform: translateY(110vh) rotate(720deg);
          }
        }
      `}} />
    </div>
  );
};

const FadeInSection = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    }, { threshold: 0.2 });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  return (
    <div
      className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}
      ref={domRef}
      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
    >
      {children}
    </div>
  );
};

const AudioVisualizer = () => (
  <div className="audio-visualizer">
    <div className="audio-bar"></div>
    <div className="audio-bar"></div>
    <div className="audio-bar"></div>
    <div className="audio-bar"></div>
  </div>
);

// Extracted Typewriter to prevent re-rendering restarts
const TypewriterIntro = ({ lines, onComplete }) => {
  const [text, setText] = useState("");
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= lines.length) {
      setTimeout(() => {
        onComplete();
      }, 1500);
      return;
    }
    
    const currentLine = lines[lineIdx];
    let charIdx = 0;
    
    const typeInterval = setInterval(() => {
      if (charIdx <= currentLine.length) {
        setText(currentLine.substring(0, charIdx));
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setLineIdx(p => p + 1), 1200);
      }
    }, 60);
    
    return () => clearInterval(typeInterval);
  }, [lineIdx, lines, onComplete]);

  return (
    <div className="typewriter-container">
      <div className="typewriter-text">
        {text}<span className="cursor-blink">_</span>
      </div>
    </div>
  );
};


/* --- MAIN PAGE COMPONENT --- */

export default function AbhilashaBirthday() {
  const [step, setStep] = useState(0); // 0: Envelope, 1: Typewriter, 2: Main
  const [passwordInput, setPasswordInput] = useState("");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showSurprise, setShowSurprise] = useState(false);

  // Time Tracker Initialization
  useEffect(() => {
    const annDate = new Date(CONTENT_CONFIG.anniversaryDate);
    const calculateTime = () => {
      const now = new Date();
      const difference = now.getTime() - annDate.getTime();
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      setTimeTogether({ days, hours, minutes });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput.toLowerCase() === CONTENT_CONFIG.password) {
      setEnvelopeOpen(true);
      setTimeout(() => setStep(1), 2500); // Wait for letter popup to read, then fade to typewriter
    } else {
      alert("Incorrect magic word");
      setPasswordInput("");
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTypewriterComplete = () => {
    setStep(2);
    // Auto-scroll slightly into hero after typewriter to immerse
    setTimeout(() => {
      scrollToSection('hero');
    }, 100);
  };

  return (
    <div className="bday-container">

      {/* STEP 0: The Magic Envelope */}
      {step === 0 && (
        <div className={`envelope-container ${envelopeOpen ? 'envelope-opened flash' : ''}`}>
          <div style={{ marginBottom: '3rem', color: '#fff', fontSize: '1.2rem', fontWeight: 300, letterSpacing: '4px', opacity: envelopeOpen ? 0 : 1, transition: 'opacity 0.5s' }}>
            {CONTENT_CONFIG.envelopeHeader}
          </div>
          
          <div className="envelope-wrapper">
            <div className="envelope-flap"></div>
            <div className="envelope-back"></div>
            <div className="envelope-letter">
              <h3>{CONTENT_CONFIG.envelopeTitle}</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', fontFamily: 'sans-serif' }}>{CONTENT_CONFIG.envelopeSubtitle}</p>
            </div>
            <div className="envelope-front-left"></div>
            <div className="envelope-front-right"></div>
            
            {!envelopeOpen && (
              <form onSubmit={handlePasswordSubmit} style={{ position: 'absolute', bottom: '-80px', width: '100%', display: 'flex', gap: '10px' }}>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit',
                    letterSpacing: '1px'
                  }}
                />
                <button type="submit" className="elegant-btn" style={{ padding: '10px 25px' }}>
                  Open
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* STEP 1: Cinematic Typewriter sequence */}
      {step === 1 && <TypewriterIntro lines={CONTENT_CONFIG.typewriterLines} onComplete={handleTypewriterComplete} />}

      {/* STEP 2: Main Emotional Experience */}
      {step === 2 && (
        <>
          <AudioVisualizer />
          <Confetti active={showSurprise} />

          {/* Ultra subtle particles for elegant float effect */}
          <div className="particles-container">
            {[...Array(15)].map((_, i) => (
              <div 
                key={i} 
                className="particle"
                style={{
                  left: `${Math.random() * 100}vw`,
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${Math.random() * 15 + 15}s`,
                  background: 'rgba(255,255,255,0.1)'
                }}
              />
            ))}
          </div>

          {/* Section 1: Hero */}
          <section id="hero" className="bday-section">
            <FadeInSection>
              <div style={{ zIndex: 10, position: 'relative' }}>
                <h1 className="bday-title">{CONTENT_CONFIG.heroTitle}</h1>
                <p className="bday-subtitle">{CONTENT_CONFIG.heroSubtitle}</p>
                <div className="heart-icon">❤️</div>
                <div style={{ marginTop: '2rem' }}>
                  <button className="elegant-btn" onClick={() => scrollToSection('message')}>
                    {CONTENT_CONFIG.heroButtonText}
                  </button>
                </div>
              </div>
            </FadeInSection>
            <div className="scroll-indicator" onClick={() => scrollToSection('message')}>↓</div>
          </section>

          {/* Section 2: Personal Message */}
          <section id="message" className="bday-section">
            <FadeInSection>
              <div className="glass-card">
                <p className="bday-subtitle" style={{ color: '#fff', fontSize: '1.1rem', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
                  "{CONTENT_CONFIG.personalMessage}"
                </p>
              </div>
            </FadeInSection>
            <div className="scroll-indicator" onClick={() => scrollToSection('photos')}>↓</div>
          </section>

          {/* Section 3: Floating Polaroids */}
          <section id="photos" className="bday-section">
            <FadeInSection>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 className="bday-title" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '0.5rem' }}>
                  {CONTENT_CONFIG.memoriesTitle}
                </h2>
                <p className="bday-subtitle" style={{ marginBottom: '4rem', opacity: 0.5 }}>
                  {CONTENT_CONFIG.memoriesSubtitle}
                </p>
                
                <div className="memories-grid">
                  {CONTENT_CONFIG.flipCards.map((card, i) => (
                    <div className="flip-card" key={i} onClick={(e) => e.currentTarget.classList.toggle('flipped')}>
                      <div className="flip-card-inner">
                        <div className="flip-card-front">
                          <img src={card.img} alt={`Memory ${i+1}`} />
                          <span>{card.caption}</span>
                        </div>
                        <div className="flip-card-back">
                          <p>{card.note}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInSection>
            <div className="scroll-indicator" onClick={() => scrollToSection('counter')}>↓</div>
          </section>

          {/* Section 4: Live Counter */}
          <section id="counter" className="bday-section">
            <FadeInSection>
              <div className="glass-card" style={{ width: '100%', maxWidth: '800px', padding: '4rem' }}>
                <h2 className="bday-subtitle" style={{ margin: 0, fontWeight: 300, color: '#fff', letterSpacing: '1px' }}>
                  We've been sharing moments for:
                </h2>
                <div className="counter-box" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', marginTop: '3rem' }}>
                  <div className="counter-item">
                    <div className="counter-value">{timeTogether.days}</div>
                    <div className="counter-label">Days</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-value">{timeTogether.hours}</div>
                    <div className="counter-label">Hours</div>
                  </div>
                  <div className="counter-item">
                    <div className="counter-value">{timeTogether.minutes}</div>
                    <div className="counter-label">Mins</div>
                  </div>
                </div>
              </div>
            </FadeInSection>
            <div className="scroll-indicator" onClick={() => scrollToSection('surprise')}>↓</div>
          </section>

          {/* Section 5: Surprise Finish */}
          <section id="surprise" className="bday-section">
            <FadeInSection>
              {!showSurprise ? (
                <button className="elegant-btn" onClick={() => setShowSurprise(true)}>
                  {CONTENT_CONFIG.surpriseButton}
                </button>
              ) : (
                <div className="glass-card" style={{ border: '1px solid rgba(255, 77, 109, 0.3)', background: 'radial-gradient(circle, rgba(255,77,109,0.1) 0%, transparent 80%)' }}>
                  <h2 className="bday-title" style={{ fontSize: '2.5rem', background: '#fff', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                    {CONTENT_CONFIG.surpriseHeadline}
                  </h2>
                  <p className="bday-subtitle" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginTop: '1.5rem', fontWeight: 300 }}>
                    {CONTENT_CONFIG.surpriseMessage}
                  </p>
                </div>
              )}
            </FadeInSection>
            {showSurprise && <div className="scroll-indicator" onClick={() => scrollToSection('final')}>↓</div>}
          </section>

          {/* Section 6: Outro */}
          <section id="final" className="bday-section" style={{ overflow: 'hidden' }}>
            <FadeInSection>
              <div style={{ paddingBottom: '10vh' }}>
                <h2 className="bday-title" style={{ fontSize: '2.5rem' }}>{CONTENT_CONFIG.finalHeadline}</h2>
                <p className="bday-subtitle" style={{ fontSize: '1.4rem', marginTop: '1.5rem', color: '#fff', letterSpacing: '1px' }}>
                  {CONTENT_CONFIG.finalSubtitle}
                </p>
                
                {/* Visual bottom hearts float */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100vw', height: '40vh', pointerEvents: 'none' }}>
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${Math.random() * 100}%`,
                        bottom: `-20%`,
                        fontSize: `${Math.random() * 2 + 1}rem`,
                        animation: `floatParticle ${Math.random() * 6 + 4}s infinite linear`,
                        animationDelay: `${Math.random() * 4}s`,
                        opacity: 0.4,
                        willChange: 'transform'
                      }}
                    >
                      ❤️
                    </div>
                  ))}
                </div>
              </div>
            </FadeInSection>
          </section>
        </>
      )}
    </div>
  );
}
