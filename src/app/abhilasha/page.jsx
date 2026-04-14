"use client";

import { useEffect, useRef, useState } from "react";
import "./style.css";

const Confetti = ({ active }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      const colors = ['#ff4d6d', '#ff8fa3', '#fff0f3', '#ffb3c1', '#c9184a'];
      const newPieces = Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'circle' : 'square',
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1.5,
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
            width: '12px',
            height: '12px',
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '0',
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
        if (entry.isIntersecting) setVisible(true);
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

export default function AbhilashaBirthday() {
  const [step, setStep] = useState(0); // 0: Envelope, 1: Typewriter, 2: Main
  const [passwordInput, setPasswordInput] = useState("");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showSurprise, setShowSurprise] = useState(false);

  // Mouse Magic Cursor Tracker
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Time Tracker
  useEffect(() => {
    const anniversaryDate = new Date("2023-01-01T00:00:00");
    const calculateTime = () => {
      const now = new Date();
      const difference = now.getTime() - anniversaryDate.getTime();
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
    if (passwordInput.toLowerCase() === "abhilasha") {
      setEnvelopeOpen(true);
      setTimeout(() => setStep(1), 2200); // switch to typewriter after envelope flies away
    } else {
      alert("Incorrect magic word");
      setPasswordInput("");
    }
  };

  const scrollToNext = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const flipCardData = [
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
  ];

  const TypewriterIntro = () => {
    const [text, setText] = useState("");
    const [lineIdx, setLineIdx] = useState(0);
    const lines = [
      "Loading memories...",
      "Finding the perfect words...",
      "Welcome to your special place, Abhilasha."
    ];

    useEffect(() => {
      if (lineIdx >= lines.length) {
        setTimeout(() => setStep(2), 1500);
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
    }, [lineIdx]);

    return (
      <div className="typewriter-container">
        <div className="typewriter-text">
          {text}<span className="cursor-blink">|</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bday-container">
      {/* Interactive Magic Cursor */}
      <div className="magic-cursor" style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }} />

      {/* STEP 0: The Magic Envelope */}
      {step === 0 && (
        <div className={`envelope-container ${envelopeOpen ? 'envelope-opened flash' : ''}`}>
          <div style={{ marginBottom: '3rem', color: '#fff', fontSize: '1.2rem', fontWeight: 300, letterSpacing: '2px' }}>
            You have a message...
          </div>
          
          <div className="envelope-wrapper">
            <div className="envelope-flap"></div>
            <div className="envelope-back"></div>
            <div className="envelope-letter">
              <h3>For Abhilasha</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', fontFamily: 'sans-serif' }}>A secret birthday wish.</p>
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
                    padding: '12px 20px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
                <button type="submit" style={{ padding: '12px 25px', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg, #ff4d6d, #d4145a)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Open
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* STEP 1: Cinematic Typewriter sequence */}
      {step === 1 && <TypewriterIntro />}

      {/* STEP 2: Main Emotional Experience */}
      {step === 2 && (
        <>
          <AudioVisualizer />
          <Confetti active={showSurprise} />

          {/* Soft Floating Particles Background */}
          <div className="particles-container">
            {[...Array(25)].map((_, i) => (
              <div 
                key={i} 
                className="particle"
                style={{
                  left: `${Math.random() * 100}vw`,
                  width: `${Math.random() * 5 + 3}px`,
                  height: `${Math.random() * 5 + 3}px`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${Math.random() * 15 + 10}s`
                }}
              />
            ))}
          </div>

          <section id="hero" className="bday-section">
            <FadeInSection>
              <div style={{ zIndex: 10, position: 'relative' }}>
                <h1 className="bday-title">Happy Birthday ❤️</h1>
                <p className="bday-subtitle">To the most special person in my life</p>
                <div className="heart-icon">❤️</div>
                <div>
                  <button className="surprise-btn" style={{ padding: '1rem 2rem', fontSize: '1rem' }} onClick={() => scrollToNext('message')}>
                    Start the Journey
                  </button>
                </div>
              </div>
            </FadeInSection>
          </section>

          <section id="message" className="bday-section">
            <FadeInSection>
              <div className="glass-card">
                <p className="bday-subtitle" style={{ color: '#fff', fontSize: '1.2rem', lineHeight: 1.8 }}>
                  "You came into my life and made everything entirely better... <br/><br/>
                  I don’t say it as often as I should, but you mean the whole world to me. Thank you for simply being you."
                </p>
              </div>
            </FadeInSection>
          </section>

          <section id="photos" className="bday-section">
            <FadeInSection>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 className="bday-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Our Memories</h2>
                <p className="bday-subtitle" style={{ marginBottom: '3rem' }}>(Tap to flip the photos)</p>
                
                <div className="memories-grid">
                  {flipCardData.map((card, i) => (
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
          </section>

          <section id="counter" className="bday-section">
            <FadeInSection>
              <div className="glass-card" style={{ width: 'auto', maxWidth: '95%', padding: '3.5rem 2.5rem' }}>
                <h2 className="bday-subtitle" style={{ margin: 0, fontWeight: 400, color: '#fff' }}>We've been writing our story for:</h2>
                <div className="counter-box">
                  <div className="counter-item">
                    <span className="counter-value">{timeTogether.days}</span>
                    <span className="counter-label">Days</span>
                  </div>
                  <div className="counter-item">
                    <span className="counter-value">{timeTogether.hours}</span>
                    <span className="counter-label">Hours</span>
                  </div>
                  <div className="counter-item">
                    <span className="counter-value">{timeTogether.minutes}</span>
                    <span className="counter-label">Mins</span>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </section>

          <section id="surprise" className="bday-section">
            <FadeInSection>
              {!showSurprise ? (
                <button className="surprise-btn" onClick={() => setShowSurprise(true)}>
                  Tap to unwrap surprise 🎁
                </button>
              ) : (
                <div className="glass-card" style={{ border: '1px solid rgba(255, 77, 109, 0.5)', background: 'rgba(255, 77, 109, 0.1)' }}>
                  <h2 className="bday-title" style={{ fontSize: '2.5rem', background: '#fff', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Surprise! 🎉
                  </h2>
                  <p className="bday-subtitle" style={{ color: '#fff', fontSize: '1.25rem', marginTop: '1rem', fontWeight: 400 }}>
                    I love you more than words can explain. Here is to a hundred more birthdays together 💖
                  </p>
                </div>
              )}
            </FadeInSection>
          </section>

          <section id="final" className="bday-section" style={{ overflow: 'hidden' }}>
            <FadeInSection>
              <div style={{ paddingBottom: '10vh' }}>
                <h2 className="bday-title" style={{ fontSize: '2.5rem' }}>Once again… Happy Birthday ❤️</h2>
                <p className="bday-subtitle" style={{ fontSize: '1.4rem', marginTop: '1.5rem', color: '#fff' }}>Stay with me forever?</p>
                
                {/* Visual bottom hearts */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100vw', height: '40vh', pointerEvents: 'none' }}>
                  {[...Array(15)].map((_, i) => (
                    <div 
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${Math.random() * 100}%`,
                        bottom: `-20%`,
                        fontSize: `${Math.random() * 2 + 1}rem`,
                        animation: `floatParticle ${Math.random() * 6 + 4}s infinite linear`,
                        animationDelay: `${Math.random() * 4}s`,
                        opacity: 0.7,
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
