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

  // Ambient Line Background System
  (function initLines() {
    var canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    
    var ctx = canvas.getContext('2d');
    var lines = [];
    var maxLines = 22;
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var targetMouseX = mouseX;
    var targetMouseY = mouseY;
    var scrollY = 0;
    var targetScrollY = 0;
    
    // Circle focal point (right side of viewport)
    var circleX = window.innerWidth * 0.85;
    var circleY = window.innerHeight * 0.35;
    
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      circleX = window.innerWidth * 0.85;
      circleY = window.innerHeight * 0.35;
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    var isMobile = window.innerWidth < 768;
    var mobileMaxLines = 12;
    var actualMaxLines = isMobile ? mobileMaxLines : maxLines;
    
    function Line() {
      this.reset();
      this.opacity = this.targetOpacity * 0.3;
      this.life = Math.random() * 12000 + 8000;
      this.born = Date.now();
    }
    
    Line.prototype.reset = function() {
      // Bias position toward right side (circle area)
      var xBias = Math.random() * Math.random();
      this.x = canvas.width * (0.3 + xBias * 0.65);
      this.y = Math.random() * canvas.height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.length = Math.random() * 80 + 50;
      
      // Calculate angle pointing toward circle with some randomness
      var toCircleX = circleX - this.x;
      var toCircleY = circleY - this.y;
      var toCircleAngle = Math.atan2(toCircleY, toCircleX);
      var randomOffset = (Math.random() - 0.5) * Math.PI * 0.8;
      this.angle = toCircleAngle + randomOffset;
      
      this.thickness = Math.random() * 0.8 + 0.6;
      this.isAccent = Math.random() < 0.1;
      
      // Lower opacity for lines on left side (text area)
      var leftFade = this.x < canvas.width * 0.4 ? 0.5 : 1;
      this.targetOpacity = (Math.random() * 0.18 + 0.12) * leftFade;
      
      this.life = Math.random() * 12000 + 8000;
      this.born = Date.now();
      this.parallaxFactor = Math.random() * 0.3 + 0.1;
    };
    
    Line.prototype.update = function() {
      var age = Date.now() - this.born;
      var lifeRatio = age / this.life;
      
      if (lifeRatio < 0.2) {
        this.opacity += (this.targetOpacity - this.opacity) * 0.04;
      } else if (lifeRatio > 0.75) {
        this.opacity *= 0.988;
      }
      
      if (age > this.life) {
        this.reset();
        this.opacity = 0;
      }
      
      var dx = mouseX - canvas.width / 2;
      var dy = mouseY - canvas.height / 2;
      var offsetX = dx * 0.005;
      var offsetY = dy * 0.005;
      
      // Parallax scroll offset (lines move slower than content)
      var scrollOffset = scrollY * this.parallaxFactor;
      
      this.x += (this.baseX + offsetX - this.x) * 0.02;
      this.y += (this.baseY + offsetY + scrollOffset - this.y) * 0.02;
    };
    
    Line.prototype.draw = function() {
      if (this.opacity < 0.01) return;
      
      var endX = this.x + Math.cos(this.angle) * this.length;
      var endY = this.y + Math.sin(this.angle) * this.length;
      
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = this.thickness;
      
      if (this.isAccent) {
        ctx.strokeStyle = 'rgba(59, 130, 246, ' + this.opacity + ')';
      } else {
        ctx.strokeStyle = 'rgba(113, 113, 122, ' + this.opacity + ')';
      }
      ctx.stroke();
    };
    
    for (var i = 0; i < actualMaxLines; i++) {
      var line = new Line();
      line.born = Date.now() - Math.random() * 6000;
      lines.push(line);
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
    
    window.addEventListener('scroll', function() {
      targetScrollY = window.scrollY;
    }, { passive: true });
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;
      scrollY += (targetScrollY - scrollY) * 0.08;
      
      for (var i = 0; i < lines.length; i++) {
        lines[i].update();
        lines[i].draw();
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
  })();
})();
