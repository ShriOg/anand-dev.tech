/**
 * cart.js — Cart logic: add / update / remove / totals / checkout.
 *
 * Cart entries are keyed by "itemId-sizeLabel" so the same item in
 * different sizes occupies different slots.
 *
 * Emits a custom 'cart:changed' event on document after every mutation
 * so UI can react without tight coupling.
 */
'use strict';

const Cart = (() => {
    /** @type {Object.<string, {id:number, name:string, size:string, price:number, quantity:number}>} */
    const _items = {};

    const _key = (id, size) => `${id}-${size}`;

    const _emit = () => {
        document.dispatchEvent(new CustomEvent('cart:changed', { detail: snapshot() }));
    };

    /* ---------- Public API ---------- */

    const add = (itemId, size, price) => {
        const item = MenuData.findById(itemId);
        if (!item) return;
        const key = _key(itemId, size);

        if (_items[key]) {
            _items[key].quantity += 1;
        } else {
            _items[key] = { id: itemId, name: item.name, size, price, quantity: 1 };
        }
        _emit();
    };

    const update = (itemId, size, price, delta) => {
        const key = _key(itemId, size);
        if (!_items[key]) {
            if (delta > 0) add(itemId, size, price);
            return;
        }
        _items[key].quantity += delta;
        if (_items[key].quantity <= 0) delete _items[key];
        _emit();
    };

    const remove = (itemId, size) => {
        delete _items[_key(itemId, size)];
        _emit();
    };

    const clear = () => {
        Object.keys(_items).forEach(k => delete _items[k]);
        _emit();
    };

    /** Quantity of a specific item+size (0 if not in cart) */
    const qty = (itemId, size) => _items[_key(itemId, size)]?.quantity || 0;

    /** Total number of items (sum of quantities) */
    const count = () => Object.values(_items).reduce((s, i) => s + i.quantity, 0);

    /** Total price */
    const total = () => Object.values(_items).reduce((s, i) => s + i.price * i.quantity, 0);

    /** Immutable snapshot of cart entries */
    const snapshot = () => Object.values(_items).map(i => ({ ...i }));

    /** Build WhatsApp checkout URL (legacy) */
    const checkoutURL = () => {
        const items = snapshot();
        if (!items.length) return null;

        let msg = '🛒 *New Order from Pramod Fast Food*\n\n';
        items.forEach(i => {
            msg += `• ${i.name} (${i.size}) × ${i.quantity} = ₹${i.price * i.quantity}\n`;
        });
        msg += `\n*Total: ₹${total()}*`;
        return `https://wa.me/918595928413?text=${encodeURIComponent(msg)}`;
    };

    /** Generate short order ID: PF + base36 timestamp */
    const generateOrderId = () => 'PF' + Date.now().toString(36).toUpperCase().slice(-6);

    /** Human-readable timestamp */
    const formatTimestamp = () => {
        const d = new Date();
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const h = d.getHours(), hr = h % 12 || 12, ap = h >= 12 ? 'PM' : 'AM';
        return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}, ${hr}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
    };

    /** Build professional WhatsApp checkout URL with customer info */
    const buildCheckoutMessage = (info, overrides = {}) => {
        const items = snapshot();
        if (!items.length) return null;

        const orderId = overrides.orderId || generateOrderId();
        const orderTotal = overrides.total != null ? overrides.total : total();
        const ts = formatTimestamp();

        let msg = `🛒 *New Order — Pramod Fast Food*\n`;
        msg += `🧾 Order ID: ${orderId}\n`;
        msg += `🕒 ${ts}\n\n`;
        msg += `👤 Customer: ${info.name}\n`;
        msg += `📞 Phone: ${info.phone}\n`;
        msg += `📦 Order Type: ${info.orderType}\n`;
        if (info.orderType === 'Dine-In') {
            if (info.persons) msg += `👥 Persons: ${info.persons}\n`;
            if (info.table) msg += `🪑 Table: ${info.table}\n`;
        }
        if (info.note) msg += `📝 Note: ${info.note}\n`;

        msg += `\n━━━━━━━━━━━━━━━━━━\n`;
        items.forEach(i => {
            msg += `• ${i.name}\n  ${i.size} × ${i.quantity}\n  ₹${i.price * i.quantity}\n\n`;
        });
        msg += `━━━━━━━━━━━━━━━━━━\n`;
        msg += `💰 *Total: ₹${orderTotal}*`;

        return `https://wa.me/918595928413?text=${encodeURIComponent(msg)}`;
    };

    /**
     * Submit order to backend API.
     * Does NOT clear the cart — caller clears only on success.
     * Does NOT build WhatsApp URL on success — backend handles the order.
     *
     * @param {object} info — { name, phone, orderType, persons?, table?, note? }
     * @returns {Promise<{ok:boolean, orderId?:string, total?:number, source:string, error?:string}>}
     */
    const submitOrder = async (info) => {
        const items = snapshot();
        if (!items.length) return { ok: false, error: 'Cart is empty', source: 'none' };

        const payload = {
            customerName: info.name,
            phone: info.phone,
            orderType: info.orderType,
            items: items.map(i => ({ itemId: i.id, size: i.size, quantity: i.quantity })),
        };
        if (info.orderType === 'Dine-In') {
            if (info.persons) payload.persons = Number(info.persons);
            if (info.table) payload.tableNumber = info.table;
        }
        if (info.note) payload.note = info.note;

        // Try backend
        if (typeof Api !== 'undefined') {
            try {
                const res = await Api.placeOrder(payload);
                const isSuccess = res?.success ?? res?.ok;
                console.log('[Cart] placeOrder response:', { isSuccess, hasData: !!res?.data, res });

                if (isSuccess && res.data) {
                    window.__BACKEND_CONNECTED__ = true;
                    const d = res.data;
                    const backendOrderId = d.orderId || d._id || generateOrderId();
                    const backendTotal = d.total != null ? d.total : total();
                    return { ok: true, orderId: backendOrderId, total: backendTotal, source: 'server' };
                }

                // HTTP succeeded but backend returned failure
                console.warn('[Cart] Backend returned non-success:', res);
            } catch (err) {
                console.warn('[Cart] API order failed:', err.message);
            }

            // Backend failed or returned error
            window.__BACKEND_CONNECTED__ = false;
            return {
                ok: false,
                error: 'Server temporarily unavailable',
                source: 'server-down',
            };
        }

        // No API module — caller should use sendViaWhatsApp()
        return { ok: false, error: 'No API available', source: 'no-api' };
    };

    /**
     * Build WhatsApp checkout URL and return it.
     * Used as fallback when backend is down.
     *
     * @param {object} info — { name, phone, orderType, persons?, table?, note? }
     * @returns {{url:string, orderId:string, total:number}}
     */
    const sendViaWhatsApp = (info) => {
        const orderId = generateOrderId();
        const orderTotal = total();
        const url = buildCheckoutMessage(info, { orderId, total: orderTotal });
        return { url, orderId, total: orderTotal };
    };

    return Object.freeze({ add, update, remove, clear, qty, count, total, snapshot, checkoutURL, buildCheckoutMessage, submitOrder, sendViaWhatsApp });
})();
