// ============================================
// Privacy Policy Page Interactions
// MenuNova
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initBackToTop();
    initScrollReveal();
    initSmoothScroll();
});

/* ============================================
   Back to Top Button
   ============================================ */

function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;

    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top on click
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Keyboard support (Ctrl+Home or Cmd+Home)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
            backToTopBtn.click();
        }
    });
}

/* ============================================
   Scroll Reveal Animation
   ============================================ */

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    if (revealElements.length === 0) return;

    // Create Intersection Observer for scroll reveal
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        observer.observe(el);
    });
}

/* ============================================
   Smooth Scroll Behavior
   ============================================ */

function initSmoothScroll() {
    // Add smooth scroll to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just an anchor
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update active state
                updateActiveSection();
            }
        });
    });

    // Update active section on scroll
    window.addEventListener('scroll', updateActiveSection, { passive: true });
}

function updateActiveSection() {
    const sections = document.querySelectorAll('.policy-section');
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        
        // Check if section is in viewport
        if (rect.top <= 150 && rect.bottom >= 150) {
            // Optional: highlight in navbar if needed
        }
    });
}

/* ============================================
   Page Load Analytics & Performance
   ============================================ */

// Track page load performance
window.addEventListener('load', function() {
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        
        // Log performance metric (optional)
        console.log('Privacy Policy page loaded in ' + loadTime + 'ms');
    }

    // Trigger initial scroll reveal checks
    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('visible');
        }
    });
});

/* ============================================
   Accessibility Enhancements
   ============================================ */

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Skip navigation using Tab
    if (e.key === 'Tab') {
        const activeElement = document.activeElement;
        
        // Prevent tab trap
        if (activeElement && activeElement.classList.contains('nav-link')) {
            // Allow normal tab behavior
        }
    }

    // Focus visible state for keyboard users
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-nav');
});

/* ============================================
   Utility: Debounce Function
   ============================================ */

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ============================================
   Print Support
   ============================================ */

// Handle print scenarios
window.addEventListener('beforeprint', function() {
    // Hide interactive elements during print
    document.querySelector('.back-to-top').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
});

window.addEventListener('afterprint', function() {
    document.querySelector('.back-to-top').style.display = 'flex';
    document.querySelector('.navbar').style.display = 'flex';
});

/* ============================================
   Mobile Menu Support (if navbar expands)
   ============================================ */

function initMobileMenu() {
    // This can be expanded if navbar becomes a hamburger menu on mobile
    // Currently navbar is always visible
}

/* ============================================
   Prefetch Related Pages
   ============================================ */

// Prefetch home and demo pages for faster navigation
document.addEventListener('DOMContentLoaded', function() {
    const prefetchLinks = [
        'https://menunova.me',
        'https://menunova.me/demo'
    ];

    prefetchLinks.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    });
});

/* ============================================
   Dark Mode Persistence (if needed)
   ============================================ */

function initDarkMode() {
    // This page is always dark themed, but this function
    // can be expanded for light/dark mode toggle if needed
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDark) {
        document.documentElement.style.colorScheme = 'dark';
    }
}

initDarkMode();

/* ============================================
   Error Tracking (optional)
   ============================================ */

window.addEventListener('error', function(e) {
    // Log errors silently without disrupting user experience
    if (window.console && console.error) {
        console.error('Error on Privacy Policy:', e.message);
    }
});

window.addEventListener('unhandledrejection', function(e) {
    // Handle unhandled promise rejections
    console.warn('Unhandled promise rejection:', e.reason);
});
