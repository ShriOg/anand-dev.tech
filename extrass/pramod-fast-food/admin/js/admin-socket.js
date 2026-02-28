'use strict';

const AdminSocket = (() => {

    let _socket = null;
    let _connected = false;
    let _reconnectTimer = null;
    const _EVENTS = {
        NEW_ORDER: 'restaurant:new-order',
        ORDER_UPDATED: 'restaurant:order-updated',
    };

    const _emit = (type, detail) => {
        document.dispatchEvent(new CustomEvent(type, { detail }));
    };

    const _updateStatus = (online) => {
        _connected = online;
        _emit('socket:status', { connected: online });
    };

    const connect = () => {

        if (typeof io === 'undefined') {
            console.warn('[AdminSocket] Socket.IO client not loaded — realtime disabled. Falling back to polling.');
            _updateStatus(false);
            _startPolling();
            return;
        }

        _emit('socket:status', { connected: 'connecting' });

        const baseUrl = 'https://anand-os-backend.onrender.com';

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
            debug('Socket Connected');
            _updateStatus(true);
            _socket.emit('join:admin');
        });

        _socket.on('disconnect', (reason) => {
            console.log('[AdminSocket] Disconnected:', reason);
            debug('Socket Disconnected');
            _updateStatus(false);
        });

        _socket.on('connect_error', (err) => {
            console.warn('[AdminSocket] Connection error:', err.message);
            _updateStatus(false);
        });

        _socket.on('reconnect_attempt', () => {
            _emit('socket:status', { connected: 'connecting' });
        });

        _socket.on(_EVENTS.NEW_ORDER, (order) => {
            console.log('[AdminSocket] New order:', order);
            debug('Socket New Order', order);
            _emit('admin:new-order', order);
        });

        _socket.on(_EVENTS.ORDER_UPDATED, (data) => {
            console.log('[AdminSocket] Order updated:', data);
            debug('Socket Status Update', data);
            _emit('admin:order-updated', data);
        });
    };

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
            } catch {  }
        }, 15000);
    };

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

    const isConnected = () => _connected;

    return Object.freeze({ connect, disconnect, isConnected });
})();
