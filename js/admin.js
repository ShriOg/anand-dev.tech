'use strict';

/* ═══════════════════════════════════════════════════════════════
 *  MenuNova — Unified Admin Frontend
 *  Single-file: OrderStatus → AdminUI → AdminAPI → AdminSocket → App
 *  Restaurant loaded dynamically via RestaurantConfig.slug
 * ═══════════════════════════════════════════════════════════════ */

/* ── Guard: slug must exist ── */
(function () {
    if (!RestaurantConfig.initialized) {
        const wrap = document.getElementById('layout');
        const gate = document.getElementById('gate');
        const sidebar = document.getElementById('sidebar');
        if (wrap) wrap.style.display = 'none';
        if (gate) gate.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        document.getElementById('notFoundPage').style.display = '';
        return;
    }
    /* set dynamic sidebar name */
    const nameEl = document.getElementById('sidebarName');
    const isDemo = RestaurantConfig.isDemo === true;
    if (nameEl) nameEl.textContent = RestaurantConfig.slug.charAt(0).toUpperCase() + RestaurantConfig.slug.slice(1);
    document.title = `Admin — ${RestaurantConfig.slug}`;
})();

/* ═══════════════════════════════════
 * 1. ORDER STATUS CONSTANTS
 * ═══════════════════════════════════ */
const ORDER_STATUS = Object.freeze({
    PENDING:   'Pending',
    PREPARING: 'Preparing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
});

const ALLOWED_TRANSITIONS = Object.freeze({
    [ORDER_STATUS.PENDING]:   [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PREPARING]: [ORDER_STATUS.COMPLETED],
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: [],
});

function normalizeStatus(raw) {
    if (!raw) return ORDER_STATUS.PENDING;
    const n = String(raw).trim().toLowerCase();
    const map = { pending: ORDER_STATUS.PENDING, preparing: ORDER_STATUS.PREPARING, completed: ORDER_STATUS.COMPLETED, cancelled: ORDER_STATUS.CANCELLED };
    return map[n] || ORDER_STATUS.PENDING;
}

function isTransitionAllowed(current, next) {
    const allowed = ALLOWED_TRANSITIONS[current];
    if (!allowed) { console.warn('[OrderStatus] Unknown:', current); return false; }
    const ok = allowed.includes(next);
    if (!ok) console.warn(`[OrderStatus] "${current}" → "${next}" blocked. Allowed: [${allowed}]`);
    return ok;
}

/* ═══════════════════════════════════
 * 2. ADMIN UI
 * ═══════════════════════════════════ */
const AdminUI = (() => {
    const $ = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => ctx.querySelectorAll(s);

    let _toastTimer;
    const showToast = (message, type = 'info') => {
        let el = $('#adminToast');
        if (!el) { el = document.createElement('div'); el.id = 'adminToast'; el.className = 'admin-toast'; document.body.appendChild(el); }
        clearTimeout(_toastTimer); el.textContent = message;
        el.className = `admin-toast admin-toast--${type} admin-toast--visible`;
        _toastTimer = setTimeout(() => el.classList.remove('admin-toast--visible'), 2800);
    };

    let _confirmResolve = null;
    const showConfirm = (message) => new Promise(resolve => { _confirmResolve = resolve; $('#confirmMsg').textContent = message; $('#confirmOverlay').hidden = false; });
    const _setupConfirm = () => {
        $('#confirmCancel')?.addEventListener('click', () => { $('#confirmOverlay').hidden = true; if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; } });
        $('#confirmOk')?.addEventListener('click', () => { $('#confirmOverlay').hidden = true; if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; } });
    };

    const switchPage = (pageKey) => {
        const pages = $$('.page');
        const current = Array.from(pages).find(p => !p.hidden);
        if (current && current.dataset.page !== pageKey) {
            current.classList.add('page--exit');
            const timer = setTimeout(() => { current.classList.remove('page--exit'); current.hidden = true; _showPage(pageKey, pages); }, 250);
            current.addEventListener('animationend', function handler() { clearTimeout(timer); current.removeEventListener('animationend', handler); current.classList.remove('page--exit'); current.hidden = true; _showPage(pageKey, pages); }, { once: true });
        } else _showPage(pageKey, pages);
        $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === pageKey));
        const titles = { dashboard: 'Dashboard', orders: 'Live Orders', history: 'Order History', menu: 'Menu', analytics: 'Analytics', settings: 'Settings' };
        $('#pageTitle').textContent = titles[pageKey] || 'Dashboard';
    };
    const _showPage = (key, pages) => { pages.forEach(p => { if (p.dataset.page === key) { p.hidden = false; p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; } else p.hidden = true; }); };

    const updateSocketStatus = (status) => {
        const el = $('#socketStatus'); if (!el) return;
        el.classList.remove('topbar__status--live', 'topbar__status--connecting', 'topbar__status--offline');
        if (status === true) { el.textContent = ' Live'; el.title = 'Realtime connected'; el.classList.add('topbar__status--live'); }
        else if (status === 'connecting') { el.innerHTML = '🟡 Connecting'; el.title = 'Connecting…'; el.classList.add('topbar__status--connecting'); }
        else { el.innerHTML = '🔴 Offline'; el.title = 'Disconnected'; el.classList.add('topbar__status--offline'); }
    };

    const animateCounter = (element, newValue) => {
        if (!element) return;
        const currentText = element.textContent.replace(/[₹,\s—]/g, '');
        const from = parseInt(currentText, 10) || 0;
        const to = typeof newValue === 'number' ? newValue : (parseInt(String(newValue).replace(/[₹,\s]/g, ''), 10) || 0);
        if (from === to) return;
        const isRupee = element.textContent.startsWith('₹') || element.dataset.prefix === '₹';
        const duration = 600, startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime, progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + (to - from) * eased);
            element.textContent = isRupee ? '₹' + current.toLocaleString('en-IN') : current.toLocaleString('en-IN');
            if (progress < 1) requestAnimationFrame(step);
            else { element.classList.add('stat-val--pop'); setTimeout(() => element.classList.remove('stat-val--pop'), 300); }
        };
        requestAnimationFrame(step);
    };

    const renderStats = (data) => {
        if (!data) return;
        const _a = (el, val, isR) => { if (!el) return; if (typeof val !== 'number') { el.textContent = '—'; return; } if (isR) el.dataset.prefix = '₹'; animateCounter(el, val); };
        _a($('#statTotalOrders'), data.totalOrders);
        _a($('#statTodayOrders'), data.todayOrders);
        _a($('#statTotalRevenue'), data.totalRevenue, true);
        _a($('#statTodayRevenue'), data.todayRevenue, true);
        _a($('#statTotalCustomers'), data.totalCustomers);
    };

    const _esc = (s) => { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
    const _fmtDate = (d) => { if (!d) return '—'; const dt = new Date(d); if (isNaN(dt)) return '—'; const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const h = dt.getHours(), hr = h % 12 || 12, ap = h >= 12 ? 'PM' : 'AM'; return `${dt.getDate()} ${M[dt.getMonth()]}, ${hr}:${String(dt.getMinutes()).padStart(2, '0')} ${ap}`; };
    const _statusBadge = (status) => { const s = normalizeStatus(status); const cls = s.toLowerCase(); const labels = { [ORDER_STATUS.PENDING]: '⏳ Pending', [ORDER_STATUS.PREPARING]: '🔥 Preparing', [ORDER_STATUS.COMPLETED]: '✅ Completed', [ORDER_STATUS.CANCELLED]: '❌ Cancelled' }; return `<span class="status-badge status-badge--${cls}">${labels[s] || s}</span>`; };
    const _emptyState = (icon, title, sub) => `<div class="empty-state"><span class="empty-state__icon">${icon}</span><p class="empty-state__title">${_esc(title)}</p><p class="empty-state__sub">${_esc(sub)}</p></div>`;

    const renderRecentOrders = (orders) => {
        const c = $('#dashRecentOrders'); if (!c) return;
        if (!orders?.length) { c.innerHTML = _emptyState('📭', 'No recent orders', 'Orders will appear here as they come in'); return; }
        c.innerHTML = orders.slice(0, 5).map(o => `<div class="recent-row"><span class="recent-row__id">${o.orderId || o._id?.slice(-6) || '—'}</span><span class="recent-row__name">${_esc(o.customerName || o.customer?.name || '—')}</span><span class="recent-row__total">₹${o.total || 0}</span><span class="recent-row__status">${_statusBadge(o.status)}</span></div>`).join('');
    };

    const _buildTimeline = (status) => {
        const steps = [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.COMPLETED];
        const isCancelled = status === ORDER_STATUS.CANCELLED;
        if (isCancelled) return '<div class="order-timeline"><div class="order-timeline__step order-timeline__step--cancelled"><div class="order-timeline__circle">✕</div><span class="order-timeline__label">Cancelled</span></div></div>';
        const currentIdx = steps.indexOf(status);
        let html = '<div class="order-timeline">';
        steps.forEach((step, i) => {
            const isComp = i < currentIdx, isAct = i === currentIdx;
            const cls = isComp ? 'order-timeline__step--completed' : isAct ? 'order-timeline__step--active' : '';
            html += `<div class="order-timeline__step ${cls}"><div class="order-timeline__circle">${isComp ? '✓' : i + 1}</div><span class="order-timeline__label">${step}</span></div>`;
            if (i < steps.length - 1) { const lf = i < currentIdx, la = i === currentIdx - 1; html += `<div class="order-timeline__line ${lf ? 'order-timeline__line--filled' : la ? 'order-timeline__line--active' : ''}"><div class="order-timeline__line-fill"></div></div>`; }
        });
        return html + '</div>';
    };

    const _buildActionButtons = (order, status) => {
        const s = normalizeStatus(status); const mongoId = order._id || order.orderId; const orderCode = order.orderId || '';
        const next = ALLOWED_TRANSITIONS[s] || [];
        if (next.length) return next.map(ns => `<button class="status-btn" data-order-id="${mongoId}" data-order-code="${orderCode}" data-status="${ns}" data-action="status-change">${ns}</button>`).join('');
        return `<span class="status-badge status-badge--${s.toLowerCase()}">${s}</span>`;
    };

    const _orderCardHTML = (o, isNew = false) => {
        const typeClass = (o.orderType || '').toLowerCase().includes('dine') ? 'dinein' : 'takeaway';
        const items = o.items || []; const status = normalizeStatus(o.status);
        return `<div class="order-card${isNew ? ' order-card--new' : ''}" data-order-id="${o._id || o.orderId}" data-status="${status}"><div class="order-card__header"><span class="order-card__id">${o.orderId || o._id?.slice(-6) || '—'}</span><span class="order-card__type order-card__type--${typeClass}">${o.orderType || '—'}</span><span class="order-card__time">${_fmtDate(o.createdAt)}</span></div>${_buildTimeline(status)}<div class="order-card__customer"><span>👤 ${_esc(o.customerName || o.customer?.name || '—')}</span><span>📞 ${o.customerPhone || o.customer?.phone || '—'}</span>${o.persons ? `<span>👥 ${o.persons}</span>` : ''}${o.table ? `<span>🪑 Table ${o.table}</span>` : ''}</div><div class="order-card__items">${items.map(i => `<div class="order-card__item"><span class="order-card__item-name">${_esc(i.name)} ${i.size ? '(' + i.size + ')' : ''} × ${i.quantity || 1}</span><span class="order-card__item-price">₹${i.price * (i.quantity || 1)}</span></div>`).join('')}</div>${o.note ? `<p style="font-size:12px;color:var(--c-text-soft);margin-bottom:var(--sp-3)">📝 ${_esc(o.note)}</p>` : ''}<div class="order-card__footer"><span class="order-card__total">₹${o.total || 0}</span><div class="order-card__actions"><div class="status-buttons">${_buildActionButtons(o, status)}</div><button class="btn-delete-order" data-action="delete-order" data-order-id="${o._id || o.orderId}">🗑 Delete</button></div></div></div>`;
    };

    const renderOrderCards = (orders, container) => {
        const target = container || $('#liveOrdersContainer'); if (!target) return;
        if (!orders?.length) { target.innerHTML = _emptyState('📋', 'No orders found', 'Live orders will show up here in realtime'); return; }
        const active = orders.filter(o => { const s = normalizeStatus(o.status); return s !== ORDER_STATUS.COMPLETED && s !== ORDER_STATUS.CANCELLED; });
        const cancelled = orders.filter(o => normalizeStatus(o.status) === ORDER_STATUS.CANCELLED);
        const completed = orders.filter(o => normalizeStatus(o.status) === ORDER_STATUS.COMPLETED);
        let html = '';
        if (active.length) { html += `<div class="orders-section-label">🔥 Active Orders (${active.length})</div>`; html += active.map(o => _orderCardHTML(o)).join(''); }
        if (cancelled.length) { html += `<div class="orders-section-label">❌ Cancelled (${cancelled.length})</div>`; html += cancelled.map(o => _orderCardHTML(o).replace('class="order-card', 'class="order-card order-card--cancelled-row moved-to-bottom')).join(''); }
        if (completed.length) { html += `<div class="orders-section-label">✅ Completed (${completed.length})</div>`; html += completed.map(o => _orderCardHTML(o).replace('class="order-card', 'class="order-card order-card--collapsed moved-to-bottom')).join(''); }
        target.innerHTML = html;
    };

    const prependOrderCard = (order) => {
        const target = $('#liveOrdersContainer'); if (!target) return;
        const empty = target.querySelector('.empty-state, .skeleton-rows, p'); if (empty) empty.remove();
        const div = document.createElement('div'); div.innerHTML = _orderCardHTML(order, true);
        const card = div.firstElementChild; card.classList.add('order-enter'); target.prepend(card);
    };

    const updateOrderCard = (orderId, updatedOrder) => {
        const card = document.querySelector(`.order-card[data-order-id="${orderId}"]`); if (!card) return false;
        const tmp = document.createElement('div'); tmp.innerHTML = _orderCardHTML(updatedOrder);
        const nc = tmp.firstElementChild; nc.style.animation = 'none'; card.replaceWith(nc);
        nc.style.boxShadow = '0 0 0 2px var(--c-green)'; setTimeout(() => nc.style.boxShadow = '', 800); return true;
    };

    const renderHistoryTable = (orders) => {
        const tbody = $('#historyTableBody'); if (!tbody) return;
        if (!orders?.length) { tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No orders found</td></tr>'; return; }
        tbody.innerHTML = orders.map(o => {
            const items = (o.items || []).map(i => `${i.name}${i.size ? ' (' + i.size + ')' : ''} ×${i.quantity || 1}`).join(', ');
            return `<tr><td><strong>${o.orderId || o._id?.slice(-6) || '—'}</strong></td><td>${_esc(o.customerName || o.customer?.name || '—')}</td><td>${o.customerPhone || o.customer?.phone || '—'}</td><td>${o.orderType || '—'}</td><td style="max-width:200px;font-size:12px;color:var(--c-text-soft)">${_esc(items)}</td><td><strong>₹${o.total || 0}</strong></td><td>${_statusBadge(o.status)}</td><td style="font-size:12px">${_fmtDate(o.createdAt)}</td></tr>`;
        }).join('');
    };

    const renderPagination = (current, total, container) => {
        const target = container || $('#historyPagination'); if (!target || total <= 1) { if (target) target.innerHTML = ''; return; }
        let html = `<button class="pagination__btn" data-page="${current - 1}" ${current <= 1 ? 'disabled' : ''}>← Prev</button>`;
        const maxV = 5; let start = Math.max(1, current - Math.floor(maxV / 2)); let end = Math.min(total, start + maxV - 1); if (end - start + 1 < maxV) start = Math.max(1, end - maxV + 1);
        for (let i = start; i <= end; i++) html += `<button class="pagination__btn${i === current ? ' active' : ''}" data-page="${i}">${i}</button>`;
        html += `<button class="pagination__btn" data-page="${current + 1}" ${current >= total ? 'disabled' : ''}>Next →</button>`;
        target.innerHTML = html;
    };

    const renderMenuItems = (items, categories) => {
        const c = $('#menuMgmtContainer'); if (!c) return;
        const catFilter = $('#menuCategoryFilter');
        if (catFilter && categories && catFilter.options.length <= 1) categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat.key || cat; opt.textContent = cat.title || cat; catFilter.appendChild(opt); });
        if (!items?.length) { c.innerHTML = _emptyState('🍽️', 'No menu items', 'Menu items will load when the server connects'); return; }
        c.innerHTML = items.map(item => {
            const isActive = item.active !== false, isSpecial = !!item.special;
            return `<div class="menu-mgmt-card${!isActive ? ' menu-mgmt-card--inactive' : ''}" data-item-id="${item._id || item.id}"><div class="menu-mgmt-card__info"><div class="menu-mgmt-card__name">${_esc(item.name)}</div><div class="menu-mgmt-card__cat">${item.category || '—'}</div></div><div class="menu-mgmt-card__prices">${(item.prices || []).map((p, idx) => `<div class="menu-mgmt-price"><span class="menu-mgmt-price__label">${p.label}:</span><input type="number" class="menu-mgmt-price__input" data-price-idx="${idx}" value="${p.value}" min="0" step="5" data-action="price-edit"></div>`).join('')}</div><div class="menu-mgmt-card__toggles"><label class="toggle"><input type="checkbox" data-action="toggle-special" ${isSpecial ? 'checked' : ''}><span class="toggle__track"></span> ★ Special</label><label class="toggle"><input type="checkbox" data-action="toggle-active" ${isActive ? 'checked' : ''}><span class="toggle__track"></span> Active</label></div><button class="menu-mgmt-card__save" data-action="save-menu-item">Save</button></div>`;
        }).join('');
    };

    const drawBarChart = (canvasId, labels, values, color = '#e85d04') => {
        const canvas = document.getElementById(canvasId); if (!canvas) return;
        const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1;
        const W = canvas.parentElement.clientWidth || 600, H = 260;
        canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.scale(dpr, dpr);
        const pad = { top: 20, right: 20, bottom: 40, left: 50 }; const chartW = W - pad.left - pad.right, chartH = H - pad.top - pad.bottom; const maxVal = Math.max(...values, 1);
        ctx.clearRect(0, 0, W, H);
        const borderClr = getComputedStyle(document.documentElement).getPropertyValue('--c-border').trim() || '#e5e7eb';
        const textClr = getComputedStyle(document.documentElement).getPropertyValue('--c-text-soft').trim() || '#6b7280';
        ctx.strokeStyle = borderClr; ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) { const y = pad.top + (chartH / 4) * i; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke(); }
        ctx.fillStyle = textClr; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) { const y = pad.top + (chartH / 4) * i; ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), pad.left - 8, y + 4); }
        const barGap = 8; const barW = Math.max(16, (chartW - barGap * (labels.length + 1)) / labels.length);
        const totalBarArea = barW * labels.length + barGap * (labels.length + 1); const offsetX = pad.left + (chartW - totalBarArea) / 2 + barGap;
        values.forEach((val, i) => {
            const x = offsetX + i * (barW + barGap); const barH = (val / maxVal) * chartH; const y = pad.top + chartH - barH;
            ctx.beginPath(); const r = Math.min(4, barW / 2); ctx.moveTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.arcTo(x + barW, y, x + barW, y + r, r); ctx.lineTo(x + barW, pad.top + chartH); ctx.lineTo(x, pad.top + chartH); ctx.closePath(); ctx.fillStyle = color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-text').trim() || '#111827'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'; if (val > 0) ctx.fillText(val, x + barW / 2, y - 6);
            ctx.fillStyle = textClr; ctx.font = '11px Inter, sans-serif'; ctx.fillText(labels[i], x + barW / 2, H - pad.bottom + 18);
        });
    };

    const drawLineChart = (canvasId, labels, values, color = '#e85d04') => {
        const canvas = document.getElementById(canvasId); if (!canvas) return;
        const ctx = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1;
        const W = canvas.parentElement.clientWidth || 600, H = 260;
        canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.scale(dpr, dpr);
        const pad = { top: 20, right: 20, bottom: 40, left: 55 }; const chartW = W - pad.left - pad.right, chartH = H - pad.top - pad.bottom; const maxVal = Math.max(...values, 1);
        ctx.clearRect(0, 0, W, H);
        const textClr = getComputedStyle(document.documentElement).getPropertyValue('--c-text-soft').trim() || '#8a8a9e';
        const borderClr = getComputedStyle(document.documentElement).getPropertyValue('--c-border').trim() || '#2a2a35';
        ctx.strokeStyle = borderClr; ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) { const y = pad.top + (chartH / 4) * i; ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke(); }
        ctx.fillStyle = textClr; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) { const y = pad.top + (chartH / 4) * i; ctx.fillText('₹' + Math.round(maxVal - (maxVal / 4) * i).toLocaleString('en-IN'), pad.left - 8, y + 4); }
        if (values.length < 2) return;
        const step = chartW / (values.length - 1);
        const points = values.map((v, i) => ({ x: pad.left + i * step, y: pad.top + chartH - (v / maxVal) * chartH }));
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, points.length - 1)];
            ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
        }
        ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
        const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH); grad.addColorStop(0, color + '30'); grad.addColorStop(1, color + '00');
        ctx.lineTo(points[points.length - 1].x, pad.top + chartH); ctx.lineTo(points[0].x, pad.top + chartH); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
        points.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); });
        ctx.fillStyle = textClr; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
        const labelStep = Math.max(1, Math.floor(labels.length / 8));
        labels.forEach((lbl, i) => { if (i % labelStep === 0 || i === labels.length - 1) ctx.fillText(lbl, points[i].x, H - pad.bottom + 16); });
    };

    const renderTopItems = (items) => {
        const c = $('#topItemsContainer'); if (!c) return;
        if (!items?.length) { c.innerHTML = _emptyState('📊', 'No data yet', 'Analytics data will appear after orders come in'); return; }
        c.innerHTML = items.slice(0, 10).map((item, i) => `<div class="top-item"><span class="top-item__rank">${i + 1}</span><span class="top-item__name">${_esc(item.name || item._id || '—')}${i === 0 ? ' <span class="top-selling-badge">MOST ORDERED TODAY</span>' : ''}</span><span class="top-item__count">${item.count || item.totalQty || 0} orders</span></div>`).join('');
    };

    const renderAnalyticsKPI = (data) => {
        const c = $('#analyticsKpiGrid'); if (!c || !data) return;
        const wg = data.weeklyGrowth ?? 0, rr = data.repeatCustomerRate ?? 0, ap = data.avgPrepTime ?? 0, tr = data.todayRevenue ?? 0;
        c.innerHTML = `<div class="kpi-card kpi-card--growth"><div class="kpi-card__value kpi-card__value--green">${wg >= 0 ? '+' : ''}${wg.toFixed(1)}%</div><div class="kpi-card__label">Weekly Growth</div><div class="kpi-card__trend kpi-card__trend--${wg >= 0 ? 'up' : 'down'}">${wg >= 0 ? '↑' : '↓'} vs last week</div></div><div class="kpi-card kpi-card--repeat"><div class="kpi-card__value kpi-card__value--blue">${rr.toFixed(0)}%</div><div class="kpi-card__label">Repeat Customer Rate</div><div class="kpi-card__trend kpi-card__trend--up">📊 Returning</div></div><div class="kpi-card kpi-card--prep"><div class="kpi-card__value kpi-card__value--yellow">${ap.toFixed(0)} min</div><div class="kpi-card__label">Average Prep Time</div><div class="kpi-card__trend kpi-card__trend--${ap <= 15 ? 'up' : 'down'}">⏱ ${ap <= 15 ? 'Fast' : 'Needs attention'}</div></div><div class="kpi-card kpi-card--revenue"><div class="kpi-card__value kpi-card__value--brand">₹${tr.toLocaleString('en-IN')}</div><div class="kpi-card__label">Today's Revenue</div><div class="kpi-card__trend kpi-card__trend--up">💰 Live</div></div>`;
    };

    const highlightTopSelling = (itemName) => {
        $$('.menu-mgmt-card .top-selling-badge').forEach(b => b.remove()); if (!itemName) return;
        $$('.menu-mgmt-card').forEach(card => { const nameEl = card.querySelector('.menu-mgmt-card__name'); if (nameEl && nameEl.textContent.trim().toLowerCase() === itemName.toLowerCase() && !nameEl.querySelector('.top-selling-badge')) { const badge = document.createElement('span'); badge.className = 'top-selling-badge'; badge.textContent = 'MOST ORDERED TODAY'; nameEl.appendChild(badge); } });
    };

    const playNotifSound = () => { const audio = document.getElementById('notifSound'); if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); } };

    const exportOrdersCSV = (orders) => {
        if (!orders?.length) return showToast('No data to export', 'error');
        const headers = ['Order ID', 'Customer', 'Phone', 'Type', 'Items', 'Total', 'Status', 'Date'];
        const rows = orders.map(o => { const items = (o.items || []).map(i => `${i.name} x${i.quantity || 1}`).join('; '); return [o.orderId || o._id || '', o.customerName || o.customer?.name || '', o.customerPhone || o.customer?.phone || '', o.orderType || '', `"${items}"`, o.total || 0, o.status || '', o.createdAt ? new Date(o.createdAt).toLocaleString() : ''].join(','); });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url); showToast('CSV exported', 'success');
    };

    const updateOrderStats = (orders) => {
        if (!orders) return;
        const activeCount = orders.filter(o => { const s = normalizeStatus(o.status); return s === ORDER_STATUS.PENDING || s === ORDER_STATUS.PREPARING; }).length;
        const badgeEl = $('#activeOrdersBadge');
        if (badgeEl) { badgeEl.textContent = activeCount ? `${activeCount} Active` : ''; badgeEl.style.display = activeCount ? 'inline-block' : 'none'; }
        const todayStr = new Date().toDateString();
        const completedToday = orders.filter(o => { if (normalizeStatus(o.status) !== ORDER_STATUS.COMPLETED) return false; const dt = o.completedAt || o.updatedAt; return dt && new Date(dt).toDateString() === todayStr; }).length;
        const counterEl = $('#completedTodayCounter');
        if (counterEl) { counterEl.textContent = `✅ Completed Today: ${completedToday}`; counterEl.style.display = completedToday ? 'inline-block' : 'none'; }
    };

    _setupConfirm();

    return Object.freeze({ $, $$, showToast, showConfirm, switchPage, updateSocketStatus, renderStats, renderRecentOrders, renderOrderCards, prependOrderCard, updateOrderCard, renderHistoryTable, renderPagination, renderMenuItems, drawBarChart, drawLineChart, renderTopItems, renderAnalyticsKPI, highlightTopSelling, playNotifSound, animateCounter, exportOrdersCSV, updateOrderStats });
})();

/* ═══════════════════════════════════
 * 3. ADMIN API
 * ═══════════════════════════════════ */
const AdminAPI = (() => {
    const BASE_URL = RestaurantConfig.API_BASE;
    console.log('[AdminAPI] Using base:', BASE_URL);

    const TOKEN_KEY = (window.MenuNovaAPI && MenuNovaAPI.ADMIN_TOKEN_KEY) || 'admin_token';
    const TOKEN_KEY_ALT = 'adminToken';
    let _adminToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY_ALT) || null;

    const getToken = () => _adminToken;
    const setToken = (token) => {
        _adminToken = token || null;
        if (_adminToken) {
            localStorage.setItem(TOKEN_KEY, _adminToken);
            localStorage.setItem(TOKEN_KEY_ALT, _adminToken);
        } else {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_KEY_ALT);
        }
    };
    const clearToken = () => setToken(null);

    const _parseJson = async (res) => { const ct = res.headers.get('content-type') || ''; if (!ct.includes('application/json')) return null; try { return await res.json(); } catch { return null; } };
    const _httpErrorMessage = (status, payload) => { const fb = payload?.message || payload?.error; if (fb) return fb; if (status === 404) return 'Restaurant not found.'; if (status >= 500) return 'Server error.'; if (status === 401) return 'Admin auth required.'; return `HTTP ${status}`; };

    async function authFetch(url, options = {}) {
        const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY_ALT);

        if (!token) {
            throw new Error('No token');
        }

        console.log('Calling:', url);
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
    }

    const _singleFetch = async (endpoint, options = {}) => {
        if (!BASE_URL) throw new Error('Restaurant runtime not initialized.');
        const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), options.timeout || 10000);
        try {
            const url = `${BASE_URL}${endpoint}`;
            debug('API Request', { method: options.method || 'GET', url });
            const res = await authFetch(url, { ...options, signal: controller.signal });
            const data = await _parseJson(res);
            if (!res.ok) {
                debug('API Error', { status: res.status, body: data });
                if (res.status === 401) {
                    clearToken();
                    localStorage.clear();
                    document.dispatchEvent(new CustomEvent('admin:unauthorized'));
                }
                throw new Error(_httpErrorMessage(res.status, data));
            }
            if (res.status === 204) return null;
            return data;
        } catch (err) {
            if (err.name === 'AbortError') throw new Error('Request timed out.');
            if ((err?.message || '') === 'No token') {
                clearToken();
                localStorage.clear();
                document.dispatchEvent(new CustomEvent('admin:unauthorized'));
            }
            throw err;
        } finally { clearTimeout(timer); }
    };

    const _fetch = async (endpoint, options = {}) => _singleFetch(endpoint, options);

    const getStats = () => _fetch('/admin/stats');
    const getAuthStatus = async () => {
        if (!BASE_URL) throw new Error('Restaurant runtime not initialized.');
        const url = `${BASE_URL}/admin/status`;
        console.log('Calling:', url);
        const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        const data = await _parseJson(res);
        if (!res.ok) throw new Error(_httpErrorMessage(res.status, data));
        return data;
    };
    const setupAdmin = async (password) => {
        if (!BASE_URL) throw new Error('Restaurant runtime not initialized.');
        const url = `${BASE_URL}/admin/setup`;
        console.log('Calling:', url);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await _parseJson(res);
        if (!res.ok) throw new Error(_httpErrorMessage(res.status, data));
        return data;
    };
    const loginAdmin = async (password) => {
        if (!BASE_URL) throw new Error('Restaurant runtime not initialized.');
        const url = `${BASE_URL}/admin/login`;
        console.log('Calling:', url);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await _parseJson(res);
        if (!res.ok) throw new Error(_httpErrorMessage(res.status, data));
        return data;
    };
    const changePassword = (oldPassword, newPassword) => _fetch('/admin/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) });
    const getOrders = (params = {}) => { const qs = new URLSearchParams(); if (params.status) qs.set('status', params.status); if (params.page) qs.set('page', params.page); if (params.limit) qs.set('limit', params.limit); if (params.dateFrom) qs.set('dateFrom', params.dateFrom); if (params.dateTo) qs.set('dateTo', params.dateTo); if (params.phone) qs.set('phone', params.phone); const q = qs.toString(); return _fetch(`/admin/orders${q ? '?' + q : ''}`); };
    const getRecentOrders = (limit = 5) => _fetch(`/admin/orders?limit=${limit}&sort=-createdAt`);
    const getTodayOrders = (params = {}) => { const qs = new URLSearchParams(); if (params.status) qs.set('status', params.status); const q = qs.toString(); return _fetch(`/admin/orders/today${q ? '?' + q : ''}`); };
    const updateOrder = (orderId, payload) => _fetch(`/admin/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    const updateOrderStatus = (orderId, currentStatus, newStatus) => { if (!isTransitionAllowed(currentStatus, newStatus)) return Promise.reject(new Error(`"${currentStatus}" → "${newStatus}" not allowed`)); return _fetch(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) }); };
    const cancelOrder = async (orderId) => {
        const id = encodeURIComponent(orderId);
        const url = `${BASE_URL}/admin/orders/${id}/status`;
        const res = await authFetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CANCELLED' }),
        });
        const data = await _parseJson(res);
        if (!res.ok) {
            if (res.status === 401) {
                clearToken();
                localStorage.clear();
                document.dispatchEvent(new CustomEvent('admin:unauthorized'));
            }
            throw new Error(_httpErrorMessage(res.status, data));
        }
        return data;
    };
    const deleteOrder = (orderId) => _fetch(`/admin/orders/${orderId}`, { method: 'DELETE' });
    const getMenu = () => _fetch('/admin/menu/all');
    const updateMenuItem = (itemId, data) => _fetch(`/admin/menu/${itemId}`, { method: 'PUT', body: JSON.stringify(data) });
    const patchMenuItem = (itemId, data) => _fetch(`/admin/menu/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) });
    const createMenuItem = (data) => _fetch('/admin/menu', { method: 'POST', body: JSON.stringify(data) });
    const getAnalytics = () => _fetch('/admin/analytics');
    const getInsights = () => _fetch('/admin/insights');

    return Object.freeze({ getToken, setToken, clearToken, authFetch, getStats, getAuthStatus, setupAdmin, loginAdmin, changePassword, getOrders, getRecentOrders, getTodayOrders, updateOrder, updateOrderStatus, cancelOrder, deleteOrder, getMenu, updateMenuItem, patchMenuItem, createMenuItem, getAnalytics, getInsights });
})();

/* ═══════════════════════════════════
 * 4. ADMIN SOCKET
 * ═══════════════════════════════════ */
const AdminSocket = (() => {
    let _socket = null, _connected = false;
    const _EVENTS = { NEW_ORDER: 'restaurant:new-order', ORDER_UPDATED: 'restaurant:order-updated', ORDER_DELETED: 'restaurant:order-deleted', TOP_ITEM_UPDATE: 'restaurant:top-item-update' };
    const _emit = (type, detail) => document.dispatchEvent(new CustomEvent(type, { detail }));
    const _updateStatus = (online) => { _connected = online; _emit('socket:status', { connected: online }); };

    let _pollInterval = null, _lastPollTimestamp = Date.now();
    const _startPolling = () => { if (_pollInterval) return; _pollInterval = setInterval(async () => { try { const orders = await AdminAPI.getOrders({ dateFrom: new Date(_lastPollTimestamp).toISOString() }); _lastPollTimestamp = Date.now(); if (orders?.data) orders.data.forEach(o => _emit('admin:new-order', o)); } catch {} }, 15000); };

    const connect = () => {
        if (typeof io === 'undefined') { console.warn('[AdminSocket] Socket.IO not loaded — polling fallback.'); _updateStatus(false); _startPolling(); return; }
        _emit('socket:status', { connected: 'connecting' });
        _socket = (window.MenuNovaSocket && MenuNovaSocket.create({ reconnectionDelay: 2000, reconnectionAttempts: 20 })) || io(RestaurantConfig.SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 2000, reconnectionAttempts: 20 });
        _socket.on('connect', () => { console.log('[AdminSocket] Connected'); _updateStatus(true); if (window.MenuNovaSocket) MenuNovaSocket.joinAdminRoom(_socket); });
        _socket.on('disconnect', (reason) => { console.log('[AdminSocket] Disconnected:', reason); _updateStatus(false); });
        _socket.on('connect_error', () => _updateStatus(false));
        _socket.on('reconnect_attempt', () => _emit('socket:status', { connected: 'connecting' }));
        _socket.on(_EVENTS.NEW_ORDER, (order) => { debug('Socket New Order', order); _emit('admin:new-order', order); });
        _socket.on(_EVENTS.ORDER_UPDATED, (data) => { debug('Socket Status Update', data); _emit('admin:order-updated', data); });
        _socket.on(_EVENTS.ORDER_DELETED, (data) => { debug('Socket Order Deleted', data); _emit('admin:order-deleted', data); });
        _socket.on(_EVENTS.TOP_ITEM_UPDATE, (data) => { debug('Socket Top Item', data); _emit('admin:top-item-update', data); });
    };

    const disconnect = () => { if (_socket) { _socket.disconnect(); _socket = null; } if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; } _updateStatus(false); };
    const isConnected = () => _connected;
    return Object.freeze({ connect, disconnect, isConnected });
})();

/* ═══════════════════════════════════
 * 5. APP BOOT
 * ═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    if (!RestaurantConfig.initialized) return;
    if (typeof AdminUI === 'undefined' || typeof AdminAPI === 'undefined') { console.error('[Admin] FATAL: modules not loaded.'); return; }

    const { $, $$, showToast, showConfirm, switchPage, updateSocketStatus, renderStats, renderRecentOrders, renderOrderCards, prependOrderCard, updateOrderCard, renderHistoryTable, renderPagination, renderMenuItems, drawBarChart, drawLineChart, renderTopItems, renderAnalyticsKPI, highlightTopSelling, playNotifSound, animateCounter, exportOrdersCSV, updateOrderStats } = AdminUI;
    const IS_DEMO = RestaurantConfig.isDemo === true;
    const DEMO_SIGNUP_URL = RestaurantConfig.demoSignupUrl || 'https://menunova.me/signup';
    const DEMO_STATS_SEED = Object.freeze({ totalOrders: 182, todayOrders: 23, totalRevenue: 146250, todayRevenue: 18640, totalCustomers: 97 });
    const DEMO_ANALYTICS_SEED = Object.freeze({
        weeklyGrowth: 18.4,
        repeatCustomerRate: 42,
        avgPrepTime: 13,
        todayRevenue: 18640,
        ordersPerDay: [
            { label: 'Mon', count: 14 },
            { label: 'Tue', count: 18 },
            { label: 'Wed', count: 16 },
            { label: 'Thu', count: 22 },
            { label: 'Fri', count: 28 },
            { label: 'Sat', count: 31 },
            { label: 'Sun', count: 26 },
        ],
        revenuePerDay: [
            { label: 'Mon', total: 10600 },
            { label: 'Tue', total: 12900 },
            { label: 'Wed', total: 12100 },
            { label: 'Thu', total: 16800 },
            { label: 'Fri', total: 22100 },
            { label: 'Sat', total: 24400 },
            { label: 'Sun', total: 19800 },
        ],
        topItems: [
            { name: 'Farmhouse Pizza', count: 19 },
            { name: 'Tandoori Paneer Pizza', count: 16 },
            { name: 'Cold Coffee', count: 15 },
            { name: 'Paneer Tikka Platter', count: 12 },
            { name: 'Brownie with Ice Cream', count: 11 },
        ],
    });

    let currentPage = 'dashboard', liveOrders = [], historyPage = 1, historyTotal = 1, allHistoryOrders = [], menuItems = [], menuCategories = [], pendingCount = 0;
    let statsRefreshTimer = null, refreshTimeout = null, autoRefreshInterval = null;
    let _appStarted = false;
    const FIVE_MINUTES = 5 * 60 * 1000;

    function injectDemoBadge() {
        if (!IS_DEMO || document.getElementById('demoFloatingBadge')) return;
        const badge = document.createElement('a');
        badge.id = 'demoFloatingBadge';
        badge.className = 'demo-floating-badge';
        badge.href = DEMO_SIGNUP_URL;
        badge.textContent = '⚡ Live Demo — Powered by MenuNova';
        badge.setAttribute('aria-label', 'Go to MenuNova signup');
        document.body.appendChild(badge);
    }

    function injectDemoLabels() {
        if (!IS_DEMO) return;
        const title = $('#pageTitle');
        if (title && !document.getElementById('adminDemoDataLabel')) {
            const label = document.createElement('span');
            label.id = 'adminDemoDataLabel';
            label.className = 'demo-data-label';
            label.textContent = 'Demo Data';
            title.appendChild(label);
        }
        const statsGrid = $('#statsGrid');
        if (statsGrid && !document.getElementById('demoStatsHint')) {
            const hint = document.createElement('p');
            hint.id = 'demoStatsHint';
            hint.className = 'demo-stats-hint';
            hint.textContent = `Live demo environment using ${RestaurantConfig.slug} dataset`;
            statsGrid.parentElement?.insertBefore(hint, statsGrid);
        }
    }

    function injectTransitionTooltip() {
        const subtitle = document.querySelector('#pageOrders .page__subtitle');
        if (!subtitle || document.getElementById('statusFlowHelp')) return;
        const tip = document.createElement('span');
        tip.id = 'statusFlowHelp';
        tip.className = 'status-flow-tip';
        tip.title = 'Status flow: Pending → Preparing → Completed. You can cancel before completion.';
        tip.textContent = 'ⓘ';
        subtitle.appendChild(tip);
    }

    function pulseRealtimeUpdate() {
        const socketStatus = $('#socketStatus');
        const list = $('#liveOrdersContainer');
        if (socketStatus) {
            socketStatus.classList.remove('topbar__status--pulse');
            void socketStatus.offsetWidth;
            socketStatus.classList.add('topbar__status--pulse');
        }
        if (list) {
            list.classList.remove('orders-grid--realtime');
            void list.offsetWidth;
            list.classList.add('orders-grid--realtime');
            setTimeout(() => list.classList.remove('orders-grid--realtime'), 900);
        }
    }

    const isStatsEmpty = (stats) => {
        if (!stats || typeof stats !== 'object') return true;
        return Number(stats.totalOrders || 0) === 0 && Number(stats.todayOrders || 0) === 0 && Number(stats.totalRevenue || 0) === 0;
    };

    const isAnalyticsEmpty = (data) => {
        if (!data || typeof data !== 'object') return true;
        const top = Array.isArray(data.topItems) ? data.topItems.length : 0;
        const orders = Array.isArray(data.ordersPerDay) ? data.ordersPerDay.length : 0;
        const rev = Array.isArray(data.revenuePerDay) ? data.revenuePerDay.length : 0;
        return top === 0 && orders === 0 && rev === 0;
    };

    function showGate() { $('#gate').hidden = false; $('#layout').hidden = true; $('#sidebar').hidden = true; }
    function hideGate() { $('#gate').hidden = true; $('#layout').hidden = false; $('#sidebar').hidden = false; }

    function _extractToken(response) {
        const direct = response?.token;
        const nested = response?.data?.token;
        return direct || nested || null;
    }

    const _onUnauthorized = () => {
        _appStarted = false;
        AdminSocket.disconnect();
        stopAutoRefresh();
        if (statsRefreshTimer) { clearInterval(statsRefreshTimer); statsRefreshTimer = null; }
        AdminAPI.clearToken();
        localStorage.clear();
        showToast('Session expired. Please login again.', 'error');
        _renderGate('login', 'Session expired. Please login again.');
        _wireLoginForm();
        showGate();
    };

    document.addEventListener('admin:unauthorized', _onUnauthorized);

    function _renderGate(mode, message) {
        const card = document.querySelector('.gate__card');
        if (!card) return;

        if (mode === 'setup') {
            card.innerHTML = `
                <span class="gate__icon">🛠️</span>
                <h1 class="gate__title">Admin Setup</h1>
                <p class="gate__sub">Create your admin password to unlock dashboard</p>
                <form class="gate__form" id="setupForm" autocomplete="off">
                    <input type="password" class="gate__input" id="setupPassword" placeholder="New password" required minlength="6">
                    <input type="password" class="gate__input" id="setupConfirmPassword" placeholder="Confirm password" required minlength="6">
                    <p class="gate__error" id="setupError" hidden></p>
                    <button type="submit" class="gate__btn" id="setupSubmitBtn">Create & Unlock →</button>
                </form>`;
            if (message) {
                const err = document.getElementById('setupError');
                if (err) { err.textContent = message; err.hidden = false; }
            }
            return;
        }

        card.innerHTML = `
            <span class="gate__icon">🔐</span>
            <h1 class="gate__title">Admin Access</h1>
            <p class="gate__sub">Enter password to continue</p>
            <form class="gate__form" id="loginForm" autocomplete="off">
                <div class="gate__input-wrap">
                    <input type="password" class="gate__input" id="loginPassword" placeholder="Password" autofocus required>
                    <button type="button" class="gate__toggle-pw" id="toggleLoginPw" aria-label="Show password">👁️</button>
                </div>
                <p class="gate__error" id="loginError" hidden>${message || 'Wrong password. Try again.'}</p>
                <button type="submit" class="gate__btn" id="loginSubmitBtn">Unlock →</button>
            </form>`;
        const loginError = document.getElementById('loginError');
        if (loginError) loginError.hidden = !message;
    }

    function renderSetupUI(message = '') {
        _renderGate('setup', message);
        _wireSetupForm();
    }

    function renderLoginUI(message = '') {
        _renderGate('login', message);
        _wireLoginForm();
    }

    async function checkAdminSetup() {
        try {
            const API_BASE = RestaurantConfig.API_BASE;
            const res = await fetch(`${API_BASE}/admin/status`);
            const data = await res.json();

            if (data.setup === false) {
                renderSetupUI();
            } else {
                renderLoginUI();
            }
        } catch (err) {
            console.error('Status check failed:', err);
            renderLoginUI('Status check failed. Please try again.');
        }
    }

    async function _startAuthFlow() {
        showGate();

        const existingToken = localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
        if (existingToken) {
            AdminAPI.setToken(existingToken);
            hideGate();
            init();
            return;
        }

        await checkAdminSetup();
    }

    function _wireSetupForm() {
        const form = document.getElementById('setupForm');
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pw = document.getElementById('setupPassword');
            const cpw = document.getElementById('setupConfirmPassword');
            const err = document.getElementById('setupError');
            const btn = document.getElementById('setupSubmitBtn');
            if (!pw || !cpw || !btn || !err) return;
            err.hidden = true;
            const p1 = pw.value.trim();
            const p2 = cpw.value.trim();
            if (p1.length < 6) { err.textContent = 'Password must be at least 6 characters.'; err.hidden = false; return; }
            if (p1 !== p2) { err.textContent = 'Passwords do not match.'; err.hidden = false; return; }

            btn.disabled = true;
            btn.textContent = 'Creating…';
            try {
                await AdminAPI.setupAdmin(p1);
                renderLoginUI('Password created. Please login.');
            } catch (error) {
                err.textContent = error.message || 'Setup failed. Please try again.';
                err.hidden = false;
                btn.disabled = false;
                btn.textContent = 'Create & Unlock →';
            }
        }, { once: true });
    }

    function _wireLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        document.getElementById('toggleLoginPw')?.addEventListener('click', () => {
            const inp = document.getElementById('loginPassword');
            const btn = document.getElementById('toggleLoginPw');
            if (!inp || !btn) return;
            if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
            else { inp.type = 'password'; btn.textContent = '👁️'; }
            inp.focus();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pw = document.getElementById('loginPassword');
            const err = document.getElementById('loginError');
            const btn = document.getElementById('loginSubmitBtn');
            if (!pw || !err || !btn) return;
            const password = pw.value.trim();
            if (!password) return;

            btn.disabled = true;
            btn.textContent = 'Verifying…';
            err.hidden = true;
            try {
                const loginRes = await AdminAPI.loginAdmin(password);
                const token = _extractToken(loginRes);
                if (!token) throw new Error('Token missing from login response.');
                localStorage.setItem('admin_token', token);
                localStorage.setItem('adminToken', token);
                location.reload();
            } catch (error) {
                err.textContent = error.message || 'Wrong password. Try again.';
                err.hidden = false;
                pw.value = '';
                pw.focus();
                pw.classList.remove('gate__input--shake');
                void pw.offsetWidth;
                pw.classList.add('gate__input--shake');
                btn.disabled = false;
                btn.textContent = 'Unlock →';
            }
        }, { once: true });
    }

    injectDemoBadge();
    _startAuthFlow();

    function init() {
        if (_appStarted) return;
        _appStarted = true;
        console.log('[Admin] init() booting…');
        window.addEventListener('error', (e) => { console.error('[Admin] Uncaught:', e.error || e.message); showToast('Something went wrong', 'error'); });
        window.addEventListener('unhandledrejection', (e) => { console.error('[Admin] Unhandled:', e.reason); showToast('Async error', 'error'); });
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
        injectDemoLabels();
        injectTransitionTooltip();
        try { AdminSocket.connect(); } catch (err) { console.error('[Admin] Socket failed:', err); }
        document.addEventListener('admin:cold-start', () => { showToast('⏳ Server waking up…', 'info'); _showWakingBanner(true); });
        loadDashboard(); statsRefreshTimer = setInterval(loadDashboard, 30000);
        wireNavigation(); wireOrderEvents(); wireHistoryEvents(); wireMenuEvents(); wireSettingsEvents(); wireSidebar();
        refreshOrders();
        startAutoRefresh();
        console.log('[Admin] init() complete');
    }

    function _showWakingBanner(show) {
        let banner = $('#coldStartBanner');
        if (show && !banner) { banner = document.createElement('div'); banner.id = 'coldStartBanner'; banner.className = 'cold-banner'; banner.innerHTML = '⏳ Backend waking up…'; const c = $('#pageContainer'); if (c) c.prepend(banner); }
        if (!show && banner) banner.remove();
    }

    async function loadDashboard() {
        try {
            const [statsRes, recentRes] = await Promise.all([AdminAPI.getStats(), AdminAPI.getRecentOrders(5)]);
            _showWakingBanner(false);
            const stats = statsRes?.data || statsRes;
            renderStats(IS_DEMO && isStatsEmpty(stats) ? DEMO_STATS_SEED : stats);
            const rp = recentRes?.data || recentRes; const recent = Array.isArray(rp) ? rp : (rp?.orders || []); renderRecentOrders(recent);
            if (typeof hideLoader === 'function') hideLoader();
        } catch (err) { const msg = (err.message || '').includes('Failed to fetch') ? 'Server starting up…' : 'Failed to load dashboard'; showToast(msg, 'error'); if (typeof hideLoader === 'function') hideLoader(); }
    }

    function wireNavigation() {
        $('#sidebar')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-item'); if (!btn) return; const page = btn.dataset.page;
            if (!page || page === currentPage) return; currentPage = page; switchPage(page); onPageSwitch(page);
            if (window.innerWidth <= 860) { $('#sidebar').classList.remove('open'); document.getElementById('sidebarOverlay')?.classList.remove('sidebar-overlay--visible'); }
        });
        document.addEventListener('click', (e) => { const goto = e.target.closest('[data-goto]'); if (!goto) return; const page = goto.dataset.goto; currentPage = page; switchPage(page); onPageSwitch(page); });
    }

    function onPageSwitch(page) {
        switch (page) { case 'dashboard': loadDashboard(); break; case 'orders': loadLiveOrders(); break; case 'history': loadHistory(); break; case 'menu': loadMenu(); break; case 'analytics': loadAnalytics(); break; case 'settings': break; }
    }

    async function loadLiveOrders() { await refreshOrders(); }
    async function refreshOrders() {
        try {
            const statusFilter = $('#ordersStatusFilter')?.value || '';
            const res = await AdminAPI.getTodayOrders({ status: statusFilter });
            const payload = res?.data || res; liveOrders = Array.isArray(payload) ? payload : (payload?.orders || []);
            renderOrderCards(liveOrders); updatePendingBadge(); updateOrderStats(liveOrders);
        } catch (err) { console.error('Refresh failed:', err); showToast('Failed to refresh orders', 'error'); }
    }
    function scheduleRefresh() { clearTimeout(refreshTimeout); refreshTimeout = setTimeout(() => refreshOrders(), 200); }
    function startAutoRefresh() { if (document.hidden) return; stopAutoRefresh(); autoRefreshInterval = setInterval(() => refreshOrders(), FIVE_MINUTES); }
    function stopAutoRefresh() { if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; } }
    function updatePendingBadge() { pendingCount = liveOrders.filter(o => normalizeStatus(o.status) === ORDER_STATUS.PENDING).length; const badge = $('#liveOrderBadge'); if (badge) { badge.textContent = pendingCount; badge.hidden = pendingCount === 0; } }

    function wireOrderEvents() {
        $('#ordersStatusFilter')?.addEventListener('change', () => { if (currentPage === 'orders') loadLiveOrders(); });
        $('#liveOrdersContainer')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-action="status-change"]'); if (!btn) return;
            const cardId = btn.dataset.orderId, orderCodeFromBtn = btn.dataset.orderCode, newStatus = btn.dataset.status;
            const order = liveOrders.find(o => (o._id || o.orderId) === cardId || (orderCodeFromBtn && o.orderId === orderCodeFromBtn));
            const mongoId = order?._id || cardId, orderCode = order?.orderId || orderCodeFromBtn || cardId, currentStatus = normalizeStatus(order?.status);
            if (currentStatus === newStatus) return;
            if (!isTransitionAllowed(currentStatus, newStatus)) { showToast(`Cannot change from ${currentStatus} to ${newStatus}`, 'error'); return; }
            if (newStatus === ORDER_STATUS.CANCELLED) {
                const confirmed = await showConfirm('Cancel this order? Cannot be undone.'); if (!confirmed) return;
                try { btn.disabled = true; btn.style.opacity = '.5'; await AdminAPI.cancelOrder(mongoId); btn.disabled = false; btn.style.opacity = ''; await refreshOrders(); showToast('Order cancelled', 'success'); } catch (err) { btn.disabled = false; btn.style.opacity = ''; showToast(`Failed: ${err.message}`, 'error'); }
                return;
            }
            try { btn.disabled = true; btn.style.opacity = '.5'; await AdminAPI.updateOrderStatus(mongoId, currentStatus, newStatus); btn.disabled = false; btn.style.opacity = ''; await refreshOrders(); showToast(`Updated to ${newStatus}`, 'success'); } catch (err) { btn.disabled = false; btn.style.opacity = ''; showToast(`Failed: ${err.message}`, 'error'); }
        });
        $('#liveOrdersContainer')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-action="delete-order"]'); if (!btn) return;
            const confirmed = await showConfirm('Delete this order?'); if (!confirmed) return;
            try { btn.disabled = true; btn.textContent = '…'; await AdminAPI.deleteOrder(btn.dataset.orderId); await refreshOrders(); showToast('Deleted', 'success'); } catch (err) { btn.disabled = false; btn.textContent = '🗑 Delete'; showToast(`Failed: ${err.message}`, 'error'); }
        });

        document.addEventListener('admin:new-order', (e) => {
            if (!e.detail) return; scheduleRefresh();
            const todayEl = $('#statTodayOrders'), totalEl = $('#statTotalOrders');
            if (todayEl) animateCounter(todayEl, (parseInt(todayEl.textContent.replace(/[^\d]/g, ''), 10) || 0) + 1);
            if (totalEl) animateCounter(totalEl, (parseInt(totalEl.textContent.replace(/[^\d]/g, ''), 10) || 0) + 1);
            playNotifSound();
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) try { new Notification('New Order!', { body: `Order from ${e.detail.customerName || 'Customer'} — ₹${e.detail.total || 0}`, icon: '🥟', tag: 'mn-admin-order' }); } catch {}
            showToast(`New order from ${e.detail.customerName || 'Customer'}!`, 'info');
            pulseRealtimeUpdate();
        });
        document.addEventListener('admin:order-updated', () => { scheduleRefresh(); pulseRealtimeUpdate(); });
        document.addEventListener('admin:order-deleted', () => { scheduleRefresh(); const todayEl = $('#statTodayOrders'), totalEl = $('#statTotalOrders'); if (todayEl) animateCounter(todayEl, Math.max(0, (parseInt(todayEl.textContent.replace(/[^\d]/g, ''), 10) || 0) - 1)); if (totalEl) animateCounter(totalEl, Math.max(0, (parseInt(totalEl.textContent.replace(/[^\d]/g, ''), 10) || 0) - 1)); });
        document.addEventListener('socket:status', (e) => { updateSocketStatus(e.detail?.connected); });
        document.addEventListener('admin:top-item-update', (e) => { if (e.detail?.itemName) highlightTopSelling(e.detail.itemName); });
    }

    async function loadHistory() {
        try {
            const params = { page: historyPage, limit: 20, status: $('#historyStatusFilter')?.value || '', dateFrom: $('#historyDateFrom')?.value || '', dateTo: $('#historyDateTo')?.value || '', phone: $('#historyPhoneSearch')?.value.trim() || '' };
            const res = await AdminAPI.getOrders(params);
            const payload = res?.data || res; const orders = Array.isArray(payload) ? payload : (payload?.orders || []);
            historyTotal = res?.totalPages || payload?.totalPages || Math.ceil((res?.total || payload?.total || orders.length) / 20) || 1;
            allHistoryOrders = orders; renderHistoryTable(orders); renderPagination(historyPage, historyTotal);
        } catch (err) { showToast('Failed to load history', 'error'); }
    }

    function wireHistoryEvents() {
        $('#historySearchBtn')?.addEventListener('click', () => { historyPage = 1; loadHistory(); });
        $('#historyPhoneSearch')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { historyPage = 1; loadHistory(); } });
        $('#historyStatusFilter')?.addEventListener('change', () => { historyPage = 1; if (currentPage === 'history') loadHistory(); });
        $('#historyPagination')?.addEventListener('click', (e) => { const btn = e.target.closest('[data-page]'); if (!btn || btn.disabled) return; const page = Number(btn.dataset.page); if (page < 1 || page > historyTotal) return; historyPage = page; loadHistory(); });
        $('#exportCsvBtn')?.addEventListener('click', () => exportOrdersCSV(allHistoryOrders));
    }

    async function loadMenu() {
        try {
            const res = await AdminAPI.getMenu(); const data = res?.data || res?.categories || res;
            if (Array.isArray(data) && data[0]?.items) { menuCategories = data.map(c => ({ key: c.key || c._id, title: c.title || c.key })); menuItems = data.flatMap(c => c.items.map(i => ({ ...i, category: c.title || c.key }))); }
            else if (Array.isArray(data)) { menuItems = data; const cats = [...new Set(data.map(i => i.category).filter(Boolean))]; menuCategories = cats.map(c => ({ key: c, title: c })); }
            else if (data && typeof data === 'object') { const cats = Object.keys(data); menuCategories = cats.map(c => ({ key: c, title: data[c]?.title || c })); menuItems = cats.flatMap(c => (data[c]?.items || []).map(i => ({ ...i, category: data[c]?.title || c }))); }
            else { menuItems = []; menuCategories = []; }
            renderMenuItems(menuItems, menuCategories);
        } catch (err) { showToast('Failed to load menu', 'error'); }
    }

    function wireMenuEvents() {
        const c = $('#menuMgmtContainer'); if (!c) return;
        c.addEventListener('input', (e) => { const card = e.target.closest('.menu-mgmt-card'); if (card) { const sb = card.querySelector('.menu-mgmt-card__save'); if (sb) sb.classList.add('show'); } });
        c.addEventListener('change', (e) => { const card = e.target.closest('.menu-mgmt-card'); if (card) { const sb = card.querySelector('.menu-mgmt-card__save'); if (sb) sb.classList.add('show'); } });
        c.addEventListener('click', async (e) => {
            const saveBtn = e.target.closest('[data-action="save-menu-item"]'); if (!saveBtn) return;
            const card = saveBtn.closest('.menu-mgmt-card'); if (!card) return; const itemId = card.dataset.itemId;
            const original = menuItems.find(i => (i._id || i.id) === itemId); if (!original) { showToast('Item not found', 'error'); return; }
            const prices = Array.from(card.querySelectorAll('.menu-mgmt-price__input')).map(inp => { const idx = Number(inp.dataset.priceIdx); const orig = (original.prices || [])[idx] || {}; return { label: String(orig.label || ''), value: Number(inp.value) }; });
            const specialChk = card.querySelector('[data-action="toggle-special"]'), activeChk = card.querySelector('[data-action="toggle-active"]');
            const payload = { name: original.name, desc: original.desc || original.description || '', category: original.category || '', prices, special: specialChk?.checked || false, active: activeChk?.checked !== false };
            try { saveBtn.disabled = true; saveBtn.classList.add('btn--loading'); saveBtn.textContent = ''; await AdminAPI.updateMenuItem(itemId, payload); saveBtn.classList.remove('btn--loading', 'show'); saveBtn.disabled = false; saveBtn.textContent = 'Save'; card.classList.toggle('menu-mgmt-card--inactive', !payload.active); card.style.boxShadow = '0 0 0 2px var(--c-green)'; setTimeout(() => card.style.boxShadow = '', 800); showToast('Menu item updated', 'success'); }
            catch (err) { saveBtn.classList.remove('btn--loading'); saveBtn.disabled = false; saveBtn.textContent = 'Save'; showToast(`Failed: ${err.message}`, 'error'); }
        });
        $('#menuCategoryFilter')?.addEventListener('change', (e) => { const v = e.target.value; renderMenuItems(v ? menuItems.filter(i => i.category === v) : menuItems, []); });
        $('#menuSearchInput')?.addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); const catV = $('#menuCategoryFilter')?.value || ''; let f = catV ? menuItems.filter(i => i.category === catV) : menuItems; if (q) f = f.filter(i => i.name.toLowerCase().includes(q)); renderMenuItems(f, []); });
    }

    function wireSettingsEvents() {
        $('#changePasswordForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = $('#oldPassword')?.value.trim() || '';
            const newPassword = $('#newPassword')?.value.trim() || '';
            const confirmPassword = $('#confirmPassword')?.value.trim() || '';
            const btn = $('#changePasswordBtn');

            if (!oldPassword || !newPassword || !confirmPassword) {
                showToast('Please fill all password fields', 'error');
                return;
            }
            if (newPassword.length < 6) {
                showToast('New password must be at least 6 characters', 'error');
                return;
            }
            if (newPassword !== confirmPassword) {
                showToast('New password and confirm password do not match', 'error');
                return;
            }

            if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
            try {
                await AdminAPI.changePassword(oldPassword, newPassword);
                $('#changePasswordForm')?.reset();
                showToast('Password updated successfully', 'success');
            } catch (err) {
                showToast(err.message || 'Failed to update password', 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Save Password'; }
            }
        });
    }

    async function loadAnalytics() {
        try {
            const res = await AdminAPI.getAnalytics();
            const data = res?.data || res;
            const effective = (IS_DEMO && isAnalyticsEmpty(data)) ? DEMO_ANALYTICS_SEED : data;
            if (!effective) return;
            renderAnalyticsKPI({ weeklyGrowth: effective.weeklyGrowth ?? effective.growth ?? 0, repeatCustomerRate: effective.repeatCustomerRate ?? effective.repeatRate ?? 0, avgPrepTime: effective.avgPrepTime ?? effective.avgPrep ?? 0, todayRevenue: effective.todayRevenue ?? 0 });
            if (effective.ordersPerDay) { const l = effective.ordersPerDay.map(d => d.label || d.date || ''); const v = effective.ordersPerDay.map(d => d.count || d.value || 0); drawBarChart('chartOrders', l, v, '#e85d04'); }
            if (effective.revenuePerDay) { const l = effective.revenuePerDay.map(d => d.label || d.date || ''); const v = effective.revenuePerDay.map(d => d.total || d.value || 0); drawBarChart('chartRevenue', l, v, '#10b981'); }
            if (effective.revenueTrend || effective.revenuePerDay) { const td = effective.revenueTrend || effective.revenuePerDay || []; drawLineChart('chartRevenueTrend', td.map(d => d.label || d.date || ''), td.map(d => d.total || d.value || 0), '#e85d04'); }
            if (effective.topItems) { renderTopItems(effective.topItems); if (effective.topItems[0]) highlightTopSelling(effective.topItems[0].name || effective.topItems[0]._id || ''); }
        } catch (err) { showToast('Failed to load analytics', 'error'); }
    }

    function wireSidebar() {
        let overlay = document.getElementById('sidebarOverlay');
        if (!overlay) { overlay = document.createElement('div'); overlay.id = 'sidebarOverlay'; overlay.className = 'sidebar-overlay'; document.body.appendChild(overlay); }
        const _close = () => { $('#sidebar').classList.remove('open'); overlay.classList.remove('sidebar-overlay--visible'); };
        $('#sidebarToggle')?.addEventListener('click', () => { const isOpen = $('#sidebar').classList.toggle('open'); overlay.classList.toggle('sidebar-overlay--visible', isOpen); });
        overlay.addEventListener('click', _close);
        document.addEventListener('click', (e) => { if (window.innerWidth > 860) return; const sb = $('#sidebar'); if (!sb.classList.contains('open')) return; if (!e.target.closest('.sidebar') && !e.target.closest('#sidebarToggle')) _close(); });
        $('#logoutBtn')?.addEventListener('click', async () => { const ok = await showConfirm('Logout from admin panel?'); if (ok) { AdminAPI.clearToken(); localStorage.removeItem('admin_token'); localStorage.removeItem('adminToken'); location.reload(); } });
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const ov = $('#confirmOverlay'); if (ov && !ov.hidden) $('#confirmCancel')?.click(); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAutoRefresh(); else { refreshOrders(); startAutoRefresh(); } });
});
