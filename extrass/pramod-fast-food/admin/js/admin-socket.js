/**
 * admin-socket.js — Socket.IO realtime connection for admin dashboard.
 *
 * Connects to the server, listens for restaurant events,
 * and dispatches CustomEvents so other modules stay decoupled.
 *
 * Expects Socket.IO client library loaded via CDN or bundled.
 * If Socket.IO is not available, falls back to polling gracefully.
 */
'use strict';

const AdminSocket = (() => {

    let _socket = null;
    let _connected = false;
    let _reconnectTimer = null;
    const _EVENTS = {
        NEW_ORDER: 'restaurant:new-order',
        ORDER_UPDATED: 'restaurant:order-updated',
    };

    /* ---------- Helpers ---------- */
    const _emit = (type, detail) => {
        document.dispatchEvent(new CustomEvent(type, { detail }));
    };

    const _updateStatus = (online) => {
        _connected = online;
        _emit('socket:status', { connected: online });
    };

    /* ---------- Connect ---------- */
    const connect = () => {
        /* Guard: if socket.io client not loaded, skip gracefully */
        if (typeof io === 'undefined') {
            console.warn('[AdminSocket] Socket.IO client not loaded — realtime disabled. Falling back to polling.');
            _updateStatus(false);
            _startPolling();
            return;
        }

        _emit('socket:status', { connected: 'connecting' });

        const baseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : 'https://anand-os-backend.onrender.com';

        const token = typeof AdminAPI !== 'undefined' && AdminAPI.getToken ? AdminAPI.getToken() : null;

        _socket = io(baseUrl, {
            ...(token ? { auth: { token } } : {}),
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 20,
        });

        _socket.on('connect', () => {
            console.log('[AdminSocket] Connected');
            _updateStatus(true);
            _socket.emit('join:admin');
        });

        _socket.on('disconnect', (reason) => {
            console.log('[AdminSocket] Disconnected:', reason);
            _updateStatus(false);
        });

        _socket.on('connect_error', (err) => {
            console.warn('[AdminSocket] Connection error:', err.message);
            _updateStatus(false);
        });

        _socket.on('reconnect_attempt', () => {
            _emit('socket:status', { connected: 'connecting' });
        });

        /* --- Restaurant events --- */
        _socket.on(_EVENTS.NEW_ORDER, (order) => {
            console.log('[AdminSocket] New order:', order);
            _emit('admin:new-order', order);
        });

        _socket.on(_EVENTS.ORDER_UPDATED, (data) => {
            console.log('[AdminSocket] Order updated:', data);
            _emit('admin:order-updated', data);
        });
    };

    /* ---------- Polling fallback (if no Socket.IO) ---------- */
    let _lastPollTimestamp = Date.now();
    let _pollInterval = null;

    const _startPolling = () => {
        if (_pollInterval) return;
        _pollInterval = setInterval(async () => {
            try {
                const orders = await AdminAPI.getOrders({ dateFrom: new Date(_lastPollTimestamp).toISOString() });
                _lastPollTimestamp = Date.now();
                if (orders && orders.data) {
                    orders.data.forEach(order => {
                        _emit('admin:new-order', order);
                    });
                }
            } catch { /* silently skip */ }
        }, 15000); // poll every 15s
    };

    /* ---------- Disconnect ---------- */
    const disconnect = () => {
        if (_socket) {
            _socket.disconnect();
            _socket = null;
        }
        if (_pollInterval) {
            clearInterval(_pollInterval);
            _pollInterval = null;
        }
        clearTimeout(_reconnectTimer);
        _updateStatus(false);
    };

    /* ---------- Status ---------- */
    const isConnected = () => _connected;

    return Object.freeze({ connect, disconnect, isConnected });
})();
