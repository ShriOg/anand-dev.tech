'use strict';

if (typeof window.__DEBUG__ === 'undefined') window.__DEBUG__ = true;
if (typeof debug === 'undefined') {
    window.debug = function(label, data) {
        if (!window.__DEBUG__) return;
        console.log('[DEBUG] ' + label, data ?? '');
    };
}

const AdminUI = (() => {

    const $ = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => ctx.querySelectorAll(s);

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

    const switchPage = (pageKey) => {
        debug('Switching Page', pageKey);
        const pages = $$('.page');
        const current = Array.from(pages).find(p => !p.hidden);

        if (current && current.dataset.page !== pageKey) {

            if (current.classList.contains('page--exit')) {
                current.classList.remove('page--exit');
                current.hidden = true;
            }
            current.classList.add('page--exit');
            const _exitTimer = setTimeout(() => {
                current.classList.remove('page--exit');
                current.hidden = true;
                _showPage(pageKey, pages);
                debug('Page Switch Fallback', pageKey);
            }, 250);
            current.addEventListener('animationend', function handler() {
                clearTimeout(_exitTimer);
                current.removeEventListener('animationend', handler);
                current.classList.remove('page--exit');
                current.hidden = true;
                _showPage(pageKey, pages);
            }, { once: true });
        } else {
            _showPage(pageKey, pages);
        }

        $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === pageKey));
        const titles = { dashboard: 'Dashboard', orders: 'Live Orders', history: 'Order History', menu: 'Menu', analytics: 'Analytics' };
        $('#pageTitle').textContent = titles[pageKey] || 'Dashboard';
    };

    const _showPage = (pageKey, pages) => {
        pages.forEach(p => {
            if (p.dataset.page === pageKey) {
                p.hidden = false;
                p.style.animation = 'none';
                void p.offsetWidth;
                p.style.animation = '';
            } else {
                p.hidden = true;
            }
        });
    };

    const updateSocketStatus = (status) => {
        const el = $('#socketStatus');
        if (!el) return;
        el.classList.remove('topbar__status--live', 'topbar__status--connecting', 'topbar__status--offline');
        if (status === 'connecting' || status === true) {
            if (status === true) {
                el.textContent = ' Live';
                el.title = 'Realtime connected';
                el.classList.add('topbar__status--live');
            } else {
                el.innerHTML = '🟡 Connecting';
                el.title = 'Connecting to server…';
                el.classList.add('topbar__status--connecting');
            }
        } else {
            el.innerHTML = '🔴 Offline';
            el.title = 'Realtime disconnected';
            el.classList.add('topbar__status--offline');
        }
    };

    const renderStats = (data) => {
        if (!data) return;

        const _animateIfNum = (el, val, isRupee) => {
            if (!el) return;
            if (typeof val !== 'number') { el.textContent = '—'; return; }
            if (isRupee) el.dataset.prefix = '₹';
            animateCounter(el, val);
        };

        _animateIfNum($('#statTotalOrders'), data.totalOrders);
        _animateIfNum($('#statTodayOrders'), data.todayOrders);
        _animateIfNum($('#statTotalRevenue'), data.totalRevenue, true);
        _animateIfNum($('#statTodayRevenue'), data.todayRevenue, true);
        _animateIfNum($('#statTotalCustomers'), data.totalCustomers);
    };

    const renderRecentOrders = (orders) => {
        const container = $('#dashRecentOrders');
        if (!container) return;
        if (!orders || !orders.length) {
            container.innerHTML = _emptyState('📭', 'No recent orders', 'Orders will appear here as they come in');
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

    const renderOrderCards = (orders, container) => {
        const target = container || $('#liveOrdersContainer');
        if (!target) return;
        if (!orders || !orders.length) {
            target.innerHTML = _emptyState('📋', 'No orders found', 'Live orders will show up here in realtime');
            return;
        }
        target.innerHTML = orders.map(o => _orderCardHTML(o)).join('');
    };

    const prependOrderCard = (order) => {
        const target = $('#liveOrdersContainer');
        if (!target) return;
        const emptyMsg = target.querySelector('.empty-state') || target.querySelector('.skeleton-rows') || target.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const div = document.createElement('div');
        div.innerHTML = _orderCardHTML(order, true);
        target.prepend(div.firstElementChild);
    };

    const updateOrderCard = (orderId, updatedOrder) => {
        const card = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
        if (!card) return false;
        const tmp = document.createElement('div');
        tmp.innerHTML = _orderCardHTML(updatedOrder);
        const newCard = tmp.firstElementChild;
        newCard.style.animation = 'none';
        card.replaceWith(newCard);
        newCard.style.boxShadow = '0 0 0 2px var(--c-green)';
        setTimeout(() => { newCard.style.boxShadow = ''; }, 800);
        return true;
    };

    const _orderCardHTML = (o, isNew = false) => {
        const typeClass = (o.orderType || '').toLowerCase().includes('dine') ? 'dinein' : 'takeaway';
        const items = o.items || [];
        const status = normalizeStatus(o.status);
        const statusLower = status.toLowerCase();

        return `
        <div class="order-card${isNew ? ' order-card--new' : ''}" data-order-id="${o._id || o.orderId}" data-status="${status}">
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
                <div class="order-card__actions">
                    <div class="status-buttons">
                        ${_buildActionButtons(o, status)}
                    </div>
                    <button class="btn-delete-order" data-action="delete-order" data-order-id="${o._id || o.orderId}">🗑 Delete</button>
                </div>
            </div>
        </div>`;
    };

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

    const renderMenuItems = (items, categories) => {
        const container = $('#menuMgmtContainer');
        if (!container) return;

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
            container.innerHTML = _emptyState('🍽️', 'No menu items', 'Menu items will load when the server connects');
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

        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-border').trim() || '#e5e7eb';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        }

        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-text-soft').trim() || '#6b7280';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            const val = Math.round(maxVal - (maxVal / 4) * i);
            ctx.fillText(val, pad.left - 8, y + 4);
        }

        const barGap = 8;
        const barW = Math.max(16, (chartW - barGap * (labels.length + 1)) / labels.length);
        const totalBarArea = barW * labels.length + barGap * (labels.length + 1);
        const offsetX = pad.left + (chartW - totalBarArea) / 2 + barGap;

        values.forEach((val, i) => {
            const x = offsetX + i * (barW + barGap);
            const barH = (val / maxVal) * chartH;
            const y = pad.top + chartH - barH;

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

            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-text').trim() || '#111827';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            if (val > 0) ctx.fillText(val, x + barW / 2, y - 6);

            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-text-soft').trim() || '#6b7280';
            ctx.font = '11px Inter, sans-serif';
            ctx.fillText(labels[i], x + barW / 2, H - pad.bottom + 18);
        });
    };

    const renderTopItems = (items) => {
        const container = $('#topItemsContainer');
        if (!container) return;
        if (!items || !items.length) {
            container.innerHTML = _emptyState('📊', 'No data yet', 'Analytics data will appear after orders come in');
            return;
        }
        container.innerHTML = items.slice(0, 10).map((item, i) => `
            <div class="top-item">
                <span class="top-item__rank">${i + 1}</span>
                <span class="top-item__name">${_esc(item.name || item._id || '—')}</span>
                <span class="top-item__count">${item.count || item.totalQty || 0} orders</span>
            </div>`).join('');
    };

    const playNotifSound = () => {
        const audio = document.getElementById('notifSound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    };

    const animateCounter = (element, newValue) => {
        if (!element) return;

        const currentText = element.textContent.replace(/[₹,\s—]/g, '');
        const from = parseInt(currentText, 10) || 0;
        const to = typeof newValue === 'number' ? newValue : (parseInt(String(newValue).replace(/[₹,\s]/g, ''), 10) || 0);
        if (from === to) return;

        const isRupee = element.textContent.startsWith('₹') || element.dataset.prefix === '₹';
        const duration = 600;
        const startTime = performance.now();

        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + (to - from) * eased);
            const formatted = current.toLocaleString('en-IN');
            element.textContent = isRupee ? '₹' + formatted : formatted;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {

                element.classList.add('stat-val--pop');
                setTimeout(() => element.classList.remove('stat-val--pop'), 300);
            }
        };
        requestAnimationFrame(step);
    };

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

    /**
     * Build action buttons based on ALLOWED_TRANSITIONS.
     * Pending  → [Preparing, Cancelled]
     * Preparing → [Completed]
     * Completed / Cancelled → no action buttons
     */
    const _buildActionButtons = (order, status) => {
        const s = normalizeStatus(status);
        const mongoId = order._id || order.orderId;
        const orderCode = order.orderId || '';

        const nextStatuses = ALLOWED_TRANSITIONS[s] || [];
        if (nextStatuses.length) {
            return nextStatuses.map(nextStatus =>
                `<button class="status-btn" data-order-id="${mongoId}" data-order-code="${orderCode}" data-status="${nextStatus}" data-action="status-change">${nextStatus}</button>`
            ).join('');
        }
        // Completed / Cancelled — no buttons
        return `<span class="status-badge status-badge--${s.toLowerCase()}">${s}</span>`;
    };

    const _statusBadge = (status) => {
        const s = normalizeStatus(status);
        const cls = s.toLowerCase();
        const labels = {
            [ORDER_STATUS.PENDING]:   '⏳ Pending',
            [ORDER_STATUS.PREPARING]: '🔥 Preparing',
            [ORDER_STATUS.COMPLETED]: '✅ Completed',
            [ORDER_STATUS.CANCELLED]: '❌ Cancelled',
        };
        return `<span class="status-badge status-badge--${cls}">${labels[s] || s}</span>`;
    };

    const _emptyState = (icon, title, sub) => {
        return `<div class="empty-state">
            <span class="empty-state__icon">${icon}</span>
            <p class="empty-state__title">${_esc(title)}</p>
            <p class="empty-state__sub">${_esc(sub)}</p>
        </div>`;
    };

    _setupConfirm();

    return Object.freeze({
        $, $$,
        showToast, showConfirm,
        switchPage,
        updateSocketStatus,
        renderStats, renderRecentOrders,
        renderOrderCards, prependOrderCard, updateOrderCard,
        renderHistoryTable, renderPagination,
        renderMenuItems,
        drawBarChart, renderTopItems,
        playNotifSound, animateCounter, exportOrdersCSV,
    });
})();
