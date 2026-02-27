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
            const showWaBtn = !!data.url;  /* Only show WhatsApp button if URL provided */
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
                        ${showWaBtn ? `<button class="order-popup__btn order-popup__btn--wa" data-wa-url="${data.url}">💬 Send via WhatsApp</button>` : ''}
                        <button class="order-popup__btn order-popup__btn--close">Close</button>
                    </div>
                    ${data.viaWhatsApp ? '<p class="order-popup__hint">Order sent via WhatsApp — check your chat</p>' : '<p class="order-popup__hint">You\'ll get notified when your order status changes</p>'}
                </div>`;
        } else if (data.serverDown && data.url) {
            /* Server down — show apology with WhatsApp fallback */
            popup.innerHTML = `
                <div class="order-popup__inner">
                    <span class="order-popup__icon">⚠️</span>
                    <h3 class="order-popup__title">Server Issue</h3>
                    <p class="order-popup__sub">Sorry, our server is waking up. You can still order via WhatsApp.</p>
                    <p class="order-popup__hint">Your cart is safe — no items lost</p>
                    <div class="order-popup__actions">
                        <button class="order-popup__btn order-popup__btn--wa" data-wa-url="${data.url}">💬 Order via WhatsApp</button>
                        <button class="order-popup__btn order-popup__btn--close">Close</button>
                    </div>
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

    /* ==========  CONNECTION INDICATOR  ========== */
    const _updateConnectionIndicator = (state) => {
        let el = document.getElementById('connIndicator');
        if (!el) {
            el = document.createElement('div');
            el.id = 'connIndicator';
            el.className = 'conn-indicator';
            document.body.appendChild(el);
        }
        const map = {
            connected:  { dot: '🟢', label: 'Connected',  cls: 'conn-indicator--on' },
            connecting: { dot: '🟡', label: 'Connecting', cls: 'conn-indicator--mid' },
            offline:    { dot: '🔴', label: 'Offline',    cls: 'conn-indicator--off' },
        };
        const info = map[state] || map.offline;
        el.className = `conn-indicator ${info.cls}`;
        el.innerHTML = `${info.dot} <span>${info.label}</span>`;
        /* Auto-hide connected indicator after 3s */
        if (state === 'connected') {
            clearTimeout(el._hideTimer);
            el._hideTimer = setTimeout(() => el.classList.add('conn-indicator--hidden'), 3000);
        } else {
            clearTimeout(el._hideTimer);
            el.classList.remove('conn-indicator--hidden');
        }
    };

    /* ==========  COLD START LISTENER  ========== */
    document.addEventListener('api:cold-start', () => {
        showToast('⏳ Server waking up — please wait…');
    });

    /* ==========  CUSTOMER ORDER NOTIFICATIONS (Socket.IO)  ========== */
    let _customerSocket = null;
    let _lastOrderId = null;

    const _initCustomerSocket = () => {
        if (typeof io === 'undefined') return;

        const socketUrl = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:10000'
            : 'https://anand-os-backend.onrender.com';

        _updateConnectionIndicator('connecting');

        _customerSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 3000,
            reconnectionAttempts: 10,
        });

        _customerSocket.on('connect', () => {
            console.log('[CustomerSocket] Connected');
            debug('Socket Connected');
            _updateConnectionIndicator('connected');
            /* Join room for latest order if we have one */
            if (_lastOrderId) {
                _customerSocket.emit('join:order', _lastOrderId);
            }
        });

        _customerSocket.on('restaurant:order-status', (data) => {
            if (!data) return;
            console.log('[CustomerSocket] Order status update:', data);
            debug('Socket Status Update', data);
            _showOrderNotification(data);
        });

        _customerSocket.on('disconnect', () => {
            console.log('[CustomerSocket] Disconnected');
            debug('Socket Disconnected');
            _updateConnectionIndicator('offline');
        });

        _customerSocket.on('reconnect_attempt', () => {
            _updateConnectionIndicator('connecting');
        });

        _customerSocket.on('connect_error', () => {
            _updateConnectionIndicator('offline');
        });
    };

    const _trackOrder = (orderId) => {
        _lastOrderId = orderId;
        localStorage.setItem('pf_last_order', orderId);
        if (_customerSocket && _customerSocket.connected) {
            _customerSocket.emit('join:order', orderId);
        }
    };

    const _showOrderNotification = (data) => {
        const statusLabels = {
            PENDING: { icon: '⏳', label: 'Order Received', desc: 'Your order has been received' },
            PREPARING: { icon: '🔥', label: 'Preparing', desc: 'Your order is being prepared!' },
            COMPLETED: { icon: '✅', label: 'Ready!', desc: 'Your order is ready for pickup/serving' },
            CANCELLED: { icon: '❌', label: 'Cancelled', desc: 'Your order has been cancelled' },
        };

        const info = statusLabels[data.status] || { icon: '📦', label: data.status, desc: 'Order status updated' };

        /* Remove any existing notification */
        const existing = document.getElementById('orderNotification');
        if (existing) existing.remove();

        const notif = document.createElement('div');
        notif.id = 'orderNotification';
        notif.className = `order-notif order-notif--${(data.status || '').toLowerCase()}`;
        notif.setAttribute('role', 'alert');
        notif.innerHTML = `
            <div class="order-notif__inner">
                <span class="order-notif__icon">${info.icon}</span>
                <div class="order-notif__text">
                    <strong class="order-notif__title">${info.label}</strong>
                    <span class="order-notif__desc">${info.desc}</span>
                    ${data.orderId ? `<span class="order-notif__id">Order: ${data.orderId}</span>` : ''}
                </div>
                <button class="order-notif__close" aria-label="Dismiss">✕</button>
            </div>`;
        document.body.appendChild(notif);
        requestAnimationFrame(() => notif.classList.add('order-notif--visible'));

        /* Vibrate on mobile */
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        /* Dismiss */
        notif.querySelector('.order-notif__close').addEventListener('click', () => {
            notif.classList.remove('order-notif--visible');
            setTimeout(() => notif.remove(), 300);
        });

        /* Auto-dismiss */
        setTimeout(() => {
            if (notif.parentNode) {
                notif.classList.remove('order-notif--visible');
                setTimeout(() => notif.remove(), 300);
            }
        }, 8000);
    };

    /* ==========  INITIAL RENDER (NON-BLOCKING)  ========== */
    /* Render static menu immediately — no skeleton, no waiting for API */
    State.set('loading', false);
    renderStats();
    renderMenu();

    /* Initialize customer Socket.IO for order notifications */
    _initCustomerSocket();

    /* Restore last tracked order ID */
    const savedOrderId = localStorage.getItem('pf_last_order');
    if (savedOrderId) _lastOrderId = savedOrderId;

    /* ==========  NON-BLOCKING BACKGROUND CONNECT  ========== */
    /* While user browses the static menu, silently ping the backend
       every 3 s. Once the server is awake, deep-merge the live menu
       into the running state without resetting cart or scroll. */

    const _connectBanner = (() => {
        const el = document.createElement('div');
        el.id = 'connectBanner';
        Object.assign(el.style, {
            position: 'fixed', top: '0', left: '0', right: '0',
            zIndex: '9999', background: '#fef3c7', color: '#92400e',
            textAlign: 'center', padding: '6px 16px',
            fontSize: '13px', fontWeight: '500',
            transform: 'translateY(-100%)', transition: 'transform 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        });
        el.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;animation:cbPulse 1.5s infinite"></span> Connecting to live server…';

        /* Add pulse keyframe once */
        if (!document.getElementById('cbPulseStyle')) {
            const s = document.createElement('style');
            s.id = 'cbPulseStyle';
            s.textContent = '@keyframes cbPulse{0%,100%{opacity:1}50%{opacity:.3}}';
            document.head.appendChild(s);
        }

        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.transform = 'translateY(0)'; });
        return el;
    })();

    let _bgPingTimer = null;
    let _isPinging = false;

    const _backgroundConnect = async () => {
        const PING_MS = 3000;
        const MAX_ATTEMPTS = 40; /* ~2 min max */
        let attempts = 0;

        const tryConnect = async () => {
            if (_isPinging) return false;
            _isPinging = true;
            attempts++;

            try {
                const result = await MenuData.connectLive();
                if (result.live) {
                    console.log('[live] Connected! Changed items:', result.changedIds?.length || 0);
                    window.__BACKEND_CONNECTED__ = true;
                    clearInterval(_bgPingTimer);
                    _bgPingTimer = null;

                    /* Remove banner smoothly */
                    _connectBanner.style.transform = 'translateY(-100%)';
                    setTimeout(() => _connectBanner.remove(), 300);

                    /* Refresh stats & menu (preserves cart & scroll) */
                    renderStats();
                    if (result.changedIds && result.changedIds.length > 0) {
                        renderMenu();
                    }
                    /* Re-render cart to hide WhatsApp fallback button */
                    renderCartModal();
                    return true;
                }
            } catch (err) {
                console.log(`[live] Attempt ${attempts} failed:`, err.message);
            } finally {
                _isPinging = false;
            }

            if (attempts >= MAX_ATTEMPTS) {
                console.warn('[live] Gave up after', MAX_ATTEMPTS, 'attempts');
                clearInterval(_bgPingTimer);
                _bgPingTimer = null;
                _connectBanner.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444"></span> Offline — using cached menu';
                setTimeout(() => {
                    _connectBanner.style.transform = 'translateY(-100%)';
                    setTimeout(() => _connectBanner.remove(), 300);
                }, 4000);
            }
            return false;
        };

        /* First attempt immediately */
        if (await tryConnect()) return;

        /* Keep pinging */
        _bgPingTimer = setInterval(() => tryConnect(), PING_MS);
    };

    _backgroundConnect();

    /* ==========  BACKEND STATUS PING (Step 2)  ========== */
    /* Proactively detect backend status via GET /api/restaurant/stats.
       This sets __BACKEND_CONNECTED__ BEFORE user reaches checkout. */
    (async () => {
        if (typeof Api === 'undefined') return;
        debug('Checking Backend Connection');
        try {
            const res = await Api.request('/api/restaurant/stats');
            const isSuccess = res?.success ?? res?.ok;
            console.log('[BackendPing] Stats response:', { isSuccess, res });
            if (isSuccess) {
                window.__BACKEND_CONNECTED__ = true;
                console.log('[BackendPing] Backend is connected');
                debug('Backend Connected');
                /* Re-render cart modal if open, to hide WhatsApp button */
                renderCartModal();
            } else {
                window.__BACKEND_CONNECTED__ = false;
                console.log('[BackendPing] Backend returned non-success');
                debug('Backend Disconnected');
            }
        } catch (err) {
            window.__BACKEND_CONNECTED__ = false;
            console.log('[BackendPing] Backend unreachable:', err.message);
            debug('Backend Disconnected');
        }
    })();

    // Fetch loyalty profile if authenticated
    (async () => {
        if (typeof Api !== 'undefined' && Api.isAuthenticated()) {
            const res = await Api.fetchProfile();
            const isSuccess = res?.success ?? res?.ok;
            if (isSuccess && res.data) {
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
        const itemId   = id;
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
        const itemId = id;
        const numPrice = Number(price);

        switch (action) {
            case 'cart-modal-inc':
                Cart.update(itemId, size, numPrice, 1);
                break;
            case 'cart-modal-dec':
                Cart.update(itemId, size, numPrice, -1);
                break;
            case 'suggest-add':
                Cart.add(itemId, size, numPrice);
                showToast(`Added ${MenuData.findById(itemId)?.name || 'item'}`);
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

                        if (result.ok && result.source === 'server') {
                            /* === Backend accepted the order === */
                            window.__BACKEND_CONNECTED__ = true;

                            /* Save customer data + loyalty points */
                            if (typeof Customer !== 'undefined') {
                                const { earnedPoints } = Customer.recordOrder(info, result.total, Cart.snapshot());
                                if (earnedPoints > 0) {
                                    showToast(`+${earnedPoints} loyalty points earned!`);
                                }
                                UI.renderLoyaltyBar(null); /* re-render from localStorage */
                            }

                            _showOrderResult(true, {
                                orderId: result.orderId,
                                total: result.total,
                                name: info.name,
                                /* No url → WhatsApp button hidden in popup */
                            });

                            if (result.orderId) _trackOrder(result.orderId);

                            // Refresh loyalty data
                            if (typeof Api !== 'undefined' && Api.isAuthenticated()) {
                                Api.fetchProfile().then(res => {
                                    const profOk = res?.success ?? res?.ok;
                                    if (profOk && res.data) UI.renderLoyaltyBar(res.data);
                                });
                            }

                            setTimeout(() => {
                                btn.disabled = false;
                                btn.textContent = '✅ Place Order';
                                Cart.clear();
                                UI.setCheckoutStep('cart');
                                toggleCart(false);
                            }, 2000);
                            return;
                        }

                        /* === Backend failed — show apology popup with WhatsApp fallback === */
                        window.__BACKEND_CONNECTED__ = false;
                        const waData = Cart.sendViaWhatsApp(info);
                        _showOrderResult(false, {
                            error: 'Sorry, our server is temporarily unavailable.',
                            serverDown: true,
                            url: waData.url,
                        });
                        btn.disabled = false;
                        btn.textContent = '✅ Place Order';
                        /* Re-render cart to show WhatsApp button */
                        renderCartModal();

                    } catch (err) {
                        debug('Fatal Error', err);
                        console.error(err);
                        window.__BACKEND_CONNECTED__ = false;
                        const waData = Cart.sendViaWhatsApp(info);
                        _showOrderResult(false, {
                            error: 'Sorry, our server is temporarily unavailable.',
                            serverDown: true,
                            url: waData.url,
                        });
                        btn.disabled = false;
                        btn.textContent = '✅ Place Order';
                        renderCartModal();
                    }
                })();
                break;
            }
            case 'checkout-wa': {
                /* Direct WhatsApp send — bypasses backend entirely */
                const waInfo = UI.getCustomerInfo();
                if (!Cart.count()) return;

                /* Save customer data + loyalty points even for WhatsApp orders */
                if (typeof Customer !== 'undefined') {
                    const waTotal = Cart.total();
                    Customer.recordOrder(waInfo, waTotal, Cart.snapshot());
                    UI.renderLoyaltyBar(null);
                }

                const waResult = Cart.sendViaWhatsApp(waInfo);
                if (waResult.url) {
                    window.open(waResult.url, '_blank');
                    showToast('Opening WhatsApp…');
                    _showOrderResult(true, {
                        orderId: waResult.orderId,
                        total: waResult.total,
                        name: waInfo.name,
                        url: waResult.url,
                        viaWhatsApp: true,
                    });
                }
                break;
            }
            case 'repeat-order': {
                /* Restore last order from Customer localStorage */
                if (typeof Customer !== 'undefined' && Customer.repeatLastOrder()) {
                    showToast('Last order restored!');
                } else {
                    showToast('No previous order found');
                }
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

    /* ==========  LOYALTY BAR  ========== */
    /* Render from localStorage first, then overlay API data if authenticated */
    UI.renderLoyaltyBar(null);

    /* Listen for customer updates (order placed) to refresh bar */
    document.addEventListener('customer:updated', () => {
        UI.renderLoyaltyBar(null);
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('#googleLoginBtn')) {
            showToast('Rewards coming soon!');
        }
    });
});
