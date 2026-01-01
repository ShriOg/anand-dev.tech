/**
 * ANAND DEV OS  Main JavaScript
 * Scroll detection, navbar, particles, reveals, interactions
 */

(function() {
  'use strict';

  // 
  // NAVIGATION
  // 
  const nav = document.querySelector('.nav');
  const navToggle = document.querySelector('.nav__toggle');
  const navLinks = document.querySelector('.nav__links');
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateNav() {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
      nav?.classList.add('nav--scrolled');
    } else {
      nav?.classList.remove('nav--scrolled');
    }
    
    if (currentScrollY > lastScrollY && currentScrollY > 200) {
      nav?.classList.add('nav--hidden');
    } else {
      nav?.classList.remove('nav--hidden');
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  // Only enable hamburger menu toggle on non-mobile (mobile.js handles mobile nav via bottom sheet)
  const isMobileDevice = () => window.innerWidth <= 768;
  
  navToggle?.addEventListener('click', function() {
    if (isMobileDevice()) return; // mobile.js handles mobile navigation
    this.classList.toggle('nav__toggle--active');
    navLinks?.classList.toggle('nav__links--open');
  });

  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      if (isMobileDevice()) return;
      navToggle?.classList.remove('nav__toggle--active');
      navLinks?.classList.remove('nav__links--open');
    });
  });

  // 
  // SCROLL REVEAL
  // 
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // 
  // PARTICLE SYSTEM
  // 
  class ParticleSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: null, y: null, radius: 150 };
      this.animationId = null;
      this.resizeTimeout = null;
      
      this.init();
      this.bindEvents();
      this.animate();
    }

    init() {
      this.resize();
      this.createParticles();
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    createParticles() {
      this.particles = [];
      const area = this.canvas.width * this.canvas.height;
      const count = Math.min(Math.floor(area / 15000), 100);
      
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          baseRadius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.1
        });
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.resize();
          this.createParticles();
        }, 250);
      });

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }

    update() {
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

        if (this.mouse.x !== null && this.mouse.y !== null) {
          const dx = p.x - this.mouse.x;
          const dy = p.y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.mouse.radius) {
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            p.x += dx * force * 0.02;
            p.y += dy * force * 0.02;
            p.radius = p.baseRadius * (1 + force * 0.5);
          } else {
            p.radius += (p.baseRadius - p.radius) * 0.1;
          }
        }
      });
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
        this.ctx.fill();
      });

      this.particles.forEach((p1, i) => {
        this.particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.15;
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        });
      });
    }

    animate() {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
      cancelAnimationFrame(this.animationId);
    }
  }

  const particlesCanvas = document.getElementById('particles-canvas');
  if (particlesCanvas) {
    new ParticleSystem(particlesCanvas);
  }

  // 
  // DEV OS TABS
  // 
  const tabs = document.querySelectorAll('.dev-os__tab');
  const tabContents = document.querySelectorAll('.dev-os__content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('dev-os__tab--active'));
      tabContents.forEach(c => c.classList.remove('dev-os__content--active'));
      
      tab.classList.add('dev-os__tab--active');
      document.getElementById(target)?.classList.add('dev-os__content--active');
    });
  });

  // 
  // TOGGLE SWITCHES
  // 
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      this.classList.toggle('toggle--active');
      const event = new CustomEvent('toggle-change', {
        detail: { active: this.classList.contains('toggle--active') }
      });
      this.dispatchEvent(event);
    });
  });

  // 
  // RANGE INPUT VALUE DISPLAY
  // 
  document.querySelectorAll('.range-input').forEach(input => {
    const valueDisplay = input.parentElement?.querySelector('.lab-demo__value');
    if (valueDisplay) {
      input.addEventListener('input', function() {
        valueDisplay.textContent = this.value;
      });
    }
  });

  // 
  // PASSWORD GATE (Hidden Page)
  // 
  const passwordForm = document.getElementById('password-form');
  const passwordInput = document.getElementById('password-input');
  const passwordError = document.getElementById('password-error');
  const passwordGate = document.getElementById('password-gate');
  const hiddenContent = document.getElementById('hidden-content');

  if (passwordForm) {
    passwordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const password = passwordInput?.value;
      
      // Simple hash check (in production, use server-side auth)
      if (password === 'Abhilasha') {
        passwordGate?.classList.add('password-gate--hidden');
        hiddenContent?.classList.add('hidden-content--visible');
        sessionStorage.setItem('hidden-auth', 'true');
      } else {
        passwordError?.classList.add('password-form__error--visible');
        passwordInput?.classList.add('password-form__input--error');
        setTimeout(() => {
          passwordError?.classList.remove('password-form__error--visible');
          passwordInput?.classList.remove('password-form__input--error');
        }, 2000);
      }
    });

    // Check session storage
    if (sessionStorage.getItem('hidden-auth') === 'true') {
      passwordGate?.classList.add('password-gate--hidden');
      hiddenContent?.classList.add('hidden-content--visible');
    }
  }

  // 
  // LAB EXPERIMENTS
  // 
  class LabParticleSystem {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = {
        particleCount: options.particleCount || 80,
        connectionDistance: options.connectionDistance || 100,
        particleSpeed: options.particleSpeed || 1,
        mouseRadius: options.mouseRadius || 120,
        particleSize: options.particleSize || 2,
        showConnections: options.showConnections !== false,
        colorHue: options.colorHue || 220
      };
      this.particles = [];
      this.mouse = { x: null, y: null };
      this.animationId = null;
      
      this.init();
    }

    init() {
      this.resize();
      this.createParticles();
      this.bindEvents();
      this.animate();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    createParticles() {
      this.particles = [];
      for (let i = 0; i < this.options.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * this.options.particleSpeed,
          vy: (Math.random() - 0.5) * this.options.particleSpeed,
          radius: Math.random() * this.options.particleSize + 1
        });
      }
    }

    bindEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }

    update() {
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

        if (this.mouse.x !== null) {
          const dx = p.x - this.mouse.x;
          const dy = p.y - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < this.options.mouseRadius) {
            const force = (this.options.mouseRadius - dist) / this.options.mouseRadius;
            p.x += dx * force * 0.03;
            p.y += dy * force * 0.03;
          }
        }
      });
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const hue = this.options.colorHue;

      this.particles.forEach(p => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
        this.ctx.fill();
      });

      if (this.options.showConnections) {
        this.particles.forEach((p1, i) => {
          this.particles.slice(i + 1).forEach(p2 => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.options.connectionDistance) {
              const opacity = (1 - dist / this.options.connectionDistance) * 0.3;
              this.ctx.beginPath();
              this.ctx.moveTo(p1.x, p1.y);
              this.ctx.lineTo(p2.x, p2.y);
              this.ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
              this.ctx.lineWidth = 0.5;
              this.ctx.stroke();
            }
          });
        });
      }
    }

    animate() {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateOption(key, value) {
      this.options[key] = value;
      if (key === 'particleCount') {
        this.createParticles();
      }
    }

    destroy() {
      cancelAnimationFrame(this.animationId);
    }
  }

  // Initialize lab canvas if exists
  const labCanvas = document.getElementById('lab-canvas');
  let labSystem = null;
  
  if (labCanvas) {
    labSystem = new LabParticleSystem(labCanvas);

    // Bind controls
    const particleCountSlider = document.getElementById('particle-count');
    const connectionDistSlider = document.getElementById('connection-dist');
    const particleSpeedSlider = document.getElementById('particle-speed');
    const showConnectionsToggle = document.getElementById('show-connections');

    particleCountSlider?.addEventListener('input', function() {
      labSystem.updateOption('particleCount', parseInt(this.value));
      document.getElementById('particle-count-value').textContent = this.value;
    });

    connectionDistSlider?.addEventListener('input', function() {
      labSystem.updateOption('connectionDistance', parseInt(this.value));
      document.getElementById('connection-dist-value').textContent = this.value;
    });

    particleSpeedSlider?.addEventListener('input', function() {
      labSystem.updateOption('particleSpeed', parseFloat(this.value));
      document.getElementById('particle-speed-value').textContent = this.value;
    });

    showConnectionsToggle?.addEventListener('click', function() {
      const active = this.classList.contains('toggle--active');
      labSystem.updateOption('showConnections', active);
    });
  }

  // 
  // WAVE SIMULATION
  // 
  class WaveSimulation {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.waves = [];
      this.animationId = null;
      this.options = {
        waveCount: 3,
        amplitude: 30,
        frequency: 0.02,
        speed: 0.02
      };
      this.time = 0;
      
      this.init();
    }

    init() {
      this.resize();
      this.bindEvents();
      this.animate();
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      const centerY = this.canvas.height / 2;
      const colors = ['rgba(59, 130, 246, 0.3)', 'rgba(96, 165, 250, 0.2)', 'rgba(147, 197, 253, 0.15)'];
      
      for (let w = 0; w < this.options.waveCount; w++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        
        for (let x = 0; x <= this.canvas.width; x += 2) {
          const y = centerY + 
            Math.sin(x * this.options.frequency + this.time + w * 0.5) * this.options.amplitude * (1 - w * 0.2) +
            Math.sin(x * this.options.frequency * 0.5 + this.time * 0.7 + w) * this.options.amplitude * 0.5;
          this.ctx.lineTo(x, y);
        }
        
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fillStyle = colors[w];
        this.ctx.fill();
      }
      
      this.time += this.options.speed;
    }

    animate() {
      this.draw();
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateOption(key, value) {
      this.options[key] = value;
    }

    destroy() {
      cancelAnimationFrame(this.animationId);
    }
  }

  const waveCanvas = document.getElementById('wave-canvas');
  let waveSystem = null;
  
  if (waveCanvas) {
    waveSystem = new WaveSimulation(waveCanvas);

    const waveAmplitudeSlider = document.getElementById('wave-amplitude');
    const waveFrequencySlider = document.getElementById('wave-frequency');
    const waveSpeedSlider = document.getElementById('wave-speed');

    waveAmplitudeSlider?.addEventListener('input', function() {
      waveSystem.updateOption('amplitude', parseInt(this.value));
      document.getElementById('wave-amplitude-value').textContent = this.value;
    });

    waveFrequencySlider?.addEventListener('input', function() {
      waveSystem.updateOption('frequency', parseFloat(this.value));
      document.getElementById('wave-frequency-value').textContent = this.value;
    });

    waveSpeedSlider?.addEventListener('input', function() {
      waveSystem.updateOption('speed', parseFloat(this.value));
      document.getElementById('wave-speed-value').textContent = this.value;
    });
  }

  // 
  // PROJECT PREVIEW CANVASES
  // 
  function initProjectPreview(canvas, type) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    let animationId;
    let time = 0;

    function drawPattern() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (type === 'particles') {
        for (let i = 0; i < 20; i++) {
          const x = (Math.sin(time * 0.5 + i * 0.5) + 1) * canvas.width * 0.4 + canvas.width * 0.1;
          const y = (Math.cos(time * 0.3 + i * 0.7) + 1) * canvas.height * 0.4 + canvas.height * 0.1;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + Math.sin(time + i) * 0.2})`;
          ctx.fill();
        }
      } else if (type === 'waves') {
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height / 2 + Math.sin(x * 0.02 + time) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (type === 'grid') {
        const gridSize = 30;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        const pulseX = (Math.sin(time) + 1) * canvas.width * 0.4 + canvas.width * 0.1;
        const pulseY = (Math.cos(time * 0.7) + 1) * canvas.height * 0.4 + canvas.height * 0.1;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 8 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.fill();
      }
      
      time += 0.02;
      animationId = requestAnimationFrame(drawPattern);
    }

    drawPattern();
  }

  document.querySelectorAll('[data-preview]').forEach(canvas => {
    initProjectPreview(canvas, canvas.dataset.preview);
  });

  // 
  // SMOOTH ANCHOR SCROLL
  // 
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 
  // ACTIVE NAV LINK
  // 
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CARD FOCUS SYSTEM
  // Shared interaction module for Projects & Lab pages
  // Handles: hover, click, URL hash, keyboard nav, mobile gestures
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  class CardFocusSystem {
    constructor(options = {}) {
      this.options = {
        cardSelector: '.focus-card',
        containerSelector: '.focus-cards-grid',
        overlayId: 'focus-overlay',
        backdropId: 'focus-overlay-backdrop',
        hashPrefix: options.hashPrefix || 'card',
        onOpen: options.onOpen || null,
        onClose: options.onClose || null,
        ...options
      };

      this.cards = [];
      this.currentCardIndex = -1;
      this.isOpen = false;
      this.scrollPosition = 0;
      this.touchStartY = 0;
      this.touchStartX = 0;
      this.touchCurrentY = 0;
      this.touchCurrentX = 0;
      this.isDragging = false;

      this.init();
    }

    init() {
      this.cards = Array.from(document.querySelectorAll(this.options.cardSelector));
      
      if (this.cards.length === 0) return;

      this.createOverlay();
      this.bindCardEvents();
      this.bindKeyboardEvents();
      this.bindHashChange();
      this.checkInitialHash();
    }

    createOverlay() {
      // Create backdrop
      if (!document.getElementById(this.options.backdropId)) {
        const backdrop = document.createElement('div');
        backdrop.id = this.options.backdropId;
        backdrop.className = 'focus-overlay-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
        
        backdrop.addEventListener('click', () => this.close());
      }

      // Create overlay container
      if (!document.getElementById(this.options.overlayId)) {
        const overlay = document.createElement('div');
        overlay.id = this.options.overlayId;
        overlay.className = 'focus-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        
        overlay.innerHTML = `
          <div class="focus-overlay__panel" role="document">
            <button class="focus-overlay__close" aria-label="Close overlay" type="button">
              <span aria-hidden="true">×</span>
            </button>
            <div class="focus-overlay__content"></div>
          </div>
        `;
        
        document.body.appendChild(overlay);

        // Bind close button
        overlay.querySelector('.focus-overlay__close').addEventListener('click', () => this.close());
        
        // Bind mobile gestures
        this.bindMobileGestures(overlay.querySelector('.focus-overlay__panel'));
      }

      this.backdrop = document.getElementById(this.options.backdropId);
      this.overlay = document.getElementById(this.options.overlayId);
      this.panel = this.overlay.querySelector('.focus-overlay__panel');
      this.content = this.overlay.querySelector('.focus-overlay__content');
    }

    bindCardEvents() {
      this.cards.forEach((card, index) => {
        // Set accessibility attributes
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-expanded', 'false');
        
        // Click handler
        card.addEventListener('click', (e) => {
          // Don't open card if clicking action buttons
          if (e.target.closest('.action-btn')) {
            return; // Let the link/button handle itself
          }
          e.preventDefault();
          this.open(index);
        });

        // Keyboard activation
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            // Don't open card if focusing action buttons
            if (e.target.closest('.action-btn')) {
              return;
            }
            e.preventDefault();
            this.open(index);
          }
        });
      });
    }

    bindKeyboardEvents() {
      document.addEventListener('keydown', (e) => {
        if (!this.isOpen) return;

        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            this.close();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            this.navigatePrev();
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            this.navigateNext();
            break;
          case 'Tab':
            this.trapFocus(e);
            break;
        }
      });
    }

    bindHashChange() {
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (!hash) {
          if (this.isOpen) this.close(false);
          return;
        }
        
        const cardIndex = this.findCardIndexByHash(hash);
        if (cardIndex !== -1 && cardIndex !== this.currentCardIndex) {
          this.open(cardIndex, false);
        }
      });
    }

    checkInitialHash() {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const cardIndex = this.findCardIndexByHash(hash);
        if (cardIndex !== -1) {
          // Small delay to ensure DOM is ready
          requestAnimationFrame(() => {
            this.open(cardIndex, false);
          });
        }
      }
    }

    findCardIndexByHash(hash) {
      return this.cards.findIndex(card => {
        const cardId = card.dataset.focusId || card.id;
        return cardId === hash || `${this.options.hashPrefix}-${cardId}` === hash;
      });
    }

    getCardHash(card) {
      return card.dataset.focusId || card.id || `${this.options.hashPrefix}-${this.cards.indexOf(card)}`;
    }

    bindMobileGestures(panel) {
      let startTime = 0;
      const SWIPE_THRESHOLD = 80;
      const VELOCITY_THRESHOLD = 0.3;

      panel.addEventListener('touchstart', (e) => {
        this.touchStartY = e.touches[0].clientY;
        this.touchStartX = e.touches[0].clientX;
        this.touchCurrentY = this.touchStartY;
        this.touchCurrentX = this.touchStartX;
        startTime = Date.now();
        this.isDragging = false;
      }, { passive: true });

      panel.addEventListener('touchmove', (e) => {
        this.touchCurrentY = e.touches[0].clientY;
        this.touchCurrentX = e.touches[0].clientX;
        
        const deltaY = this.touchCurrentY - this.touchStartY;
        const deltaX = this.touchCurrentX - this.touchStartX;
        
        // Only start dragging if moving predominantly down/right
        if (!this.isDragging && (deltaY > 10 || deltaX > 10)) {
          // Check if at top of scroll
          if (panel.scrollTop <= 0 && (deltaY > Math.abs(deltaX))) {
            this.isDragging = true;
          }
        }
        
        if (this.isDragging) {
          const translateY = Math.max(0, deltaY * 0.5);
          panel.style.transform = `translateY(${translateY}px)`;
          panel.style.transition = 'none';
        }
      }, { passive: true });

      panel.addEventListener('touchend', () => {
        if (!this.isDragging) return;
        
        const deltaY = this.touchCurrentY - this.touchStartY;
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaTime = Date.now() - startTime;
        const velocityY = deltaY / deltaTime;
        const velocityX = deltaX / deltaTime;
        
        // Reset transform
        panel.style.transform = '';
        panel.style.transition = '';
        
        // Check for swipe down or swipe right
        const isSwipeDown = deltaY > SWIPE_THRESHOLD || velocityY > VELOCITY_THRESHOLD;
        const isSwipeRight = deltaX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD;
        
        if (isSwipeDown || isSwipeRight) {
          this.close();
        }
        
        this.isDragging = false;
      }, { passive: true });
    }

    trapFocus(e) {
      const focusableElements = this.panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }

    open(index, updateHash = true) {
      if (index < 0 || index >= this.cards.length) return;
      
      const card = this.cards[index];
      const contentTemplate = card.querySelector('.focus-card__content-template');
      
      if (!contentTemplate) {
        console.warn('Card missing content template:', card);
        return;
      }

      // Store scroll position and lock body
      this.scrollPosition = window.scrollY;
      document.body.classList.add('focus-overlay-open');
      document.body.style.top = `-${this.scrollPosition}px`;

      // Update current index
      this.currentCardIndex = index;
      this.isOpen = true;

      // Update card accessibility
      this.cards.forEach((c, i) => {
        c.setAttribute('aria-expanded', i === index ? 'true' : 'false');
      });

      // Populate overlay content
      this.content.innerHTML = contentTemplate.innerHTML;

      // Show overlay
      this.backdrop.classList.add('focus-overlay-backdrop--active');
      this.overlay.classList.add('focus-overlay--active');
      this.overlay.setAttribute('aria-hidden', 'false');
      this.backdrop.setAttribute('aria-hidden', 'false');

      // Update URL hash
      if (updateHash) {
        const hash = this.getCardHash(card);
        history.pushState(null, '', `#${hash}`);
      }

      // Focus management
      setTimeout(() => {
        const closeBtn = this.overlay.querySelector('.focus-overlay__close');
        closeBtn?.focus();
      }, 100);

      // Callback
      if (this.options.onOpen) {
        this.options.onOpen(card, index);
      }
    }

    close(updateHash = true) {
      if (!this.isOpen) return;

      // Hide overlay
      this.backdrop.classList.remove('focus-overlay-backdrop--active');
      this.overlay.classList.remove('focus-overlay--active');
      this.overlay.setAttribute('aria-hidden', 'true');
      this.backdrop.setAttribute('aria-hidden', 'true');

      // Update card accessibility
      this.cards.forEach(c => {
        c.setAttribute('aria-expanded', 'false');
      });

      // Restore scroll position
      document.body.classList.remove('focus-overlay-open');
      document.body.style.top = '';
      window.scrollTo(0, this.scrollPosition);

      // Clear hash
      if (updateHash && window.location.hash) {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }

      // Return focus to card
      if (this.currentCardIndex >= 0 && this.cards[this.currentCardIndex]) {
        this.cards[this.currentCardIndex].focus();
      }

      // Callback
      if (this.options.onClose) {
        this.options.onClose(this.cards[this.currentCardIndex], this.currentCardIndex);
      }

      // Clear content after animation
      setTimeout(() => {
        this.content.innerHTML = '';
      }, 400);

      this.isOpen = false;
    }

    navigateNext() {
      if (this.currentCardIndex < this.cards.length - 1) {
        this.open(this.currentCardIndex + 1);
      }
    }

    navigatePrev() {
      if (this.currentCardIndex > 0) {
        this.open(this.currentCardIndex - 1);
      }
    }

    destroy() {
      this.close();
      this.backdrop?.remove();
      this.overlay?.remove();
      this.cards.forEach(card => {
        card.removeAttribute('role');
        card.removeAttribute('tabindex');
        card.removeAttribute('aria-expanded');
      });
    }
  }

  // Initialize Card Focus System if cards exist
  const focusCards = document.querySelectorAll('.focus-card');
  if (focusCards.length > 0) {
    // Determine hash prefix based on page
    const isLabPage = window.location.pathname.includes('lab');
    const hashPrefix = isLabPage ? 'lab' : 'project';
    
    window.cardFocusSystem = new CardFocusSystem({
      hashPrefix: hashPrefix
    });
  }

})();
