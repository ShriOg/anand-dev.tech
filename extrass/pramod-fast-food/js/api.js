/**
 * api.js — Centralised API utility for Pramod Fast Food.
 *
 * Single source of truth for all backend communication.
 * Auto-detects local dev vs production endpoint.
 * Every fetch goes through Api.request() which handles errors,
 * timeouts, and token management uniformly.
 *
 * Loaded BEFORE menu-data.js so other modules can call Api.*
 */
'use strict';

const Api = (() => {

    /* ---------- Configuration ---------- */

    const _BASE = (() => {
        const host = location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
        return '';  // same-origin in production
    })();

    const ENDPOINTS = Object.freeze({
        menu:    '/api/restaurant/menu',
        orders:  '/api/restaurant/orders',
        profile: '/api/auth/profile',
    });

    const TIMEOUT_MS = 12000;

    /** JWT token (set after login, if any) */
    let _token = localStorage.getItem('pf_token') || null;

    /* ---------- Internals ---------- */

    /**
     * Core fetch wrapper.
     * @param {string}  path     - API path (e.g. '/api/restaurant/menu')
     * @param {object}  [opts]   - fetch options override
     * @param {number}  [timeout] - ms before abort
     * @returns {Promise<{ok:boolean, status:number, data:any, error?:string}>}
     */
    const request = async (path, opts = {}, timeout = TIMEOUT_MS) => {
        const url = `${_BASE}${path}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const headers = {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
        };
        if (_token) headers['Authorization'] = `Bearer ${_token}`;

        try {
            const res = await fetch(url, {
                ...opts,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timer);

            let data = null;
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                data = await res.json();
            }

            if (!res.ok) {
                return {
                    ok: false,
                    status: res.status,
                    data,
                    error: (data && (data.message || data.error)) || `HTTP ${res.status}`,
                };
            }
            return { ok: true, status: res.status, data };

        } catch (err) {
            clearTimeout(timer);
            if (err.name === 'AbortError') {
                return { ok: false, status: 0, data: null, error: 'Request timed out' };
            }
            return { ok: false, status: 0, data: null, error: err.message || 'Network error' };
        }
    };

    /* ---------- Public API ---------- */

    /**
     * Fetch live menu from backend.
     * @returns {Promise<{ok:boolean, data?:object, error?:string}>}
     *   data = { categories: { key: { title, icon, items[] } } } or array format
     */
    const fetchMenu = () => request(ENDPOINTS.menu);

    /**
     * Submit order to backend. Backend calculates totals.
     * @param {{customerName:string, phone:string, orderType:string, persons?:number,
     *          tableNumber?:string, note?:string, items:{itemId:number, size:string, quantity:number}[]}} payload
     * @returns {Promise<{ok:boolean, data?:{orderId:string, total:number, ...}, error?:string}>}
     */
    const placeOrder = (payload) => request(ENDPOINTS.orders, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    /**
     * Fetch authenticated user profile (loyalty data).
     * @returns {Promise<{ok:boolean, data?:{name:string, points:number, orders:number, ...}, error?:string}>}
     */
    const fetchProfile = () => request(ENDPOINTS.profile);

    /** Store JWT token (e.g. after login) */
    const setToken = (token) => {
        _token = token;
        if (token) localStorage.setItem('pf_token', token);
        else localStorage.removeItem('pf_token');
    };

    /** Read current token */
    const getToken = () => _token;

    /** Check if user is authenticated */
    const isAuthenticated = () => !!_token;

    return Object.freeze({
        request,
        fetchMenu,
        placeOrder,
        fetchProfile,
        setToken,
        getToken,
        isAuthenticated,
        ENDPOINTS,
    });
})();
