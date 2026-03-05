'use strict';

const MenuNovaAPI = (() => {
    const cfg = window.AppConfig || window.RestaurantConfig || {};
    const API_BASE = cfg.API_BASE || null;
    const ADMIN_TOKEN_KEY = 'admin_token';

    const normalizePath = (path) => {
        if (!path) return '';
        return path.startsWith('/') ? path : `/${path}`;
    };

    const buildUrl = (path, query = null) => {
        if (!API_BASE) throw new Error('API base is not configured for this host.');
        const url = new URL(`${API_BASE}${normalizePath(path)}`);
        if (query && typeof query === 'object') {
            Object.entries(query).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;
                url.searchParams.set(key, String(value));
            });
        }
        return url.toString();
    };

    const parseJson = async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        try { return await res.json(); } catch { return null; }
    };

    const toError = (status, payload) => {
        const bodyMsg = payload?.message || payload?.error;
        if (bodyMsg) return bodyMsg;
        if (status === 401) return 'Unauthorized';
        if (status === 404) return 'Not found';
        if (status >= 500) return 'Server error';
        return `HTTP ${status}`;
    };

    const onUnauthorized = () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        document.dispatchEvent(new CustomEvent('admin:unauthorized'));
    };

    const request = async (path, options = {}) => {
        const { method = 'GET', body, headers = {}, auth = false, query } = options;
        const url = buildUrl(path, query);
        console.log('Calling:', url);

        const finalHeaders = { 'Content-Type': 'application/json', ...(headers || {}) };
        if (auth) {
            const token = localStorage.getItem(ADMIN_TOKEN_KEY);
            if (!token) throw new Error('No token');
            finalHeaders.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(url, {
            method,
            headers: finalHeaders,
            body: body === undefined ? undefined : JSON.stringify(body),
        });

        const payload = await parseJson(res);
        if (!res.ok) {
            if (auth && res.status === 401) onUnauthorized();
            throw new Error(toError(res.status, payload));
        }

        return payload?.data ?? payload;
    };

    async function authFetch(url, options = {}) {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) throw new Error('No token');
        console.log('Calling:', url);
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
        if (res.status === 401) onUnauthorized();
        return res;
    }

    const publicApi = Object.freeze({
        getMenu: () => request('/menu'),
        initCustomer: (payload) => request('/customer/init', { method: 'POST', body: payload }),
        createCustomer: (payload) => request('/customers', { method: 'POST', body: payload }),
        getOrders: (params = {}) => request('/orders', { query: params }),
        getOrderById: (orderId) => request(`/orders/${encodeURIComponent(orderId)}`),
        cancelOrder: (orderId) => request(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'PATCH' }),
        createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
    });

    const adminApi = Object.freeze({
        setup: (password) => request('/admin/setup', { method: 'POST', body: { password }, auth: false }),
        login: (password) => request('/admin/login', { method: 'POST', body: { password }, auth: false }),
        status: () => request('/admin/status', { auth: true }),
        orders: (params = {}) => request('/admin/orders', { auth: true, query: params }),
        ordersToday: (params = {}) => request('/admin/orders/today', { auth: true, query: params }),
        menuAll: () => request('/admin/menu/all', { auth: true }),
        stats: () => request('/admin/stats', { auth: true }),
        analytics: () => request('/admin/analytics', { auth: true }),
        insights: () => request('/admin/insights', { auth: true }),
        menuCreate: (payload) => request('/admin/menu', { method: 'POST', body: payload, auth: true }),
        menuPut: (id, payload) => request(`/admin/menu/${encodeURIComponent(id)}`, { method: 'PUT', body: payload, auth: true }),
        menuPatch: (id, payload) => request(`/admin/menu/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
        orderPatch: (id, payload) => request(`/admin/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
        orderPatchStatus: (id, payload) => request(`/admin/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: payload, auth: true }),
        orderDelete: (id) => request(`/admin/orders/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
        changePassword: (oldPassword, newPassword) => request('/admin/change-password', { method: 'POST', body: { oldPassword, newPassword }, auth: true }),
    });

    return Object.freeze({
        ADMIN_TOKEN_KEY,
        API_BASE,
        buildUrl,
        request,
        authFetch,
        public: publicApi,
        admin: adminApi,
    });
})();
