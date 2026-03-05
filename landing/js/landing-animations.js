// ============================================================================
// MenuNova Premium Landing Page - Animations & Interactions
// ============================================================================

// 1. PARTICLE BACKGROUND ANIMATION
// ============================================================================

class ParticleCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    createParticles() {
        this.particles = [];
        const count = Math.min(50, Math.floor(this.canvas.width / 20));
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let particle of this.particles) {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            this.ctx.fillStyle = `rgba(255, 190, 88, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particles on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ParticleCanvas('particles-canvas');
    });
} else {
    new ParticleCanvas('particles-canvas');
}

// ============================================================================
// 2. SCROLL-TRIGGERED FADE-IN ANIMATIONS
// ============================================================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px',
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.fade-in, .fade-in-down, .fade-in-up, .fade-in-scroll').forEach((el) => {
    // Add scroll observer class for elements not already animated
    if (!el.classList.contains('fade-in') && !el.classList.contains('fade-in-down') && !el.classList.contains('fade-in-up')) {
        el.classList.add('fade-in-scroll');
    }
});

// Observe sections for scroll animations
document.querySelectorAll('section').forEach((section) => {
    section.addEventListener('mouseenter', () => {
        section.querySelectorAll('.fade-in-scroll').forEach((el) => {
            observer.observe(el);
        });
    });
});

// Initial observation
document.querySelectorAll('.fade-in-scroll').forEach((el) => {
    observer.observe(el);
});

// ============================================================================
// 3. ANIMATED COUNTERS
// ============================================================================

function animateCounter(element, target, duration = 2000) {
    const start = Date.now();
    const initialValue = parseInt(element.textContent) || 0;
    
    const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.floor(initialValue + (target - initialValue) * progress);
        element.textContent = value;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// Trigger counters when section comes into view
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.hasAttribute('data-counted')) {
            const stats = entry.target.querySelectorAll('.stat-number, .header-value');
            
            stats.forEach((stat) => {
                const text = stat.textContent.trim();
                const number = parseInt(text);
                
                if (!isNaN(number)) {
                    animateCounter(stat, number);
                }
            });
            
            entry.target.setAttribute('data-counted', 'true');
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

// Observe dashboard and stats sections
document.querySelectorAll('.dashboard-mockup').forEach((el) => {
    counterObserver.observe(el);
});

// ============================================================================
// 4. INTERACTIVE DEMO TABS
// ============================================================================

const demoCTabs = document.querySelectorAll('.demo-tab');
const demoFrames = document.querySelectorAll('.demo-frame');

demoCTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs
        demoCTabs.forEach((t) => t.classList.remove('active'));
        
        // Hide all frames
        demoFrames.forEach((frame) => frame.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Show corresponding frame
        const targetFrame = document.getElementById(`${tabName}-frame`);
        if (targetFrame) {
            targetFrame.classList.add('active');
        }
    });
});

// ============================================================================
// 5. SMOOTH SCROLL BEHAVIOR FOR ANCHOR LINKS
// ============================================================================

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href !== '#') {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// ============================================================================
// 6. STAGGERED ANIMATIONS FOR GRIDS
// ============================================================================

function staggerAnimation(containerSelector, itemSelector, delay = 100) {
    const containers = document.querySelectorAll(containerSelector);
    
    containers.forEach((container) => {
        const items = container.querySelectorAll(itemSelector);
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.animation = `slideInLeft 0.8s cubic-bezier(0.22, 1, 0.36, 1) both`;
            item.style.animationDelay = `${index * (delay / 1000)}s`;
        });
    });
}

// Apply stagger to grids
staggerAnimation('.problem-grid', '.problem-card', 100);
staggerAnimation('.analytics-grid', '.analytics-card', 100);
staggerAnimation('.features-grid', '.feature-card', 100);

// ============================================================================
// 7. HOVER EFFECTS FOR CARDS
// ============================================================================

document.querySelectorAll('.problem-card, .analytics-card, .feature-card').forEach((card) => {
    const originalGradient = window.getComputedStyle(card).background;
    
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
    });
});

// ============================================================================
// 8. ANIMATED BACKGROUND GRADIENT
// ============================================================================

function animateBackgroundGradient() {
    const body = document.body;
    let hue = 0;
    
    setInterval(() => {
        hue = (hue + 0.05) % 360;
        // Optional: uncomment to add subtle color shift
        // body.style.filter = `hue-rotate(${hue}deg)`;
    }, 100);
}

// animateBackgroundGradient(); // Uncomment to enable

// ============================================================================
// 9. LAZY LOAD OPTIMIZATION
// ============================================================================

if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imgObserver.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach((img) => {
        imgObserver.observe(img);
    });
}

// ============================================================================
// 10. MOBILE RESPONSIVE ADJUSTMENTS
// ============================================================================

function adjustForMobile() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Reduce particle count on mobile
        const canvas = document.getElementById('particles-canvas');
        if (canvas) {
            const particleInstance = window.particleCanvas;
            if (particleInstance) {
                particleInstance.particles = particleInstance.particles.slice(0, 20);
            }
        }
    }
}

window.addEventListener('resize', adjustForMobile);
adjustForMobile();

// ============================================================================
// 11. PERFORMANCE: REDUCE ANIMATIONS ON SCROLL
// ============================================================================

let isScrolling = false;

window.addEventListener('scroll', () => {
    if (!isScrolling) {
        isScrolling = true;
        document.body.style.pointerEvents = 'none';
        
        setTimeout(() => {
            isScrolling = false;
            document.body.style.pointerEvents = 'auto';
        }, 100);
    }
}, { passive: true });

// ============================================================================
// 12. PRELOAD CRITICAL RESOURCES
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Prefetch demo page
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/demo';
    document.head.appendChild(link);
});

// ============================================================================
// 13. KEYBOARD NAVIGATION SUPPORT
// ============================================================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
        window.scrollBy({ top: 100, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
        window.scrollBy({ top: -100, behavior: 'smooth' });
    }
});

// ============================================================================
// 14. ACCESSIBILITY: RESPECT PREFERS-REDUCED-MOTION
// ============================================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    document.documentElement.style.scrollBehavior = 'auto';
    
    document.querySelectorAll('[class*="fade"], [class*="slide"], [class*="float"]').forEach((el) => {
        el.style.animation = 'none';
        el.style.transition = 'none';
    });
}

console.log('🍽️ MenuNova Landing Page - Animations Initialized');
