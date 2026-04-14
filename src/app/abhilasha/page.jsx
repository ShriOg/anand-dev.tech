"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import "./style.css";

// ==========================================
// 🎂 EDIT EVERYTHING IN THIS BLOCK BELOW
// ==========================================
export const CONTENT_CONFIG = {
  password: "abhilasha",
  anniversaryDate: "2025-04-21T00:00:00",

  typewriterLines: [
    "Toh aa hi gayi aap…",
    "Ms. Sleeping Beauty 👀",
    "Thoda wait karna padega… sab kuch instantly nahi milta.",
    "This isn't just a page… thodi mehnat lagi hai isme.",
    "Welcome, Abhilasha Jii ❤️"
  ],

  envelopeHeader: "Tumhare liye kuch khaas hai…",
  envelopeTitle: "Only for Abhilasha",
  envelopeSubtitle: "Kholo… par dhyaan se.",

  heroTitle: "Happy Birthday ❤️",
  heroSubtitle:
    "Sach bolun… tumne meri zindagi ko bas better nahi, beautiful bana diya hai.",
  heroButtonText: "Chalein…? 👀",

  personalMessage:
    "You didn’t just enter my life...\n" +
    "you slowly became a part of everything.\n\n" +

    "Pehle sab normal tha…\n" +
    "phir tum aayi… aur sab special lagne laga.\n\n" +

    "Kuch baatein main shayad kabhi perfect tareeke se bol nahi paunga…\n" +
    "par tum samajh leti ho na?\n\n" +

    "Meri har smile ke peeche tum ho.\n" +
    "Aur shayad meri har tension ke peeche bhi… but woh alag baat hai 😭\n\n" +

    "Tum sirf important nahi ho.\n" +
    "Tum meri aadat ban chuki ho.\n\n" +

    "And honestly…\n" +
    "I don’t want to lose this.\n\n" +

    "You’re not just special.\n" +
    "You’re *my everything.*",

  memoriesTitle: "Kuch Pyaare Pyaare Pal",
  memoriesSubtitle: "(Jo kabhi purane nahi honge)",

  flipCards: [
    {
      img: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      caption: "Woh Moments",
      note:
        "Sach bolun toh mujhe exact yaad bhi nahi ki kab sab itna khaas ban gaya.\n\n" +
        "Bas itna pata hai… tumhare saath har din alag lagta hai."
    },
    {
      img: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      caption: "Chhoti Baatein",
      note:
        "Tumhari chhoti chhoti baatein… random texts… wo hasi…\n\n" +
        "Pata nahi kaise, par mera poora din bana deti hain."
    },
    {
      img: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      caption: "Sirf Tum",
      note:
        "Future ke baare mein zyada sochta nahi hoon…\n\n" +
        "Par agar kuch sach mein chahta hoon…\n" +
        "toh wo sirf ek cheez hai — tum."
    }
  ],

  surpriseHeadline: "Ruko… ek aur baat 🎉",
  surpriseMessage:
    "Main tumhe sirf aaj ke liye nahi chahta.\n\n" +

    "Main tumhe har version mein dekhna chahta hoon —\n" +
    "happy, sad, overthinking, angry… sab.\n\n" +

    "Tumhari hansi, tumhare sapne, tumhara gussa…\n" +
    "mujhe sab accept hai.\n\n" +

    "Bas ek cheez chahiye…\n" +
    "stay with me.",

  surpriseButton: "Open karo… dekhte hain 👀",

  finalHeadline: "Happy Birthday, Abhilasha ❤️",
  finalSubtitle:
    "Toh phir batao…\n\n" +
    "Hamesha ke liye aise hi tang karne do?\n\n" +
    "Ya officially haan bolna padega? 😌"
};
// ==========================================
// END OF EDITABLE BLOCK
// ==========================================

/* --- REUSABLE CINEMATIC COMPONENTS --- */

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
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fall {
          to {
            transform: translateY(110vh) rotate(720deg);
          }
        }
      `}} />
    </div>
  );
};

const MagneticButton = ({ children, onClick, className, style }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      style={style}
    >
      {children}
    </motion.button>
  );
};

const CustomCursor = () => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMouse = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const target = e.target;
      if (target.tagName.toLowerCase() === 'button' || target.closest('.flip-card') || target.closest('.wax-seal')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    window.addEventListener('mousemove', updateMouse);
    return () => window.removeEventListener('mousemove', updateMouse);
  }, []);

  return (
    <div
      className={`custom-cursor ${isHovering ? 'active' : ''}`}
      style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
    />
  );
};

const ParticleSwarm = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let stardust = [];
    let animationFrameId;
    let mouse = { x: null, y: null };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
      if (mouse.x && Math.random() > 0.4) {
        stardust.push({
          x: e.clientX,
          y: e.clientY,
          radius: Math.random() * 2 + 1,
          opacity: 1,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1
        });
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.angle = Math.random() * 360;
        this.speed = Math.random() * 0.2 + 0.1;
      }

      update() {
        this.angle += this.speed * 0.05;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (mouse.x != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let maxDistance = 150;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = forceDirectionX * force * this.density * 0.2;
          let directionY = forceDirectionY * force * this.density * 0.2;

          if (distance < maxDistance) {
            this.x -= directionX;
            this.y -= directionY;
          } else {
            if (this.x !== this.baseX) this.x -= (this.x - this.baseX) / 50;
            if (this.y !== this.baseY) this.y -= (this.y - this.baseY) / 50;
          }
        }
      }

      draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < 60; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Base swarm
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      // Stardust interactive trail
      for (let i = 0; i < stardust.length; i++) {
        let p = stardust[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.02; // fade out over 50 frames

        ctx.fillStyle = `rgba(255, 77, 109, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      // Clean up dead stardust
      stardust = stardust.filter(p => p.opacity > 0);

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }} />;
};

const TypewriterIntro = ({ lines, onComplete, onCharType }) => {
  const [text, setText] = useState("");
  const [lineIdx, setLineIdx] = useState(0);

  // Store callbacks in refs to prevent infinite re-render looping from inline functions
  const cbRefs = useRef({ onComplete, onCharType });
  useEffect(() => {
    cbRefs.current = { onComplete, onCharType };
  });

  useEffect(() => {
    if (lineIdx >= lines.length) {
      setTimeout(() => cbRefs.current.onComplete(), 2000);
      return;
    }
    const currentLine = lines[lineIdx];
    let charIdx = 0;
    const typeInterval = setInterval(() => {
      if (charIdx <= currentLine.length) {
        setText(currentLine.substring(0, charIdx));
        cbRefs.current.onCharType();
        charIdx++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => setLineIdx(p => p + 1), 1500);
      }
    }, 60);
    return () => clearInterval(typeInterval);
  }, [lineIdx, lines]);

  return (
    <motion.div
      className="typewriter-container"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(10px)' }} transition={{ duration: 1.5 }}
    >
      <div className="typewriter-text">{text}<span className="cursor-blink">|</span></div>
    </motion.div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function CinematicBirthday() {
  const [step, setStep] = useState(0);
  const [passwordInput, setPasswordInput] = useState("");
  const [hint, setHint] = useState("");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [bgPulse, setBgPulse] = useState(0);
  const [timeTogether, setTimeTogether] = useState({ days: 0, hours: 0, minutes: 0 });
  const [showSurprise, setShowSurprise] = useState(false);
  const [showIdleMessage, setShowIdleMessage] = useState(false);
  const [heartExplosion, setHeartExplosion] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    if (step !== 2) return;
    let timeout;
    const resetIdle = () => {
      setShowIdleMessage(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowIdleMessage(true), 15000);
    };
    window.addEventListener("mousemove", resetIdle);
    resetIdle();
    return () => {
      window.removeEventListener("mousemove", resetIdle);
      clearTimeout(timeout);
    };
  }, [step]);

  useEffect(() => {
    const annDate = new Date(CONTENT_CONFIG.anniversaryDate);
    const calculateTime = () => {
      const now = new Date();
      const difference = now.getTime() - annDate.getTime();
      setTimeTogether({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60)
      });
    };
    calculateTime();
    const t = setInterval(calculateTime, 60000);
    return () => clearInterval(t);
  }, []);

  const handleWaxTarget = () => {
    document.getElementById("passInput")?.focus();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput.toLowerCase() === CONTENT_CONFIG.password) {
      setHint("");
      setEnvelopeOpen(true);
      setTimeout(() => setStep(1), 3000);
    } else {
      setHint("Hint: The most special girl in the world.");
      setPasswordInput("");
    }
  };

  const scrollToNext = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerSurprise = async () => {
    setShowSurprise(true);
    await controls.start({ x: [0, -10, 10, -5, 5, 0], transition: { duration: 0.5 } });
  };

  return (
    <motion.div
      className="bday-container"
      animate={controls}
      style={{ backgroundColor: showSurprise ? "#0a0005" : "#000" }}
    >
      <CustomCursor />
      {step === 2 && <ParticleSwarm />}

      <div
        className="ambient-bg"
        style={{
          opacity: 0.3 + (bgPulse * 0.5),
          transition: 'opacity 0.2s',
          background: showSurprise ? 'radial-gradient(circle at center, rgba(255, 77, 109, 0.15) 0%, rgba(0,0,0,1) 80%)' : undefined
        }}
      />

      {step === 0 && (
        <motion.div
          className="envelope-container"
          animate={{ opacity: envelopeOpen ? 0 : 1, filter: envelopeOpen ? "blur(20px)" : "blur(0px)" }}
          transition={{ duration: 1.5, delay: 1 }}
        >
          <div style={{ marginBottom: '4rem', color: '#fff', fontSize: '1.2rem', fontWeight: 300, letterSpacing: '4px', textAlign: 'center' }}>
            {CONTENT_CONFIG.envelopeHeader}
          </div>

          <div className="envelope-scaler">
            <div className={`envelope-wrapper ${envelopeOpen ? 'envelope-opened' : ''}`}>
              <div className="envelope-flap"></div>
              <div className="envelope-back"></div>
              <div className="envelope-letter" style={{ transform: envelopeOpen ? `translateY(-200px)` : `` }}>
                <h3>{CONTENT_CONFIG.envelopeTitle}</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>{CONTENT_CONFIG.envelopeSubtitle}</p>
              </div>
              <div className="envelope-front-left"></div>
              <div className="envelope-front-right"></div>

              {!envelopeOpen && <div className="wax-seal" onClick={handleWaxTarget} />}

              {!envelopeOpen && (
                <form onSubmit={handlePasswordSubmit} className="password-form">
                  <input id="passInput" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Secret unlock word..." className="password-input" />
                  <div className="password-hint">{hint}</div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {step === 1 && (
        <TypewriterIntro
          lines={CONTENT_CONFIG.typewriterLines}
          onCharType={() => { setBgPulse(1); setTimeout(() => setBgPulse(0), 100); }}
          onComplete={() => { setStep(2); setTimeout(() => scrollToNext('hero'), 100); }}
        />
      )}

      {step === 2 && (
        <>
          <motion.section
            id="hero" className="bday-section"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true, margin: "-10%" }}
          >
            <h1 className="bday-title">{CONTENT_CONFIG.heroTitle}</h1>
            <p className="bday-subtitle">{CONTENT_CONFIG.heroSubtitle}</p>
            <div className="heart-icon" style={{ animation: "heartbeat 1.5s infinite ease-in-out" }}>❤️</div>
            <MagneticButton className="elegant-btn" onClick={() => scrollToNext('message')}>
              {CONTENT_CONFIG.heroButtonText}
            </MagneticButton>
            <div className="scroll-indicator" onClick={() => scrollToNext('message')}>↓</div>
          </motion.section>

          <motion.section
            id="message" className="bday-section"
            initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true, margin: "-20%" }}
          >
            <div className="glass-card">
              <p className="bday-subtitle" style={{ color: '#fff', fontSize: '1.15rem', lineHeight: 2.2, whiteSpace: 'pre-wrap' }}>
                {CONTENT_CONFIG.personalMessage}
              </p>
            </div>
            <div className="scroll-indicator" onClick={() => scrollToNext('photos')}>↓</div>
          </motion.section>

          <motion.section
            id="photos" className="bday-section"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="bday-title" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>{CONTENT_CONFIG.memoriesTitle}</h2>
            <p className="bday-subtitle" style={{ marginBottom: '2rem', opacity: 0.5 }}>{CONTENT_CONFIG.memoriesSubtitle}</p>
            <div className="memories-grid">
              {CONTENT_CONFIG.flipCards.map((card, i) => (
                <motion.div
                  className="flip-card" key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.2 }}
                  viewport={{ once: true, margin: "-10%" }}
                  onClick={(e) => { e.currentTarget.classList.toggle('flipped'); }}
                  whileHover={{ scale: 1.05, rotate: Math.random() * 4 - 2 }}
                >
                  <div className="flip-card-inner">
                    <div className="flip-card-front">
                      <img src={card.img} alt={`Memory ${i + 1}`} />
                      <span>{card.caption}</span>
                    </div>
                    <div className="flip-card-back">
                      <p>{card.note}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="scroll-indicator" onClick={() => scrollToNext('counter')}>↓</div>
          </motion.section>

          <motion.section
            id="counter" className="bday-section"
            initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1 }}
            viewport={{ once: true, margin: "-20%" }}
          >
            <div className="glass-card" style={{ padding: '4rem 2rem' }}>
              <h2 className="bday-subtitle" style={{ fontWeight: 300, color: '#fff' }}>We've lived this for:</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', marginTop: '3rem' }}>
                <div className="counter-item"><div className="counter-value">{timeTogether.days}</div><div className="counter-label">Days</div></div>
                <div className="counter-item"><div className="counter-value">{timeTogether.hours}</div><div className="counter-label">Hours</div></div>
                <div className="counter-item"><div className="counter-value">{timeTogether.minutes}</div><div className="counter-label">Mins</div></div>
              </div>
              <p style={{ marginTop: '3rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>And somehow… it still feels like it just started.</p>
            </div>
            <div className="scroll-indicator" onClick={() => scrollToNext('surprise')}>↓</div>
          </motion.section>

          <motion.section
            id="surprise" className="bday-section"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {!showSurprise ? (
              <MagneticButton className="elegant-btn" onClick={triggerSurprise}>
                {CONTENT_CONFIG.surpriseButton}
              </MagneticButton>
            ) : (
              <motion.div
                className="glass-card"
                style={{ border: '1px solid rgba(255, 77, 109, 0.4)' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, type: "spring" }}
              >
                <h2 className="bday-title">{CONTENT_CONFIG.surpriseHeadline}</h2>
                <p className="bday-subtitle" style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>{CONTENT_CONFIG.surpriseMessage}</p>

                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                  {[...Array(40)].map((_, i) => (
                    <motion.div
                      key={i}
                      style={{ position: 'absolute', width: '8px', height: '8px', background: ['#ff4d6d', '#fff', '#f06292'][i % 3], borderRadius: '50%' }}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{ x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000, opacity: 0, rotate: Math.random() * 360 }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            {showSurprise && <div className="scroll-indicator" onClick={() => scrollToNext('final')}>↓</div>}
          </motion.section>

          <motion.section
            id="final" className="bday-section"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 2 }}
          >
            <h2 className="bday-title">{CONTENT_CONFIG.finalHeadline}</h2>
            <p className="bday-subtitle" style={{ whiteSpace: 'pre-wrap', color: '#fff' }}>{CONTENT_CONFIG.finalSubtitle}</p>

            <div className="dual-btn-container">
              <MagneticButton className="elegant-btn" onClick={() => setHeartExplosion(true)}>Haan ❤️</MagneticButton>
              <MagneticButton className="elegant-btn" onClick={() => setHeartExplosion(true)} style={{ background: 'rgba(255, 77, 109, 0.2)' }}>Obviously Haan</MagneticButton>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  style={{ position: 'absolute', bottom: '-10%', left: `${Math.random() * 100}%`, fontSize: `${Math.random() * 2 + 1}rem`, opacity: 0.3 }}
                  animate={{ y: ['0vh', '-120vh'], rotate: [0, Math.random() * 360] }}
                  transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
                >
                  ❤️
                </motion.div>
              ))}

              {/* Massive Interactive Heart Explosion for "Obviously Yes" click */}
              {heartExplosion && [...Array(30)].map((_, i) => (
                <motion.div
                  key={`burst-${i}`}
                  style={{ position: 'absolute', left: '50%', top: '80%', fontSize: `${Math.random() * 3 + 1}rem` }}
                  initial={{ x: '-50%', y: '-50%', opacity: 1, scale: 0 }}
                  animate={{
                    x: `calc(-50% + ${(Math.random() - 0.5) * 1000}px)`,
                    y: `calc(-50% + ${(Math.random() - 1) * 800}px)`,
                    opacity: 0,
                    scale: Math.random() * 2 + 1,
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: Math.random() * 1.5 + 1.5, type: "spring" }}
                >
                  💝
                </motion.div>
              ))}
            </div>

            <motion.div
              style={{ position: 'absolute', bottom: '20px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}
              animate={{ opacity: showIdleMessage ? 1 : 0 }}
              transition={{ duration: 2 }}
            >
              "I meant every word."
            </motion.div>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
