/**
 * Nothing-Inspired Portfolio - JavaScript
 * Minimal, calm, intentional interactions
 */

(function() {
  'use strict';

  // ========================================
  // MINIMAL INTRO ANIMATION
  // Plays only on page reload, not internal navigation
  // ========================================
  function shouldPlayIntro() {
    // Check if this is index.html (home page)
    const isHomePage = window.location.pathname === '/' || 
                       window.location.pathname.endsWith('index.html') ||
                       window.location.pathname.endsWith('/');
    
    if (!isHomePage) return false;
    
    // Check navigation type: reload vs navigate
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navType = navEntries[0].type;
      // 'reload' = browser refresh, 'navigate' = new page load
      // 'back_forward' = browser back/forward
      if (navType === 'reload') return true;
    }
    
    // Check if coming from same site (internal navigation)
    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerHost = new URL(referrer).hostname;
        const currentHost = window.location.hostname;
        // If referrer is same site, skip intro
        if (referrerHost === currentHost) return false;
      } catch (e) {
        // Invalid referrer, treat as new visit
      }
    }
    
    // New visit (no referrer or external referrer) - play intro
    return true;
  }
  
  // Apply intro animation if conditions met
  if (shouldPlayIntro()) {
    document.body.classList.add('intro-active');
    
    // Remove class after animations complete (allow CSS to clean up)
    setTimeout(() => {
      document.body.classList.remove('intro-active');
    }, 1000);
  }

  // ========================================
  // PARTICLE SYSTEM - Subtle & Calm
  // ========================================
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let mouseX = 0;
    let mouseY = 0;

    // Resize canvas
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Particle class
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.targetOpacity = this.opacity;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Subtle mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          this.speedX -= (dx / distance) * force * 0.01;
          this.speedY -= (dy / distance) * force * 0.01;
          this.targetOpacity = 0.6;
        } else {
          this.targetOpacity = Math.random() * 0.5 + 0.1;
        }

        // Smooth opacity transition
        this.opacity += (this.targetOpacity - this.opacity) * 0.02;

        // Boundary check with wrap-around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Dampen speed
        this.speedX *= 0.99;
        this.speedY *= 0.99;

        // Add slight random movement
        this.speedX += (Math.random() - 0.5) * 0.01;
        this.speedY += (Math.random() - 0.5) * 0.01;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107, 138, 253, ${this.opacity * 0.6})`;
        ctx.fill();
      }
    }

    // Initialize particles
    function initParticles() {
      particles = [];
      const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    // Draw connections between nearby particles
    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            const opacity = (1 - distance / 100) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(107, 138, 253, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      drawConnections();
      animationId = requestAnimationFrame(animate);
    }

    // Event listeners
    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!reducedMotion) {
      resizeCanvas();
      initParticles();
      animate();
    }
  }

  // ========================================
  // SCROLL REVEAL ANIMATIONS
  // ========================================
  const revealElements = document.querySelectorAll('.reveal, .stat-card, .skill-card, .project-card-large, .subject-card');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  // ========================================
  // SMART NAVBAR SCROLL BEHAVIOR
  // Hide on scroll down, show on scroll up
  // ========================================
  const navbar = document.getElementById('navbar');
  let lastScrollY = window.scrollY;
  let ticking = false;
  let scrollTimeout = null;
  const scrollThreshold = 10; // Minimum scroll distance to trigger
  const topThreshold = 80; // Always show navbar near top

  function updateNavbar() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    if (navbar) {
      // Always show navbar when near the top of the page
      if (currentScrollY < topThreshold) {
        navbar.classList.remove('navbar--hidden');
        navbar.classList.add('navbar--visible');
      } 
      // Scrolling DOWN - hide navbar (only if scrolled enough)
      else if (scrollDelta > scrollThreshold) {
        navbar.classList.add('navbar--hidden');
        navbar.classList.remove('navbar--visible');
      } 
      // Scrolling UP - show navbar
      else if (scrollDelta < -scrollThreshold) {
        navbar.classList.remove('navbar--hidden');
        navbar.classList.add('navbar--visible');
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  // Debounced scroll handler for better performance
  function onScroll() {
    if (!ticking) {
      // Clear any pending timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        updateNavbar();
        ticking = false;
      });
      
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  
  // Handle touch events for mobile (better touch scroll detection)
  let touchStartY = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (!navbar) return;
    
    const touchY = e.touches[0].clientY;
    const touchDelta = touchStartY - touchY;
    
    // Only respond to significant touch movements
    if (Math.abs(touchDelta) > 20) {
      if (touchDelta > 0 && window.scrollY > topThreshold) {
        // Swiping up (scrolling down content)
        navbar.classList.add('navbar--hidden');
        navbar.classList.remove('navbar--visible');
      } else if (touchDelta < 0) {
        // Swiping down (scrolling up content)
        navbar.classList.remove('navbar--hidden');
        navbar.classList.add('navbar--visible');
      }
      touchStartY = touchY;
    }
  }, { passive: true });

  // ========================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ========================================
  // PROGRESS BAR ANIMATION FOR GRADES
  // ========================================
  const progressBars = document.querySelectorAll('.subject-card__fill');
  
  const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const width = fill.style.width;
        fill.style.width = '0';
        
        setTimeout(() => {
          fill.style.width = width;
        }, 100);
        
        progressObserver.unobserve(fill);
      }
    });
  }, {
    threshold: 0.5
  });

  progressBars.forEach(bar => {
    progressObserver.observe(bar);
  });

  // ========================================
  // FORM VALIDATION (Contact Page)
  // ========================================
  const contactForm = document.querySelector('.contact-form form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      const inputs = this.querySelectorAll('input, textarea');
      let isValid = true;

      inputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#ef4444';
        } else {
          input.style.borderColor = '';
        }
      });

      if (!isValid) {
        e.preventDefault();
      }
    });

    // Reset border color on input
    contactForm.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', function() {
        this.style.borderColor = '';
      });
    });
  }

  // ========================================
  // HOVER EFFECTS ENHANCEMENT
  // ========================================
  const cards = document.querySelectorAll('.stat-card, .skill-card, .project-card-large, .subject-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s ease';
    });
  });

  // ========================================
  // BUTTON INTERACTION ENHANCEMENT
  // ========================================
  const actionButtons = document.querySelectorAll('.btn-action');
  
  actionButtons.forEach(btn => {
    // Add active state for touch devices
    btn.addEventListener('touchstart', function() {
      this.classList.add('is-pressed');
    }, { passive: true });
    
    btn.addEventListener('touchend', function() {
      this.classList.remove('is-pressed');
    }, { passive: true });
  });

  // ========================================
  // DETECT MOBILE DEVICE
  // ========================================
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  
  if (isMobile) {
    document.body.classList.add('is-mobile');
  }

  // ========================================
  // TYPED TEXT EFFECT (Optional)
  // ========================================
  const typedElement = document.querySelector('.hero__subtitle');
  
  if (typedElement && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Already handled by CSS animations
  }

  // ========================================
  // PAGE LOAD ANIMATIONS
  // ========================================
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Ensure navbar is visible on load
    if (navbar) {
      navbar.classList.add('navbar--visible');
    }
    
    // Trigger initial reveals for visible elements
    const visibleReveals = document.querySelectorAll('.reveal');
    visibleReveals.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        el.classList.add('active');
      }
    });
  });

})();
