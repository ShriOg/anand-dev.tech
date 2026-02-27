/**
 * admin-api.js — API layer for admin dashboard.
 *
 * Handles all HTTP requests to the restaurant API.
 * Manages JWT token, auto-redirects on 401, centralises error handling.
 */
'use strict';

const AdminAPI = (() => {

    /* ---------- Config ---------- */
    const BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api';

    const TOKEN_KEY = 'pf_admin_token';

    /* ---------- Token management ---------- */
    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
    const clearToken = () => localStorage.removeItem(TOKEN_KEY);

    /* ---------- Core fetch wrapper ---------- */
    const _fetch = async (endpoint, options = {}) => {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        };

        try {
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            if (res.status === 401) {
                clearToken();
                window.location.href = '/login?redirect=admin';
                throw new Error('Unauthorized');
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `HTTP ${res.status}`);
            }

            /* Handle 204 No Content */
            if (res.status === 204) return null;
            return await res.json();
        } catch (err) {
            if (err.message === 'Unauthorized') throw err;
            console.error(`[AdminAPI] ${options.method || 'GET'} ${endpoint}:`, err);
            throw err;
        }
    };

    /* ---------- Auth ---------- */
    const verifyAdmin = async () => {
        const data = await _fetch('/auth/profile');
        if (!data || data.role !== 'admin') {
            clearToken();
            throw new Error('Not admin');
        }
        return data;
    };

    const login = async (email, password) => {
        const data = await _fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.token) setToken(data.token);
        return data;
    };

    const logout = () => {
        clearToken();
        window.location.href = '/login';
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
        getToken, setToken, clearToken,
        verifyAdmin, login, logout,
        getStats, getOrders, getRecentOrders,
        updateOrderStatus,
        getMenu, updateMenuItem,
        getAnalytics,
    });
})();
