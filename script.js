(function() {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (reducedMotion) {
    document.querySelectorAll('.project-card, .project-item, .case-study-image, .case-study-section, .about-section, .case-study-back, .case-study-repo, .hero__accent, [data-reveal]').forEach(function(el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('is-visible');
    });
    document.querySelectorAll('.case-study-section[data-narrative="problem"] .case-study-section__content p').forEach(function(p) {
      p.style.opacity = '1';
      p.style.transform = 'none';
    });
  }

  var navbar = document.getElementById('navbar');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  
  var lastScrollY = window.scrollY;
  var ticking = false;
  var scrollTimeout = null;

  function updateNavbar() {
    var currentScrollY = window.scrollY;
    
    if (currentScrollY > 50) {
      navbar.classList.add('nav--scrolled');
    } else {
      navbar.classList.remove('nav--scrolled');
    }
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        navbar.classList.add('nav--hidden');
      } else {
        navbar.classList.remove('nav--hidden');
      }
      lastScrollY = currentScrollY;
    }, 120);
    
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      navToggle.classList.toggle('nav__toggle--active');
      navLinks.classList.toggle('nav__links--open');
    });
  }

  if (reducedMotion) return;

  var narrativeDelays = {
    'problem': 0,
    'solution': 0,
    'visual': 100,
    'implementation': 0,
    'outcome': 0,
    'tech': 0
  };

  var revealElements = document.querySelectorAll('.project-card, .project-item, .case-study-image, .case-study-section, .about-section, .case-study-back, .case-study-repo, [data-reveal]');
  
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var narrative = el.dataset.narrative;
        var delay = narrative && narrativeDelays[narrative] ? narrativeDelays[narrative] : 0;
        
        setTimeout(function() {
          el.classList.add('is-visible');
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, delay);
        
        revealObserver.unobserve(el);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(function(el) {
    var parent = el.parentElement;
    var isNarrativeSection = el.classList.contains('case-study-section') && el.dataset.narrative;
    
    if (isNarrativeSection) {
      var article = el.closest('.case-study-narrative');
      if (article) {
        var sections = Array.from(article.querySelectorAll('.case-study-section[data-narrative]'));
        var idx = sections.indexOf(el);
        if (idx > 0) {
          el.style.transitionDelay = (idx * 80) + 'ms';
        }
      }
    } else if (!el.classList.contains('case-study-back')) {
      var siblings = parent ? Array.from(parent.children).filter(function(child) {
        return child.classList.contains('project-card') || 
               child.classList.contains('project-item') || 
               child.classList.contains('about-section');
      }) : [];
      
      var siblingIndex = siblings.indexOf(el);
      if (siblingIndex > 0) {
        el.style.transitionDelay = (siblingIndex * 80) + 'ms';
      }
    }
    
    revealObserver.observe(el);
  });

  // Particle Background System
  (function initParticles() {
    var canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    
    var ctx = canvas.getContext('2d');
    var particles = [];
    var particleCount = 40;
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var targetMouseX = mouseX;
    var targetMouseY = mouseY;
    
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    function Particle() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 1 + 1;
      this.opacity = Math.random() * 0.15 + 0.1;
      this.isAccent = Math.random() < 0.08;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = (Math.random() - 0.5) * 0.15;
    }
    
    Particle.prototype.update = function() {
      this.baseX += this.vx;
      this.baseY += this.vy;
      
      if (this.baseX < 0 || this.baseX > canvas.width) this.vx *= -1;
      if (this.baseY < 0 || this.baseY > canvas.height) this.vy *= -1;
      
      var dx = mouseX - canvas.width / 2;
      var dy = mouseY - canvas.height / 2;
      var offsetX = dx * 0.008;
      var offsetY = dy * 0.008;
      
      this.x += (this.baseX + offsetX - this.x) * 0.03;
      this.y += (this.baseY + offsetY - this.y) * 0.03;
    };
    
    Particle.prototype.draw = function() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      if (this.isAccent) {
        ctx.fillStyle = 'rgba(59, 130, 246, ' + this.opacity + ')';
      } else {
        ctx.fillStyle = 'rgba(113, 113, 122, ' + this.opacity + ')';
      }
      ctx.fill();
    };
    
    for (var i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    
    var throttleTimer = null;
    document.addEventListener('mousemove', function(e) {
      if (throttleTimer) return;
      throttleTimer = setTimeout(function() {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
        throttleTimer = null;
      }, 16);
    }, { passive: true });
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      
      for (var i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
  })();
})();
