/**
 * admin-app.js — Orchestrator: wires auth → events → API → UI.
 *
 * Single DOMContentLoaded entry point.
 * All interactions via event delegation on stable containers.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    const { $, $$, showToast, showConfirm,
            switchPage, updateSocketStatus, renderStats, renderRecentOrders,
            renderOrderCards, prependOrderCard, renderHistoryTable, renderPagination,
            renderMenuItems, drawBarChart, renderTopItems, playNotifSound,
            exportOrdersCSV } = AdminUI;

    /* ==========  STATE  ========== */
    let currentPage = 'dashboard';
    let liveOrders = [];
    let historyPage = 1;
    let historyTotal = 1;
    let allHistoryOrders = [];  /* cached for CSV export */
    let menuItems = [];
    let menuCategories = [];
    let pendingCount = 0;
    let statsRefreshTimer = null;

    /* ==========  PASSWORD GATE  ========== */
    const HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    const GATE_KEY = 'adminUnlocked';

    /** SHA-256 hash via Web Crypto API (with fallback for non-HTTPS) */
    async function sha256(text) {
        // crypto.subtle requires secure context (HTTPS or localhost)
        if (crypto.subtle) {
            const encoded = new TextEncoder().encode(text);
            const buffer = await crypto.subtle.digest('SHA-256', encoded);
            return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        // Fallback: simple JS SHA-256 for non-secure contexts
        return _sha256Fallback(text);
    }

    /** Pure-JS SHA-256 fallback (no external deps) */
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

    /* Check session first */
    if (sessionStorage.getItem(GATE_KEY)) {
        hideGate();
        init();
    } else {
        showGate();
    }

    /* Gate form submission */
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
        console.log('[gate] hash:', hash); /* debug: remove later */

        if (hash === HASH) {
            sessionStorage.setItem(GATE_KEY, '1');
            input.classList.remove('gate__input--shake');
            error.hidden = true;
            hideGate();
            init();
        } else {
            error.hidden = false;
            input.value = '';
            input.focus();
            input.classList.remove('gate__input--shake');
            void input.offsetWidth; /* reflow to re-trigger */
            input.classList.add('gate__input--shake');
            btn.disabled = false;
            btn.textContent = 'Unlock →';
        }
    });

    /* Show/hide password toggle */
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

    /* ==========  INIT  ========== */
    function init() {
        /* Connect realtime */
        AdminSocket.connect();

        /* Cold-start listener */
        document.addEventListener('admin:cold-start', () => {
            showToast('⏳ Server waking up — hang tight…', 'info');
            _showWakingBanner(true);
        });

        /* Load initial data */
        loadDashboard();

        /* Auto-refresh stats every 30s */
        statsRefreshTimer = setInterval(loadDashboard, 30000);

        /* Wire navigation */
        wireNavigation();
        wireOrderEvents();
        wireHistoryEvents();
        wireMenuEvents();
        wireTheme();
        wireSidebar();
    }

    /* ---------- Cold-start banner ---------- */
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

    /* ====================================================================
       DASHBOARD
    ==================================================================== */
    async function loadDashboard() {
        try {
            const [stats, recentRes] = await Promise.all([
                AdminAPI.getStats(),
                AdminAPI.getRecentOrders(5),
            ]);
            _showWakingBanner(false);
            renderStats(stats);
            const recent = recentRes?.data || recentRes?.orders || (Array.isArray(recentRes) ? recentRes : []);
            renderRecentOrders(recent);
        } catch (err) {
            const msg = (err.message || '').includes('Failed to fetch')
                ? 'Server is starting up — will retry automatically…'
                : 'Failed to load dashboard data';
            showToast(msg, 'error');
        }
    }

    /* ====================================================================
       NAVIGATION
    ==================================================================== */
    function wireNavigation() {
        $('#sidebar').addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-item');
            if (!btn) return;
            const page = btn.dataset.page;
            if (!page || page === currentPage) return;
            currentPage = page;
            switchPage(page);
            onPageSwitch(page);

            /* Close sidebar on mobile */
            if (window.innerWidth <= 860) {
                $('#sidebar').classList.remove('open');
            }
        });

        /* "View All" links */
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
        switch (page) {
            case 'dashboard': loadDashboard(); break;
            case 'orders': loadLiveOrders(); break;
            case 'history': loadHistory(); break;
            case 'menu': loadMenu(); break;
            case 'analytics': loadAnalytics(); break;
        }
    }

    /* ====================================================================
       LIVE ORDERS
    ==================================================================== */
    async function loadLiveOrders() {
        try {
            const statusFilter = $('#ordersStatusFilter')?.value || '';
            const res = await AdminAPI.getOrders({ status: statusFilter, limit: 50 });
            liveOrders = res?.data || res?.orders || (Array.isArray(res) ? res : []);
            renderOrderCards(liveOrders);
            updatePendingBadge();
        } catch (err) {
            showToast('Failed to load orders', 'error');
        }
    }

    function updatePendingBadge() {
        pendingCount = liveOrders.filter(o => o.status === 'PENDING').length;
        const badge = $('#liveOrderBadge');
        if (badge) {
            badge.textContent = pendingCount;
            badge.hidden = pendingCount === 0;
        }
    }

    function wireOrderEvents() {
        /* Status filter */
        $('#ordersStatusFilter')?.addEventListener('change', () => {
            if (currentPage === 'orders') loadLiveOrders();
        });

        /* Status change on order card (event delegation) */
        $('#liveOrdersContainer')?.addEventListener('change', async (e) => {
            const select = e.target.closest('[data-action="status-change"]');
            if (!select) return;

            const orderId = select.dataset.orderId;
            const newStatus = select.value;

            if (newStatus === 'CANCELLED') {
                const confirmed = await showConfirm('Cancel this order? This cannot be undone.');
                if (!confirmed) {
                    /* Revert select */
                    const order = liveOrders.find(o => (o._id || o.orderId) === orderId);
                    if (order) select.value = order.status;
                    return;
                }
            }

            try {
                await AdminAPI.updateOrderStatus(orderId, newStatus);
                /* Update local state */
                const order = liveOrders.find(o => (o._id || o.orderId) === orderId);
                if (order) order.status = newStatus;

                /* Update select class */
                select.className = `status-select status-select--${newStatus.toLowerCase()}`;
                updatePendingBadge();
                showToast(`Order updated to ${newStatus}`, 'success');
            } catch (err) {
                showToast(`Failed to update: ${err.message}`, 'error');
                const order = liveOrders.find(o => (o._id || o.orderId) === orderId);
                if (order) select.value = order.status;
            }
        });

        /* Realtime: new order from socket */
        document.addEventListener('admin:new-order', (e) => {
            const order = e.detail;
            if (!order) return;

            /* Deduplicate */
            const exists = liveOrders.find(o => (o._id || o.orderId) === (order._id || order.orderId));
            if (exists) return;

            liveOrders.unshift(order);
            updatePendingBadge();

            if (currentPage === 'orders') {
                prependOrderCard(order);
            }

            playNotifSound();
            showToast(`New order from ${order.customerName || 'Customer'}!`, 'info');
        });

        /* Realtime: order status update */
        document.addEventListener('admin:order-updated', (e) => {
            const data = e.detail;
            if (!data) return;
            const order = liveOrders.find(o => (o._id || o.orderId) === (data._id || data.orderId));
            if (order) {
                order.status = data.status;
                if (currentPage === 'orders') loadLiveOrders();
            }
        });

        /* Socket status */
        document.addEventListener('socket:status', (e) => {
            updateSocketStatus(e.detail?.connected);
        });
    }

    /* ====================================================================
       ORDER HISTORY
    ==================================================================== */
    async function loadHistory() {
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
            const orders = res?.data || res?.orders || (Array.isArray(res) ? res : []);
            historyTotal = res?.totalPages || Math.ceil((res?.total || orders.length) / 20) || 1;
            allHistoryOrders = orders;

            renderHistoryTable(orders);
            renderPagination(historyPage, historyTotal);
        } catch (err) {
            showToast('Failed to load history', 'error');
        }
    }

    function wireHistoryEvents() {
        /* Filters */
        $('#historySearchBtn')?.addEventListener('click', () => {
            historyPage = 1;
            loadHistory();
        });

        /* Enter key on phone search */
        $('#historyPhoneSearch')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { historyPage = 1; loadHistory(); }
        });

        $('#historyStatusFilter')?.addEventListener('change', () => {
            historyPage = 1;
            if (currentPage === 'history') loadHistory();
        });

        /* Pagination */
        $('#historyPagination')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-page]');
            if (!btn || btn.disabled) return;
            const page = Number(btn.dataset.page);
            if (page < 1 || page > historyTotal) return;
            historyPage = page;
            loadHistory();
        });

        /* CSV export */
        $('#exportCsvBtn')?.addEventListener('click', () => {
            exportOrdersCSV(allHistoryOrders);
        });
    }

    /* ====================================================================
       MENU MANAGEMENT
    ==================================================================== */
    async function loadMenu() {
        try {
            const res = await AdminAPI.getMenu();
            const data = res?.data || res?.categories || res;

            /* Flatten nested structure or use flat array */
            if (Array.isArray(data) && data[0]?.items) {
                /* Nested: { key, title, items[] } */
                menuCategories = data.map(c => ({ key: c.key || c._id, title: c.title || c.key }));
                menuItems = data.flatMap(c => c.items.map(i => ({ ...i, category: c.title || c.key })));
            } else if (Array.isArray(data)) {
                menuItems = data;
                const cats = [...new Set(data.map(i => i.category).filter(Boolean))];
                menuCategories = cats.map(c => ({ key: c, title: c }));
            } else {
                menuItems = [];
                menuCategories = [];
            }

            renderMenuItems(menuItems, menuCategories);
        } catch (err) {
            showToast('Failed to load menu', 'error');
        }
    }

    function wireMenuEvents() {
        const container = $('#menuMgmtContainer');
        if (!container) return;

        /* Track dirty state — show save button */
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

        /* Save button */
        container.addEventListener('click', async (e) => {
            const saveBtn = e.target.closest('[data-action="save-menu-item"]');
            if (!saveBtn) return;

            const card = saveBtn.closest('.menu-mgmt-card');
            if (!card) return;
            const itemId = card.dataset.itemId;

            /* Gather updated values */
            const priceInputs = card.querySelectorAll('.menu-mgmt-price__input');
            const prices = Array.from(priceInputs).map(inp => ({
                idx: Number(inp.dataset.priceIdx),
                value: Number(inp.value),
            }));

            const specialChk = card.querySelector('[data-action="toggle-special"]');
            const activeChk = card.querySelector('[data-action="toggle-active"]');

            const payload = {
                prices: prices.map(p => p.value),
                special: specialChk?.checked || false,
                active: activeChk?.checked !== false,
            };

            try {
                saveBtn.disabled = true;
                saveBtn.textContent = '…';
                await AdminAPI.updateMenuItem(itemId, payload);
                saveBtn.classList.remove('show');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';

                /* Update visual state */
                card.classList.toggle('menu-mgmt-card--inactive', !payload.active);
                showToast('Menu item updated', 'success');
            } catch (err) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
                showToast(`Failed: ${err.message}`, 'error');
            }
        });

        /* Category filter */
        $('#menuCategoryFilter')?.addEventListener('change', (e) => {
            const val = e.target.value;
            const filtered = val ? menuItems.filter(i => i.category === val) : menuItems;
            renderMenuItems(filtered, []);
        });

        /* Search */
        $('#menuSearchInput')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const catVal = $('#menuCategoryFilter')?.value || '';
            let filtered = catVal ? menuItems.filter(i => i.category === catVal) : menuItems;
            if (q) filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
            renderMenuItems(filtered, []);
        });
    }

    /* ====================================================================
       ANALYTICS
    ==================================================================== */
    async function loadAnalytics() {
        try {
            const data = await AdminAPI.getAnalytics();
            if (!data) return;

            /* Orders per day chart */
            if (data.ordersPerDay) {
                const labels = data.ordersPerDay.map(d => d.label || d.date || '');
                const values = data.ordersPerDay.map(d => d.count || d.value || 0);
                drawBarChart('chartOrders', labels, values, '#e85d04');
            }

            /* Revenue per day chart */
            if (data.revenuePerDay) {
                const labels = data.revenuePerDay.map(d => d.label || d.date || '');
                const values = data.revenuePerDay.map(d => d.total || d.value || 0);
                drawBarChart('chartRevenue', labels, values, '#10b981');
            }

            /* Top items */
            if (data.topItems) {
                renderTopItems(data.topItems);
            }
        } catch (err) {
            showToast('Failed to load analytics', 'error');
        }
    }

    /* ====================================================================
       THEME TOGGLE
    ==================================================================== */
    function wireTheme() {
        const saved = localStorage.getItem('pf_admin_theme');
        if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon();

        $('#themeToggle')?.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('pf_admin_theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('pf_admin_theme', 'dark');
            }
            updateThemeIcon();
        });
    }

    function updateThemeIcon() {
        const btn = $('#themeToggle');
        if (btn) btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    }

    /* ====================================================================
       SIDEBAR (mobile toggle)
    ==================================================================== */
    function wireSidebar() {
        $('#sidebarToggle')?.addEventListener('click', () => {
            $('#sidebar').classList.toggle('open');
        });

        /* Close on overlay click (mobile) */
        document.addEventListener('click', (e) => {
            if (window.innerWidth > 860) return;
            const sidebar = $('#sidebar');
            if (!sidebar.classList.contains('open')) return;
            if (!e.target.closest('.sidebar') && !e.target.closest('#sidebarToggle')) {
                sidebar.classList.remove('open');
            }
        });

        /* Logout — clear session, reload */
        $('#logoutBtn')?.addEventListener('click', async () => {
            const ok = await showConfirm('Lock the admin panel?');
            if (ok) {
                sessionStorage.removeItem(GATE_KEY);
                location.reload();
            }
        });
    }

    /* ====================================================================
       KEYBOARD SHORTCUTS
    ==================================================================== */
    document.addEventListener('keydown', (e) => {
        /* Escape to close confirm */
        if (e.key === 'Escape') {
            const overlay = $('#confirmOverlay');
            if (overlay && !overlay.hidden) {
                overlay.hidden = true;
            }
        }
    });
});
