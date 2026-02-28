/**
 * customer.js — Customer data persistence, loyalty points, repeat order.
 *
 * Uses localStorage (no cookies). Provides a clean API for:
 *   - Saving/loading customer profile (name, phone, orders, points)
 *   - Recording each order for loyalty tracking
 *   - Storing last order items for "Repeat Last Order"
 *
 * Loaded AFTER cart.js, BEFORE ui.js so UI can call Customer.*
 */
'use strict';

const Customer = (() => {

    const STORAGE_KEY = 'pf_user';
    const NAME_KEY = 'pf_customer_name';
    const PHONE_KEY = 'pf_customer_phone';
    const THEME_KEY = 'pf_theme';
    const ORDERS_KEY = 'pf_orders';
    const POINTS_PER_100 = 10; // ₹100 = 10 points

    /* ---------- Internal helpers ---------- */

    /** Read stored profile or return default */
    const _load = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    /** Persist profile to localStorage */
    const _save = (profile) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (err) {
            console.warn('[Customer] Failed to save:', err.message);
        }
    };

    /** Build a fresh default profile */
    const _defaultProfile = (name, phone) => ({
        name: name || '',
        phone: phone || '',
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        lastOrder: null,
        createdAt: new Date().toISOString(),
    });

    /* ---------- Public API ---------- */

    /**
     * Get the saved customer profile, or null if none.
     * @returns {{ name, phone, totalOrders, totalSpent, loyaltyPoints, lastOrder }|null}
     */
    const getProfile = () => _load();

    /**
     * Check if a returning customer exists.
     * @returns {boolean}
     */
    const exists = () => !!_load();

    /**
     * Record a completed order. Updates totals, points, and lastOrder.
     * Creates profile if first time.
     *
     * @param {object} info — { name, phone }
     * @param {number} orderTotal — ₹ amount
     * @param {Array}  cartItems  — Cart.snapshot() at time of order
     */
    const recordOrder = (info, orderTotal, cartItems) => {
        let profile = _load();

        if (!profile) {
            profile = _defaultProfile(info.name, info.phone);
        }

        // Update identity (may change across visits)
        profile.name = info.name || profile.name;
        profile.phone = info.phone || profile.phone;

        // Increment stats
        profile.totalOrders = (profile.totalOrders || 0) + 1;
        profile.totalSpent = (profile.totalSpent || 0) + (orderTotal || 0);

        // Loyalty: 10 points per ₹100
        const earnedPoints = Math.floor((orderTotal || 0) / 100) * POINTS_PER_100;
        profile.loyaltyPoints = (profile.loyaltyPoints || 0) + earnedPoints;

        // Store last order for repeat
        profile.lastOrder = {
            items: (cartItems || []).map(i => ({
                itemId: i.itemId,
                name: i.name,
                size: i.size,
                price: i.price,
                quantity: i.quantity,
            })),
            total: orderTotal,
            date: new Date().toISOString(),
        };

        profile.updatedAt = new Date().toISOString();

        _save(profile);
        console.log('[Customer] Order recorded — points:', profile.loyaltyPoints, 'orders:', profile.totalOrders);

        // Dispatch event for UI to react
        document.dispatchEvent(new CustomEvent('customer:updated', { detail: profile }));

        return { profile, earnedPoints };
    };

    /**
     * Get last order items for "Repeat Last Order".
     * @returns {Array|null} — array of { itemId, name, size, price, quantity } or null
     */
    const getLastOrder = () => {
        const profile = _load();
        return profile?.lastOrder?.items || null;
    };

    /**
     * Restore last order into Cart.
     * @returns {boolean} true if items were added
     */
    const repeatLastOrder = () => {
        const items = getLastOrder();
        if (!items || !items.length) return false;

        // Clear current cart first
        Cart.clear();

        // Re-add each item
        items.forEach(i => {
            for (let q = 0; q < i.quantity; q++) {
                Cart.add(i.itemId || i.id, i.size, i.price);
            }
        });

        console.log('[Customer] Repeated last order —', items.length, 'line items');
        return true;
    };

    /**
     * Get display-ready loyalty data for the loyalty bar.
     * @returns {{ name, points, orders, totalSpent }|null}
     */
    const getLoyaltyData = () => {
        const profile = _load();
        if (!profile) return null;
        return {
            name: profile.name,
            points: profile.loyaltyPoints || 0,
            orders: profile.totalOrders || 0,
            totalSpent: profile.totalSpent || 0,
        };
    };

    /**
     * Clear all stored customer data.
     */
    const clear = () => {
        localStorage.removeItem(STORAGE_KEY);
        document.dispatchEvent(new CustomEvent('customer:updated', { detail: null }));
    };

    /* ---------- Name persistence ---------- */

    const getName = () => localStorage.getItem(NAME_KEY) || '';

    const setName = (name) => {
        const trimmed = (name || '').trim();
        if (trimmed) {
            localStorage.setItem(NAME_KEY, trimmed);
            /* Also update profile name if profile exists */
            const profile = _load();
            if (profile) {
                profile.name = trimmed;
                _save(profile);
            }
        }
    };

    const hasName = () => !!localStorage.getItem(NAME_KEY);

    /* ---------- Phone persistence ---------- */

    const getPhone = () => localStorage.getItem(PHONE_KEY) || '';

    const setPhone = (phone) => {
        const trimmed = (phone || '').trim();
        if (trimmed) {
            localStorage.setItem(PHONE_KEY, trimmed);
            const profile = _load();
            if (profile) {
                profile.phone = trimmed;
                _save(profile);
            }
        }
    };

    const hasPhone = () => !!localStorage.getItem(PHONE_KEY);

    /* ---------- Theme persistence ---------- */

    const getTheme = () => localStorage.getItem(THEME_KEY) || 'light';

    const setTheme = (theme) => {
        localStorage.setItem(THEME_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
    };

    /* ---------- Orders history ---------- */

    const _loadOrders = () => {
        try {
            const raw = localStorage.getItem(ORDERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    };

    const _saveOrders = (orders) => {
        try {
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        } catch (err) {
            console.warn('[Customer] Failed to save orders:', err.message);
        }
    };

    /**
     * Save an order to local history.
     * @param {object} order  — { orderId, items, total, status, date, customerName, phone }
     */
    const saveOrder = (order) => {
        const orders = _loadOrders();
        /* Prevent duplicates */
        const idx = orders.findIndex(o => o.orderId === order.orderId);
        if (idx >= 0) {
            orders[idx] = { ...orders[idx], ...order };
        } else {
            orders.unshift(order);
        }
        /* Keep max 20 orders */
        if (orders.length > 20) orders.length = 20;
        _saveOrders(orders);
        document.dispatchEvent(new CustomEvent('orders:updated'));
    };

    /**
     * Update an order's status in local history.
     * @param {string} orderId — can be orderId or Mongo _id
     * @param {string} status — PENDING | PREPARING | COMPLETED | CANCELLED
     */
    const updateOrderStatus = (orderId, status) => {
        const orders = _loadOrders();
        /* Match by orderId first, then by _id */
        const order = orders.find(o => o.orderId === orderId)
                   || orders.find(o => o._id === orderId);
        if (order) {
            order.status = status;
            order.updatedAt = new Date().toISOString();
            _saveOrders(orders);
            document.dispatchEvent(new CustomEvent('orders:updated'));
            console.log('[Customer] Order status updated:', order.orderId, '→', status);
        }
    };

    /** Get all saved orders (newest first). */
    const getOrders = () => _loadOrders();

    /** Get a specific order by orderId or Mongo _id. */
    const getOrder = (id) => _loadOrders().find(o => o.orderId === id || o._id === id) || null;

    /** Check if there are any active orders (PENDING or PREPARING). */
    const hasActiveOrders = () => _loadOrders().some(o => o.status === 'PENDING' || o.status === 'PREPARING');

    return Object.freeze({
        getProfile,
        exists,
        recordOrder,
        getLastOrder,
        repeatLastOrder,
        getLoyaltyData,
        clear,
        getName,
        setName,
        hasName,
        getPhone,
        setPhone,
        hasPhone,
        getTheme,
        setTheme,
        saveOrder,
        updateOrderStatus,
        getOrders,
        getOrder,
        hasActiveOrders,
    });
})();
