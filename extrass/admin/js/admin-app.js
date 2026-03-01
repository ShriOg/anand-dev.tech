'use strict';
console.log('[Admin] admin-app.js loaded');

(function adminPWA() {

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/extrass/admin/sw.js', {
                scope: '/extrass/admin/'
            })
            .then(() => console.log('[Admin] PWA Service Worker registered'))
            .catch(err => console.error('[Admin] SW registration failed', err));
    }

    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.querySelector('#adminInstallBtn');
        if (installBtn) installBtn.style.display = 'inline-flex';
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'adminInstallBtn') {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(choice => {
                    console.log('[Admin] Install:', choice.outcome);
                    deferredPrompt = null;
                    const btn = document.querySelector('#adminInstallBtn');
                    if (btn) btn.style.display = 'none';
                });
            }
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log('[Admin] PWA installed successfully');
        const btn = document.querySelector('#adminInstallBtn');
        if (btn) btn.style.display = 'none';
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] DOMContentLoaded fired');

    if (typeof AdminUI === 'undefined') {
        console.error('[Admin] FATAL: AdminUI not loaded — check script order in HTML.');
        return;
    }
    if (typeof AdminAPI === 'undefined') {
        console.error('[Admin] FATAL: AdminAPI not loaded — check script order in HTML.');
        return;
    }

    const { $, $$, showToast, showConfirm,
            switchPage, updateSocketStatus, renderStats, renderRecentOrders,
            renderOrderCards, prependOrderCard, updateOrderCard, renderHistoryTable, renderPagination,
            renderMenuItems, drawBarChart, drawLineChart, renderTopItems, renderAnalyticsKPI,
            highlightTopSelling, playNotifSound, animateCounter,
            exportOrdersCSV } = AdminUI;

    let currentPage = 'dashboard';
    let liveOrders = [];
    let historyPage = 1;
    let historyTotal = 1;
    let allHistoryOrders = [];
    let menuItems = [];
    let menuCategories = [];
    let pendingCount = 0;
    let statsRefreshTimer = null;

    const HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    const GATE_KEY = 'adminUnlocked';

    async function sha256(text) {

        if (crypto.subtle) {
            const encoded = new TextEncoder().encode(text);
            const buffer = await crypto.subtle.digest('SHA-256', encoded);
            return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        return _sha256Fallback(text);
    }

    function _sha256Fallback(str) {
        const K = [
            0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
            0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
            0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
            0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
            0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
            0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
            0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
            0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
        ];
        let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
        const rr = (x,n) => (x>>>n)|(x<<(32-n));
        const bytes = new TextEncoder().encode(str);
        const bits = bytes.length * 8;
        const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
        padded.set(bytes); padded[bytes.length] = 0x80;
        const dv = new DataView(padded.buffer);
        dv.setUint32(padded.length - 4, bits, false);
        for (let off = 0; off < padded.length; off += 64) {
            const W = new Uint32Array(64);
            for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4, false);
            for (let i = 16; i < 64; i++) {
                const s0 = rr(W[i-15],7)^rr(W[i-15],18)^(W[i-15]>>>3);
                const s1 = rr(W[i-2],17)^rr(W[i-2],19)^(W[i-2]>>>10);
                W[i] = (W[i-16]+s0+W[i-7]+s1)|0;
            }
            let [a,b,c,d,e,f,g,h] = H;
            for (let i = 0; i < 64; i++) {
                const S1 = rr(e,6)^rr(e,11)^rr(e,25);
                const ch = (e&f)^(~e&g);
                const t1 = (h+S1+ch+K[i]+W[i])|0;
                const S0 = rr(a,2)^rr(a,13)^rr(a,22);
                const maj = (a&b)^(a&c)^(b&c);
                const t2 = (S0+maj)|0;
                h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
            }
            H = [H[0]+a|0,H[1]+b|0,H[2]+c|0,H[3]+d|0,H[4]+e|0,H[5]+f|0,H[6]+g|0,H[7]+h|0];
        }
        return H.map(v => (v>>>0).toString(16).padStart(8,'0')).join('');
    }

    function showGate() {
        const gate = $('#gate');
        const layout = $('#layout');
        const sidebar = $('#sidebar');
        gate.hidden = false;
        layout.hidden = true;
        sidebar.hidden = true;
    }

    function hideGate() {
        const gate = $('#gate');
        const layout = $('#layout');
        const sidebar = $('#sidebar');
        gate.hidden = true;
        layout.hidden = false;
        sidebar.hidden = false;
    }

    if (sessionStorage.getItem(GATE_KEY)) {
        hideGate();
        try { init(); } catch (err) { console.error('[Admin] Boot failed (session restore):', err); }
    } else {
        showGate();
    }

    $('#gateForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = $('#gatePassword');
        const error = $('#gateError');
        const btn = e.target.querySelector('.gate__btn');
        const pw = input.value;

        if (!pw) return;

        btn.disabled = true;
        btn.textContent = 'Verifying…';

        const hash = await sha256(pw);
        console.log('[gate] hash:', hash);

        if (hash === HASH) {
            sessionStorage.setItem(GATE_KEY, '1');
            input.classList.remove('gate__input--shake');
            error.hidden = true;
            hideGate();
            try { init(); } catch (err) { console.error('[Admin] Boot failed (gate unlock):', err); }
        } else {
            error.hidden = false;
            input.value = '';
            input.focus();
            input.classList.remove('gate__input--shake');
            void input.offsetWidth;
            input.classList.add('gate__input--shake');
            btn.disabled = false;
            btn.textContent = 'Unlock →';
        }
    });

    $('#togglePw')?.addEventListener('click', () => {
        const input = $('#gatePassword');
        const btn = $('#togglePw');
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
            btn.setAttribute('aria-label', 'Hide password');
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
            btn.setAttribute('aria-label', 'Show password');
        }
        input.focus();
    });

    function init() {
        console.log('[Admin] init() — booting admin panel…');
        debug('Admin Booted');

        window.addEventListener('error', (e) => {
            console.error('[Admin] Uncaught error:', e.error || e.message);
            showToast('Something went wrong — check console', 'error');
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error('[Admin] Unhandled rejection:', e.reason);
            showToast('Async error — check console', 'error');
        });

        document.addEventListener('click', (e) => {
            const el = e.target.closest('button, select, [data-action], [data-page], [data-goto], .toggle, .tool-btn');
            if (!el) return;
            debug('Click', { tag: el.tagName, id: el.id || undefined, classes: (el.className || '').split?.(' ')?.[0], ...el.dataset });
        }, true);

        const pageContainer = $('#pageContainer');
        const topbar = document.querySelector('.topbar');
        if (pageContainer && topbar) {
            window.addEventListener('scroll', () => {
                topbar.classList.toggle('topbar--scrolled', window.scrollY > 4);
            }, { passive: true });
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }

        try {

            AdminSocket.connect();
            console.log('[Admin] ✓ Socket initialised');
        } catch (err) {
            console.error('[Admin] ✗ Socket connect failed:', err);
        }

        document.addEventListener('admin:cold-start', () => {
            showToast('⏳ Server waking up — hang tight…', 'info');
            _showWakingBanner(true);
        });

        loadDashboard();

        statsRefreshTimer = setInterval(loadDashboard, 30000);

        const wireFns = [
            ['Navigation',   wireNavigation],
            ['OrderEvents',  wireOrderEvents],
            ['HistoryEvents',wireHistoryEvents],
            ['MenuEvents',   wireMenuEvents],
            ['Theme',        wireTheme],
            ['Sidebar',      wireSidebar],
        ];

        for (const [label, fn] of wireFns) {
            try {
                fn();
                console.log(`[Admin] ✓ wire${label}`);
            } catch (err) {
                console.error(`[Admin] ✗ wire${label} failed:`, err);
            }
        }

        console.log('[Admin] init() complete ✓');
    }

    function _showWakingBanner(show) {
        let banner = $('#coldStartBanner');
        if (show && !banner) {
            banner = document.createElement('div');
            banner.id = 'coldStartBanner';
            banner.className = 'cold-banner';
            banner.innerHTML = '⏳ Backend server is waking up (free-tier cold start). Data will load in a few seconds…';
            const container = $('#pageContainer');
            if (container) container.prepend(banner);
        }
        if (!show && banner) {
            banner.remove();
        }
    }

    async function loadDashboard() {
        console.log('[Admin] loadDashboard()');
        debug('Fetching Stats');
        try {
            const [statsRes, recentRes] = await Promise.all([
                AdminAPI.getStats(),
                AdminAPI.getRecentOrders(5),
            ]);
            console.log('[Admin] Stats response:', statsRes);
            console.log('[Admin] Recent orders response:', recentRes);
            _showWakingBanner(false);

            const stats = statsRes?.data || statsRes;
            debug('Stats Data', stats);
            renderStats(stats);
            const recentPayload = recentRes?.data || recentRes;
            const recent = Array.isArray(recentPayload) ? recentPayload : (recentPayload?.orders || []);
            console.log('[Admin] Rendered', recent.length, 'recent orders');
            renderRecentOrders(recent);
        } catch (err) {
            debug('Fatal Error', err);
            console.error(err);
            const msg = (err.message || '').includes('Failed to fetch')
                ? 'Server is starting up — will retry automatically…'
                : 'Failed to load dashboard data';
            showToast(msg, 'error');
        }
    }

    function wireNavigation() {
        const sidebar = $('#sidebar');
        if (!sidebar) { console.error('[Admin] #sidebar not found in DOM'); return; }
        sidebar.addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-item');
            if (!btn) return;
            const page = btn.dataset.page;
            console.log('[Admin] Sidebar click → page:', page);
            debug('Sidebar Click', page);
            if (!page || page === currentPage) return;
            currentPage = page;
            switchPage(page);
            onPageSwitch(page);

            if (window.innerWidth <= 860) {
                $('#sidebar').classList.remove('open');
                document.getElementById('sidebarOverlay')?.classList.remove('sidebar-overlay--visible');
            }
        });

        document.addEventListener('click', (e) => {
            const goto = e.target.closest('[data-goto]');
            if (!goto) return;
            const page = goto.dataset.goto;
            currentPage = page;
            switchPage(page);
            onPageSwitch(page);
        });
    }

    function onPageSwitch(page) {
        debug('Page Switched', page);
        requestAnimationFrame(() => {
            const target = document.querySelector(`.page[data-page="${page}"]`);
            debug('Page Visible Check', { page, hidden: target?.hidden, found: !!target });
        });
        switch (page) {
            case 'dashboard': loadDashboard(); break;
            case 'orders': loadLiveOrders(); break;
            case 'history': loadHistory(); break;
            case 'menu': loadMenu(); break;
            case 'analytics': loadAnalytics(); break;
        }
    }

    async function loadLiveOrders() {
        console.log('[Admin] loadLiveOrders()');
        debug('Fetching Live Orders');
        try {
            const statusFilter = $('#ordersStatusFilter')?.value || '';
            const res = await AdminAPI.getTodayOrders({ status: statusFilter });
            console.log('[Admin] Today orders response:', res);

            const payload = res?.data || res;
            liveOrders = Array.isArray(payload) ? payload : (payload?.orders || []);
            console.log('[Admin] Live orders count:', liveOrders.length);
            debug('Orders Received', liveOrders);
            renderOrderCards(liveOrders);
            updatePendingBadge();
        } catch (err) {
            debug('Fatal Error', err);
            console.error(err);
            showToast('Failed to load orders', 'error');
        }
    }

    function updatePendingBadge() {
        pendingCount = liveOrders.filter(o => normalizeStatus(o.status) === ORDER_STATUS.PENDING).length;
        const badge = $('#liveOrderBadge');
        if (badge) {
            badge.textContent = pendingCount;
            badge.hidden = pendingCount === 0;
        }
    }

    function wireOrderEvents() {

        $('#ordersStatusFilter')?.addEventListener('change', () => {
            if (currentPage === 'orders') loadLiveOrders();
        });

        $('#liveOrdersContainer')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-action="status-change"]');
            if (!btn || !btn.classList.contains('status-btn')) return;

            const cardId = btn.dataset.orderId;
            const orderCodeFromBtn = btn.dataset.orderCode;
            const newStatus = btn.dataset.status; // Already Title Case from ORDER_STATUS

            const order = liveOrders.find(o =>
                (o._id || o.orderId) === cardId ||
                (orderCodeFromBtn && o.orderId === orderCodeFromBtn)
            );
            const mongoId = order?._id || cardId;
            const orderCode = order?.orderId || orderCodeFromBtn || cardId;
            const currentStatus = normalizeStatus(order?.status);

            // Skip if already at this status
            if (currentStatus === newStatus) return;

            // ── Validate transition before calling backend ──
            if (!isTransitionAllowed(currentStatus, newStatus)) {
                showToast(`Cannot change from ${currentStatus} to ${newStatus}`, 'error');
                return;
            }

            console.log('[Admin] Status change request:', { mongoId, orderCode, currentStatus, newStatus });
            console.log('Sending status:', newStatus);

            // ── Cancel uses dedicated endpoint ──
            if (newStatus === ORDER_STATUS.CANCELLED) {
                const confirmed = await showConfirm('Cancel this order? This cannot be undone.');
                if (!confirmed) return;

                try {
                    btn.disabled = true;
                    btn.style.opacity = '.5';
                    await AdminAPI.cancelOrder(orderCode);
                    btn.disabled = false;
                    btn.style.opacity = '';

                    if (order) order.status = ORDER_STATUS.CANCELLED;
                    updatePendingBadge();
                    if (order) updateOrderCard(mongoId, order);
                    debug('Order Cancelled', { mongoId, orderCode });
                    showToast('Order cancelled', 'success');
                } catch (err) {
                    btn.disabled = false;
                    btn.style.opacity = '';
                    showToast(`Failed to cancel: ${err.message}`, 'error');
                }
                return;
            }

            // ── General status update ──
            try {
                btn.disabled = true;
                btn.style.opacity = '.5';

                console.log('[Admin] Sending PATCH /status with payload:', { status: newStatus });
                await AdminAPI.updateOrderStatus(mongoId, currentStatus, newStatus);
                btn.disabled = false;
                btn.style.opacity = '';

                if (order) order.status = newStatus;

                updatePendingBadge();
                if (order) updateOrderCard(mongoId, order);
                debug('Order Status Updated', { mongoId, orderCode, currentStatus, newStatus });
                showToast(`Order updated to ${newStatus}`, 'success');
            } catch (err) {
                btn.disabled = false;
                btn.style.opacity = '';
                showToast(`Failed to update: ${err.message}`, 'error');
            }
        });

        $('#liveOrdersContainer')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-action="delete-order"]');
            if (!btn) return;

            const orderId = btn.dataset.orderId;
            const confirmed = await showConfirm('Are you sure you want to delete this order?');
            if (!confirmed) return;

            try {
                btn.disabled = true;
                btn.textContent = '…';
                await AdminAPI.deleteOrder(orderId);

                liveOrders = liveOrders.filter(o => (o._id || o.orderId) !== orderId);
                updatePendingBadge();

                const card = btn.closest('.order-card');
                if (card) {
                    card.classList.add('order-card--fade-out');
                    card.addEventListener('animationend', () => card.remove(), { once: true });
                }

                document.dispatchEvent(new CustomEvent('admin:order-deleted'));

                debug('Order Deleted', { orderId });
                showToast('Order deleted successfully', 'success');
            } catch (err) {
                btn.disabled = false;
                btn.textContent = '🗑 Delete';
                showToast(`Failed to delete: ${err.message}`, 'error');
            }
        });

        document.addEventListener('admin:new-order', (e) => {
            const order = e.detail;
            console.log('[Admin] admin:new-order event received:', order);
            if (!order) return;

            const exists = liveOrders.find(o => (o._id || o.orderId) === (order._id || order.orderId));
            if (exists) return;

            liveOrders.unshift(order);
            updatePendingBadge();

            if (currentPage === 'orders') {
                prependOrderCard(order);
                // Auto-scroll newest order to top
                const container = $('#liveOrdersContainer');
                if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            }

            const todayEl = $('#statTodayOrders');
            const totalEl = $('#statTotalOrders');
            if (todayEl) animateCounter(todayEl, (parseInt(todayEl.textContent.replace(/[^\d]/g,''),10)||0) + 1);
            if (totalEl) animateCounter(totalEl, (parseInt(totalEl.textContent.replace(/[^\d]/g,''),10)||0) + 1);

            playNotifSound();

            if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
                try {
                    new Notification('New Order!', {
                        body: `Order from ${order.customerName || 'Customer'} — ₹${order.total || 0}`,
                        icon: '🥟',
                        tag: 'pf-admin-order',
                    });
                } catch {  }
            }

            showToast(`New order from ${order.customerName || 'Customer'}!`, 'info');
        });

        document.addEventListener('admin:order-updated', (e) => {
            const data = e.detail;
            if (!data) return;
            const order = liveOrders.find(o => (o._id || o.orderId) === (data._id || data.orderId));
            if (order) {
                order.status = normalizeStatus(data.status);
                updatePendingBadge();
                if (currentPage === 'orders') loadLiveOrders();
            }
        });

        document.addEventListener('admin:order-deleted', () => {
            const todayEl = $('#statTodayOrders');
            const totalEl = $('#statTotalOrders');
            if (todayEl) animateCounter(todayEl, Math.max(0, (parseInt(todayEl.textContent.replace(/[^\d]/g,''),10)||0) - 1));
            if (totalEl) animateCounter(totalEl, Math.max(0, (parseInt(totalEl.textContent.replace(/[^\d]/g,''),10)||0) - 1));
        });

        document.addEventListener('socket:status', (e) => {
            console.log('[Admin] Socket status:', e.detail?.connected);
            updateSocketStatus(e.detail?.connected);
        });

        // Live top-selling item update
        document.addEventListener('admin:top-item-update', (e) => {
            const data = e.detail;
            if (data?.itemName) {
                highlightTopSelling(data.itemName);
            }
        });
    }

    async function loadHistory() {
        console.log('[Admin] loadHistory()');
        try {
            const params = {
                page: historyPage,
                limit: 20,
                status: $('#historyStatusFilter')?.value || '',
                dateFrom: $('#historyDateFrom')?.value || '',
                dateTo: $('#historyDateTo')?.value || '',
                phone: $('#historyPhoneSearch')?.value.trim() || '',
            };
            const res = await AdminAPI.getOrders(params);

            const payload = res?.data || res;
            const orders = Array.isArray(payload) ? payload : (payload?.orders || []);
            historyTotal = res?.totalPages || payload?.totalPages || Math.ceil((res?.total || payload?.total || orders.length) / 20) || 1;
            allHistoryOrders = orders;

            debug('History Data', { count: orders.length, page: historyPage, totalPages: historyTotal });
            renderHistoryTable(orders);
            renderPagination(historyPage, historyTotal);
        } catch (err) {
            debug('Fatal Error', err);
            console.error(err);
            showToast('Failed to load history', 'error');
        }
    }

    function wireHistoryEvents() {

        $('#historySearchBtn')?.addEventListener('click', () => {
            historyPage = 1;
            loadHistory();
        });

        $('#historyPhoneSearch')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { historyPage = 1; loadHistory(); }
        });

        $('#historyStatusFilter')?.addEventListener('change', () => {
            historyPage = 1;
            if (currentPage === 'history') loadHistory();
        });

        $('#historyPagination')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-page]');
            if (!btn || btn.disabled) return;
            const page = Number(btn.dataset.page);
            if (page < 1 || page > historyTotal) return;
            historyPage = page;
            loadHistory();
        });

        $('#exportCsvBtn')?.addEventListener('click', () => {
            exportOrdersCSV(allHistoryOrders);
        });
    }

    async function loadMenu() {
        console.log('[Admin] loadMenu()');
        try {
            const res = await AdminAPI.getMenu();
            console.log('[Admin] Menu response:', res);

            const data = res?.data || res?.categories || res;

            if (Array.isArray(data) && data[0]?.items) {

                menuCategories = data.map(c => ({ key: c.key || c._id, title: c.title || c.key }));
                menuItems = data.flatMap(c => c.items.map(i => ({ ...i, category: c.title || c.key })));
            } else if (Array.isArray(data)) {
                menuItems = data;
                const cats = [...new Set(data.map(i => i.category).filter(Boolean))];
                menuCategories = cats.map(c => ({ key: c, title: c }));
            } else if (data && typeof data === 'object') {

                const cats = Object.keys(data);
                menuCategories = cats.map(c => ({ key: c, title: data[c]?.title || c }));
                menuItems = cats.flatMap(c => (data[c]?.items || []).map(i => ({ ...i, category: data[c]?.title || c })));
            } else {
                menuItems = [];
                menuCategories = [];
            }

            debug('Menu Data', { items: menuItems.length, categories: menuCategories.length });
            renderMenuItems(menuItems, menuCategories);
        } catch (err) {
            debug('Fatal Error', err);
            console.error(err);
            showToast('Failed to load menu', 'error');
        }
    }

    function wireMenuEvents() {
        const container = $('#menuMgmtContainer');
        if (!container) return;

        container.addEventListener('input', (e) => {
            const card = e.target.closest('.menu-mgmt-card');
            if (!card) return;
            const saveBtn = card.querySelector('.menu-mgmt-card__save');
            if (saveBtn) saveBtn.classList.add('show');
        });

        container.addEventListener('change', (e) => {
            const card = e.target.closest('.menu-mgmt-card');
            if (!card) return;
            const saveBtn = card.querySelector('.menu-mgmt-card__save');
            if (saveBtn) saveBtn.classList.add('show');
        });

        container.addEventListener('click', async (e) => {
            const saveBtn = e.target.closest('[data-action="save-menu-item"]');
            if (!saveBtn) return;

            const card = saveBtn.closest('.menu-mgmt-card');
            if (!card) return;
            const itemId = card.dataset.itemId;

            const original = menuItems.find(i => (i._id || i.id) === itemId);
            if (!original) {
                showToast('Could not find original menu item', 'error');
                return;
            }

            const priceInputs = card.querySelectorAll('.menu-mgmt-price__input');
            const prices = Array.from(priceInputs).map(inp => {
                const idx = Number(inp.dataset.priceIdx);
                const orig = (original.prices || [])[idx] || {};
                return { label: String(orig.label || ''), value: Number(inp.value) };
            });

            const specialChk = card.querySelector('[data-action="toggle-special"]');
            const activeChk = card.querySelector('[data-action="toggle-active"]');

            const payload = {
                name: original.name,
                desc: original.desc || original.description || '',
                category: original.category || '',
                prices,
                special: specialChk?.checked || false,
                active: activeChk?.checked !== false,
            };

            try {
                saveBtn.disabled = true;
                saveBtn.classList.add('btn--loading');
                saveBtn.textContent = '';
                await AdminAPI.updateMenuItem(itemId, payload);
                saveBtn.classList.remove('btn--loading', 'show');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';

                card.classList.toggle('menu-mgmt-card--inactive', !payload.active);
                card.style.boxShadow = '0 0 0 2px var(--c-green)';
                setTimeout(() => { card.style.boxShadow = ''; }, 800);
                debug('Menu Item Saved', { itemId, payload });
                showToast('Menu item updated', 'success');
            } catch (err) {
                saveBtn.classList.remove('btn--loading');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
                showToast(`Failed: ${err.message}`, 'error');
            }
        });

        $('#menuCategoryFilter')?.addEventListener('change', (e) => {
            const val = e.target.value;
            const filtered = val ? menuItems.filter(i => i.category === val) : menuItems;
            renderMenuItems(filtered, []);
        });

        $('#menuSearchInput')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const catVal = $('#menuCategoryFilter')?.value || '';
            let filtered = catVal ? menuItems.filter(i => i.category === catVal) : menuItems;
            if (q) filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
            renderMenuItems(filtered, []);
        });
    }

    async function loadAnalytics() {
        console.log('[Admin] loadAnalytics()');
        try {
            const res = await AdminAPI.getAnalytics();
            console.log('[Admin] Analytics response:', res);

            const data = res?.data || res;
            if (!data) return;

            // KPI cards (weekly growth, repeat rate, avg prep, today revenue)
            renderAnalyticsKPI({
                weeklyGrowth: data.weeklyGrowth ?? data.growth ?? 0,
                repeatCustomerRate: data.repeatCustomerRate ?? data.repeatRate ?? 0,
                avgPrepTime: data.avgPrepTime ?? data.avgPrep ?? 0,
                todayRevenue: data.todayRevenue ?? 0,
            });

            if (data.ordersPerDay) {
                const labels = data.ordersPerDay.map(d => d.label || d.date || '');
                const values = data.ordersPerDay.map(d => d.count || d.value || 0);
                drawBarChart('chartOrders', labels, values, '#e85d04');
            }

            if (data.revenuePerDay) {
                const labels = data.revenuePerDay.map(d => d.label || d.date || '');
                const values = data.revenuePerDay.map(d => d.total || d.value || 0);
                drawBarChart('chartRevenue', labels, values, '#10b981');
            }

            // 30-day revenue trend line chart
            if (data.revenueTrend || data.revenuePerDay) {
                const trendData = data.revenueTrend || data.revenuePerDay || [];
                const labels = trendData.map(d => d.label || d.date || '');
                const values = trendData.map(d => d.total || d.value || 0);
                drawLineChart('chartRevenueTrend', labels, values, '#e85d04');
            }

            if (data.topItems) {
                renderTopItems(data.topItems);
                // Highlight top selling in menu if loaded
                if (data.topItems[0]) {
                    highlightTopSelling(data.topItems[0].name || data.topItems[0]._id || '');
                }
            }
        } catch (err) {
            debug('Fatal Error', err);
            console.error(err);
            showToast('Failed to load analytics', 'error');
        }
    }

    function wireTheme() {
        // Premium dark-only UI — no theme toggle needed
        // Remove any stale light preference
        localStorage.removeItem('pf_admin_theme');
        updateThemeIcon();

        $('#themeToggle')?.addEventListener('click', () => {
            // Easter egg: clicking the theme button just pops a toast
            showToast('Premium dark mode — always on 🌙', 'info');
        });
    }

    function updateThemeIcon() {
        const btn = $('#themeToggle');
        if (btn) btn.textContent = '🌙';
    }

    function wireSidebar() {

        let overlay = document.getElementById('sidebarOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sidebarOverlay';
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }

        const _closeSidebar = () => {
            $('#sidebar').classList.remove('open');
            overlay.classList.remove('sidebar-overlay--visible');
        };

        $('#sidebarToggle')?.addEventListener('click', () => {
            const isOpen = $('#sidebar').classList.toggle('open');
            overlay.classList.toggle('sidebar-overlay--visible', isOpen);
            debug('Sidebar Toggle', { open: isOpen });
        });

        overlay.addEventListener('click', _closeSidebar);

        document.addEventListener('click', (e) => {
            if (window.innerWidth > 860) return;
            const sidebar = $('#sidebar');
            if (!sidebar.classList.contains('open')) return;
            if (!e.target.closest('.sidebar') && !e.target.closest('#sidebarToggle')) {
                _closeSidebar();
            }
        });

        $('#logoutBtn')?.addEventListener('click', async () => {
            const ok = await showConfirm('Lock the admin panel?');
            if (ok) {
                sessionStorage.removeItem(GATE_KEY);
                location.reload();
            }
        });
    }

    document.addEventListener('keydown', (e) => {

        if (e.key === 'Escape') {
            const overlay = $('#confirmOverlay');
            if (overlay && !overlay.hidden) {
                $('#confirmCancel')?.click();
            }
        }
    });
});
