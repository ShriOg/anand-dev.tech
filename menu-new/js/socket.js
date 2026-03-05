'use strict';

const MenuNovaSocket = (() => {
    const cfg = window.AppConfig || window.RestaurantConfig || {};

    const create = (opts = {}) => {
        if (typeof io === 'undefined') return null;
        return io(cfg.SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 30,
            ...opts,
        });
    };

    const joinAdminRoom = (socket) => {
        if (!socket || !cfg.SLUG) return;
        const room = `admin_${cfg.SLUG}`;
        socket.emit('join:admin', { slug: cfg.SLUG, room });
        socket.emit('join-room', { room, slug: cfg.SLUG, role: 'admin' });
    };

    const joinUserRoom = (socket, phone) => {
        if (!socket || !cfg.SLUG || !phone) return;
        const room = `user_${cfg.SLUG}_${phone}`;
        socket.emit('join:user', { slug: cfg.SLUG, phone, room });
        socket.emit('join-room', { room, slug: cfg.SLUG, phone, role: 'user' });
    };

    return Object.freeze({ create, joinAdminRoom, joinUserRoom });
})();
