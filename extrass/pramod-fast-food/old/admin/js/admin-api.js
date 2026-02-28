'use strict';

const AdminAPI = (() => {

    const BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:10000/api'
        : 'https://anand-os-backend.onrender.com/api';

    const COLD_START_RETRY_DELAY = 2000;
    let _serverAwake = false;

    const _singleFetch = async (endpoint, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        const res = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            if (res.status >= 500) throw new Error('Server waking up… please try again.');
            if (res.status === 401) throw new Error('Admin authentication required.');
            throw new Error(body.message || `HTTP ${res.status}`);
        }

        _serverAwake = true;
        if (res.status === 204) return null;
        return await res.json();
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

    const updateOrderStatus = (orderId, status) =>
        _fetch(`/restaurant/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
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
        updateOrderStatus,
        getMenu, updateMenuItem,
        getAnalytics,
    });
})();
