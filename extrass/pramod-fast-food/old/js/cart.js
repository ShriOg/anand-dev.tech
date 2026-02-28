'use strict';

const Cart = (() => {

    const _items = {};

    const _key = (id, size) => `${id}-${size}`;

    const _emit = () => {
        document.dispatchEvent(new CustomEvent('cart:changed', { detail: snapshot() }));
    };

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

    const qty = (itemId, size) => _items[_key(itemId, size)]?.quantity || 0;

    const count = () => Object.values(_items).reduce((s, i) => s + i.quantity, 0);

    const total = () => Object.values(_items).reduce((s, i) => s + i.price * i.quantity, 0);

    const snapshot = () => Object.values(_items).map(i => ({ ...i }));

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

    const generateOrderId = () => 'PF' + Date.now().toString(36).toUpperCase().slice(-6);

    const formatTimestamp = () => {
        const d = new Date();
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const h = d.getHours(), hr = h % 12 || 12, ap = h >= 12 ? 'PM' : 'AM';
        return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}, ${hr}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
    };

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

    const submitOrder = (info) => {
        const items = snapshot();
        if (!items.length) return { ok: false, error: 'Cart is empty' };

        const orderId = generateOrderId();
        const orderTotal = total();
        const url = buildCheckoutMessage(info, { orderId, total: orderTotal });
        return { ok: true, url, orderId, total: orderTotal };
    };

    return Object.freeze({ add, update, remove, clear, qty, count, total, snapshot, checkoutURL, buildCheckoutMessage, submitOrder });
})();
