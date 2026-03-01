'use strict';

const Customer = (() => {

    const STORAGE_KEY = 'pf_user';
    const NAME_KEY = 'pf_customer_name';
    const PHONE_KEY = 'pf_customer_phone';
    const THEME_KEY = 'pf_theme';
    const ORDERS_KEY = 'pf_orders';
    const POINTS_PER_100 = 10;

    const _load = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const _save = (profile) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch (err) {
            console.warn('[Customer] Failed to save:', err.message);
        }
    };

    const _defaultProfile = (name, phone) => ({
        name: name || '',
        phone: phone || '',
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        lastOrder: null,
        createdAt: new Date().toISOString(),
    });

    const getProfile = () => _load();

    const exists = () => !!_load();

    const recordOrder = (info, orderTotal, cartItems) => {
        let profile = _load();

        if (!profile) {
            profile = _defaultProfile(info.name, info.phone);
        }

        profile.name = info.name || profile.name;
        profile.phone = info.phone || profile.phone;

        profile.totalOrders = (profile.totalOrders || 0) + 1;
        profile.totalSpent = (profile.totalSpent || 0) + (orderTotal || 0);

        const earnedPoints = Math.floor((orderTotal || 0) / 100) * POINTS_PER_100;
        profile.loyaltyPoints = (profile.loyaltyPoints || 0) + earnedPoints;

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

        document.dispatchEvent(new CustomEvent('customer:updated', { detail: profile }));

        return { profile, earnedPoints };
    };

    const getLastOrder = () => {
        const profile = _load();
        return profile?.lastOrder?.items || null;
    };

    const repeatLastOrder = () => {
        const items = getLastOrder();
        if (!items || !items.length) return false;

        Cart.clear();

        items.forEach(i => {
            for (let q = 0; q < i.quantity; q++) {
                Cart.add(i.itemId || i.id, i.size, i.price);
            }
        });

        console.log('[Customer] Repeated last order —', items.length, 'line items');
        return true;
    };

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

    const clear = () => {
        localStorage.removeItem(STORAGE_KEY);
        document.dispatchEvent(new CustomEvent('customer:updated', { detail: null }));
    };

    const getName = () => localStorage.getItem(NAME_KEY) || '';

    const setName = (name) => {
        const trimmed = (name || '').trim();
        if (trimmed) {
            localStorage.setItem(NAME_KEY, trimmed);

            const profile = _load();
            if (profile) {
                profile.name = trimmed;
                _save(profile);
            }
        }
    };

    const hasName = () => !!localStorage.getItem(NAME_KEY);

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

    const getTheme = () => localStorage.getItem(THEME_KEY) || 'light';

    const setTheme = (theme) => {
        localStorage.setItem(THEME_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
    };

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

    const saveOrder = (order) => {
        const orders = _loadOrders();

        const idx = orders.findIndex(o => o.orderId === order.orderId);
        if (idx >= 0) {
            orders[idx] = { ...orders[idx], ...order };
        } else {
            orders.unshift(order);
        }

        if (orders.length > 20) orders.length = 20;
        _saveOrders(orders);
        document.dispatchEvent(new CustomEvent('orders:updated'));
    };

    const updateOrderStatus = (orderId, status) => {
        const orders = _loadOrders();

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

    const getOrders = () => _loadOrders();

    const getOrder = (id) => _loadOrders().find(o => o.orderId === id || o._id === id) || null;

    const removeOrder = (id) => {
        const orders = _loadOrders().filter(o => o.orderId !== id && o._id !== id);
        _saveOrders(orders);
        document.dispatchEvent(new CustomEvent('orders:updated'));
        console.log('[Customer] Order removed:', id);
    };

    const hasActiveOrders = () => _loadOrders().some(o => {
        const s = normalizeStatus(o.status);
        return s === ORDER_STATUS.PENDING || s === ORDER_STATUS.PREPARING;
    });

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
        removeOrder,
        hasActiveOrders,
    });
})();
