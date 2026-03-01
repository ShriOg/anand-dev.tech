'use strict';

const UI = (() => {

    const $ = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => ctx.querySelectorAll(s);

    const _prevQty = new Map();
    let _lastCartCount = 0;
    let _checkoutStep = 'cart';
    let _customerInfo = {};

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

        if (_checkoutStep === 'form') {
            debug('Checkout Step', 'form');
            if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">📋</span> Details';
            _renderCheckoutForm(listEl, footerEl);
            return;
        }

        if (_checkoutStep === 'summary') {
            debug('Checkout Step', 'summary');
            if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">📦</span> Summary';
            _renderOrderSummary(listEl, footerEl);
            return;
        }

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

    const _renderCheckoutForm = (listEl, footerEl) => {

        const saved = (typeof Customer !== 'undefined') ? Customer.getProfile() : null;
        const lsName = localStorage.getItem('pf_customer_name') || '';
        const lsPhone = localStorage.getItem('pf_customer_phone') || '';
        const ci = {
            name: _customerInfo.name || saved?.name || lsName || '',
            phone: _customerInfo.phone || saved?.phone || lsPhone || '',
            orderType: _customerInfo.orderType || '',
            persons: _customerInfo.persons || '',
            table: _customerInfo.table || '',
            note: _customerInfo.note || '',
        };
        const phoneIsStored = !!lsPhone;
        listEl.innerHTML = `
        <div class="checkout-form">
            <div class="form-group">
                <label class="form-label" for="custName">Name *</label>
                <input type="text" id="custName" class="form-input" placeholder="Your name" required autocomplete="name" value="${ci.name || ''}">
            </div>
            <div class="form-group">
                <label class="form-label" for="custPhone">Phone *</label>
                <input type="tel" id="custPhone" class="form-input${phoneIsStored ? ' readonly-phone' : ''}" placeholder="10-digit number" maxlength="10" required autocomplete="tel" value="${ci.phone || ''}"${phoneIsStored ? ' readonly' : ''}>
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

    const renderGreeting = () => {
        const bar = $('#greetingBar');
        if (!bar) return;

        const name = localStorage.getItem('pf_customer_name') || '';

        if (!name) {
            bar.hidden = true;
            return;
        }

        bar.hidden = false;
        const hi = $('#greetingHi');
        const sub = $('#greetingSub');
        const dot = $('#orderDot');

        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

        if (hi) hi.textContent = `${greeting}, ${name} 👋`;
        if (sub) {
            const loyalty = (typeof Customer !== 'undefined') ? Customer.getLoyaltyData() : null;
            const pts = loyalty?.points || 0;
            const orders = loyalty?.orders || 0;
            sub.textContent = pts > 0 ? `⭐ ${pts} pts · 🏅 ${orders} orders` : 'Ready to order something delicious?';
        }
        if (dot && typeof Customer !== 'undefined') {
            dot.classList.toggle('greeting__order-dot--active', Customer.hasActiveOrders());
        }
    };

    const renderAuthButton = () => {
        const btn = $('#heroAuthBtn');
        if (!btn) return;
        const name = Customer.getName();
        if (name) {

            const initial = name.charAt(0).toUpperCase();
            btn.className = 'hero__auth hero__auth--profile';
            btn.innerHTML = `<span class="hero__auth-avatar">${initial}</span>`;
            btn.setAttribute('aria-label', name);
            btn.title = name;
        } else {

            btn.className = 'hero__auth';
            btn.innerHTML = '✏️ Sign Up';
            btn.setAttribute('aria-label', 'Sign Up');
            btn.title = '';
        }
    };

    const renderThemeToggle = () => {
        const btn = $('#themeToggle');
        if (!btn) return;
        const theme = Customer.getTheme();
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    };

    const _buildTimeline = (status, order) => {
        // ═══════════════════════════════════════════════
        // 3-STAGE PROGRESS SYSTEM
        // UI:   Pending → Accepted → Served
        // Maps: Pending → Preparing → Completed
        // Cancelled = terminal override
        // Uses ORDER_STATUS constants (Title Case)
        // ═══════════════════════════════════════════════
        const normalized = normalizeStatus(status);
        const STAGES = [
            { key: ORDER_STATUS.PENDING,   label: STATUS_LABELS[ORDER_STATUS.PENDING],   icon: '⏳' },
            { key: ORDER_STATUS.PREPARING, label: STATUS_LABELS[ORDER_STATUS.PREPARING], icon: '🔥' },
            { key: ORDER_STATUS.COMPLETED, label: STATUS_LABELS[ORDER_STATUS.COMPLETED], icon: '✅' },
        ];
        const STAGE_INDEX = {};
        STAGES.forEach((s, i) => { STAGE_INDEX[s.key] = i; });
        STAGE_INDEX[ORDER_STATUS.CANCELLED] = -1;

        const totalStages = STAGES.length;
        const currentIdx = STAGE_INDEX[normalized] ?? -1;
        const isCancelled = normalized === ORDER_STATUS.CANCELLED;
        const isCompleted = normalized === ORDER_STATUS.COMPLETED;
        const isPreparing = normalized === ORDER_STATUS.PREPARING;

        // Dynamic percentage: (currentStageIndex / (totalStages - 1)) * 100
        let progressPct = 0;
        if (isCancelled) {
            progressPct = 100; // full red fill
        } else if (currentIdx >= 0) {
            progressPct = Math.round((currentIdx / (totalStages - 1)) * 100);
        }

        // Determine fill modifier class
        let fillModifier = '';
        if (isCancelled)       fillModifier = ' order-progress__fill--cancelled';
        else if (isCompleted)  fillModifier = ' order-progress__fill--done';
        else if (isPreparing)  fillModifier = ' order-progress__fill--preparing';

        // Determine card-level modifiers
        const cardModifiers = isCancelled ? ' order-progress--cancelled' : '';

        let html = '';

        // ── Progress bar ──
        html += `<div class="order-progress${cardModifiers}">
            <div class="order-progress__fill${fillModifier}" style="width:${progressPct}%" data-progress></div>
        </div>`;

        // ── Cancelled terminal state ──
        if (isCancelled) {
            html += `<div class="order-cancelled-badge">
                <span class="order-cancelled-badge__icon">✕</span>
                <span class="order-cancelled-badge__text">Cancelled</span>
            </div>`;
            return `<div class="order-timeline order-timeline--cancelled">${html}</div>`;
        }

        // ── Completion time display ──
        if (isCompleted && order) {
            const completionInfo = _calcCompletionTime(order);
            if (completionInfo) {
                html += `<div class="order-completion-time">
                    <span class="order-completion-time__icon">✅</span>
                    <span class="order-completion-time__text">${completionInfo}</span>
                </div>`;
            }
        }

        // ── Countdown timer placeholder (for Pending / Preparing) ──
        if (!isCompleted && order) {
            const orderId = order._id || order.orderId || '';
            html += `<div class="order-countdown" data-countdown-id="${orderId}"></div>`;
        }

        // ── Timeline steps ──
        STAGES.forEach((stage, i) => {
            const stageIdx = STAGE_INDEX[stage.key];
            const isDone   = currentIdx > stageIdx;
            const isActive = currentIdx === stageIdx;

            let dotClass = '';
            let labelClass = '';
            if (isDone) {
                dotClass = 'order-timeline__dot--done';
                labelClass = 'order-timeline__label--done';
            } else if (isActive) {
                dotClass = 'order-timeline__dot--active';
                labelClass = 'order-timeline__label--active';
                // Pulse effect on Accepted stage
                if (stage.key === ORDER_STATUS.PREPARING) {
                    labelClass += ' order-timeline__label--pulse';
                }
            }

            html += `<div class="order-timeline__step">
                <div class="order-timeline__dot ${dotClass}">${isDone ? '✓' : isActive ? stage.icon : ''}</div>
                <span class="order-timeline__label ${labelClass}">${stage.label}</span>
            </div>`;

            if (i < STAGES.length - 1) {
                let lineClass = '';
                if (isDone) lineClass = 'order-timeline__line--done';
                else if (isActive) lineClass = 'order-timeline__line--active';
                // Shimmer on active line when Preparing
                if (isActive && stage.key === ORDER_STATUS.PREPARING) {
                    lineClass += ' order-timeline__line--shimmer';
                }
                html += `<div class="order-timeline__line ${lineClass}"></div>`;
            }
        });

        return `<div class="order-timeline">${html}</div>`;
    };

    // ═══════════════════════════════════════════════
    // COMPLETION TIME CALCULATOR
    // ═══════════════════════════════════════════════
    const _calcCompletionTime = (order) => {
        const start = order.date || order.createdAt;
        const end   = order.updatedAt || order.completedAt;
        if (!start) return null;

        const startTime = new Date(start).getTime();
        const endTime   = end ? new Date(end).getTime() : Date.now();
        const diffMs    = endTime - startTime;

        if (diffMs < 0 || isNaN(diffMs)) return null;

        const totalMins = Math.round(diffMs / 60000);
        if (totalMins < 1) return 'Completed in <1 min';
        if (totalMins === 1) return 'Completed in 1 min';
        return `Completed in ${totalMins} mins`;
    };

    // ═══════════════════════════════════════════════
    // LIVE COUNTDOWN TIMER MANAGER
    // ═══════════════════════════════════════════════
    const _countdownTimers = new Map(); // orderId → intervalId
    const DEFAULT_EST_MINUTES = 15;

    const _startCountdown = (orderId, order) => {
        // Prevent duplicate timers
        _stopCountdown(orderId);

        const status = normalizeStatus(order.status);
        // Don't start for terminal states
        if (status === ORDER_STATUS.COMPLETED || status === ORDER_STATUS.CANCELLED) return;

        const el = document.querySelector(`[data-countdown-id="${orderId}"]`);
        if (!el) return;

        const createdAt = new Date(order.date || order.createdAt || Date.now()).getTime();
        const estMinutes = order.estimatedMinutes || DEFAULT_EST_MINUTES;
        const estimatedEnd = createdAt + (estMinutes * 60000);

        const tick = () => {
            const now = Date.now();
            const remaining = estimatedEnd - now;

            // Re-check if element still in DOM
            if (!el.isConnected) {
                _stopCountdown(orderId);
                return;
            }

            if (remaining <= 0) {
                // Timer expired but not completed yet
                el.innerHTML = `<span class="order-countdown__icon">⏳</span>
                    <span class="order-countdown__text order-countdown__text--finishing">Finishing up…</span>`;
                _stopCountdown(orderId);
                return;
            }

            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            const isUrgent = remaining < 120000; // < 2 min

            el.innerHTML = `<span class="order-countdown__icon">⏱</span>
                <span class="order-countdown__text${isUrgent ? ' order-countdown__text--urgent' : ''}">~${display} remaining</span>`;
        };

        // Immediate first tick
        tick();

        // Tick every second
        const intervalId = setInterval(tick, 1000);
        _countdownTimers.set(orderId, intervalId);
    };

    const _stopCountdown = (orderId) => {
        const timerId = _countdownTimers.get(orderId);
        if (timerId) {
            clearInterval(timerId);
            _countdownTimers.delete(orderId);
        }
    };

    const _stopAllCountdowns = () => {
        _countdownTimers.forEach((timerId) => clearInterval(timerId));
        _countdownTimers.clear();
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

        // Stop all existing countdowns before re-rendering
        _stopAllCountdowns();

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
            const statusKey = normalizeStatus(order.status);
            const displayLabel = STATUS_LABELS[statusKey] || statusKey;
            const isPending   = statusKey === ORDER_STATUS.PENDING;
            const isCancelled = statusKey === ORDER_STATUS.CANCELLED;
            const isCompleted = statusKey === ORDER_STATUS.COMPLETED;
            const items = order.items || [];

            let itemsHtml = items.slice(0, 4).map(i =>
                `<div class="order-card__item">
                    <span class="order-card__item-name">${i.name || 'Item'}</span>
                    <span class="order-card__item-qty">${i.size ? i.size + ' × ' : ''}${i.quantity || 1}</span>
                </div>`
            ).join('');
            if (items.length > 4) itemsHtml += `<div class="order-card__item"><span class="order-card__item-name" style="color:var(--c-text-lighter)">+${items.length - 4} more</span><span></span></div>`;

            return `
            <div class="order-card${isCancelled ? ' order-card--cancelled' : ''}${isCompleted ? ' order-card--completed' : ''}" data-order-id="${order.orderId || ''}" data-id="${order._id || ''}" data-status="${statusKey}">
                <div class="order-card__head">
                    <span class="order-card__id">${order.orderId || '—'}</span>
                    <span class="order-card__date">${_formatOrderDate(order.date)}</span>
                </div>
                <span class="order-card__status order-status order-card__status--${statusKey.toLowerCase()}">${displayLabel}</span>
                ${_buildTimeline(statusKey, order)}
                <div class="order-card__items">${itemsHtml}</div>
                <div class="order-card__foot">
                    <span class="order-card__total">₹${order.total || 0}</span>
                    <div class="order-card__foot-actions">
                        ${isPending ? `<button class="cancel-order" data-id="${order._id || order.orderId}">✕ Cancel</button>` : ''}
                        ${isCompleted ? `<button class="order-card__reorder" data-action="panel-reorder" data-order-id="${order.orderId}">🔁 Reorder</button>` : ''}
                        ${isCancelled ? `<button class="delete-cancelled" data-id="${order._id || order.orderId}">🗑 Delete</button>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');

        // Start countdowns for active orders after DOM renders
        requestAnimationFrame(() => {
            orders.forEach(order => {
                const statusKey = normalizeStatus(order.status);
                if (statusKey !== ORDER_STATUS.COMPLETED && statusKey !== ORDER_STATUS.CANCELLED) {
                    const orderId = order._id || order.orderId;
                    if (orderId) _startCountdown(orderId, order);
                }
            });
        });
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

    const updateOrderCard = (order) => {
        if (!order) return;
        const id = order._id;
        if (!id) return;

        const card = document.querySelector(`[data-id="${id}"]`);
        if (!card) return;

        const statusKey = normalizeStatus(order.status);
        const isCancelled = statusKey === ORDER_STATUS.CANCELLED;
        const isCompleted = statusKey === ORDER_STATUS.COMPLETED;
        const isPreparing = statusKey === ORDER_STATUS.PREPARING;

        // ── 3-stage index mapping ──
        const STAGE_INDEX = {
            [ORDER_STATUS.PENDING]: 0,
            [ORDER_STATUS.PREPARING]: 1,
            [ORDER_STATUS.COMPLETED]: 2,
            [ORDER_STATUS.CANCELLED]: -1,
        };
        const totalStages = 3;
        const currentIdx = STAGE_INDEX[statusKey] ?? -1;

        // Update badge with display label
        const badge = card.querySelector('.order-status');
        if (badge) {
            badge.textContent = STATUS_LABELS[statusKey] || statusKey;
            badge.className = `order-card__status order-status order-card__status--${statusKey.toLowerCase()}`;
        }

        // Update data-status attribute
        card.dataset.status = statusKey;

        // ── Update progress fill dynamically ──
        const progressFill = card.querySelector('[data-progress]');
        if (progressFill) {
            let pct = 0;
            if (isCancelled) {
                pct = 100;
                progressFill.className = 'order-progress__fill order-progress__fill--cancelled';
                progressFill.closest('.order-progress')?.classList.add('order-progress--cancelled');
            } else if (currentIdx >= 0) {
                pct = Math.round((currentIdx / (totalStages - 1)) * 100);
                progressFill.classList.remove('order-progress__fill--cancelled');
                progressFill.closest('.order-progress')?.classList.remove('order-progress--cancelled');

                if (isCompleted) {
                    progressFill.className = 'order-progress__fill order-progress__fill--done';
                } else if (isPreparing) {
                    progressFill.className = 'order-progress__fill order-progress__fill--preparing';
                } else {
                    progressFill.className = 'order-progress__fill';
                }
            }
            progressFill.style.width = `${pct}%`;
        }

        // ── Replace full timeline (handles completion time, countdown, steps) ──
        const timeline = card.querySelector('.order-timeline');
        if (timeline) {
            // Stop countdown for this order before replacing DOM
            _stopCountdown(id);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = _buildTimeline(statusKey, order);
            const newTimeline = tempDiv.querySelector('.order-timeline');
            if (newTimeline) timeline.replaceWith(newTimeline);

            // Start new countdown if still active
            if (!isCompleted && !isCancelled) {
                requestAnimationFrame(() => _startCountdown(id, order));
            }
        }

        // ── Update footer actions ──
        const footActions = card.querySelector('.order-card__foot-actions');
        if (footActions) {
            let actionsHtml = '';
            if (statusKey === ORDER_STATUS.PENDING) {
                actionsHtml = `<button class="cancel-order" data-id="${id}">✕ Cancel</button>`;
            } else if (isCompleted) {
                const orderId = card.dataset.orderId || '';
                actionsHtml = `<button class="order-card__reorder" data-action="panel-reorder" data-order-id="${orderId}">🔁 Reorder</button>`;
            } else if (isCancelled) {
                actionsHtml = `<button class="delete-cancelled" data-id="${id}">🗑 Delete</button>`;
            }
            footActions.innerHTML = actionsHtml;
        }

        // ── Card-level class modifiers ──
        card.classList.toggle('order-card--cancelled', isCancelled);
        card.classList.toggle('order-card--completed', isCompleted);

        // ── Stop countdown for terminal states ──
        if (isCompleted || isCancelled) {
            _stopCountdown(id);
        }

        // ── Pulse animation ──
        card.classList.add('pulse');
        setTimeout(() => card.classList.remove('pulse'), 600);

        if (isCompleted) {
            setTimeout(() => {
                if (card.parentNode) {
                    card.classList.add('order-card--collapsed');
                    setTimeout(() => {
                        if (card.parentNode) card.parentNode.appendChild(card);
                    }, 600);
                }
            }, 10000);
        }
    };

    return Object.freeze({
        $, $$,
        renderStats, showSkeleton, renderMenu,
        renderCartBadge, renderCartModal, toggleCart,
        showToast, setActiveTab, setActiveChip,
        setCheckoutStep, getCheckoutStep, setCustomerInfo, getCustomerInfo,
        renderAuthButton,
        renderGreeting,
        renderThemeToggle,
        renderOrdersPanel,
        toggleOrdersPanel,
        updateOrderCard,
    });
})();
