(() => {
    const nav = document.querySelector('.nav');
    const hero = document.querySelector('.hero');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileMq = window.matchMedia('(max-width: 768px)');

    const handleNavScroll = () => {
        if (!nav) return;
        nav.classList.toggle('nav--scrolled', window.scrollY > 28);
    };

    handleNavScroll();
    window.addEventListener('scroll', handleNavScroll, { passive: true });

    const normalizePath = (path) => {
        let normalized = (path || '/').toLowerCase();
        if (normalized.endsWith('index.html')) normalized = normalized.slice(0, -10);
        if (!normalized.endsWith('/')) normalized += '/';
        return normalized;
    };

    const navLinksContainer = document.querySelector('.nav__links');
    if (navLinksContainer) {
        const navLinks = Array.from(navLinksContainer.querySelectorAll('a'));
        const indicator = document.createElement('span');
        indicator.className = 'nav__active-indicator';
        navLinksContainer.appendChild(indicator);

        const currentPath = normalizePath(window.location.pathname);
        let activeLink = null;
        let longest = 0;

        navLinks.forEach((link) => {
            const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
            if (currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
                if (linkPath.length > longest) {
                    longest = linkPath.length;
                    activeLink = link;
                }
            }
        });

        const moveIndicator = (target) => {
            if (!target) {
                indicator.style.opacity = '0';
                return;
            }
            const parentRect = navLinksContainer.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const offsetLeft = targetRect.left - parentRect.left;

            indicator.style.width = `${targetRect.width}px`;
            indicator.style.transform = `translateX(${offsetLeft}px)`;
            indicator.style.opacity = '1';
        };

        navLinks.forEach((link) => {
            if (link === activeLink) link.classList.add('is-active');
            link.addEventListener('mouseenter', () => moveIndicator(link), { passive: true });
            link.addEventListener('focus', () => moveIndicator(link), { passive: true });
        });

        navLinksContainer.addEventListener('mouseleave', () => moveIndicator(activeLink), { passive: true });
        requestAnimationFrame(() => moveIndicator(activeLink));
        window.addEventListener('resize', () => moveIndicator(activeLink), { passive: true });
    }

    const navToggle = document.querySelector('.nav__toggle');
    const navOverlay = document.querySelector('.nav__mobile-overlay');
    const navPanel = document.querySelector('.nav__mobile-panel');
    const mobileNavLinks = Array.from(document.querySelectorAll('.nav__mobile-link'));

    const setMobileNavState = (open) => {
        if (!nav || !navToggle || !navOverlay || !navPanel) return;

        nav.classList.toggle('nav--mobile-open', open);
        document.body.classList.toggle('is-mobile-nav-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        navPanel.setAttribute('aria-hidden', String(!open));

        if (open) {
            navOverlay.removeAttribute('hidden');
            return;
        }

        navPanel.style.transition = '';
        navPanel.style.transform = '';
        const hideOverlay = () => {
            if (!nav.classList.contains('nav--mobile-open')) {
                navOverlay.setAttribute('hidden', '');
            }
            navOverlay.removeEventListener('transitionend', hideOverlay);
        };
        navOverlay.addEventListener('transitionend', hideOverlay);

        window.setTimeout(() => {
            if (!nav.classList.contains('nav--mobile-open')) {
                navOverlay.setAttribute('hidden', '');
            }
        }, 450);
    };

    const closeMobileNav = () => setMobileNavState(false);

    if (nav && navToggle && navOverlay && navPanel) {
        navToggle.addEventListener('click', () => {
            setMobileNavState(!nav.classList.contains('nav--mobile-open'));
        });

        navOverlay.addEventListener('click', closeMobileNav);

        mobileNavLinks.forEach((link) => {
            link.addEventListener('click', closeMobileNav);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && nav.classList.contains('nav--mobile-open')) {
                closeMobileNav();
            }
        });

        let touchStartX = 0;
        let touchStartY = 0;
        let swipeOffset = 0;

        navPanel.addEventListener('touchstart', (event) => {
            if (!nav.classList.contains('nav--mobile-open')) return;
            const touch = event.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            swipeOffset = 0;
            navPanel.style.transition = '';
        }, { passive: true });

        navPanel.addEventListener('touchmove', (event) => {
            if (!nav.classList.contains('nav--mobile-open')) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = Math.abs(touch.clientY - touchStartY);
            if (deltaX <= 0 || deltaY > 52) return;

            swipeOffset = Math.min(deltaX, 140);
            navPanel.style.transition = 'none';
            navPanel.style.transform = `translate3d(${swipeOffset}px, 0, 0)`;
        }, { passive: true });

        navPanel.addEventListener('touchend', () => {
            if (!nav.classList.contains('nav--mobile-open')) return;

            if (swipeOffset > 72) {
                closeMobileNav();
                swipeOffset = 0;
                return;
            }

            swipeOffset = 0;
            navPanel.style.transition = '';
            navPanel.style.transform = '';
        }, { passive: true });

        mobileMq.addEventListener('change', (event) => {
            if (!event.matches) closeMobileNav();
        });
    }

    const heroContent = document.querySelector('.hero__content');
    if (heroContent && !heroContent.querySelector('.hero-atmosphere')) {
        const atmosphere = document.createElement('div');
        atmosphere.className = 'hero-atmosphere';
        atmosphere.setAttribute('aria-hidden', 'true');
        atmosphere.innerHTML = `
            <svg class="hero-plate" viewBox="0 0 520 520" role="presentation" focusable="false">
                <circle class="plate-ring plate-ring--draw" cx="260" cy="260" r="206"></circle>
                <circle class="plate-ring plate-ring--outer" cx="260" cy="260" r="206"></circle>
                <circle class="plate-ring plate-ring--inner" cx="260" cy="260" r="162"></circle>
            </svg>
            <svg class="hero-steam-svg" viewBox="0 0 680 360" role="presentation" focusable="false">
                <path class="steam-path" d="M140 336 C112 280, 120 220, 170 168 C205 131, 190 78, 155 40" />
                <path class="steam-path" d="M340 340 C305 280, 326 226, 372 174 C402 140, 395 84, 360 40" />
                <path class="steam-path" d="M536 338 C506 282, 514 226, 560 174 C590 138, 578 84, 548 42" />
            </svg>
            <span class="spice-orb spice-orb--a"></span>
            <span class="spice-orb spice-orb--b"></span>
        `;
        heroContent.prepend(atmosphere);
    }

    if (hero && !prefersReducedMotion) {
        const handleHeroPointer = (event) => {
            const rect = hero.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            hero.style.setProperty('--hero-mx', `${(x * 18).toFixed(2)}px`);
            hero.style.setProperty('--hero-my', `${(y * 12).toFixed(2)}px`);
        };

        hero.addEventListener('pointermove', handleHeroPointer, { passive: true });
        hero.addEventListener('pointerleave', () => {
            hero.style.setProperty('--hero-mx', '0px');
            hero.style.setProperty('--hero-my', '0px');
        }, { passive: true });
    }

    const revealTargets = Array.from(document.querySelectorAll('.hero .eyebrow, .hero h1, .hero .hero__subtitle, .hero .hero__actions, .hero .hero__panel, .cta-box'));
    revealTargets.forEach((element, index) => {
        element.classList.add('reveal');
        element.style.setProperty('--reveal-delay', `${Math.min(index * 80, 420)}ms`);
    });

    const cards = Array.from(document.querySelectorAll('.card'));
    const steps = Array.from(document.querySelectorAll('.step'));
    const faqs = Array.from(document.querySelectorAll('.faq-item'));

    if (prefersReducedMotion) {
        revealTargets.forEach((element) => element.classList.add('is-visible'));
        [...cards, ...steps, ...faqs].forEach((element) => element.classList.add('is-visible'));
        return;
    }

    if (!('IntersectionObserver' in window)) {
        revealTargets.forEach((element) => element.classList.add('is-visible'));
        [...cards, ...steps, ...faqs].forEach((element) => element.classList.add('is-visible'));
    } else {
        const observer = new IntersectionObserver((entries, io) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const target = entry.target;
                const delay = Number(target.dataset.delay || 0);
                if (delay) {
                    window.setTimeout(() => target.classList.add('is-visible'), delay);
                } else {
                    target.classList.add('is-visible');
                }
                io.unobserve(target);
            });
        }, {
            threshold: 0.14,
            rootMargin: '0px 0px -8% 0px'
        });

        revealTargets.forEach((element) => observer.observe(element));

        cards.forEach((card, index) => {
            card.dataset.delay = String((index % 4) * 70);
            observer.observe(card);
        });

        steps.forEach((step, index) => {
            step.dataset.delay = String((index % 4) * 85);
            observer.observe(step);
        });

        faqs.forEach((faq, index) => {
            faq.dataset.delay = String((index % 4) * 75);
            observer.observe(faq);
        });
    }

    const magneticElements = Array.from(document.querySelectorAll('.nav__cta, .btn'));
    magneticElements.forEach((element) => {
        element.addEventListener('pointermove', (event) => {
            const rect = element.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            element.style.transform = `translate3d(${(x * 6).toFixed(2)}px, ${(y * 5).toFixed(2)}px, 0)`;
        }, { passive: true });

        element.addEventListener('pointerleave', () => {
            element.style.transform = '';
        }, { passive: true });
    });

    cards.forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.setProperty('--card-tilt-y', `${(x * 4.2).toFixed(2)}deg`);
            card.style.setProperty('--card-tilt-x', `${(-y * 3.6).toFixed(2)}deg`);
        }, { passive: true });

        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--card-tilt-y', '0deg');
            card.style.setProperty('--card-tilt-x', '0deg');
        }, { passive: true });
    });
})();
