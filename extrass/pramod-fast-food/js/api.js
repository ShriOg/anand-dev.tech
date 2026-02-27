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
        return 'https://anand-os-backend.onrender.com';
    })();

    const ENDPOINTS = Object.freeze({
        menu:    '/api/restaurant/menu',
        orders:  '/api/restaurant/orders',
        profile: '/api/auth/profile',
    });

    const TIMEOUT_MS = 8000;
    const COLD_START_RETRY_DELAY = 2000;

    /** JWT token (set after login, if any) */
    let _token = localStorage.getItem('pf_token') || null;

    /** Track server readiness for cold-start UX */
    let _serverAwake = false;
    const isServerAwake = () => _serverAwake;

    /* ---------- Internals ---------- */

    /**
     * Single attempt fetch.
     */
    const _doFetch = async (url, opts, headers, timeout) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

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
            _serverAwake = true;
            /* Unwrap backend { success, data } envelope so consumers get the real payload */
            const payload = (data && data.success === true && 'data' in data) ? data.data : data;
            return { ok: true, status: res.status, data: payload };

        } catch (err) {
            clearTimeout(timer);
            if (err.name === 'AbortError') {
                return { ok: false, status: 0, data: null, error: 'Request timed out' };
            }
            return { ok: false, status: 0, data: null, error: err.message || 'Network error' };
        }
    };

    /**
     * Core fetch wrapper with automatic cold-start retry.
     * On first network error / timeout, waits 3s and retries once
     * (Render free-tier spins down after inactivity).
     *
     * @param {string}  path     - API path (e.g. '/api/restaurant/menu')
     * @param {object}  [opts]   - fetch options override
     * @param {number}  [timeout] - ms before abort
     * @returns {Promise<{ok:boolean, status:number, data:any, error?:string}>}
     */
    const request = async (path, opts = {}, timeout = TIMEOUT_MS) => {
        const url = `${_BASE}${path}`;

        const headers = {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
        };
        if (_token) headers['Authorization'] = `Bearer ${_token}`;

        const result = await _doFetch(url, opts, headers, timeout);

        /* Retry once on cold-start (network error or timeout, not HTTP errors) */
        if (!result.ok && result.status === 0 && !_serverAwake) {
            console.log('[Api] Server may be waking up — retrying in 3s…');
            document.dispatchEvent(new CustomEvent('api:cold-start'));
            await new Promise(r => setTimeout(r, COLD_START_RETRY_DELAY));
            return _doFetch(url, opts, headers, timeout);
        }

        return result;
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
        isServerAwake,
        ENDPOINTS,
    });
})();
