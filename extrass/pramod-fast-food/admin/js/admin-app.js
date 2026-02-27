/**
 * admin-app.js — Orchestrator: wires auth → events → API → UI.
 *
 * Single DOMContentLoaded entry point.
 * All interactions via event delegation on stable containers.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

    const { $, $$, hideAuthGuard, showAuthFailed, showToast, showConfirm,
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

    /* ==========  AUTH  ========== */
    (async () => {
        try {
            const user = await AdminAPI.verifyAdmin();
            $('#adminUser').textContent = user.name || user.email || 'Admin';
            hideAuthGuard();
            init();
        } catch (err) {
            showAuthFailed('Admin access required. Please log in.');
        }
    })();

    /* ==========  INIT  ========== */
    function init() {
        /* Connect realtime */
        AdminSocket.connect();

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

    /* ====================================================================
       DASHBOARD
    ==================================================================== */
    async function loadDashboard() {
        try {
            const [stats, recentRes] = await Promise.all([
                AdminAPI.getStats(),
                AdminAPI.getRecentOrders(5),
            ]);
            renderStats(stats);
            const recent = recentRes?.data || recentRes?.orders || (Array.isArray(recentRes) ? recentRes : []);
            renderRecentOrders(recent);
        } catch (err) {
            showToast('Failed to load dashboard data', 'error');
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

        /* Logout */
        $('#logoutBtn')?.addEventListener('click', async () => {
            const ok = await showConfirm('Log out of admin panel?');
            if (ok) AdminAPI.logout();
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
