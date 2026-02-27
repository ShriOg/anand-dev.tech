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
    let _checkoutStep = 'cart'; // 'cart' | 'form' | 'summary'
    let _customerInfo = {};

    /* ====================================================================
       STATS
    ==================================================================== */
    const renderStats = () => {
        const items = MenuData.allItems();
        const specials = items.filter(i => i.special).length;
        const avg = items.length ? Math.round(items.reduce((s, i) => s + i.prices[0].value, 0) / items.length) : 0;

        const totalEl = $('#stat-total');
        const specialsEl = $('#stat-specials');
        const avgEl = $('#stat-avg');

        if (totalEl) totalEl.textContent = items.length;
        if (specialsEl) specialsEl.textContent = specials;
        if (avgEl) avgEl.textContent = `₹${avg}`;

        // Live indicator
        const indicator = $('#liveIndicator');
        if (indicator && typeof MenuData.isLive === 'function') {
            if (MenuData.isLive()) {
                indicator.innerHTML = '<span class="live-dot"></span> Live';
                indicator.classList.add('live-indicator--on');
                indicator.classList.remove('live-indicator--off');
            } else {
                indicator.innerHTML = '<span class="live-dot"></span> Offline';
                indicator.classList.remove('live-indicator--on');
                indicator.classList.add('live-indicator--off');
            }
        }
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
        const q = Cart.qty(item._id, label);
        const key = `${item._id}-${label}`;
        const prev = _prevQty.get(key) || 0;
        const morphClass = q > 0 && prev === 0 ? ' cart-ctrl--morph' : '';

        if (q === 0) {
            return `
                <div class="cart-ctrl cart-ctrl--empty${morphClass}">
                    <button class="add-btn" data-action="cart-add"
                        data-id="${item._id}" data-size="${label}" data-price="${value}">+ Add</button>
                </div>`;
        }
        return `
            <div class="cart-ctrl cart-ctrl--qty${morphClass}">
                <div class="qty-ctrl">
                    <button class="qty-btn" data-action="cart-dec"
                        data-id="${item._id}" data-size="${label}" data-price="${value}" aria-label="Decrease">−</button>
                    <span class="qty-val" aria-live="polite">${q}</span>
                    <button class="qty-btn" data-action="cart-inc"
                        data-id="${item._id}" data-size="${label}" data-price="${value}" aria-label="Increase">+</button>
                </div>
            </div>`;
    };

    const renderMenu = () => {
        const container = $('#menuContainer');
        const category = State.get('category');
        const search   = State.get('search');
        const filter   = State.get('filter');
        debug('Rendering Menu', { category, search, filter });

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
                _prevQty.set(`${item._id}-${p.label}`, Cart.qty(item._id, p.label));
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

    /** Pick 2 random menu items not currently in cart */
    const _renderSuggestions = () => {
        const cartIds = new Set(Cart.snapshot().map(i => i.itemId));
        const available = MenuData.allItems().filter(i => !cartIds.has(i._id));
        if (!available.length) return '';
        const picks = available.sort(() => Math.random() - 0.5).slice(0, 2);
        return `
        <div class="cart-suggestions">
            <p class="cart-suggestions__title">You may also like</p>
            <div class="cart-suggestions__list">
                ${picks.map(item => {
                    const p = item.prices[0];
                    return `
                    <div class="suggest-card">
                        <div class="suggest-card__info">
                            <span class="suggest-card__name">${item.name}</span>
                            <span class="suggest-card__price">₹${p.value}</span>
                        </div>
                        <button class="suggest-card__add" data-action="suggest-add"
                            data-id="${item._id}" data-size="${p.label}" data-price="${p.value}">+ Add</button>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    };

    const renderCartModal = () => {
        const listEl   = $('#cartItems');
        const footerEl = $('#cartFooter');
        const titleEl  = $('.cart-modal__title');

        /* --- Checkout FORM step --- */
        if (_checkoutStep === 'form') {
            debug('Checkout Step', 'form');
            if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">📋</span> Details';
            _renderCheckoutForm(listEl, footerEl);
            return;
        }
        /* --- Order SUMMARY step --- */
        if (_checkoutStep === 'summary') {
            debug('Checkout Step', 'summary');
            if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">📦</span> Summary';
            _renderOrderSummary(listEl, footerEl);
            return;
        }

        /* --- Default CART step --- */
        debug('Rendering Cart Modal', Cart.snapshot());
        if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">🛒</span> Your Cart';
        const items = Cart.snapshot();

        if (!items.length) {
            const hasLastOrder = (typeof Customer !== 'undefined') && Customer.getLastOrder();
            listEl.innerHTML = `
                <div class="empty-cart">
                    <span class="empty-cart__icon">🛒</span>
                    <p class="empty-cart__title">Your cart is empty</p>
                    <p class="empty-cart__hint">Add items from the menu to get started</p>
                    ${hasLastOrder ? '<button class="repeat-order-btn" data-action="repeat-order">🔁 Repeat Last Order</button>' : ''}
                </div>`;
            footerEl.hidden = true;
            return;
        }

        let html = `<div class="cart-actions"><button class="clear-cart-btn" data-action="clear-cart">🗑 Clear Cart</button></div>`;

        html += items.map(i => `
            <div class="cart-row">
                <div class="cart-row__info">
                    <span class="cart-row__name">${i.name}</span>
                    <span class="cart-row__meta">${i.size}</span>
                </div>
                <div class="cart-row__controls">
                    <button class="cart-row__btn" data-action="cart-modal-dec"
                        data-id="${i.itemId}" data-size="${i.size}" data-price="${i.price}" aria-label="Decrease">−</button>
                    <span class="cart-row__qty">${i.quantity}</span>
                    <button class="cart-row__btn" data-action="cart-modal-inc"
                        data-id="${i.itemId}" data-size="${i.size}" data-price="${i.price}" aria-label="Increase">+</button>
                </div>
                <span class="cart-row__price">₹${i.price * i.quantity}</span>
            </div>`).join('');

        html += _renderSuggestions();
        listEl.innerHTML = html;

        footerEl.hidden = false;
        footerEl.innerHTML = `
            <div class="cart-total"><span>Total</span><span class="cart-total__val" id="cartTotal">₹${Cart.total()}</span></div>
            <button class="checkout-btn" id="checkoutBtn" data-action="checkout-start">� Place Order</button>`;
    };

    /* ---------- Checkout Form ---------- */
    const _renderCheckoutForm = (listEl, footerEl) => {
        /* Auto-prefill from saved customer data if form fields are empty */
        const saved = (typeof Customer !== 'undefined') ? Customer.getProfile() : null;
        const ci = {
            name: _customerInfo.name || saved?.name || '',
            phone: _customerInfo.phone || saved?.phone || '',
            orderType: _customerInfo.orderType || '',
            persons: _customerInfo.persons || '',
            table: _customerInfo.table || '',
            note: _customerInfo.note || '',
        };
        listEl.innerHTML = `
        <div class="checkout-form">
            <div class="form-group">
                <label class="form-label" for="custName">Name *</label>
                <input type="text" id="custName" class="form-input" placeholder="Your name" required autocomplete="name" value="${ci.name || ''}">
            </div>
            <div class="form-group">
                <label class="form-label" for="custPhone">Phone *</label>
                <input type="tel" id="custPhone" class="form-input" placeholder="10-digit number" maxlength="10" required autocomplete="tel" value="${ci.phone || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Order Type *</label>
                <div class="order-type-toggle">
                    <label class="order-type-opt${(!ci.orderType || ci.orderType === 'Dine-In') ? ' order-type-opt--active' : ''}">
                        <input type="radio" name="orderType" value="Dine-In" ${(!ci.orderType || ci.orderType === 'Dine-In') ? 'checked' : ''}> 🍽 Dine-In
                    </label>
                    <label class="order-type-opt${ci.orderType === 'Takeaway' ? ' order-type-opt--active' : ''}">
                        <input type="radio" name="orderType" value="Takeaway" ${ci.orderType === 'Takeaway' ? 'checked' : ''}> 🥡 Takeaway
                    </label>
                </div>
            </div>
            <div class="form-group dine-in-fields" id="dineInFields" ${ci.orderType === 'Takeaway' ? 'hidden' : ''}>
                <div class="form-row">
                    <div class="form-group form-group--half">
                        <label class="form-label" for="custPersons">Persons</label>
                        <input type="number" id="custPersons" class="form-input" placeholder="e.g. 3" min="1" max="50" value="${ci.persons || ''}">
                    </div>
                    <div class="form-group form-group--half">
                        <label class="form-label" for="custTable">Table No.</label>
                        <input type="text" id="custTable" class="form-input" placeholder="e.g. 4" value="${ci.table || ''}">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="custNote">Note (optional)</label>
                <textarea id="custNote" class="form-input form-input--textarea" placeholder="Any special request…" rows="2">${ci.note || ''}</textarea>
            </div>
        </div>`;

        footerEl.hidden = false;
        footerEl.innerHTML = `
            <div class="checkout-nav">
                <button class="checkout-back-btn" data-action="checkout-back">← Back</button>
                <button class="checkout-next-btn" data-action="checkout-review">Review Order →</button>
            </div>`;
    };

    /* ---------- Order Summary ---------- */
    const _renderOrderSummary = (listEl, footerEl) => {
        const ci = _customerInfo;
        const items = Cart.snapshot();

        let html = `<div class="order-summary">
            <div class="order-summary__info">
                <div class="order-summary__row"><span>👤</span><span>${ci.name}</span></div>
                <div class="order-summary__row"><span>📞</span><span>${ci.phone}</span></div>
                <div class="order-summary__row"><span>📦</span><span>${ci.orderType}</span></div>`;
        if (ci.orderType === 'Dine-In') {
            if (ci.persons) html += `<div class="order-summary__row"><span>👥</span><span>${ci.persons} persons</span></div>`;
            if (ci.table) html += `<div class="order-summary__row"><span>🪑</span><span>Table ${ci.table}</span></div>`;
        }
        if (ci.note) html += `<div class="order-summary__row"><span>📝</span><span>${ci.note}</span></div>`;

        html += `</div><div class="order-summary__divider"></div><div class="order-summary__items">`;
        items.forEach(i => {
            html += `
            <div class="order-summary__item">
                <div class="order-summary__item-info">
                    <span class="order-summary__item-name">${i.name}</span>
                    <span class="order-summary__item-meta">${i.size} × ${i.quantity}</span>
                </div>
                <span class="order-summary__item-price">₹${i.price * i.quantity}</span>
            </div>`;
        });
        html += `</div><div class="order-summary__divider"></div>
            <div class="order-summary__total"><span>Total</span><span class="order-summary__total-val">₹${Cart.total()}</span></div>
        </div>`;

        listEl.innerHTML = html;
        footerEl.hidden = false;

        const connected = window.__BACKEND_CONNECTED__;
        footerEl.innerHTML = `
            <div class="checkout-nav">
                <button class="checkout-back-btn" data-action="checkout-back-form">← Edit</button>
                <button class="checkout-confirm-btn checkout-confirm-btn--primary" data-action="checkout-confirm">✅ Place Order</button>
                ${!connected ? '<button class="checkout-confirm-btn checkout-confirm-btn--wa" data-action="checkout-wa">💬 Place Order via WhatsApp</button>' : ''}
            </div>
            ${!connected ? '<p class="checkout-server-hint">⚠️ Server may be waking up — WhatsApp is available as backup</p>' : ''}`;
    };

    /* ---------- Checkout Step Manager ---------- */
    const setCheckoutStep = (step) => { _checkoutStep = step; renderCartModal(); };
    const getCheckoutStep = () => _checkoutStep;
    const setCustomerInfo = (info) => { _customerInfo = info; };
    const getCustomerInfo = () => ({ ..._customerInfo });

    const toggleCart = (force) => {
        const open = force !== undefined ? force : !State.get('cartOpen');
        State.set('cartOpen', open);
        $('#cartModal').classList.toggle('show', open);
        $('#modalOverlay').classList.toggle('show', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (!open && _checkoutStep !== 'cart') {
            _checkoutStep = 'cart';
            renderCartModal();
        }
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

    /* ====================================================================
       LOYALTY BAR
    ==================================================================== */
    const renderLoyaltyBar = (user) => {
        const el = $('#loyaltyBar');
        if (!el) return;

        /* Prefer local Customer data over passed-in user (API profile) */
        const local = (typeof Customer !== 'undefined') ? Customer.getLoyaltyData() : null;
        const data = local || user;

        if (data && data.name) {
            el.innerHTML = `
                <span class="loyalty__user">Hi, ${data.name}! 👋</span>
                <div class="loyalty__stats">
                    <span class="loyalty__stat">⭐ ${data.points || 0} pts</span>
                    <span class="loyalty__stat">🏅 ${data.orders || 0} orders</span>
                </div>`;
        } else {
            el.innerHTML = `
                <button class="loyalty__login" id="googleLoginBtn">🎁 Sign in for rewards</button>
                <div class="loyalty__stats">
                    <span class="loyalty__stat">⭐ 0 pts</span>
                    <span class="loyalty__stat">🏅 0 orders</span>
                </div>`;
        }
    };

    /* ====================================================================
       GREETING BAR
    ==================================================================== */
    const renderGreeting = () => {
        const bar = $('#greetingBar');
        if (!bar) return;
        const name = Customer.getName() || '';
        const loyalty = Customer.getLoyaltyData();

        if (!name && !loyalty) {
            bar.hidden = true;
            return;
        }

        bar.hidden = false;
        const hi = $('#greetingHi');
        const sub = $('#greetingSub');
        const dot = $('#orderDot');

        const displayName = name || loyalty?.name || 'Guest';
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

        if (hi) hi.textContent = `${greeting}, ${displayName}! 👋`;
        if (sub) {
            const pts = loyalty?.points || 0;
            const orders = loyalty?.orders || 0;
            sub.textContent = pts > 0 ? `⭐ ${pts} pts · 🏅 ${orders} orders` : 'Ready to order something delicious?';
        }
        if (dot) {
            dot.classList.toggle('greeting__order-dot--active', Customer.hasActiveOrders());
        }
    };

    /* ====================================================================
       THEME TOGGLE
    ==================================================================== */
    const renderThemeToggle = () => {
        const btn = $('#themeToggle');
        if (!btn) return;
        const theme = Customer.getTheme();
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    };

    /* ====================================================================
       ORDERS PANEL
    ==================================================================== */
    const _buildTimeline = (status) => {
        const steps = [
            { key: 'PENDING',   label: 'Placed',   icon: '⏳' },
            { key: 'PREPARING', label: 'Preparing', icon: '🔥' },
            { key: 'COMPLETED', label: 'Ready',     icon: '✅' },
        ];
        const statusOrder = { PENDING: 0, PREPARING: 1, COMPLETED: 2, CANCELLED: -1 };
        const current = statusOrder[status] ?? -1;

        let html = '';
        steps.forEach((step, i) => {
            const stepIdx = statusOrder[step.key];
            const isDone = current > stepIdx;
            const isActive = current === stepIdx;
            const dotClass = isDone ? 'order-timeline__dot--done' : isActive ? 'order-timeline__dot--active' : '';
            const labelClass = isDone ? 'order-timeline__label--done' : isActive ? 'order-timeline__label--active' : '';

            html += `<div class="order-timeline__step">
                <div class="order-timeline__dot ${dotClass}">${isDone ? '✓' : isActive ? step.icon : ''}</div>
                <span class="order-timeline__label ${labelClass}">${step.label}</span>
            </div>`;

            if (i < steps.length - 1) {
                const lineClass = isDone ? 'order-timeline__line--done' : isActive ? 'order-timeline__line--active' : '';
                html += `<div class="order-timeline__line ${lineClass}"></div>`;
            }
        });

        return `<div class="order-timeline">${html}</div>`;
    };

    const _formatOrderDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${d.getDate()} ${M[d.getMonth()]}, ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2,'0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
    };

    const renderOrdersPanel = () => {
        const body = $('#ordersList');
        if (!body) return;

        const orders = Customer.getOrders();

        if (!orders.length) {
            body.innerHTML = `
                <div class="orders-panel__empty">
                    <span class="orders-panel__empty-icon">📦</span>
                    <p class="orders-panel__empty-text">No orders yet</p>
                    <p class="orders-panel__empty-hint">Your order history will appear here</p>
                </div>`;
            return;
        }

        body.innerHTML = orders.map(order => {
            const statusKey = (order.status || 'PENDING').toUpperCase();
            const isCancelled = statusKey === 'CANCELLED';
            const isCompleted = statusKey === 'COMPLETED';
            const items = order.items || [];

            let itemsHtml = items.slice(0, 4).map(i =>
                `<div class="order-card__item">
                    <span class="order-card__item-name">${i.name || 'Item'}</span>
                    <span class="order-card__item-qty">${i.size ? i.size + ' × ' : ''}${i.quantity || 1}</span>
                </div>`
            ).join('');
            if (items.length > 4) itemsHtml += `<div class="order-card__item"><span class="order-card__item-name" style="color:var(--c-text-lighter)">+${items.length - 4} more</span><span></span></div>`;

            return `
            <div class="order-card" data-order-id="${order.orderId || ''}">
                <div class="order-card__head">
                    <span class="order-card__id">${order.orderId || '—'}</span>
                    <span class="order-card__date">${_formatOrderDate(order.date)}</span>
                </div>
                <span class="order-card__status order-card__status--${statusKey.toLowerCase()}">${statusKey}</span>
                ${!isCancelled ? _buildTimeline(statusKey) : ''}
                <div class="order-card__items">${itemsHtml}</div>
                <div class="order-card__foot">
                    <span class="order-card__total">₹${order.total || 0}</span>
                    ${isCompleted ? `<button class="order-card__reorder" data-action="panel-reorder" data-order-id="${order.orderId}">🔁 Reorder</button>` : ''}
                </div>
            </div>`;
        }).join('');
    };

    const toggleOrdersPanel = (force) => {
        const panel = $('#ordersPanel');
        const overlay = $('#ordersOverlay');
        if (!panel || !overlay) return;

        const open = force !== undefined ? force : !panel.classList.contains('orders-panel--visible');
        panel.classList.toggle('orders-panel--visible', open);
        overlay.classList.toggle('orders-overlay--visible', open);
        document.body.style.overflow = open ? 'hidden' : '';

        if (open) renderOrdersPanel();
    };

    /* ---------- Public surface ---------- */
    return Object.freeze({
        $, $$,
        renderStats, showSkeleton, renderMenu,
        renderCartBadge, renderCartModal, toggleCart,
        showToast, setActiveTab, setActiveChip,
        setCheckoutStep, getCheckoutStep, setCustomerInfo, getCustomerInfo,
        renderLoyaltyBar,
        renderGreeting,
        renderThemeToggle,
        renderOrdersPanel,
        toggleOrdersPanel,
    });
})();
