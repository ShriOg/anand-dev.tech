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

    /* ==========  ORDER RESULT POPUP  ========== */
    const _showOrderResult = (success, data = {}) => {
        /* Remove any existing popup */
        const existing = document.getElementById('orderResultPopup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'orderResultPopup';
        popup.className = `order-popup order-popup--${success ? 'success' : 'error'}`;
        popup.setAttribute('role', 'alertdialog');

        if (success) {
            popup.innerHTML = `
                <div class="order-popup__inner">
                    <span class="order-popup__icon">✅</span>
                    <h3 class="order-popup__title">Order Placed!</h3>
                    <p class="order-popup__sub">Hi ${_esc(data.name || '')}, your order is confirmed</p>
                    <div class="order-popup__id-row">
                        <span class="order-popup__id">🧾 ${data.orderId || '—'}</span>
                        <button class="order-popup__copy" data-copy="${data.orderId || ''}" title="Copy Order ID">📋</button>
                    </div>
                    <p class="order-popup__total">Total: ₹${data.total || 0}</p>
                    <div class="order-popup__actions">
                        <button class="order-popup__btn order-popup__btn--wa" data-wa-url="${data.url || ''}">💬 Send via WhatsApp</button>
                        <button class="order-popup__btn order-popup__btn--close">Close</button>
                    </div>
                    <p class="order-popup__hint">Check WhatsApp for your order details</p>
                </div>`;
        } else {
            popup.innerHTML = `
                <div class="order-popup__inner">
                    <span class="order-popup__icon">❌</span>
                    <h3 class="order-popup__title">Order Failed</h3>
                    <p class="order-popup__sub">${_esc(data.error || 'Something went wrong')}</p>
                    <p class="order-popup__hint">Your cart is safe — please try again</p>
                    <div class="order-popup__actions">
                        <button class="order-popup__btn order-popup__btn--close">OK</button>
                    </div>
                </div>`;
        }

        document.body.appendChild(popup);
        requestAnimationFrame(() => popup.classList.add('order-popup--visible'));

        /* Event delegation inside popup */
        popup.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('[data-copy]');
            if (copyBtn) {
                navigator.clipboard.writeText(copyBtn.dataset.copy).then(() => {
                    copyBtn.textContent = '✅';
                    setTimeout(() => { copyBtn.textContent = '📋'; }, 1200);
                }).catch(() => showToast('Copy failed'));
                return;
            }
            const waBtn = e.target.closest('[data-wa-url]');
            if (waBtn && waBtn.dataset.waUrl) {
                window.open(waBtn.dataset.waUrl, '_blank');
                return;
            }
            if (e.target.closest('.order-popup__btn--close')) {
                popup.classList.remove('order-popup--visible');
                setTimeout(() => popup.remove(), 300);
            }
        });

        /* Auto-dismiss after 15s */
        setTimeout(() => {
            if (popup.parentNode) {
                popup.classList.remove('order-popup--visible');
                setTimeout(() => popup.remove(), 300);
            }
        }, 15000);
    };

    const _esc = (s) => {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    };

    /* ==========  INITIAL RENDER  ========== */
    showSkeleton();

    /* Load static menu (no backend) */
    renderStats();
    State.set('loading', false);
    renderMenu();

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
            case 'toggle-suggestions': {
                const wrapper = btn.closest('.cart-suggestions');
                const list = wrapper?.querySelector('.cart-suggestions__list');
                if (!list) break;
                const open = list.hidden;
                list.hidden = !open;
                btn.setAttribute('aria-expanded', String(open));
                btn.querySelector('.cart-suggestions__chevron').textContent = open ? '\u25b4' : '\u25be';
                break;
            }
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
                if (!Cart.count() || btn.disabled) return;

                btn.disabled = true;
                btn.textContent = '⏳ Opening WhatsApp…';

                const result = Cart.submitOrder(info);

                if (!result.ok) {
                    showToast(result.error || 'Something went wrong');
                    btn.disabled = false;
                    btn.textContent = '💬 Confirm & Send';
                    break;
                }

                /* Show success popup */
                _showOrderResult(true, {
                    orderId: result.orderId,
                    total: result.total,
                    url: result.url,
                    name: info.name,
                });

                showToast('Opening WhatsApp…');
                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

                /* Clear cart & reset after short delay */
                setTimeout(() => {
                    Cart.clear();
                    UI.setCheckoutStep('cart');
                    toggleCart(false);
                    btn.disabled = false;
                    btn.textContent = '💬 Confirm & Send';
                }, 2000);
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
