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

    /** Build WhatsApp checkout URL */
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

    return Object.freeze({ add, update, remove, clear, qty, count, total, snapshot, checkoutURL });
})();
