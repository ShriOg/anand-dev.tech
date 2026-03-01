'use strict';

const AdminAPI = (() => {

    const BASE_URL = window.location.hostname === 'localhost'
        ? 'https://anand-os-backend.onrender.com/api'
        : 'https://anand-os-backend.onrender.com/api';

    console.log('[AdminAPI] Using base:', BASE_URL);

    const COLD_START_RETRY_DELAY = 2000;
    let _serverAwake = false;

    const _singleFetch = async (endpoint, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        debug('API Request', { method: options.method || 'GET', url: `${BASE_URL}${endpoint}`, body: options.body ? JSON.parse(options.body) : undefined });
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            debug('API Error', { status: res.status, body });
            if (res.status >= 500) throw new Error('Server waking up… please try again.');
            if (res.status === 401) throw new Error('Admin authentication required.');
            throw new Error(body.message || `HTTP ${res.status}`);
        }

        _serverAwake = true;
        if (res.status === 204) return null;
        const data = await res.json();
        debug('API Response Status', res.status);
        debug('API Response Body', data);
        return data;
    };

    const _fetch = async (endpoint, options = {}) => {
        try {
            return await _singleFetch(endpoint, options);
        } catch (err) {

            if (!_serverAwake && (err.message === 'Failed to fetch' || err.name === 'TypeError')) {
                console.log('[AdminAPI] Server may be waking up — retrying in 3.5s…');
                document.dispatchEvent(new CustomEvent('admin:cold-start'));
                await new Promise(r => setTimeout(r, COLD_START_RETRY_DELAY));
                return _singleFetch(endpoint, options);
            }
            console.error(`[AdminAPI] ${options.method || 'GET'} ${endpoint}:`, err);
            throw err;
        }
    };

    const getStats = () => _fetch('/restaurant/stats');

    const getOrders = (params = {}) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set('status', params.status);
        if (params.page) qs.set('page', params.page);
        if (params.limit) qs.set('limit', params.limit);
        if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
        if (params.dateTo) qs.set('dateTo', params.dateTo);
        if (params.phone) qs.set('phone', params.phone);
        const q = qs.toString();
        return _fetch(`/restaurant/orders${q ? '?' + q : ''}`);
    };

    const getRecentOrders = (limit = 5) => _fetch(`/restaurant/orders?limit=${limit}&sort=-createdAt`);

    const getTodayOrders = (params = {}) => {
        const qs = new URLSearchParams();
        if (params.status) qs.set('status', params.status);
        const q = qs.toString();
        return _fetch(`/restaurant/orders/today${q ? '?' + q : ''}`);
    };

    const updateOrderStatus = (orderId, currentStatus, newStatus) => {
        // ── Validate transition before hitting backend ──
        if (!isTransitionAllowed(currentStatus, newStatus)) {
            return Promise.reject(new Error(`Transition "${currentStatus}" → "${newStatus}" not allowed`));
        }

        console.log('[AdminAPI] updateOrderStatus', { orderId, currentStatus, newStatus, payload: { status: newStatus } });

        return _fetch(`/restaurant/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
        });
    };

    const cancelOrder = (orderCode) => {
        console.log('[AdminAPI] cancelOrder — using dedicated cancel endpoint', { orderCode });
        return _fetch(`/restaurant/orders/${encodeURIComponent(orderCode)}/cancel`, {
            method: 'PATCH',
        });
    };

    const deleteOrder = (orderId) =>
        _fetch(`/restaurant/orders/${orderId}`, {
            method: 'DELETE',
        });

    const getMenu = () => _fetch('/restaurant/menu');

    const updateMenuItem = (itemId, data) =>
        _fetch(`/restaurant/menu/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });

    const getAnalytics = () => _fetch('/restaurant/analytics');

    return Object.freeze({
        getStats, getOrders, getRecentOrders, getTodayOrders,
        updateOrderStatus, cancelOrder, deleteOrder,
        getMenu, updateMenuItem,
        getAnalytics,
    });
})();
