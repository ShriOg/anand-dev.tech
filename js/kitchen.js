'use strict';

/* ═══════════════════════════════════════════════════════════════
 *  MenuNova — Unified Kitchen Display
 *  Extracted from inline <script> in kitchen.html
 *  Restaurant loaded dynamically via RestaurantConfig.slug
 * ═══════════════════════════════════════════════════════════════ */

/* ── Guard: slug must exist ── */
(function () {
    if (!RestaurantConfig.initialized) {
        document.getElementById('kitchenWrapper').style.display = 'none';
        document.getElementById('notFoundPage').style.display = '';
        if (typeof hideLoader === 'function') hideLoader();
        return;
    }
    document.title = `Kitchen — ${RestaurantConfig.slug}`;
    _bootKitchen();
})();

function _bootKitchen() {

const IS_DEMO = RestaurantConfig.isDemo === true;
const DEMO_SIGNUP_URL = RestaurantConfig.demoSignupUrl || 'https://menunova.me/signup';

const API_BASE = RestaurantConfig.API_URL;
const ADMIN_TOKEN = localStorage.getItem('admin_token') || '';
const adminHeaders = (extra = {}) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN_TOKEN}`, ...extra });
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let orders = [];
let allTodayOrders = [];
let soundEnabled = true;
let socket = null;
let refreshTimeout = null;
let autoRefreshInterval = null;
let knownOrderIds = new Set();

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

function injectKitchenDemoHeaderBadge() {
    if (!IS_DEMO) return;
    document.body.classList.add('demo-kitchen');
    const title = $('.kitchen-header__title');
    if (title && !document.getElementById('kitchenDemoModeBadge')) {
        const badge = document.createElement('span');
        badge.id = 'kitchenDemoModeBadge';
        badge.className = 'kitchen-demo-badge';
        badge.textContent = 'Demo Mode';
        title.appendChild(badge);
    }
    document.title = `Kitchen — ${RestaurantConfig.slug}`;
}

/* ═══ CLOCK ═══ */
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    $('#kitchenClock').textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ═══ FULLSCREEN ═══ */
$('#kitchenFullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
});

/* ═══ WAKE LOCK ═══ */
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            await navigator.wakeLock.request('screen');
            const el = $('#kitchenWakelock');
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 2000);
        } catch {}
    }
}
requestWakeLock();
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
});

/* ═══ SOUND TOGGLE ═══ */
$('#kitchenSoundToggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    $('#kitchenSoundToggle').textContent = soundEnabled ? '🔔' : '🔕';
});

function playSound() {
    if (!soundEnabled) return;
    const audio = $('#kitchenNotifSound');
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
}

/* ═══ CENTRAL REFRESH (DB as source-of-truth) ═══ */
async function refreshOrders() {
    try {
        const url = `${API_BASE}/admin/orders/today`;
        const res = (window.MenuNovaAPI && MenuNovaAPI.authFetch)
            ? await MenuNovaAPI.authFetch(url)
            : await fetch(url, { headers: adminHeaders() });
        if (res.status === 401) { localStorage.removeItem('admin_token'); window.location.href = '/admin/'; return; }
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const all = data?.data || data?.orders || (Array.isArray(data) ? data : []);
        allTodayOrders = all;
        const nextOrders = all.filter(o => {
            const s = (o.status || '').toLowerCase();
            return s === 'pending' || s === 'preparing';
        });
        nextOrders.sort((a, b) => {
            const sa = (a.status || '').toLowerCase();
            const sb = (b.status || '').toLowerCase();
            if (sa === 'pending' && sb === 'preparing') return -1;
            if (sa === 'preparing' && sb === 'pending') return 1;
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
        const newOrderIds = new Set();
        nextOrders.forEach((o) => {
            const id = String(o._id || o.orderId || '');
            if (!id) return;
            if (!knownOrderIds.has(id)) newOrderIds.add(id);
        });
        knownOrderIds = new Set(nextOrders.map(o => String(o._id || o.orderId || '')).filter(Boolean));
        orders = nextOrders;
        renderOrders(newOrderIds);
        if (newOrderIds.size > 0) playSound();
        updateKitchenStats();
        if (typeof hideLoader === 'function') hideLoader();
    } catch (err) {
        console.error('Refresh failed:', err);
        if (typeof hideLoader === 'function') hideLoader();
    }
}

function scheduleRefresh() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => refreshOrders(), 200);
}

function startAutoRefresh() {
    if (document.hidden) return;
    stopAutoRefresh();
    autoRefreshInterval = setInterval(() => refreshOrders(), FIVE_MINUTES);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
}

/* ═══ KITCHEN STATS ═══ */
function updateKitchenStats() {
    const activeCount = orders.length;
    const badgeEl = $('#kitchenActiveBadge');
    if (badgeEl) { badgeEl.textContent = activeCount ? `${activeCount} Active` : ''; badgeEl.style.display = activeCount ? 'inline-block' : 'none'; }

    const todayStr = new Date().toDateString();
    const completedToday = allTodayOrders.filter(o => {
        const s = (o.status || '').toLowerCase();
        if (s !== 'completed') return false;
        const dt = o.completedAt || o.updatedAt;
        return dt && new Date(dt).toDateString() === todayStr;
    }).length;

    const counterEl = $('#kitchenCompletedCounter');
    if (counterEl) { counterEl.innerHTML = `<span class="kitchen-icon" aria-hidden="true">✅</span> Completed Today: ${completedToday}`; counterEl.style.display = completedToday ? 'inline-flex' : 'none'; }
}

/* ═══ RENDER ═══ */
function renderOrders(newOrderIds = new Set()) {
    const container = $('#kitchenOrders');
    $('#kitchenCount').textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

    if (!orders.length) {
        container.innerHTML = '<div class="kitchen-empty"><div class="kitchen-empty__icon">👨‍🍳</div><div class="kitchen-empty__text">No active orders</div></div>';
        return;
    }
    container.innerHTML = orders.map(o => buildCard(o, newOrderIds)).join('');
    wireSwipe();
}

function buildCard(o, newOrderIds = new Set()) {
    const status = o.status || 'Pending';
    const statusLower = status.toLowerCase();
    const typeClass = (o.orderType || '').toLowerCase().includes('dine') ? 'dinein' : 'takeaway';
    const items = o.items || [];
    const mongoId = o._id || o.orderId;
    const orderCode = o.orderId || '';
    const time = fmtTime(o.createdAt);
    const isPending = statusLower === 'pending';
    const isPreparing = statusLower === 'preparing';

    const flashClass = newOrderIds.has(String(mongoId || '')) ? ' kitchen-card--flash' : '';

    return `
    <div class="kitchen-card kitchen-card--${statusLower}${flashClass}" data-order-id="${mongoId}" data-order-code="${orderCode}" data-status="${status}">
        <div class="kitchen-card__swipe-hint kitchen-card__swipe-hint--right">${isPending ? '<span class="kitchen-icon kitchen-icon--status" aria-hidden="true">→</span><span>Preparing</span>' : ''}</div>
        <div class="kitchen-card__swipe-hint kitchen-card__swipe-hint--left">${isPreparing ? '<span class="kitchen-icon kitchen-icon--status" aria-hidden="true">←</span><span>Completed</span>' : ''}</div>
        <div class="kitchen-card__header">
            <span class="kitchen-card__id">${orderCode || mongoId?.slice?.(-6) || '—'}</span>
            <span class="kitchen-card__type kitchen-card__type--${typeClass}">${o.orderType || '—'}</span>
        </div>
        <div class="kitchen-card__time"><span class="kitchen-icon kitchen-icon--meta" aria-hidden="true">🕐</span><span>${time}</span></div>
        <div class="kitchen-card__customer"><span class="kitchen-icon kitchen-icon--meta" aria-hidden="true">👤</span><span>${esc(o.customerName || o.customer?.name || '—')}</span>${o.table ? '<span>·</span><span class="kitchen-icon kitchen-icon--meta" aria-hidden="true">🪑</span><span>Table ' + o.table + '</span>' : ''}</div>
        ${o.note ? `<div class="kitchen-card__note"><span class="kitchen-icon kitchen-icon--meta" aria-hidden="true">📝</span><span>${esc(o.note)}</span></div>` : ''}
        <div class="kitchen-card__items">
            ${items.map(i => `<div class="kitchen-card__item"><span>${esc(i.name)}${i.size ? ' (' + i.size + ')' : ''}</span><span class="kitchen-card__item-qty">×${i.quantity || 1}</span></div>`).join('')}
        </div>
        <div class="kitchen-card__footer">
            ${isPending ? `<button class="kitchen-btn kitchen-btn--preparing" data-action="preparing" data-order-id="${mongoId}" data-order-code="${orderCode}">🔥 Start Preparing</button>` : ''}
            ${isPreparing ? `<button class="kitchen-btn kitchen-btn--completed" data-action="completed" data-order-id="${mongoId}" data-order-code="${orderCode}">✅ Mark Completed</button>` : ''}
        </div>
    </div>`;
}

function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function fmtTime(d) {
    if (!d) return '—';
    const dt = new Date(d); if (isNaN(dt)) return '—';
    const h = dt.getHours(), hr = h % 12 || 12, ap = h >= 12 ? 'PM' : 'AM';
    return `${hr}:${String(dt.getMinutes()).padStart(2, '0')} ${ap}`;
}

/* ═══ STATUS UPDATE ═══ */
async function updateStatus(mongoId, orderCode, newStatus) {
    try {
        const url = `${API_BASE}/admin/orders/${mongoId}/status`;
        const res = (window.MenuNovaAPI && MenuNovaAPI.authFetch)
            ? await MenuNovaAPI.authFetch(url, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
            : await fetch(url, { method: 'PATCH', headers: adminHeaders(), body: JSON.stringify({ status: newStatus }) });
        if (res.status === 401) { localStorage.removeItem('admin_token'); window.location.href = '/admin/'; return; }
        if (!res.ok) throw new Error('Update failed');
        await refreshOrders();
    } catch (err) { console.error('[Kitchen] Status update error:', err); }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const action = btn.dataset.action, mongoId = btn.dataset.orderId, orderCode = btn.dataset.orderCode;
    if (action === 'preparing') updateStatus(mongoId, orderCode, 'Preparing');
    else if (action === 'completed') updateStatus(mongoId, orderCode, 'Completed');
});

/* ═══ SWIPE GESTURES ═══ */
function wireSwipe() {
    $$('.kitchen-card').forEach(card => {
        let startX = 0, currentX = 0, swiping = false;
        const THRESHOLD = 100;
        const onStart = (e) => { const t = e.touches ? e.touches[0] : e; startX = t.clientX; currentX = startX; swiping = true; card.classList.add('kitchen-card--swiping'); };
        const onMove = (e) => { if (!swiping) return; const t = e.touches ? e.touches[0] : e; currentX = t.clientX; const dx = currentX - startX; card.style.transform = `translateX(${dx}px) rotate(${dx * 0.02}deg)`; card.style.opacity = Math.max(0.3, 1 - Math.abs(dx) / 400); };
        const onEnd = () => {
            if (!swiping) return; swiping = false; card.classList.remove('kitchen-card--swiping');
            const dx = currentX - startX; const status = card.dataset.status?.toLowerCase();
            const mongoId = card.dataset.orderId, orderCode = card.dataset.orderCode;
            if (dx > THRESHOLD && status === 'pending') { card.classList.add('kitchen-card--swipe-right'); card.addEventListener('animationend', () => updateStatus(mongoId, orderCode, 'Preparing'), { once: true }); }
            else if (dx < -THRESHOLD && status === 'preparing') { card.classList.add('kitchen-card--swipe-left'); card.addEventListener('animationend', () => updateStatus(mongoId, orderCode, 'Completed'), { once: true }); }
            else { card.style.transition = 'transform .3s ease, opacity .3s ease'; card.style.transform = ''; card.style.opacity = ''; setTimeout(() => card.style.transition = '', 300); }
        };
        card.addEventListener('touchstart', onStart, { passive: true });
        card.addEventListener('touchmove', onMove, { passive: true });
        card.addEventListener('touchend', onEnd);
        card.addEventListener('mousedown', onStart);
        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseup', onEnd);
        card.addEventListener('mouseleave', () => { if (swiping) onEnd(); });
    });
}

/* ═══ SOCKET ═══ */
function connectSocket() {
    if (typeof io === 'undefined') { console.warn('[Kitchen] Socket.IO not available — polling fallback'); setInterval(refreshOrders, 10000); return; }
    socket = (window.MenuNovaSocket && MenuNovaSocket.create({ reconnectionDelay: 2000, reconnectionAttempts: 30 })) || io(RestaurantConfig.SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 2000, reconnectionAttempts: 30 });
    socket.on('connect', () => {
        console.log('[Kitchen] Socket connected');
        if (window.MenuNovaSocket) MenuNovaSocket.joinAdminRoom(socket);
    });
    socket.on('restaurant:new-order', () => { playSound(); scheduleRefresh(); });
    socket.on('restaurant:order-updated', () => scheduleRefresh());
    socket.on('restaurant:order-deleted', () => scheduleRefresh());
    socket.on('disconnect', () => console.log('[Kitchen] Socket disconnected'));
    socket.on('reconnect', () => { console.log('[Kitchen] Reconnected'); refreshOrders(); });
}

/* ═══ BOOT ═══ */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoRefresh();
    else { refreshOrders(); startAutoRefresh(); }
});

(async () => { await refreshOrders(); startAutoRefresh(); connectSocket(); })();

injectDemoBadge();
injectKitchenDemoHeaderBadge();

} /* end _bootKitchen */
