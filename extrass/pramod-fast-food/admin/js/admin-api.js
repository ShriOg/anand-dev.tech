/**
 * admin-api.js — API layer for admin dashboard.
 *
 * Handles all HTTP requests to the restaurant API.
 * No JWT — auth is handled by the client-side password gate.
 */
'use strict';

const AdminAPI = (() => {

    /* ---------- Config ---------- */
    const BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api';

    /* ---------- Core fetch wrapper ---------- */
    const _fetch = async (endpoint, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `HTTP ${res.status}`);
            }

            /* Handle 204 No Content */
            if (res.status === 204) return null;
            return await res.json();
        } catch (err) {
            console.error(`[AdminAPI] ${options.method || 'GET'} ${endpoint}:`, err);
            throw err;
        }
    };

    /* ---------- Dashboard Stats ---------- */
    const getStats = () => _fetch('/restaurant/stats');

    /* ---------- Orders ---------- */
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

    const updateOrderStatus = (orderId, status) =>
        _fetch(`/restaurant/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

    /* ---------- Menu ---------- */
    const getMenu = () => _fetch('/restaurant/menu');

    const updateMenuItem = (itemId, data) =>
        _fetch(`/restaurant/menu/${itemId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });

    /* ---------- Analytics ---------- */
    const getAnalytics = () => _fetch('/restaurant/analytics');

    /* ---------- Public surface ---------- */
    return Object.freeze({
        getStats, getOrders, getRecentOrders,
        updateOrderStatus,
        getMenu, updateMenuItem,
        getAnalytics,
    });
})();
