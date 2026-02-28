'use strict';

window.__DEBUG__ = true;

function debug(label, data = null) {
    if (!window.__DEBUG__) return;
    console.log(`[DEBUG] ${label}`, data ?? '');
}

const Api = (() => {

    const _BASE = (() => {
        const host = location.hostname;
        if (host === 'localhost' || host === '127.0.0.1')
            return 'https://anand-os-backend.onrender.com';
        return 'https://anand-os-backend.onrender.com';
    })();

    console.log('[API] Using base:', _BASE);

    const ENDPOINTS = Object.freeze({
        menu:    '/api/restaurant/menu',
        orders:  '/api/restaurant/orders',
        profile: '/api/auth/profile',
    });

    const TIMEOUT_MS = 8000;
    const COLD_START_RETRY_DELAY = 2000;

    let _token = localStorage.getItem('pf_token') || null;

    let _serverAwake = false;
    const isServerAwake = () => _serverAwake;

    const _doFetch = async (url, opts, headers, timeout) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            debug('API Request', { method: opts.method || 'GET', url, body: opts.body ? JSON.parse(opts.body) : undefined });
            const res = await fetch(url, {
                ...opts,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timer);
            debug('API Response Status', res.status);

            let data = null;
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                data = await res.json();
                debug('API Response Body', data);
            }

            if (!res.ok) {
                let error = (data && (data.message || data.error)) || `HTTP ${res.status}`;
                if (res.status >= 500) error = 'Server waking up… please try again.';
                else if (res.status === 401) error = 'Admin authentication required.';
                return {
                    ok: false,
                    status: res.status,
                    data,
                    error,
                };
            }
            _serverAwake = true;

            const payload = (data && data.success === true && 'data' in data) ? data.data : data;
            return { ok: true, status: res.status, data: payload };

        } catch (err) {
            clearTimeout(timer);
            debug('API Error', err);
            if (err.name === 'AbortError') {
                return { ok: false, status: 0, data: null, error: 'Request timed out' };
            }
            return { ok: false, status: 0, data: null, error: err.message || 'Network error' };
        }
    };

    const request = async (path, opts = {}, timeout = TIMEOUT_MS) => {
        const url = `${_BASE}${path}`;

        const headers = {
            'Content-Type': 'application/json',
            ...(opts.headers || {}),
        };
        if (_token) headers['Authorization'] = `Bearer ${_token}`;

        const result = await _doFetch(url, opts, headers, timeout);

        if (!result.ok && result.status === 0 && !_serverAwake) {
            console.log('[Api] Server may be waking up — retrying in 3s…');
            document.dispatchEvent(new CustomEvent('api:cold-start'));
            await new Promise(r => setTimeout(r, COLD_START_RETRY_DELAY));
            return _doFetch(url, opts, headers, timeout);
        }

        return result;
    };

    const fetchMenu = () => request(ENDPOINTS.menu);

    const placeOrder = (payload) => request(ENDPOINTS.orders, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    const fetchOrdersByPhone = (phone) =>
        request(`${ENDPOINTS.orders}?phone=${encodeURIComponent(phone)}`);

    const fetchProfile = () => request(ENDPOINTS.profile);

    const setToken = (token) => {
        _token = token;
        if (token) localStorage.setItem('pf_token', token);
        else localStorage.removeItem('pf_token');
    };

    const getToken = () => _token;

    const isAuthenticated = () => !!_token;

    return Object.freeze({
        request,
        fetchMenu,
        placeOrder,
        fetchOrdersByPhone,
        fetchProfile,
        setToken,
        getToken,
        isAuthenticated,
        isServerAwake,
        ENDPOINTS,
    });
})();
