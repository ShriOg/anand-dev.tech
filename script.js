/**
 * CINEMATIC LANDING PAGE INTERACTIONS
 * Apple-level premium animations and effects
 */

(function() {
    'use strict';
    
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    
    const state = {
        mouseX: 0,
        mouseY: 0,
        targetX: 0,
        targetY: 0,
        isMouseMoving: false,
        isMobile: false,
        rafId: null
    };
    
    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    
    const elements = {
        cursorGlow: null,
        cards: [],
        radialGradient: null
    };
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    function init() {
        // Cache DOM elements
        elements.cursorGlow = document.getElementById('cursorGlow');
        elements.cards = Array.from(document.querySelectorAll('.feature-card'));
        elements.radialGradient = document.querySelector('.radial-gradient');
        
        // Detect mobile
        state.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                         || window.innerWidth < 768;
        
        // Initialize effects
        if (!state.isMobile) {
            initCursorGlow();
            initParallax();
        } else {
            initMobileAmbience();
        }
        
        initCardInteractions();
        initSmoothScroll();
        
        console.log('✨ Cinematic landing page initialized');
    }
    
    // ==========================================
    // CURSOR GLOW EFFECT
    // ==========================================
    
    function initCursorGlow() {
        let mouseMoveTimeout;
        
        // Track mouse position with smooth interpolation
        document.addEventListener('mousemove', (e) => {
            state.targetX = e.clientX;
            state.targetY = e.clientY;
            
            if (!state.isMouseMoving) {
                state.isMouseMoving = true;
                elements.cursorGlow.classList.add('active');
                animateCursorGlow();
            }
            
            // Hide glow after inactivity
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                state.isMouseMoving = false;
                elements.cursorGlow.classList.remove('active');
            }, 1000);
        });
        
        // Initialize position on first load
        state.mouseX = window.innerWidth / 2;
        state.mouseY = window.innerHeight / 2;
    }
    
    function animateCursorGlow() {
        if (!state.isMouseMoving) return;
        
        // Smooth interpolation (lerp) for buttery movement
        const lerp = 0.15;
        state.mouseX += (state.targetX - state.mouseX) * lerp;
        state.mouseY += (state.targetY - state.mouseY) * lerp;
        
        // Update glow position
        elements.cursorGlow.style.transform = `translate(${state.mouseX}px, ${state.mouseY}px)`;
        
        // Continue animation loop
        state.rafId = requestAnimationFrame(animateCursorGlow);
    }
    
    // ==========================================
    // PARALLAX EFFECT
    // ==========================================
    
    function initParallax() {
        document.addEventListener('mousemove', (e) => {
            const mouseXPercent = (e.clientX / window.innerWidth - 0.5) * 2;
            const mouseYPercent = (e.clientY / window.innerHeight - 0.5) * 2;
            
            // Subtle parallax on radial gradient
            if (elements.radialGradient) {
                const moveX = mouseXPercent * 20;
                const moveY = mouseYPercent * 20;
                elements.radialGradient.style.transform = 
                    `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            }
        });
    }
    
    // ==========================================
    // MOBILE AMBIENT EFFECT
    // ==========================================
    
    function initMobileAmbience() {
        // Enhanced ambient animations for mobile (no cursor glow)
        const ambientGlows = document.querySelectorAll('.ambient-glow');
        ambientGlows.forEach((glow, index) => {
            glow.style.animationDuration = `${15 + index * 3}s`;
            glow.style.opacity = '0.4';
        });
    }
    
    // ==========================================
    // CARD INTERACTIONS
    // ==========================================
    
    function initCardInteractions() {
        elements.cards.forEach((card) => {
            // Enhanced hover effect with mouse position
            card.addEventListener('mouseenter', function() {
                this.style.zIndex = '10';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.zIndex = '1';
                this.style.transform = 'translateY(0) scale(1)';
            });
            
            // Dynamic tilt effect on mouse move
            if (!state.isMobile) {
                card.addEventListener('mousemove', function(e) {
                    const rect = this.getBoundingClientRect();
                    const cardCenterX = rect.left + rect.width / 2;
                    const cardCenterY = rect.top + rect.height / 2;
                    
                    const angleX = (e.clientY - cardCenterY) / 30;
                    const angleY = (cardCenterX - e.clientX) / 30;
                    
                    this.style.transform = `
                        translateY(-8px) 
                        scale(1.02) 
                        rotateX(${angleX}deg) 
                        rotateY(${angleY}deg)
                    `;
                });
            }
            
            // Click animation feedback
            card.addEventListener('mousedown', function() {
                this.style.transform = 'translateY(-6px) scale(1.01)';
            });
            
            card.addEventListener('mouseup', function() {
                setTimeout(() => {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                }, 100);
            });
        });
    }
    
    // ==========================================
    // SMOOTH SCROLL
    // ==========================================
    
    function initSmoothScroll() {
        // Add smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Optional: Add custom easing for links
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
    }
    
    // ==========================================
    // PERFORMANCE OPTIMIZATION
    // ==========================================
    
    // Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (state.rafId) {
                cancelAnimationFrame(state.rafId);
                state.rafId = null;
            }
        } else {
            if (state.isMouseMoving) {
                animateCursorGlow();
            }
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
        }
    });
    
    // ==========================================
    // ENTRY POINT
    // ==========================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
