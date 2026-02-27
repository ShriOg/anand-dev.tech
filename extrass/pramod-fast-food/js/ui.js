/**
 * ui.js — All DOM rendering: menu cards, cart modal, stats, skeletons, toasts.
 *
 * Rendering is pure: each function reads MenuData / Cart / State and
 * writes to a known container. No side-effects outside the DOM.
 */
'use strict';

const UI = (() => {
    /* ---------- DOM shorthand ---------- */
    const $ = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => ctx.querySelectorAll(s);

    /* ---------- Internal state ---------- */
    const _prevQty = new Map();
    let _lastCartCount = 0;

    /* ====================================================================
       STATS
    ==================================================================== */
    const renderStats = () => {
        const items = MenuData.allItems();
        const specials = items.filter(i => i.special).length;
        const avg = Math.round(items.reduce((s, i) => s + i.prices[0].value, 0) / items.length);

        $('#stat-total').textContent = items.length;
        $('#stat-specials').textContent = specials;
        $('#stat-avg').textContent = `₹${avg}`;
    };

    /* ====================================================================
       SKELETON LOADER
    ==================================================================== */
    const showSkeleton = () => {
        const container = $('#menuContainer');
        container.innerHTML = Array.from({ length: 4 }, () => `
            <div class="skeleton-section">
                <div class="skeleton skeleton--header"></div>
                <div class="skeleton skeleton--card"></div>
                <div class="skeleton skeleton--card"></div>
            </div>
        `).join('');
    };

    /* ====================================================================
       MENU RENDERING
    ==================================================================== */
    const _matchSearch = (item, query) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
               (item.desc && item.desc.toLowerCase().includes(q));
    };

    const _matchFilter = (item, filter) => {
        if (filter === 'special') return !!item.special;
        if (filter === 'under50')  return item.prices[0].value < 50;
        if (filter === 'under100') return item.prices[0].value < 100;
        return true;
    };

    const _cartButton = (item, label, value) => {
        const q = Cart.qty(item.id, label);
        const key = `${item.id}-${label}`;
        const prev = _prevQty.get(key) || 0;
        const morphClass = q > 0 && prev === 0 ? ' cart-ctrl--morph' : '';

        if (q === 0) {
            return `
                <div class="cart-ctrl cart-ctrl--empty${morphClass}">
                    <button class="add-btn" data-action="cart-add"
                        data-id="${item.id}" data-size="${label}" data-price="${value}">+ Add</button>
                </div>`;
        }
        return `
            <div class="cart-ctrl cart-ctrl--qty${morphClass}">
                <div class="qty-ctrl">
                    <button class="qty-btn" data-action="cart-dec"
                        data-id="${item.id}" data-size="${label}" data-price="${value}" aria-label="Decrease">−</button>
                    <span class="qty-val" aria-live="polite">${q}</span>
                    <button class="qty-btn" data-action="cart-inc"
                        data-id="${item.id}" data-size="${label}" data-price="${value}" aria-label="Increase">+</button>
                </div>
            </div>`;
    };

    const renderMenu = () => {
        const container = $('#menuContainer');
        const category = State.get('category');
        const search   = State.get('search');
        const filter   = State.get('filter');

        const cats = category === 'all' ? MenuData.keys() : [category];
        let html = '';

        if (filter === 'special') {
            html += '<div class="special-ribbon" role="status">Today\'s Specials</div>';
        }

        cats.forEach(key => {
            const cat = MenuData.get(key);
            const visible = cat.items
                .filter(i => _matchSearch(i, search))
                .filter(i => _matchFilter(i, filter));

            if (!visible.length) return;

            html += `
            <section class="cat-section" aria-label="${cat.title}">
                <div class="cat-head">
                    <span class="cat-icon">${cat.icon}</span>
                    <h2 class="cat-title">${cat.title}</h2>
                    <span class="cat-count">${visible.length}</span>
                </div>
                <div class="menu-grid">
                    ${visible.map((item, i) => `
                    <article class="card${item.special ? ' card--special' : ''}" style="animation-delay:${i * 0.04}s">
                        ${item.prices[0].value < 50 ? '<span class="badge-budget">Under ₹50</span>' : ''}
                        <div class="card__head">
                            <span class="veg-dot" aria-label="Vegetarian"></span>
                            <span class="card__name">${item.name}</span>
                            ${item.special ? '<span class="badge-special">★ Special</span>' : ''}
                        </div>
                        ${item.desc ? `<p class="card__desc">${item.desc}</p>` : ''}
                        <div class="card__prices">
                            ${item.prices.map(p => `
                            <div class="price-col">
                                <span class="price-label">${p.label}</span>
                                <span class="price-val">₹${p.value}</span>
                                ${_cartButton(item, p.label, p.value)}
                            </div>`).join('')}
                        </div>
                    </article>`).join('')}
                </div>
            </section>`;
        });

        if (!html) {
            html = `
            <div class="empty-state" role="status">
                <span class="empty-state__icon">🔍</span>
                <p class="empty-state__text">No items found</p>
                <p class="empty-state__hint">Try a different search or filter</p>
            </div>`;
        }

        const prevHeight = container.offsetHeight;
        if (prevHeight) container.style.minHeight = `${prevHeight}px`;

        container.classList.remove('menu-fade-in');
        container.classList.add('menu-fade-out');

        requestAnimationFrame(() => {
            container.innerHTML = html;
            container.classList.remove('menu-fade-out');
            container.classList.add('menu-fade-in');

            requestAnimationFrame(() => {
                container.style.minHeight = '';
                window.setTimeout(() => container.classList.remove('menu-fade-in'), 220);
            });
        });

        _prevQty.clear();
        MenuData.allItems().forEach(item => {
            item.prices.forEach(p => {
                _prevQty.set(`${item.id}-${p.label}`, Cart.qty(item.id, p.label));
            });
        });
    };

    /* ====================================================================
       CART BADGE
    ==================================================================== */
    const renderCartBadge = () => {
        const badge = $('#cartBadge');
        const c = Cart.count();
        badge.textContent = c;
        badge.style.display = c > 0 ? 'flex' : 'none';

        if (c > _lastCartCount) {
            badge.classList.remove('badge-pop');
            void badge.offsetWidth;
            badge.classList.add('badge-pop');
        }
        _lastCartCount = c;
    };

    /* ====================================================================
       CART MODAL
    ==================================================================== */
    const renderCartModal = () => {
        const listEl   = $('#cartItems');
        const footerEl = $('#cartFooter');
        const items    = Cart.snapshot();

        if (!items.length) {
            listEl.innerHTML = `
                <div class="empty-cart">
                    <span class="empty-cart__icon">🛒</span>
                    <p class="empty-cart__title">Your cart is empty</p>
                    <p class="empty-cart__hint">Add items from the menu to get started</p>
                </div>`;
            footerEl.hidden = true;
            return;
        }

        listEl.innerHTML = items.map(i => `
            <div class="cart-row">
                <div class="cart-row__info">
                    <span class="cart-row__name">${i.name}</span>
                    <span class="cart-row__meta">${i.size} × ${i.quantity}</span>
                </div>
                <span class="cart-row__price">₹${i.price * i.quantity}</span>
            </div>`).join('');

        $('#cartTotal').textContent = `₹${Cart.total()}`;
        footerEl.hidden = false;
    };

    const toggleCart = (force) => {
        const open = force !== undefined ? force : !State.get('cartOpen');
        State.set('cartOpen', open);
        $('#cartModal').classList.toggle('show', open);
        $('#modalOverlay').classList.toggle('show', open);
        document.body.style.overflow = open ? 'hidden' : '';
    };

    /* ====================================================================
       TOAST (mini feedback when item added)
    ==================================================================== */
    let _toastTimer;
    const showToast = (message) => {
        let el = $('#toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast';
            el.className = 'toast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        clearTimeout(_toastTimer);
        el.textContent = message;
        el.classList.add('toast--visible');
        _toastTimer = setTimeout(() => el.classList.remove('toast--visible'), 2200);
    };

    /* ====================================================================
       ACTIVE STATES (tabs, chips)
    ==================================================================== */
    const setActiveTab = (key) => {
        $$('.tab').forEach(t => {
            const active = t.dataset.category === key;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active);
        });
    };

    const setActiveChip = (key) => {
        $$('.chip').forEach(c => {
            const active = c.dataset.filter === key;
            c.classList.toggle('active', active);
            c.setAttribute('aria-pressed', active);
        });
    };

    /* ---------- Public surface ---------- */
    return Object.freeze({
        $, $$,
        renderStats, showSkeleton, renderMenu,
        renderCartBadge, renderCartModal, toggleCart,
        showToast, setActiveTab, setActiveChip,
    });
})();
