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

    const debounce = (fn, ms) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    if (typeof Customer !== 'undefined') {
        const savedTheme = Customer.getTheme();
        document.documentElement.setAttribute('data-theme', savedTheme);
        UI.renderThemeToggle();
    }

    const _initUserSetup = () => {

        const existingName  = localStorage.getItem('pf_customer_name');
        const existingPhone = localStorage.getItem('pf_customer_phone');
        if (existingName && existingPhone) {
            _onSessionReady();
            return;
        }

        const modal    = $('#userSetupModal');
        const nameIn   = $('#setupName');
        const phoneIn  = $('#setupPhone');
        const errEl    = $('#setupError');
        const submitBtn = $('#setupSubmit');
        if (!modal) return;

        requestAnimationFrame(() => modal.classList.add('user-setup--visible'));
        setTimeout(() => { if (nameIn) nameIn.focus(); }, 400);

        const _showErr = (msg) => {
            errEl.textContent = msg;
            errEl.hidden = false;
        };

        const _submit = () => {
            errEl.hidden = true;
            const name  = nameIn.value.trim();
            const phone = phoneIn.value.replace(/\s/g, '');

            if (!name || name.length < 2) {
                _showErr('Name must be at least 2 characters');
                nameIn.focus();
                return;
            }
            if (!/^\d{10}$/.test(phone)) {
                _showErr('Phone must be exactly 10 digits');
                phoneIn.focus();
                return;
            }

            localStorage.setItem('pf_customer_name', name);
            localStorage.setItem('pf_customer_phone', phone);

            if (typeof Customer !== 'undefined') {
                Customer.setName(name);
                Customer.setPhone(phone);
            }

            modal.classList.remove('user-setup--visible');
            setTimeout(() => modal.remove(), 300);

            showToast(`Welcome, ${name}! 🎉`);
            _onSessionReady();
        };

        submitBtn.addEventListener('click', _submit);

        [nameIn, phoneIn].forEach(inp => {
            inp?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') _submit();
            });
        });

    };

    const _onSessionReady = () => {
        UI.renderGreeting();
        UI.renderAuthButton();
        _initCustomerSocket();
        _fetchOrdersByPhone();
    };

    const _showOrderResult = (success, data = {}) => {

        const existing = document.getElementById('orderResultPopup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'orderResultPopup';
        popup.className = `order-popup order-popup--${success ? 'success' : 'error'}`;
        popup.setAttribute('role', 'alertdialog');

        if (success) {
            const showWaBtn = !!data.url;
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
                        <button class="track-btn order-popup__btn--track" onclick="openTrackModal('${data.orderId || ''}')">📍 Track Your Order</button>
                        ${showWaBtn ? `<button class="order-popup__btn order-popup__btn--wa" data-wa-url="${data.url}">💬 Send via WhatsApp</button>` : ''}
                        <button class="order-popup__btn order-popup__btn--close">Close</button>
                    </div>
                    ${data.viaWhatsApp ? '<p class="order-popup__hint">Order sent via WhatsApp — check your chat</p>' : '<p class="order-popup__hint">You\'ll get notified when your order status changes</p>'}
                </div>`;

            /* ── Auto-open track modal 1s after order placed ── */
            if (data.orderId) {
                if (typeof autoOpenTimer !== 'undefined') clearTimeout(autoOpenTimer);
                window.userClosedTracking = false;
                autoOpenTimer = setTimeout(() => {
                    if (!window.userClosedTracking) openTrackModal(data.orderId);
                }, 1000);
            }

            // (rest of popup wiring continues below)
        } else if (data.serverDown && data.url) {

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

        if (state === 'connected') {
            clearTimeout(el._hideTimer);
            el._hideTimer = setTimeout(() => el.classList.add('conn-indicator--hidden'), 3000);
        } else {
            clearTimeout(el._hideTimer);
            el.classList.remove('conn-indicator--hidden');
        }
    };

    document.addEventListener('api:cold-start', () => {
        showToast('⏳ Server waking up — please wait…');
    });

    const _notifySound = new Audio('data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToGAAD+/wIA/P8EAPv/BgD5/wgA9/8KAPb/CwD1/wwA9f8MAPT/DQD0/w0A9P8NAPX/DAD1/wwA9v8LAPX/DADz/w4A8P8RAPD/EQDx/xAA8v8PAPL/DwDy/w8A8P8RAPP/DgD4/wkA+/8GAP3/BAD+/wMA//8CAP//AgD//wIA//8CAP//AgD+/wMA/f8EAPz/BQD7/wYA+v8HAPn/CAD4/wkA+P8JAPj/CQD5/wgA+v8HAPv/BgD8/wUA/f8EAP7/AwD//wIA//8BAP//AQD//wEA//8BAP//AQD//wEAAAAAAAAAAAAA');
    _notifySound.volume = 0.7;

    const _playNotifySound = () => {
        try {
            _notifySound.currentTime = 0;
            _notifySound.play().catch(() => {});
        } catch {  }
    };

    const _notifThrottle = new Map();
    const _THROTTLE_MS = 3000;

    const _shouldNotify = (orderId) => {
        if (!orderId) return true;
        const last = _notifThrottle.get(orderId);
        const now = Date.now();
        if (last && now - last < _THROTTLE_MS) return false;
        _notifThrottle.set(orderId, now);

        if (_notifThrottle.size > 50) {
            for (const [k, v] of _notifThrottle) {
                if (now - v > 30000) _notifThrottle.delete(k);
            }
        }
        return true;
    };

    const _requestNotifPermission = () => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    };

    const _sendPushNotification = (title, body, icon) => {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission !== 'granted') return;
        if (!document.hidden) return;
        try {
            new Notification(title, { body, icon: icon || '🥟', tag: 'pf-order-update' });
        } catch {  }
    };

    document.addEventListener('click', function _reqPerm() {
        _requestNotifPermission();
        document.removeEventListener('click', _reqPerm);
    });

    let _customerSocket = null;
    let _lastOrderId = null;

    const _initCustomerSocket = () => {
        if (typeof io === 'undefined') return;

        const socketUrl = RestaurantConfig.SOCKET_URL;

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

            const phone = localStorage.getItem('pf_customer_phone');
            if (phone) {
                _customerSocket.emit('join-room', phone);
                console.log('[CustomerSocket] Joined room:', phone);
            }
        });

        _customerSocket.on('restaurant:order-status', (data) => {
            if (!data) return;
            console.log('[CustomerSocket] Order status update:', data);
            debug('Socket Status Update', data);
            _showOrderNotification(data);

            if (typeof Customer !== 'undefined' && data.orderId) {
                Customer.updateOrderStatus(data.orderId, data.status);
                UI.renderGreeting();
                UI.renderOrdersPanel();
            }
        });

        _customerSocket.on('restaurant:new-order', (data) => {
            if (!data) return;
            const profile = typeof Customer !== 'undefined' ? Customer.getProfile() : null;
            if (profile && data.phone && data.phone === profile.phone) {
                console.log('[CustomerSocket] New order confirmed:', data);
                if (data.orderId) {
                    Customer.saveOrder({
                        orderId: data.orderId,
                        status: data.status || 'PENDING',
                        total: data.total,
                        items: data.items || [],
                        date: data.date || new Date().toISOString(),
                        customerName: data.customerName,
                        phone: data.phone,
                    });
                    UI.renderGreeting();
                    UI.renderOrdersPanel();
                }
            }
        });

        _customerSocket.on('restaurant:order-updated', (order) => {
            if (!order) return;
            console.log('[CustomerSocket] order-updated:', order._id, order.status);

            UI.updateOrderCard(order);

            const id = order._id || order.orderId;
            const status = (order.status || '').toUpperCase();
            if (typeof Customer !== 'undefined' && id) {
                Customer.updateOrderStatus(id, status);
            }

            // Live-refresh track modal if open for this order
            if (typeof currentTrackedOrderId !== 'undefined'
                && currentTrackedOrderId
                && (order.orderId === currentTrackedOrderId || order._id === currentTrackedOrderId)) {
                renderTrackContent(order);
            }

            if (_shouldNotify(id) && ['PREPARING', 'READY', 'COMPLETED'].includes(status)) {
                _playNotifySound();
                _sendPushNotification('Order Update', `Order is now ${status}`, '🥟');
            }

            _showOrderNotification({ orderId: id, status });
            UI.renderGreeting();
        });

        _customerSocket.on('restaurant:order-deleted', ({ orderId }) => {
            console.log('[CustomerSocket] order-deleted:', orderId);
            const card = document.querySelector(`[data-id="${orderId}"]`);
            if (card) card.remove();
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

        _customerSocket.on('restaurant:menu-updated', () => {
            console.log('[CustomerSocket] Menu updated — clearing cache');
            if (typeof MenuData !== 'undefined' && MenuData.clearCache) {
                MenuData.clearCache();
            }

            MenuData.connectLive().then((result) => {
                if (result.live) {
                    renderStats();
                    renderMenu();
                    showToast('Menu updated! 🔄');
                }
            });
        });
    };

    const _trackOrder = (orderId) => {
        _lastOrderId = orderId;
        localStorage.setItem('pf_last_order', orderId);
    };

    const _fetchOrdersByPhone = async () => {
        if (typeof Api === 'undefined') return;
        const phone = localStorage.getItem('pf_customer_phone');
        if (!phone) {
            console.log('[Orders] No phone in localStorage — skipping fetch');
            return;
        }
        try {
            const res = await Api.fetchOrdersByPhone(phone);
            if (res.ok && Array.isArray(res.data)) {
                console.log('[Orders] Fetched', res.data.length, 'orders for phone:', phone);

                res.data.forEach(order => {
                    Customer.saveOrder({
                        orderId: order.orderId || order._id,
                        _id: order._id,
                        status: (order.status || 'PENDING').toUpperCase(),
                        total: order.total,
                        items: order.items || [],
                        date: order.createdAt || order.date || new Date().toISOString(),
                        customerName: order.customerName,
                        phone: order.phone,
                    });
                });
                UI.renderOrdersPanel();
                UI.renderGreeting();
            } else {
                console.log('[Orders] Fetch failed or empty:', res.error);
            }
        } catch (err) {
            console.warn('[Orders] Fetch error:', err.message);
        }
    };

    const _showOrderNotification = (data) => {
        const statusLabels = {
            PENDING: { icon: '⏳', label: 'Order Received', desc: 'Your order has been received' },
            PREPARING: { icon: '🔥', label: 'Preparing', desc: 'Your order is being prepared!' },
            READY: { icon: '📦', label: 'Ready!', desc: 'Your order is ready for pickup' },
            COMPLETED: { icon: '✅', label: 'Completed', desc: 'Your order is complete — enjoy!' },
            CANCELLED: { icon: '❌', label: 'Cancelled', desc: 'Your order has been cancelled' },
        };

        const info = statusLabels[data.status] || { icon: '📦', label: data.status, desc: 'Order status updated' };
        const customerName = (typeof Customer !== 'undefined' ? Customer.getName() : '') || 'Guest';

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
                    <strong class="order-notif__title">${customerName}, ${info.label}</strong>
                    <span class="order-notif__desc">${info.desc}</span>
                    ${data.orderId ? `<span class="order-notif__id">Order: ${data.orderId}</span>` : ''}
                </div>
                <button class="order-notif__close" aria-label="Dismiss">✕</button>
            </div>`;
        document.body.appendChild(notif);
        requestAnimationFrame(() => notif.classList.add('order-notif--visible'));

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        notif.querySelector('.order-notif__close').addEventListener('click', () => {
            notif.classList.remove('order-notif--visible');
            setTimeout(() => notif.remove(), 300);
        });

        setTimeout(() => {
            if (notif.parentNode) {
                notif.classList.remove('order-notif--visible');
                setTimeout(() => notif.remove(), 300);
            }
        }, 8000);
    };

    State.set('loading', false);
    renderStats();
    renderMenu();

    const savedOrderId = localStorage.getItem('pf_last_order');
    if (savedOrderId) _lastOrderId = savedOrderId;

    _initUserSetup();

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
        const MAX_ATTEMPTS = 40;
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

                    _connectBanner.style.transform = 'translateY(-100%)';
                    setTimeout(() => _connectBanner.remove(), 300);

                    if (typeof hideLoader === 'function') hideLoader();

                    renderStats();
                    if (result.changedIds && result.changedIds.length > 0) {
                        renderMenu();
                    }

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
                if (typeof hideLoader === 'function') hideLoader();
                setTimeout(() => {
                    _connectBanner.style.transform = 'translateY(-100%)';
                    setTimeout(() => _connectBanner.remove(), 300);
                }, 4000);
            }
            return false;
        };

        if (await tryConnect()) return;

        _bgPingTimer = setInterval(() => tryConnect(), PING_MS);
    };

    _backgroundConnect();

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

    (async () => {
        if (typeof Api !== 'undefined' && Api.isAuthenticated()) {
            await Api.fetchProfile();
        }
    })();

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

    $('#menuTabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        State.set('category', tab.dataset.category);
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        updateTabIndicator(tab);
    });

    $('#filterBar').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        State.set('filter', chip.dataset.filter);
    });

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

    $('#cartBtn').addEventListener('click',     () => toggleCart());
    $('#modalOverlay').addEventListener('click', () => toggleCart(false));
    $('#closeCart').addEventListener('click',    () => toggleCart(false));

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

                localStorage.setItem('pf_customer_name', name);
                localStorage.setItem('pf_customer_phone', phone);

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
                if (typeof showLoader === 'function') showLoader('Placing your order...');

                (async () => {
                    try {
                        const result = await Cart.submitOrder(info);

                        if (result.ok && result.source === 'server') {

                            window.__BACKEND_CONNECTED__ = true;

                            if (typeof Customer !== 'undefined') {
                                const { earnedPoints } = Customer.recordOrder(info, result.total, Cart.snapshot());
                                if (earnedPoints > 0) {
                                    showToast(`+${earnedPoints} loyalty points earned!`);
                                }

                                Customer.saveOrder({
                                    orderId: result.orderId,
                                    _id: result._id || null,
                                    status: 'PENDING',
                                    total: result.total,
                                    items: Cart.snapshot(),
                                    date: new Date().toISOString(),
                                    customerName: info.name,
                                    phone: info.phone,
                                });
                                UI.renderGreeting();
                            }

                            if (typeof hideLoader === 'function') hideLoader();
                            _showOrderResult(true, {
                                orderId: result.orderId,
                                total: result.total,
                                name: info.name,

                            });

                            if (result.orderId) _trackOrder(result.orderId);

                            setTimeout(() => {
                                btn.disabled = false;
                                btn.textContent = '✅ Place Order';
                                Cart.clear();
                                UI.setCheckoutStep('cart');
                                toggleCart(false);
                            }, 2000);
                            return;
                        }

                        window.__BACKEND_CONNECTED__ = false;
                        if (typeof hideLoader === 'function') hideLoader();
                        const waData = Cart.sendViaWhatsApp(info);
                        _showOrderResult(false, {
                            error: 'Sorry, our server is temporarily unavailable.',
                            serverDown: true,
                            url: waData.url,
                        });
                        btn.disabled = false;
                        btn.textContent = '✅ Place Order';

                        renderCartModal();

                    } catch (err) {
                        debug('Fatal Error', err);
                        console.error(err);
                        window.__BACKEND_CONNECTED__ = false;
                        if (typeof hideLoader === 'function') hideLoader();
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

                const waInfo = UI.getCustomerInfo();
                if (!Cart.count()) return;

                if (typeof Customer !== 'undefined') {
                    const waTotal = Cart.total();
                    Customer.recordOrder(waInfo, waTotal, Cart.snapshot());
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

                if (typeof Customer !== 'undefined' && Customer.repeatLastOrder()) {
                    showToast('Last order restored!');
                } else {
                    showToast('No previous order found');
                }
                break;
            }
        }
    });

    cartModal.addEventListener('change', (e) => {
        if (e.target.name === 'orderType') {
            const dineIn = $('#dineInFields');
            if (dineIn) dineIn.hidden = e.target.value === 'Takeaway';
            cartModal.querySelectorAll('.order-type-opt').forEach(lbl => {
                lbl.classList.toggle('order-type-opt--active', lbl.querySelector('input').checked);
            });
        }
    });

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

    document.addEventListener('customer:updated', () => {
        UI.renderGreeting();
    });

    document.addEventListener('orders:updated', () => {
        UI.renderGreeting();
    });

    const themeToggle = $('#themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = Customer.getTheme();
            const next = current === 'dark' ? 'light' : 'dark';
            Customer.setTheme(next);
            UI.renderThemeToggle();
            showToast(next === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
        });
    }

    const ordersBtn = $('#ordersBtn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', () => UI.toggleOrdersPanel(true));
    }

    const closeOrders = $('#closeOrders');
    if (closeOrders) {
        closeOrders.addEventListener('click', () => UI.toggleOrdersPanel(false));
    }

    const ordersOverlay = $('#ordersOverlay');
    if (ordersOverlay) {
        ordersOverlay.addEventListener('click', () => UI.toggleOrdersPanel(false));
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = $('#ordersPanel');
            if (panel && panel.classList.contains('orders-panel--visible')) {
                UI.toggleOrdersPanel(false);
            }
        }
    });

    const ordersPanel = $('#ordersPanel');
    if (ordersPanel) {
        ordersPanel.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="panel-reorder"]');
            if (!btn) return;
            const orderId = btn.dataset.orderId;
            const order = Customer.getOrder(orderId);
            if (!order || !order.items || !order.items.length) {
                showToast('No items to reorder');
                return;
            }
            Cart.clear();
            order.items.forEach(i => {
                for (let q = 0; q < (i.quantity || 1); q++) {
                    Cart.add(i.itemId || i.id, i.size, i.price);
                }
            });
            UI.toggleOrdersPanel(false);
            toggleCart(true);
            showToast('Order restored! 🔁');
        });
    }

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.cancel-order');
        if (!btn) return;

        const id = btn.dataset.id;
        if (!id || btn.disabled) return;

        // Set loading state
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="cancel-order__spinner"></span> Cancelling…';
        btn.classList.add('cancel-order--loading');

        try {
            const res = await fetch(`${RestaurantConfig.API_URL}/restaurant/orders/${id}/cancel`, { method: 'PATCH' });

            let json = null;
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                json = await res.json();
            }

            if (!res.ok) {
                const errMsg = (json && (json.message || json.error)) || `Error ${res.status}`;
                showToast(errMsg, 'error');
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.classList.remove('cancel-order--loading');
                return;
            }

            if (typeof Customer !== 'undefined') {
                Customer.updateOrderStatus(id, 'CANCELLED');
            }

            // Instant UI update on the card
            const card = btn.closest('.order-card');
            if (card) {
                UI.updateOrderCard({ _id: id, status: 'CANCELLED' });
            }

            UI.renderOrdersPanel();
            UI.renderGreeting();

            showToast('Order cancelled', 'success');
        } catch (err) {
            console.error('[Cancel] Failed:', err);
            showToast('Failed to cancel — check connection', 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('cancel-order--loading');
        }
    });

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-cancelled');
        if (!btn) return;

        const id = btn.dataset.id;
        if (!id || btn.disabled) return;

        btn.disabled = true;
        btn.innerHTML = '⏳ Deleting…';

        try {
            await fetch(`${RestaurantConfig.API_URL}/restaurant/orders/${id}`, { method: 'DELETE' });

            const card = btn.closest('.order-card');
            if (card) {
                card.style.transition = 'opacity .3s ease, transform .3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 300);
            }

            if (typeof Customer !== 'undefined' && Customer.removeOrder) {
                Customer.removeOrder(id);
            }

            showToast('Cancelled order deleted', 'success');
        } catch (err) {
            console.error('[Delete] Failed:', err);
            btn.disabled = false;
            btn.innerHTML = '🗑 Delete';
            showToast('Failed to delete order');
        }
    });
});
