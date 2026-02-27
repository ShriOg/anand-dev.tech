/**
 * admin-ui.js — All DOM rendering for the admin dashboard.
 *
 * Pure rendering functions: read data → write DOM.
 * No side-effects outside their target containers.
 */
'use strict';

const AdminUI = (() => {

    /* ---------- DOM helpers ---------- */
    const $ = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => ctx.querySelectorAll(s);

    /* ====================================================================
       TOAST SYSTEM
    ==================================================================== */
    let _toastTimer;
    const showToast = (message, type = 'info') => {
        let el = $('#adminToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'adminToast';
            el.className = 'admin-toast';
            document.body.appendChild(el);
        }
        clearTimeout(_toastTimer);
        el.textContent = message;
        el.className = `admin-toast admin-toast--${type} admin-toast--visible`;
        _toastTimer = setTimeout(() => el.classList.remove('admin-toast--visible'), 2800);
    };

    /* ====================================================================
       CONFIRM DIALOG
    ==================================================================== */
    let _confirmResolve = null;
    const showConfirm = (message) => {
        return new Promise((resolve) => {
            _confirmResolve = resolve;
            $('#confirmMsg').textContent = message;
            $('#confirmOverlay').hidden = false;
        });
    };

    const _setupConfirm = () => {
        $('#confirmCancel')?.addEventListener('click', () => {
            $('#confirmOverlay').hidden = true;
            if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
        });
        $('#confirmOk')?.addEventListener('click', () => {
            $('#confirmOverlay').hidden = true;
            if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
        });
    };

    /* ====================================================================
       PAGE NAVIGATION
    ==================================================================== */
    const switchPage = (pageKey) => {
        $$('.page').forEach(p => p.hidden = p.dataset.page !== pageKey);
        $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === pageKey));

        const titles = { dashboard: 'Dashboard', orders: 'Live Orders', history: 'Order History', menu: 'Menu', analytics: 'Analytics' };
        $('#pageTitle').textContent = titles[pageKey] || 'Dashboard';
    };

    /* ====================================================================
       SOCKET STATUS
    ==================================================================== */
    const updateSocketStatus = (connected) => {
        const el = $('#socketStatus');
        if (!el) return;
        el.innerHTML = connected ? '🟢 Live' : '🔴 Offline';
        el.title = connected ? 'Realtime connected' : 'Realtime disconnected';
    };

    /* ====================================================================
       DASHBOARD STATS
    ==================================================================== */
    const renderStats = (data) => {
        if (!data) return;
        const fmt = (n) => typeof n === 'number' ? n.toLocaleString('en-IN') : '—';
        const fmtR = (n) => typeof n === 'number' ? '₹' + n.toLocaleString('en-IN') : '—';

        $('#statTotalOrders').textContent = fmt(data.totalOrders);
        $('#statTodayOrders').textContent = fmt(data.todayOrders);
        $('#statTotalRevenue').textContent = fmtR(data.totalRevenue);
        $('#statTodayRevenue').textContent = fmtR(data.todayRevenue);
        $('#statTotalCustomers').textContent = fmt(data.totalCustomers);
    };

    /* ====================================================================
       DASHBOARD RECENT ORDERS
    ==================================================================== */
    const renderRecentOrders = (orders) => {
        const container = $('#dashRecentOrders');
        if (!container) return;
        if (!orders || !orders.length) {
            container.innerHTML = '<p style="text-align:center;color:var(--c-text-soft);padding:20px">No recent orders</p>';
            return;
        }
        container.innerHTML = orders.slice(0, 5).map(o => `
            <div class="recent-row">
                <span class="recent-row__id">${o.orderId || o._id?.slice(-6) || '—'}</span>
                <span class="recent-row__name">${_esc(o.customerName || o.customer?.name || '—')}</span>
                <span class="recent-row__total">₹${o.total || 0}</span>
                <span class="recent-row__status">${_statusBadge(o.status)}</span>
            </div>`).join('');
    };

    /* ====================================================================
       LIVE ORDER CARDS
    ==================================================================== */
    const renderOrderCards = (orders, container) => {
        const target = container || $('#liveOrdersContainer');
        if (!target) return;
        if (!orders || !orders.length) {
            target.innerHTML = '<p style="text-align:center;color:var(--c-text-soft);padding:40px">No orders found</p>';
            return;
        }
        target.innerHTML = orders.map(o => _orderCardHTML(o)).join('');
    };

    const prependOrderCard = (order) => {
        const target = $('#liveOrdersContainer');
        if (!target) return;
        const emptyMsg = target.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const div = document.createElement('div');
        div.innerHTML = _orderCardHTML(order, true);
        target.prepend(div.firstElementChild);
    };

    const _orderCardHTML = (o, isNew = false) => {
        const typeClass = (o.orderType || '').toLowerCase().includes('dine') ? 'dinein' : 'takeaway';
        const items = o.items || [];
        const statusLower = (o.status || 'PENDING').toLowerCase();

        return `
        <div class="order-card${isNew ? ' order-card--new' : ''}" data-order-id="${o._id || o.orderId}">
            <div class="order-card__header">
                <span class="order-card__id">${o.orderId || o._id?.slice(-6) || '—'}</span>
                <span class="order-card__type order-card__type--${typeClass}">${o.orderType || '—'}</span>
                <span class="order-card__time">${_fmtDate(o.createdAt)}</span>
            </div>
            <div class="order-card__customer">
                <span>👤 ${_esc(o.customerName || o.customer?.name || '—')}</span>
                <span>📞 ${o.customerPhone || o.customer?.phone || '—'}</span>
                ${o.persons ? `<span>👥 ${o.persons}</span>` : ''}
                ${o.table ? `<span>🪑 Table ${o.table}</span>` : ''}
            </div>
            <div class="order-card__items">
                ${items.map(i => `
                <div class="order-card__item">
                    <span class="order-card__item-name">${_esc(i.name)} ${i.size ? '(' + i.size + ')' : ''} × ${i.quantity || 1}</span>
                    <span class="order-card__item-price">₹${i.price * (i.quantity || 1)}</span>
                </div>`).join('')}
            </div>
            ${o.note ? `<p style="font-size:12px;color:var(--c-text-soft);margin-bottom:var(--sp-3)">📝 ${_esc(o.note)}</p>` : ''}
            <div class="order-card__footer">
                <span class="order-card__total">₹${o.total || 0}</span>
                <select class="status-select status-select--${statusLower}" data-order-id="${o._id || o.orderId}" data-action="status-change">
                    <option value="PENDING" ${o.status === 'PENDING' ? 'selected' : ''}>⏳ Pending</option>
                    <option value="PREPARING" ${o.status === 'PREPARING' ? 'selected' : ''}>🔥 Preparing</option>
                    <option value="COMPLETED" ${o.status === 'COMPLETED' ? 'selected' : ''}>✅ Completed</option>
                    <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>❌ Cancelled</option>
                </select>
            </div>
        </div>`;
    };

    /* ====================================================================
       ORDER HISTORY TABLE
    ==================================================================== */
    const renderHistoryTable = (orders) => {
        const tbody = $('#historyTableBody');
        if (!tbody) return;
        if (!orders || !orders.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No orders found</td></tr>';
            return;
        }
        tbody.innerHTML = orders.map(o => {
            const items = (o.items || []).map(i => `${i.name}${i.size ? ' (' + i.size + ')' : ''} ×${i.quantity || 1}`).join(', ');
            return `
            <tr>
                <td><strong>${o.orderId || o._id?.slice(-6) || '—'}</strong></td>
                <td>${_esc(o.customerName || o.customer?.name || '—')}</td>
                <td>${o.customerPhone || o.customer?.phone || '—'}</td>
                <td>${o.orderType || '—'}</td>
                <td style="max-width:200px;font-size:12px;color:var(--c-text-soft)">${_esc(items)}</td>
                <td><strong>₹${o.total || 0}</strong></td>
                <td>${_statusBadge(o.status)}</td>
                <td style="font-size:12px">${_fmtDate(o.createdAt)}</td>
            </tr>`;
        }).join('');
    };

    const renderPagination = (current, total, container) => {
        const target = container || $('#historyPagination');
        if (!target || total <= 1) { target.innerHTML = ''; return; }

        let html = `<button class="pagination__btn" data-page="${current - 1}" ${current <= 1 ? 'disabled' : ''}>← Prev</button>`;
        const maxVisible = 5;
        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

        for (let i = start; i <= end; i++) {
            html += `<button class="pagination__btn${i === current ? ' active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += `<button class="pagination__btn" data-page="${current + 1}" ${current >= total ? 'disabled' : ''}>Next →</button>`;
        target.innerHTML = html;
    };

    /* ====================================================================
       MENU MANAGEMENT
    ==================================================================== */
    const renderMenuItems = (items, categories) => {
        const container = $('#menuMgmtContainer');
        if (!container) return;

        /* Populate category filter dropdown */
        const catFilter = $('#menuCategoryFilter');
        if (catFilter && categories && catFilter.options.length <= 1) {
            categories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.key || c;
                opt.textContent = c.title || c;
                catFilter.appendChild(opt);
            });
        }

        if (!items || !items.length) {
            container.innerHTML = '<p style="text-align:center;color:var(--c-text-soft);padding:40px">No menu items</p>';
            return;
        }

        container.innerHTML = items.map(item => {
            const isActive = item.active !== false;
            const isSpecial = !!item.special;
            return `
            <div class="menu-mgmt-card${!isActive ? ' menu-mgmt-card--inactive' : ''}" data-item-id="${item._id || item.id}">
                <div class="menu-mgmt-card__info">
                    <div class="menu-mgmt-card__name">${_esc(item.name)}</div>
                    <div class="menu-mgmt-card__cat">${item.category || '—'}</div>
                </div>
                <div class="menu-mgmt-card__prices">
                    ${(item.prices || []).map((p, idx) => `
                    <div class="menu-mgmt-price">
                        <span class="menu-mgmt-price__label">${p.label}:</span>
                        <input type="number" class="menu-mgmt-price__input" data-price-idx="${idx}"
                            value="${p.value}" min="0" step="5" data-action="price-edit">
                    </div>`).join('')}
                </div>
                <div class="menu-mgmt-card__toggles">
                    <label class="toggle">
                        <input type="checkbox" data-action="toggle-special" ${isSpecial ? 'checked' : ''}>
                        <span class="toggle__track"></span>
                        ★ Special
                    </label>
                    <label class="toggle">
                        <input type="checkbox" data-action="toggle-active" ${isActive ? 'checked' : ''}>
                        <span class="toggle__track"></span>
                        Active
                    </label>
                </div>
                <button class="menu-mgmt-card__save" data-action="save-menu-item">Save</button>
            </div>`;
        }).join('');
    };

    /* ====================================================================
       ANALYTICS CHARTS (Lightweight Canvas)
    ==================================================================== */
    const drawBarChart = (canvasId, labels, values, color = '#e85d04') => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const W = canvas.parentElement.clientWidth || 600;
        const H = 260;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);

        const pad = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;
        const maxVal = Math.max(...values, 1);

        /* Clear */
        ctx.clearRect(0, 0, W, H);

        /* Grid lines */
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-border').trim() || '#e5e7eb';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        }

        /* Y axis labels */
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-text-soft').trim() || '#6b7280';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            const val = Math.round(maxVal - (maxVal / 4) * i);
            ctx.fillText(val, pad.left - 8, y + 4);
        }

        /* Bars */
        const barGap = 8;
        const barW = Math.max(16, (chartW - barGap * (labels.length + 1)) / labels.length);
        const totalBarArea = barW * labels.length + barGap * (labels.length + 1);
        const offsetX = pad.left + (chartW - totalBarArea) / 2 + barGap;

        values.forEach((val, i) => {
            const x = offsetX + i * (barW + barGap);
            const barH = (val / maxVal) * chartH;
            const y = pad.top + chartH - barH;

            /* Bar */
            ctx.beginPath();
            const r = Math.min(4, barW / 2);
            ctx.moveTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.arcTo(x + barW, y, x + barW, y + r, r);
            ctx.lineTo(x + barW, pad.top + chartH);
            ctx.lineTo(x, pad.top + chartH);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.85;
            ctx.fill();
            ctx.globalAlpha = 1;

            /* Value on top */
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-text').trim() || '#111827';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            if (val > 0) ctx.fillText(val, x + barW / 2, y - 6);

            /* X label */
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-text-soft').trim() || '#6b7280';
            ctx.font = '11px Inter, sans-serif';
            ctx.fillText(labels[i], x + barW / 2, H - pad.bottom + 18);
        });
    };

    const renderTopItems = (items) => {
        const container = $('#topItemsContainer');
        if (!container) return;
        if (!items || !items.length) {
            container.innerHTML = '<p style="text-align:center;color:var(--c-text-soft);padding:20px">No data yet</p>';
            return;
        }
        container.innerHTML = items.slice(0, 10).map((item, i) => `
            <div class="top-item">
                <span class="top-item__rank">${i + 1}</span>
                <span class="top-item__name">${_esc(item.name || item._id || '—')}</span>
                <span class="top-item__count">${item.count || item.totalQty || 0} orders</span>
            </div>`).join('');
    };

    /* ====================================================================
       NOTIFICATION SOUND
    ==================================================================== */
    const playNotifSound = () => {
        const audio = document.getElementById('notifSound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    };

    /* ====================================================================
       CSV EXPORT
    ==================================================================== */
    const exportOrdersCSV = (orders) => {
        if (!orders || !orders.length) return showToast('No data to export', 'error');
        const headers = ['Order ID', 'Customer', 'Phone', 'Type', 'Items', 'Total', 'Status', 'Date'];
        const rows = orders.map(o => {
            const items = (o.items || []).map(i => `${i.name} x${i.quantity || 1}`).join('; ');
            return [
                o.orderId || o._id || '',
                o.customerName || o.customer?.name || '',
                o.customerPhone || o.customer?.phone || '',
                o.orderType || '',
                `"${items}"`,
                o.total || 0,
                o.status || '',
                o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
            ].join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported', 'success');
    };

    /* ====================================================================
       HELPERS
    ==================================================================== */
    const _esc = (s) => {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    };

    const _fmtDate = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        if (isNaN(dt)) return '—';
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const h = dt.getHours(), hr = h % 12 || 12, ap = h >= 12 ? 'PM' : 'AM';
        return `${dt.getDate()} ${M[dt.getMonth()]}, ${hr}:${String(dt.getMinutes()).padStart(2,'0')} ${ap}`;
    };

    const _statusBadge = (status) => {
        const s = (status || 'PENDING').toUpperCase();
        const cls = s.toLowerCase();
        const labels = { PENDING: '⏳ Pending', PREPARING: '🔥 Preparing', COMPLETED: '✅ Completed', CANCELLED: '❌ Cancelled' };
        return `<span class="status-badge status-badge--${cls}">${labels[s] || s}</span>`;
    };

    /* ---------- Init confirm dialog ---------- */
    _setupConfirm();

    /* ---------- Public surface ---------- */
    return Object.freeze({
        $, $$,
        showToast, showConfirm,
        switchPage,
        updateSocketStatus,
        renderStats, renderRecentOrders,
        renderOrderCards, prependOrderCard,
        renderHistoryTable, renderPagination,
        renderMenuItems,
        drawBarChart, renderTopItems,
        playNotifSound, exportOrdersCSV,
    });
})();
