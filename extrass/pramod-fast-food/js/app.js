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

    /* ==========  UTILITY  ========== */
    const debounce = (fn, ms) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    /* ==========  INITIAL RENDER  ========== */
    showSkeleton();
    renderStats();

    // Simulate data-loading delay (swap with real fetch later)
    setTimeout(() => {
        State.set('loading', false);
        renderMenu();
    }, 350);

    /* ==========  STATE → UI SUBSCRIPTIONS  ========== */
    State.on('category', (v) => { setActiveTab(v);  renderMenu(); });
    State.on('filter',   (v) => { setActiveChip(v); renderMenu(); });
    State.on('search',   ()  => { renderMenu(); });

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
                Cart.add(itemId, size, priceNum);
                showToast(`Added ${MenuData.findById(itemId)?.name || 'item'}`);
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

    $('#cartFooter').addEventListener('click', (e) => {
        if (e.target.closest('#checkoutBtn')) {
            const url = Cart.checkoutURL();
            if (url) window.open(url, '_blank');
        }
    });

    // Close cart on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && State.get('cartOpen')) toggleCart(false);
    });

    /* ==========  BACK TO TOP  ========== */
    const btt = $('#backToTop');
    let scrollTick = false;

    window.addEventListener('scroll', () => {
        if (scrollTick) return;
        scrollTick = true;
        requestAnimationFrame(() => {
            btt.classList.toggle('show', window.scrollY > 400);
            scrollTick = false;
        });
    }, { passive: true });

    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
