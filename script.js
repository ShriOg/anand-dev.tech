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
        prevMouseX: 0,
        prevMouseY: 0,
        velocity: 0,
        isMouseMoving: false,
        isMobile: false,
        rafId: null,
        breathingPhase: 0,
        hoveredCard: null
    };
    
    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    
    const elements = {
        cursorGlowContainer: null,
        cursorGlowOuter: null,
        cursorGlowMid: null,
        cursorGlowInner: null,
        cards: [],
        radialGradient: null,
        backgroundLayer: null
    };
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    function init() {
        // Cache DOM elements
        elements.cursorGlowContainer = document.querySelector('.cursor-glow-container');
        elements.cursorGlowOuter = document.getElementById('cursorGlowOuter');
        elements.cursorGlowMid = document.getElementById('cursorGlowMid');
        elements.cursorGlowInner = document.getElementById('cursorGlowInner');
        elements.cards = Array.from(document.querySelectorAll('.feature-card'));
        elements.radialGradient = document.querySelector('.radial-gradient');
        elements.backgroundLayer = document.querySelector('.background-layer');
        
        // Detect mobile
        state.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                         || window.innerWidth < 768;
        
        // Initialize effects
        if (!state.isMobile) {
            initAdvancedCursorGlow();
            initParallax();
            initAmbientBackgroundShift();
        } else {
            initMobileAmbience();
        }
        
        initCardInteractions();
        initSmoothScroll();
        
        console.log('✨ Advanced cinematic landing page initialized');
    }
    
    // ==========================================
    // ADVANCED CINEMATIC CURSOR GLOW SYSTEM
    // ==========================================
    
    function initAdvancedCursorGlow() {
        let mouseMoveTimeout;
        
        // Track mouse position and velocity
        document.addEventListener('mousemove', (e) => {
            // Calculate velocity for speed-based effects
            const dx = e.clientX - state.targetX;
            const dy = e.clientY - state.targetY;
            state.velocity = Math.sqrt(dx * dx + dy * dy);
            
            state.targetX = e.clientX;
            state.targetY = e.clientY;
            
            if (!state.isMouseMoving) {
                state.isMouseMoving = true;
                elements.cursorGlowContainer.classList.add('active');
                animateAdvancedCursorGlow();
            }
            
            // Hide glow after inactivity
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                state.isMouseMoving = false;
                elements.cursorGlowContainer.classList.remove('active');
                if (state.rafId) {
                    cancelAnimationFrame(state.rafId);
                    state.rafId = null;
                }
            }, 1500);
        });
        
        // Initialize position on first load
        state.mouseX = window.innerWidth / 2;
        state.mouseY = window.innerHeight / 2;
        state.prevMouseX = state.mouseX;
        state.prevMouseY = state.mouseY;
    }
    
    function animateAdvancedCursorGlow() {
        if (!state.isMouseMoving) return;
        
        // Multi-layered interpolation for depth effect
        const lerpOuter = 0.08;  // Slowest, most trailing
        const lerpMid = 0.12;    // Medium speed
        const lerpInner = 0.18;  // Fastest, most responsive
        
        // Store previous position
        state.prevMouseX = state.mouseX;
        state.prevMouseY = state.mouseY;
        
        // Update current position with smooth interpolation
        state.mouseX += (state.targetX - state.mouseX) * lerpMid;
        state.mouseY += (state.targetY - state.mouseY) * lerpMid;
        
        // Breathing effect (subtle opacity pulse)
        state.breathingPhase += 0.02;
        const breathingOpacity = 0.9 + Math.sin(state.breathingPhase) * 0.1;
        
        // Velocity-based scaling (subtle expansion on fast movement)
        const velocityScale = Math.min(1 + (state.velocity * 0.002), 1.15);
        
        // Update outer glow (slowest, most trailing)
        const outerX = state.mouseX + (state.mouseX - state.prevMouseX) * 0.3;
        const outerY = state.mouseY + (state.mouseY - state.prevMouseY) * 0.3;
        elements.cursorGlowOuter.style.transform = `
            translate(${outerX}px, ${outerY}px) 
            scale(${velocityScale * 0.95})
        `;
        elements.cursorGlowOuter.style.opacity = breathingOpacity * 0.6;
        
        // Update mid glow (medium speed)
        const midX = state.mouseX + (state.mouseX - state.prevMouseX) * 0.15;
        const midY = state.mouseY + (state.mouseY - state.prevMouseY) * 0.15;
        elements.cursorGlowMid.style.transform = `
            translate(${midX}px, ${midY}px) 
            scale(${velocityScale})
        `;
        elements.cursorGlowMid.style.opacity = breathingOpacity * 0.8;
        
        // Update inner glow (fastest, most responsive)
        elements.cursorGlowInner.style.transform = `
            translate(${state.mouseX}px, ${state.mouseY}px) 
            scale(${velocityScale * 1.05})
        `;
        elements.cursorGlowInner.style.opacity = breathingOpacity;
        
        // Decay velocity
        state.velocity *= 0.9;
        
        // Continue animation loop
        state.rafId = requestAnimationFrame(animateAdvancedCursorGlow);
    }
    
    // ==========================================
    // ENHANCED PARALLAX EFFECT
    // ==========================================
    
    function initParallax() {
        let parallaxX = 0;
        let parallaxY = 0;
        
        document.addEventListener('mousemove', (e) => {
            const mouseXPercent = (e.clientX / window.innerWidth - 0.5) * 2;
            const mouseYPercent = (e.clientY / window.innerHeight - 0.5) * 2;
            
            // Smooth parallax with interpolation
            const targetX = mouseXPercent * 25;
            const targetY = mouseYPercent * 25;
            
            function updateParallax() {
                parallaxX += (targetX - parallaxX) * 0.1;
                parallaxY += (targetY - parallaxY) * 0.1;
                
                if (elements.radialGradient) {
                    elements.radialGradient.style.transform = 
                        `translate(calc(-50% + ${parallaxX}px), calc(-50% + ${parallaxY}px))`;
                }
                
                if (Math.abs(targetX - parallaxX) > 0.1 || Math.abs(targetY - parallaxY) > 0.1) {
                    requestAnimationFrame(updateParallax);
                }
            }
            
            updateParallax();
        });
    }
    
    // ==========================================
    // AMBIENT BACKGROUND SHIFT
    // ==========================================
    
    function initAmbientBackgroundShift() {
        if (!elements.backgroundLayer) return;
        
        document.addEventListener('mousemove', (e) => {
            const mouseXPercent = e.clientX / window.innerWidth;
            const mouseYPercent = e.clientY / window.innerHeight;
            
            // Shift hue based on cursor position (very subtle)
            const hueShift = (mouseXPercent * 10) - 5; // -5 to +5 degrees
            const brightness = 1 + (mouseYPercent * 0.05 - 0.025); // Slight brightness variation
            
            elements.backgroundLayer.style.filter = 
                `hue-rotate(${hueShift}deg) brightness(${brightness})`;
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
            // Enhanced hover effect with mouse position and glow interaction
            card.addEventListener('mouseenter', function() {
                this.style.zIndex = '10';
                state.hoveredCard = this;
                
                // Intensify glow when hovering over cards
                if (elements.cursorGlowContainer) {
                    elements.cursorGlowContainer.classList.add('intense');
                }
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.zIndex = '1';
                this.style.transform = 'translateY(0) scale(1)';
                this.style.removeProperty('--mouse-x');
                this.style.removeProperty('--mouse-y');
                state.hoveredCard = null;
                
                // Remove glow intensity
                if (elements.cursorGlowContainer) {
                    elements.cursorGlowContainer.classList.remove('intense');
                }
            });
            
            // Dynamic tilt effect and light reflection on mouse move
            if (!state.isMobile) {
                card.addEventListener('mousemove', function(e) {
                    const rect = this.getBoundingClientRect();
                    const cardCenterX = rect.left + rect.width / 2;
                    const cardCenterY = rect.top + rect.height / 2;
                    
                    // Calculate mouse position relative to card
                    const mouseXRelative = ((e.clientX - rect.left) / rect.width) * 100;
                    const mouseYRelative = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    // Update CSS custom properties for light reflection
                    this.style.setProperty('--mouse-x', `${mouseXRelative}%`);
                    this.style.setProperty('--mouse-y', `${mouseYRelative}%`);
                    
                    // 3D tilt effect
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
            if (state.isMouseMoving && !state.isMobile) {
                animateAdvancedCursorGlow();
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
