/**
 * app.js — Orchestrator: wires events → state → UI.
 *
 * Single DOMContentLoaded listener.  All user interactions go through
 * event delegation on stable parent containers — zero inline handlers.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const { $, $$, renderMenu, renderStats, renderCartBadge, renderCartModal,
            toggleCart, showToast, showSkeleton, setActiveTab, setActiveChip } = UI;

    const hero = document.querySelector('.hero');
    const tabs = $('#menuTabs');
    const tabIndicator = document.querySelector('.tab-indicator');
    const cartModal = $('#cartModal');
    const modalOverlay = $('#modalOverlay');
    let lastFocusedEl = null;

    /* ==========  UTILITY  ========== */
    const debounce = (fn, ms) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    /* ==========  INITIAL RENDER  ========== */
    showSkeleton();

    // Fetch menu from API → fall back to static data
    (async () => {
        try {
            const result = await MenuData.fetchFromApi();
            if (!result.live) {
                console.warn('[menu] Using static fallback:', result.error);
            }
        } catch (err) {
            console.warn('[menu] Fetch failed, using static data:', err);
        }
        renderStats();
        State.set('loading', false);
        renderMenu();
    })();

    // Fetch loyalty profile if authenticated
    (async () => {
        if (typeof Api !== 'undefined' && Api.isAuthenticated()) {
            const res = await Api.fetchProfile();
            if (res.ok && res.data) {
                UI.renderLoyaltyBar(res.data);
            } else {
                UI.renderLoyaltyBar(null);
            }
        }
    })();

    /* ==========  STATE → UI SUBSCRIPTIONS  ========== */
    const updateTabIndicator = (activeTab) => {
        if (!tabs || !tabIndicator || !activeTab) return;
        requestAnimationFrame(() => {
            const rect = activeTab.getBoundingClientRect();
            const parentRect = tabs.getBoundingClientRect();
            const x = rect.left - parentRect.left + tabs.scrollLeft;
            tabIndicator.style.transform = `translateX(${x}px)`;
            tabIndicator.style.width = `${rect.width}px`;
        });
    };

    State.on('category', (v) => {
        setActiveTab(v);
        renderMenu();
        updateTabIndicator(document.querySelector(`.tab[data-category="${v}"]`));
    });
    State.on('filter',   (v) => { setActiveChip(v); renderMenu(); });
    State.on('search',   ()  => { renderMenu(); });
    State.on('cartOpen', (open) => {
        document.body.classList.toggle('modal-open', open);
        modalOverlay.setAttribute('aria-hidden', String(!open));

        if (open) {
            lastFocusedEl = document.activeElement;
            const focusable = cartModal.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
            if (focusable) focusable.focus();
        } else if (lastFocusedEl) {
            lastFocusedEl.focus();
        }
    });

    document.addEventListener('cart:changed', () => {
        renderMenu();
        renderCartBadge();
        renderCartModal();
    });

    /* ==========  EVENT DELEGATION: menu container  ========== */
    $('#menuContainer').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const { action, id, size, price } = btn.dataset;
        const itemId   = Number(id);
        const priceNum = Number(price);

        switch (action) {
            case 'cart-add':
                const prevCount = Cart.count();
                Cart.add(itemId, size, priceNum);
                if (prevCount === 0 && Cart.count() === 1) toggleCart(true);
                showToast(`Added ${MenuData.findById(itemId)?.name || 'item'}`);
                if (navigator.vibrate) navigator.vibrate(12);
                break;
            case 'cart-inc':
                Cart.update(itemId, size, priceNum, 1);
                break;
            case 'cart-dec':
                Cart.update(itemId, size, priceNum, -1);
                break;
        }
    });

    /* ==========  TABS  ========== */
    $('#menuTabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        State.set('category', tab.dataset.category);
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        updateTabIndicator(tab);
    });

    /* ==========  FILTER CHIPS  ========== */
    $('#filterBar').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        State.set('filter', chip.dataset.filter);
    });

    /* ==========  SEARCH  ========== */
    const searchInput = $('#searchInput');
    const searchClear = $('#searchClear');
    const debouncedSearch = debounce((q) => State.set('search', q), 180);

    searchInput.addEventListener('input', (e) => {
        const q = e.target.value;
        searchClear.classList.toggle('show', q.length > 0);
        debouncedSearch(q);
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('show');
        State.set('search', '');
        searchInput.focus();
    });

    /* ==========  CART MODAL  ========== */
    $('#cartBtn').addEventListener('click',     () => toggleCart());
    $('#modalOverlay').addEventListener('click', () => toggleCart(false));
    $('#closeCart').addEventListener('click',    () => toggleCart(false));

    /* ==========  CART MODAL: delegation for +/−, clear, checkout flow, suggestions  ========== */
    cartModal.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const { action, id, size, price } = btn.dataset;
        const numId = Number(id);
        const numPrice = Number(price);

        switch (action) {
            case 'cart-modal-inc':
                Cart.update(numId, size, numPrice, 1);
                break;
            case 'cart-modal-dec':
                Cart.update(numId, size, numPrice, -1);
                break;
            case 'suggest-add':
                Cart.add(numId, size, numPrice);
                showToast(`Added ${MenuData.findById(numId)?.name || 'item'}`);
                if (navigator.vibrate) navigator.vibrate(12);
                break;
            case 'clear-cart':
                Cart.clear();
                showToast('Cart cleared');
                break;
            case 'checkout-start':
                UI.setCheckoutStep('form');
                break;
            case 'checkout-back':
                UI.setCheckoutStep('cart');
                break;
            case 'checkout-review': {
                const name = $('#custName')?.value.trim();
                const phone = $('#custPhone')?.value.trim();
                const orderType = cartModal.querySelector('input[name="orderType"]:checked')?.value || 'Dine-In';
                const persons = $('#custPersons')?.value;
                const table = $('#custTable')?.value.trim();
                const note = $('#custNote')?.value.trim();

                if (!name) { showToast('Please enter your name'); $('#custName')?.focus(); return; }
                if (!phone || !/^\d{10}$/.test(phone)) { showToast('Enter valid 10-digit phone'); $('#custPhone')?.focus(); return; }

                UI.setCustomerInfo({ name, phone, orderType, persons, table, note });
                UI.setCheckoutStep('summary');
                break;
            }
            case 'checkout-back-form':
                UI.setCheckoutStep('form');
                break;
            case 'checkout-confirm': {
                const info = UI.getCustomerInfo();
                if (!Cart.count()) return;

                btn.disabled = true;
                btn.textContent = '⏳ Placing order…';

                (async () => {
                    try {
                        const result = await Cart.submitOrder(info);

                        if (!result.ok) {
                            showToast(result.error || 'Order failed — please try again');
                            btn.disabled = false;
                            btn.textContent = '💬 Confirm & Send';
                            return;
                        }

                        // Order saved (or fallback succeeded) — open WhatsApp
                        showToast('Order placed! Opening WhatsApp…');
                        if (result.url) window.open(result.url, '_blank');

                        // Refresh loyalty data after successful order
                        if (typeof Api !== 'undefined' && Api.isAuthenticated()) {
                            Api.fetchProfile().then(res => {
                                if (res.ok && res.data) UI.renderLoyaltyBar(res.data);
                            });
                        }

                        // Clear cart only after backend confirms
                        setTimeout(() => {
                            btn.disabled = false;
                            btn.textContent = '💬 Confirm & Send';
                            Cart.clear();
                            UI.setCheckoutStep('cart');
                            toggleCart(false);
                        }, 2000);

                    } catch (err) {
                        showToast('Network error — your cart is safe');
                        btn.disabled = false;
                        btn.textContent = '💬 Confirm & Send';
                    }
                })();
                break;
            }
        }
    });

    /* Order-type toggle inside checkout form */
    cartModal.addEventListener('change', (e) => {
        if (e.target.name === 'orderType') {
            const dineIn = $('#dineInFields');
            if (dineIn) dineIn.hidden = e.target.value === 'Takeaway';
            cartModal.querySelectorAll('.order-type-opt').forEach(lbl => {
                lbl.classList.toggle('order-type-opt--active', lbl.querySelector('input').checked);
            });
        }
    });

    // Close cart on Escape + trap focus in modal
    document.addEventListener('keydown', (e) => {
        if (!State.get('cartOpen')) return;
        if (e.key === 'Escape') return toggleCart(false);
        if (e.key !== 'Tab') return;

        const focusables = cartModal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // Swipe down to close (mobile)
    let touchStartY = 0;
    let touchActive = false;
    cartModal.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchActive = true;
    }, { passive: true });
    cartModal.addEventListener('touchmove', (e) => {
        if (!touchActive) return;
        const delta = e.touches[0].clientY - touchStartY;
        if (delta > 90) {
            touchActive = false;
            toggleCart(false);
        }
    }, { passive: true });
    cartModal.addEventListener('touchend', () => { touchActive = false; }, { passive: true });

    /* ==========  BACK TO TOP  ========== */
    const btt = $('#backToTop');
    let scrollTick = false;

    window.addEventListener('scroll', () => {
        if (scrollTick) return;
        scrollTick = true;
        requestAnimationFrame(() => {
            btt.classList.toggle('show', window.scrollY > 400);
            if (hero) hero.classList.toggle('hero--compact', window.scrollY > 60);
            scrollTick = false;
        });
    }, { passive: true });

    if (tabs) {
        tabs.addEventListener('scroll', () => {
            const active = document.querySelector('.tab.active');
            updateTabIndicator(active);
        }, { passive: true });
    }

    window.addEventListener('resize', () => {
        const active = document.querySelector('.tab.active');
        updateTabIndicator(active);
    });

    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    updateTabIndicator(document.querySelector('.tab.active'));

    /* ==========  LOYALTY BAR (frontend placeholder)  ========== */
    UI.renderLoyaltyBar(null);

    document.addEventListener('click', (e) => {
        if (e.target.closest('#googleLoginBtn')) {
            showToast('Rewards coming soon!');
        }
    });
});
