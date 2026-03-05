'use strict';

/* ═══════════════════════════════════════════════════════════════
 *  MenuNova — Unified Menu Frontend
 *  Single-file module: State → Api → MenuData → Cart → Customer → UI → App
 *  All restaurant data loaded dynamically via RestaurantConfig.slug
 * ═══════════════════════════════════════════════════════════════ */

/* ── Guard: slug must exist ── */
(function () {
    if (!RestaurantConfig.initialized) {
        document.getElementById('pageWrapper').style.display = 'none';
        document.getElementById('notFoundPage').style.display = '';
        if (typeof hideLoader === 'function') hideLoader();
        return;
    }
    document.title = `Menu — ${RestaurantConfig.slug}`;
    _bootMenu();
})();

function _bootMenu() {

const IS_DEMO = RestaurantConfig.isDemo === true;
const DEMO_SIGNUP_URL = RestaurantConfig.demoSignupUrl || 'https://menunova.me/signup';
const DEMO_RESTAURANT_NAME = RestaurantConfig.demoRestaurantName || 'Demo Restaurant';
const DEMO_MENU_SEED = {
    starters: {
        title: 'Starters',
        icon: '🥗',
        items: [
            { _id: 'demo-starter-1', name: 'Paneer Tikka Platter', desc: 'Char-grilled paneer with mint chutney.', special: true, active: true, prices: [{ label: 'Regular', value: 269 }] },
            { _id: 'demo-starter-2', name: 'Crispy Corn Chaat', desc: 'Crunchy corn tossed with house spices.', special: false, active: true, prices: [{ label: 'Regular', value: 199 }] },
            { _id: 'demo-starter-3', name: 'Peri Peri Fries', desc: 'Hand-cut fries with smoky peri peri dust.', special: false, active: true, prices: [{ label: 'Regular', value: 179 }] },
        ],
    },
    'main-course': {
        title: 'Main Course',
        icon: '🍕',
        items: [
            { _id: 'demo-main-1', name: 'Farmhouse Pizza', desc: 'Loaded with garden-fresh vegetables.', special: true, active: true, prices: [{ label: 'Regular', value: 349 }] },
            { _id: 'demo-main-2', name: 'Tandoori Paneer Pizza', desc: 'Indian-spiced paneer on artisan crust.', special: true, active: true, prices: [{ label: 'Regular', value: 369 }] },
            { _id: 'demo-main-3', name: 'Veg Loaded Burger', desc: 'Stacked patty, cheddar, and crunch.', special: false, active: true, prices: [{ label: 'Regular', value: 239 }] },
            { _id: 'demo-main-4', name: 'Alfredo Pasta', desc: 'Creamy white-sauce pasta with herbs.', special: false, active: true, prices: [{ label: 'Regular', value: 289 }] },
        ],
    },
    beverages: {
        title: 'Beverages',
        icon: '🥤',
        items: [
            { _id: 'demo-bev-1', name: 'Cold Coffee', desc: 'Rich espresso blend with chilled foam.', special: false, active: true, prices: [{ label: 'Regular', value: 159 }] },
            { _id: 'demo-bev-2', name: 'Virgin Mojito', desc: 'Mint, lime, and sparkling refreshment.', special: false, active: true, prices: [{ label: 'Regular', value: 149 }] },
            { _id: 'demo-bev-3', name: 'Fresh Lime Soda', desc: 'Classic café cooler, sweet or salted.', special: false, active: true, prices: [{ label: 'Regular', value: 119 }] },
        ],
    },
    desserts: {
        title: 'Desserts',
        icon: '🍰',
        items: [
            { _id: 'demo-dessert-1', name: 'Brownie with Ice Cream', desc: 'Warm brownie with vanilla scoop.', special: true, active: true, prices: [{ label: 'Regular', value: 229 }] },
            { _id: 'demo-dessert-2', name: 'Gulab Jamun Cheesecake', desc: 'Fusion dessert with saffron glaze.', special: true, active: true, prices: [{ label: 'Regular', value: 249 }] },
        ],
    },
};

function injectDemoBadge() {
    if (!IS_DEMO || document.getElementById('demoFloatingBadge')) return;
    const badge = document.createElement('a');
    badge.id = 'demoFloatingBadge';
    badge.className = 'demo-floating-badge';
    badge.href = DEMO_SIGNUP_URL;
    badge.textContent = '⚡ Live Demo — Powered by MenuNova';
    badge.setAttribute('aria-label', 'Go to MenuNova signup');
    document.body.appendChild(badge);
}

function showDemoIntroOnce() {
    if (!IS_DEMO) return;
    const key = RestaurantConfig.storageKey('demo_intro_seen');
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    const overlay = document.createElement('div');
    overlay.className = 'demo-intro';
    overlay.innerHTML = '<div class="demo-intro__card" role="dialog" aria-modal="true" aria-label="Welcome to demo"><h2 class="demo-intro__title">Welcome to the MenuNova Live Demo 🚀</h2><p class="demo-intro__text">This is a fully working demo restaurant.<br>Place a test order to see live updates in the Kitchen and Admin dashboards.</p><button class="demo-intro__btn" type="button">Try It Now</button></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.demo-intro__btn')?.addEventListener('click', () => overlay.remove());
}

function injectDemoConversionSection() {
    if (!IS_DEMO || document.getElementById('demoConversionSection')) return;
    const pageWrapper = document.getElementById('pageWrapper');
    const globalFooter = document.querySelector('.global-footer');
    if (!pageWrapper || !globalFooter) return;
    const section = document.createElement('section');
    section.id = 'demoConversionSection';
    section.className = 'demo-conversion';
    section.innerHTML = '<h2 class="demo-conversion__title">Want This For Your Restaurant?</h2><p class="demo-conversion__sub">Launch Your Own QR Menu in Minutes.</p><a class="demo-conversion__btn" href="' + DEMO_SIGNUP_URL + '">Create My Restaurant</a>';
    pageWrapper.insertBefore(section, globalFooter);
}

function applyDemoBranding() {
    if (!IS_DEMO) return;
    document.title = `Menu — ${DEMO_RESTAURANT_NAME}`;
    const titleEl = document.getElementById('heroTitle');
    const subEl = document.getElementById('heroSub');
    const badgeEl = document.getElementById('heroBadge');
    const emojiEl = document.getElementById('heroEmoji');
    if (titleEl) titleEl.textContent = DEMO_RESTAURANT_NAME;
    if (subEl) subEl.textContent = 'Premium Vegetarian Modern Café · Live Demo';
    if (badgeEl) badgeEl.textContent = '⚡ Demo Mode · No Payment Required';
    if (emojiEl) emojiEl.textContent = '🌿';
}

/* ═══════════════════════════════════
 * 1. STATE
 * ═══════════════════════════════════ */
const State = (() => {
    const _state = { category: 'all', search: '', filter: 'all', cartOpen: false, loading: true };
    const _listeners = {};
    const get = (key) => _state[key];
    const set = (key, value) => {
        if (_state[key] === value) return;
        debug('State Change', { key, value });
        _state[key] = value;
        (_listeners[key] || []).forEach(fn => fn(value));
        (_listeners['*'] || []).forEach(fn => fn(key, value));
    };
    const on = (key, fn) => {
        if (!_listeners[key]) _listeners[key] = new Set();
        _listeners[key].add(fn);
        return () => _listeners[key].delete(fn);
    };
    return Object.freeze({ get, set, on });
})();

/* ═══════════════════════════════════
 * 2. API
 * ═══════════════════════════════════ */
const Api = (() => {
    const _BASE = (window.AppConfig && window.AppConfig.API_BASE) || RestaurantConfig.API_BASE;
    console.log('[API] Using base:', _BASE);

    const ENDPOINTS = Object.freeze({ menu: '/menu', orders: '/orders', customerInit: '/customer/init', customers: '/customers' });
    const TIMEOUT_MS = 8000;
    const COLD_START_RETRY_DELAY = 2000;
    let _serverAwake = false;
    const isServerAwake = () => _serverAwake;

    const _parseJson = async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        try { return await res.json(); } catch { return null; }
    };

    const _httpErrorMessage = (status, payload) => {
        const fromBody = payload?.message || payload?.error;
        if (fromBody) return fromBody;
        if (status === 404) return 'Restaurant not found for this subdomain.';
        if (status >= 500) return 'Server error. Please try again in a moment.';
        if (status === 401) return 'Authentication required.';
        if (status === 400) return 'Invalid request. Please verify inputs.';
        return `HTTP ${status}`;
    };

    const _doFetch = async (url, opts, headers, timeout) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            debug('API Request', { method: opts.method || 'GET', url });
            console.log('Calling:', url);
            const res = await fetch(url, { ...opts, headers, signal: controller.signal });
            clearTimeout(timer);
            const data = await _parseJson(res);
            if (!res.ok) {
                return { ok: false, status: res.status, data, error: _httpErrorMessage(res.status, data), code: 'http_error' };
            }
            _serverAwake = true;
            const payload = (data && data.success === true && 'data' in data) ? data.data : data;
            return { ok: true, status: res.status, data: payload };
        } catch (err) {
            clearTimeout(timer);
            if (err.name === 'AbortError') return { ok: false, status: 0, data: null, error: 'Request timed out', code: 'timeout' };
            return { ok: false, status: 0, data: null, error: err.message || 'Network error', code: 'network_error' };
        }
    };

    const request = async (path, opts = {}, timeout = TIMEOUT_MS) => {
        if (!_BASE) {
            const result = { ok: false, status: 0, data: null, error: 'Restaurant runtime is not initialized on this host.', code: 'restaurant_not_initialized' };
            console.error('[Api] Request blocked:', result.error);
            document.dispatchEvent(new CustomEvent('api:error', { detail: result }));
            return result;
        }
        const url = `${_BASE}${path}`;
        const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
        const result = await _doFetch(url, opts, headers, timeout);

        if (!result.ok && result.status === 0 && !_serverAwake && result.code === 'network_error') {
            console.warn('[Api] Server may be waking up — retrying in 2s…');
            document.dispatchEvent(new CustomEvent('api:cold-start'));
            await new Promise(r => setTimeout(r, COLD_START_RETRY_DELAY));
            const retried = await _doFetch(url, opts, headers, timeout);
            if (!retried.ok) document.dispatchEvent(new CustomEvent('api:error', { detail: retried }));
            return retried;
        }
        if (!result.ok) document.dispatchEvent(new CustomEvent('api:error', { detail: result }));
        return result;
    };

    const fetchMenu = () => request(ENDPOINTS.menu);
    const placeOrder = (payload) => request(ENDPOINTS.orders, { method: 'POST', body: JSON.stringify(payload) });
    const fetchOrdersByPhone = (phone) => request(`${ENDPOINTS.orders}?phone=${encodeURIComponent(phone)}`);
    const initCustomer = async (payload) => {
        const primary = await request(ENDPOINTS.customerInit, { method: 'POST', body: JSON.stringify(payload) });
        if (primary.ok || primary.status !== 404) return primary;
        return request(ENDPOINTS.customers, { method: 'POST', body: JSON.stringify(payload) });
    };
    const syncCustomerAfterOrder = async (payload) => {
        const primary = await request(ENDPOINTS.customerInit, { method: 'POST', body: JSON.stringify(payload) });
        if (primary.ok || primary.status !== 404) return primary;
        return request(ENDPOINTS.customers, { method: 'POST', body: JSON.stringify(payload) });
    };

    return Object.freeze({ request, fetchMenu, placeOrder, fetchOrdersByPhone, initCustomer, syncCustomerAfterOrder, isServerAwake, ENDPOINTS });
})();

/* ═══════════════════════════════════
 * 3. MENU DATA
 * ═══════════════════════════════════ */
window.__SERVER_READY__ = false;
window.__BACKEND_CONNECTED__ = false;

const MenuData = (() => {
    let _isLive = false;
    let categories = {};

    const _filterActive = (cats) => {
        const result = {};
        for (const [key, cat] of Object.entries(cats)) {
            const activeItems = cat.items.filter(i => i.active !== false);
            if (activeItems.length) result[key] = { ...cat, items: activeItems };
        }
        return result;
    };

    const entries = () => Object.entries(categories);
    const allItems = () => Object.values(categories).flatMap(c => c.items);
    const findById = (id) => allItems().find(i => i._id === String(id));
    const _groupPriority = ['momos-steam', 'momos-fried', 'momos-gravy', 'momos-kurkure', 'momos', 'rolls', 'fried', 'pizza', 'burgers', 'pasta', 'drinks', 'beverages', 'desserts'];
    const keys = () => Object.keys(categories).sort((a, b) => {
        const ai = _groupPriority.indexOf(a);
        const bi = _groupPriority.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
    const get = (key) => categories[key];

    const load = (data) => {
        Object.keys(categories).forEach(k => delete categories[k]);
        const active = _filterActive(data);
        for (const [key, cat] of Object.entries(active)) categories[key] = cat;
    };

    const _normalizePrices = (raw) => {
        if (!raw) return [];
        if (typeof raw === 'number') return [{ label: 'Regular', value: raw }];
        if (!Array.isArray(raw)) return [];
        return raw.map(p => {
            if (typeof p === 'number') return { label: 'Regular', value: p };
            return { label: String(p.label || p.size || 'Regular'), value: Number(p.value ?? p.price ?? 0) };
        }).filter(p => Number.isFinite(p.value));
    };

    const _normalizeItem = (serverItem) => {
        return {
            _id: String(serverItem._id || serverItem.id || ''),
            name: String(serverItem.name || ''),
            desc: String(serverItem.desc || serverItem.description || ''),
            group: String(serverItem.group || serverItem.type || serverItem.itemType || '').trim(),
            icon: String(serverItem.icon || serverItem.emoji || '').trim(),
            special: !!serverItem.special,
            active: serverItem.active !== false,
            prices: _normalizePrices(serverItem.prices || serverItem.sizes || serverItem.price),
        };
    };

    const _slugifyKey = (value, fallback = 'other') => {
        const source = String(value || '').toLowerCase().trim();
        const normalized = source.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return normalized || fallback;
    };

    const _titleCase = (value) => String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()).trim();

    const _groupIconFromKey = (key) => {
        const map = {
            'momos-steam': '🥟',
            'momos-fried': '🍤',
            'momos-gravy': '🍲',
            'momos-kurkure': '🌶️',
            momos: '🥟',
            rolls: '🌯',
            pizza: '🍕',
            fried: '🍟',
            drinks: '🥤',
            beverages: '🥤',
            desserts: '🍰',
            starter: '🥗',
            starters: '🥗',
            burger: '🍔',
            burgers: '🍔',
            pasta: '🍝',
        };
        return map[key] || '🍽️';
    };

    const _inferGroupFromName = (name) => {
        const n = String(name || '').toLowerCase();
        if (!n) return '';
        // Special-case: fried rice items should be main-course, not momos
        if (/fried\s+rice|schezwan\s+rice|veg\s+fried\s+rice|egg\s+fried\s+rice|fried-rice/.test(n)) return 'main-course';
        // Split momos into subcategories based on common keywords
        if (/steam\b|steamed|steaming/.test(n)) return 'momos-steam';
        if (/fried|crispy|deep[- ]?fried|pan[- ]?fried|crunchy/.test(n)) return 'momos-fried';
        if (/gravy|soup|curry/.test(n)) return 'momos-gravy';
        if (/kurkure|kurkuri|kurkure-style/.test(n)) return 'momos-kurkure';
        if (/momo|dumpling/.test(n)) return 'momos';
        if (/roll|wrap/.test(n)) return 'rolls';
        if (/pizza/.test(n)) return 'pizza';
        if (/frie|fried|spring roll|pakora|nugget/.test(n)) return 'fried';
        if (/cola|soda|juice|shake|tea|coffee|drink|mojito/.test(n)) return 'drinks';
        if (/cake|brownie|dessert|ice cream|gulab/.test(n)) return 'desserts';
        if (/burger/.test(n)) return 'burgers';
        if (/pasta|spaghetti|noodle/.test(n)) return 'pasta';
        return '';
    };

    const normalizeMenuFromServer = (serverData) => {
        if (!serverData) return {};
        let flatItems = [];

        if (Array.isArray(serverData)) {
            flatItems = serverData;
        } else if (typeof serverData === 'object') {
            const root = serverData.categories || serverData.menu || serverData;
            if (Array.isArray(root)) {
                flatItems = root;
            } else if (typeof root === 'object') {
                for (const [key, cat] of Object.entries(root)) {
                    if (!cat) continue;
                    const catItems = Array.isArray(cat.items)
                        ? cat.items
                        : (Array.isArray(cat.products) ? cat.products : []);
                    if (!catItems.length) continue;
                    const categoryKey = _slugifyKey(cat.slug || cat.key || key, key);
                    const categoryTitle = String(cat.title || cat.name || key).trim();
                    const categoryIcon = String(cat.icon || '🍽️');
                    for (const item of catItems) {
                        flatItems.push({
                            ...item,
                            category: item.category || categoryTitle || key,
                            categoryKey: item.categoryKey || categoryKey,
                            categoryTitle,
                            categoryIcon,
                        });
                    }
                }
            }
        }

        if (!flatItems.length) return {};

        const buckets = {};
        for (const raw of flatItems) {
            if (raw.active === false) continue;
            const item = _normalizeItem(raw);
            if (item.active === false || !item._id || !item.name) continue;
            const explicitGroup = raw.group || raw.itemGroup || raw.type || raw.itemType;
            const groupSource = explicitGroup || raw.categoryKey || raw.categoryTitle || raw.category || 'other';
            let key = _slugifyKey(groupSource, 'other');
            const genericBuckets = new Set(['special', 'chilli', 'spicy', 'menu', 'items', 'other']);
            if (!explicitGroup || genericBuckets.has(key)) {
                const inferred = _inferGroupFromName(raw.name || item.name);
                if (inferred) key = inferred;
            }
            if (!buckets[key]) buckets[key] = { title: '', icon: '', items: [] };
            const titleCandidate = raw.groupTitle || raw.group || raw.itemGroup || raw.type || raw.itemType || raw.categoryTitle || raw.category;
            const titleCandidateKey = _slugifyKey(titleCandidate || '', '');
            const shouldUseTitleCandidate = !!explicitGroup || (titleCandidateKey && !genericBuckets.has(titleCandidateKey));
            if (!buckets[key].title && titleCandidate && shouldUseTitleCandidate) {
                buckets[key].title = _titleCase(String(titleCandidate));
            }
            const iconCandidate = raw.groupIcon || raw.icon || raw.emoji || raw.categoryIcon;
            if (!buckets[key].icon) {
                buckets[key].icon = String(iconCandidate || _groupIconFromKey(key));
            }
            item.group = key;
            if (item.icon && !buckets[key].icon) buckets[key].icon = item.icon;
            buckets[key].items.push(item);
        }

        const result = {};
        for (const [key, bucket] of Object.entries(buckets)) {
            result[key] = {
                title: bucket.title || _titleCase(key),
                icon: bucket.icon || _groupIconFromKey(key),
                items: bucket.items,
            };
        }
        return result;
    };

    const setLiveData = (liveCats) => {
        const changedIds = [];
        const filtered = _filterActive(liveCats);

        for (const [key, liveCat] of Object.entries(filtered)) {
            if (!categories[key]) {
                categories[key] = { title: liveCat.title || key, icon: liveCat.icon || '🍽️', items: liveCat.items.map(i => ({ ...i })) };
                liveCat.items.forEach(i => changedIds.push(i._id));
                continue;
            }
            const currentCat = categories[key];
            if (liveCat.title) currentCat.title = liveCat.title;
            if (liveCat.icon && liveCat.icon !== '🍽️') currentCat.icon = liveCat.icon;

            const currentMap = new Map(currentCat.items.map(i => [i._id, i]));
            for (const liveItem of liveCat.items) {
                const existing = currentMap.get(liveItem._id);
                if (!existing) { currentCat.items.push({ ...liveItem }); changedIds.push(liveItem._id); continue; }
                let changed = false;
                for (const prop of ['name', 'desc', 'special', 'active']) { if (existing[prop] !== liveItem[prop]) { existing[prop] = liveItem[prop]; changed = true; } }
                if (JSON.stringify(existing.prices) !== JSON.stringify(liveItem.prices)) { existing.prices = liveItem.prices.map(p => ({ ...p })); changed = true; }
                if (changed) changedIds.push(existing._id);
            }
            const liveIds = new Set(liveCat.items.map(i => i._id));
            currentCat.items.filter(i => !liveIds.has(i._id)).forEach(i => changedIds.push(i._id));
            currentCat.items = currentCat.items.filter(i => liveIds.has(i._id));
        }
        for (const key of Object.keys(categories)) {
            if (!filtered[key]) { categories[key].items.forEach(i => changedIds.push(i._id)); delete categories[key]; }
        }
        _isLive = true;
        window.__SERVER_READY__ = true;
        return changedIds;
    };

    const CACHE_KEY = RestaurantConfig.storageKey('menu_cache');
    const CACHE_TIME_KEY = RestaurantConfig.storageKey('menu_cache_time');
    const FIVE_MIN = 5 * 60 * 1000;

    const _getCached = () => { try { const raw = localStorage.getItem(CACHE_KEY); const ts = localStorage.getItem(CACHE_TIME_KEY); if (raw && ts && (Date.now() - parseInt(ts, 10) < FIVE_MIN)) return JSON.parse(raw); } catch {} return null; };
    const _setCache = (data) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); localStorage.setItem(CACHE_TIME_KEY, Date.now().toString()); } catch {} };
    const clearCache = () => { localStorage.removeItem(CACHE_KEY); localStorage.removeItem(CACHE_TIME_KEY); };

    const connectLive = async () => {
        const cached = _getCached();
        if (cached && Object.keys(cached).length) {
            const changedIds = setLiveData(cached);
            return { live: true, changedIds, cached: true };
        }
        if (typeof Api === 'undefined') return { live: false, error: 'Api not loaded' };
        try {
            const res = await Api.fetchMenu();
            const isSuccess = res?.success ?? res?.ok;
            if (!isSuccess || !res.data) return { live: false, error: res.error || 'No data' };
            const cats = normalizeMenuFromServer(res.data);
            if (!cats || !Object.keys(cats).length) return { live: false, error: 'Empty menu' };
            _setCache(cats);
            const changedIds = setLiveData(cats);
            window.__BACKEND_CONNECTED__ = true;
            return { live: true, changedIds };
        } catch (err) {
            return { live: false, error: err.message || 'Network error' };
        }
    };

    const isLive = () => _isLive;
    return Object.freeze({ entries, allItems, findById, keys, get, load, connectLive, setLiveData, normalizeMenuFromServer, isLive, clearCache });
})();

/* ═══════════════════════════════════
 * 4. CART
 * ═══════════════════════════════════ */
const Cart = (() => {
    const _items = {};
    const _key = (id, size) => `${id}-${size}`;
    const _emit = () => { document.dispatchEvent(new CustomEvent('cart:changed', { detail: snapshot() })); };

    const add = (itemId, size, price) => {
        const item = MenuData.findById(itemId);
        if (!item) return;
        const key = _key(itemId, size);
        if (_items[key]) _items[key].quantity += 1;
        else _items[key] = { itemId: String(itemId), name: item.name, size, price, quantity: 1 };
        _emit();
    };
    const update = (itemId, size, price, delta) => { const key = _key(itemId, size); if (!_items[key]) { if (delta > 0) add(itemId, size, price); return; } _items[key].quantity += delta; if (_items[key].quantity <= 0) delete _items[key]; _emit(); };
    const remove = (itemId, size) => { delete _items[_key(itemId, size)]; _emit(); };
    const clear = () => { Object.keys(_items).forEach(k => delete _items[k]); _emit(); };
    const qty = (itemId, size) => _items[_key(itemId, size)]?.quantity || 0;
    const count = () => Object.values(_items).reduce((s, i) => s + i.quantity, 0);
    const total = () => Object.values(_items).reduce((s, i) => s + i.price * i.quantity, 0);
    const snapshot = () => Object.values(_items).map(i => ({ ...i }));

    const generateOrderId = () => (RestaurantConfig.slug || 'MN').slice(0, 3).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-6);

    const formatTimestamp = () => {
        const d = new Date();
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const h = d.getHours(), hr = h % 12 || 12, ap = h >= 12 ? 'PM' : 'AM';
        return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}, ${hr}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
    };

    const buildCheckoutMessage = (info, overrides = {}) => {
        const items = snapshot(); if (!items.length) return null;
        const orderId = overrides.orderId || generateOrderId();
        const orderTotal = overrides.total != null ? overrides.total : total();
        let msg = `🛒 *New Order — ${RestaurantConfig.slug}*\n🧾 Order ID: ${orderId}\n🕒 ${formatTimestamp()}\n\n👤 Customer: ${info.name}\n📞 Phone: ${info.phone}\n📦 Order Type: ${info.orderType}\n`;
        if (info.orderType === 'Dine-In') { if (info.persons) msg += `👥 Persons: ${info.persons}\n`; if (info.table) msg += `🪑 Table: ${info.table}\n`; }
        if (info.note) msg += `📝 Note: ${info.note}\n`;
        msg += `\n━━━━━━━━━━━━━━━━━━\n`;
        items.forEach(i => { msg += `• ${i.name}\n  ${i.size} × ${i.quantity}\n  ₹${i.price * i.quantity}\n\n`; });
        msg += `━━━━━━━━━━━━━━━━━━\n💰 *Total: ₹${orderTotal}*`;
        return `https://wa.me/${window.__RESTAURANT_PHONE__ || ''}?text=${encodeURIComponent(msg)}`;
    };

    const _mapOrderType = (type) => { if (type === 'Dine-In') return 'DINE_IN'; if (type === 'Takeaway') return 'TAKEAWAY'; return type; };

    const submitOrder = async (info) => {
        const items = snapshot(); if (!items.length) return { ok: false, error: 'Cart is empty', source: 'none' };
        const payload = { customerName: info.name, phone: info.phone, orderType: _mapOrderType(info.orderType), items: items.map(i => ({ itemId: i.itemId, size: i.size, quantity: i.quantity })) };
        if (info.orderType === 'Dine-In') { if (info.persons) payload.persons = Number(info.persons); if (info.table) payload.tableNumber = info.table; }
        if (info.note) payload.note = info.note;

        try {
            const res = await Api.placeOrder(payload);
            const isSuccess = res?.success ?? res?.ok;
            if (isSuccess && res.data) {
                window.__BACKEND_CONNECTED__ = true;
                const d = res.data;
                return { ok: true, orderId: d.orderId || d._id || generateOrderId(), _id: d._id || null, total: d.total != null ? d.total : total(), source: 'server' };
            }
        } catch (err) { console.warn('[Cart] API order failed:', err.message); }
        window.__BACKEND_CONNECTED__ = false;
        return { ok: false, error: 'Server temporarily unavailable', source: 'server-down' };
    };

    const sendViaWhatsApp = (info) => { const orderId = generateOrderId(); const orderTotal = total(); return { url: buildCheckoutMessage(info, { orderId, total: orderTotal }), orderId, total: orderTotal }; };

    return Object.freeze({ add, update, remove, clear, qty, count, total, snapshot, buildCheckoutMessage, submitOrder, sendViaWhatsApp });
})();

/* ═══════════════════════════════════
 * 5. CUSTOMER
 * ═══════════════════════════════════ */
const Customer = (() => {
    const _sk = (key) => RestaurantConfig.storageKey(key);
    const STORAGE_KEY = _sk('user');
    const NAME_KEY = _sk('customer_name');
    const PHONE_KEY = _sk('customer_phone');
    const THEME_KEY = _sk('theme');
    const ORDERS_KEY = _sk('orders');
    const POINTS_PER_100 = 10;

    const _load = () => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } };
    const _save = (profile) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch {} };

    const _defaultProfile = (name, phone) => ({ name: name || '', phone: phone || '', totalOrders: 0, totalSpent: 0, loyaltyPoints: 0, lastOrder: null, createdAt: new Date().toISOString() });

    const getProfile = () => _load();
    const exists = () => !!_load();

    const recordOrder = (info, orderTotal, cartItems) => {
        let profile = _load() || _defaultProfile(info.name, info.phone);
        profile.name = info.name || profile.name;
        profile.phone = info.phone || profile.phone;
        profile.totalOrders = (profile.totalOrders || 0) + 1;
        profile.totalSpent = (profile.totalSpent || 0) + (orderTotal || 0);
        const earnedPoints = Math.floor((orderTotal || 0) / 100) * POINTS_PER_100;
        profile.loyaltyPoints = (profile.loyaltyPoints || 0) + earnedPoints;
        profile.lastOrder = { items: (cartItems || []).map(i => ({ itemId: i.itemId, name: i.name, size: i.size, price: i.price, quantity: i.quantity })), total: orderTotal, date: new Date().toISOString() };
        profile.updatedAt = new Date().toISOString();
        _save(profile);
        document.dispatchEvent(new CustomEvent('customer:updated', { detail: profile }));
        return { profile, earnedPoints };
    };

    const getLastOrder = () => { const p = _load(); return p?.lastOrder?.items || null; };
    const repeatLastOrder = () => { const items = getLastOrder(); if (!items?.length) return false; Cart.clear(); items.forEach(i => { for (let q = 0; q < i.quantity; q++) Cart.add(i.itemId || i.id, i.size, i.price); }); return true; };
    const getLoyaltyData = () => { const p = _load(); if (!p) return null; return { name: p.name, points: p.loyaltyPoints || 0, orders: p.totalOrders || 0, totalSpent: p.totalSpent || 0 }; };
    const clear = () => { localStorage.removeItem(STORAGE_KEY); document.dispatchEvent(new CustomEvent('customer:updated', { detail: null })); };
    const getName = () => localStorage.getItem(NAME_KEY) || '';
    const setName = (name) => { const t = (name || '').trim(); if (t) { localStorage.setItem(NAME_KEY, t); const p = _load(); if (p) { p.name = t; _save(p); } } };
    const hasName = () => !!localStorage.getItem(NAME_KEY);
    const getPhone = () => localStorage.getItem(PHONE_KEY) || '';
    const setPhone = (phone) => { const t = (phone || '').trim(); if (t) { localStorage.setItem(PHONE_KEY, t); const p = _load(); if (p) { p.phone = t; _save(p); } } };
    const hasPhone = () => !!localStorage.getItem(PHONE_KEY);
    const getTheme = () => localStorage.getItem(THEME_KEY) || 'light';
    const setTheme = (theme) => { localStorage.setItem(THEME_KEY, theme); document.documentElement.setAttribute('data-theme', theme); };

    const _loadOrders = () => { try { const raw = localStorage.getItem(ORDERS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } };
    const _saveOrders = (orders) => { try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch {} };

    const saveOrder = (order) => {
        const orders = _loadOrders();
        const idx = orders.findIndex(o => o.orderId === order.orderId);
        if (idx >= 0) orders[idx] = { ...orders[idx], ...order }; else orders.unshift(order);
        if (orders.length > 20) orders.length = 20;
        _saveOrders(orders);
        document.dispatchEvent(new CustomEvent('orders:updated'));
    };
    const updateOrderStatus = (orderId, status) => {
        const orders = _loadOrders();
        const order = orders.find(o => o.orderId === orderId) || orders.find(o => o._id === orderId);
        if (order) { order.status = status; order.updatedAt = new Date().toISOString(); _saveOrders(orders); document.dispatchEvent(new CustomEvent('orders:updated')); }
    };
    const getOrders = () => _loadOrders();
    const getOrder = (id) => _loadOrders().find(o => o.orderId === id || o._id === id) || null;
    const removeOrder = (id) => { const orders = _loadOrders().filter(o => o.orderId !== id && o._id !== id); _saveOrders(orders); document.dispatchEvent(new CustomEvent('orders:updated')); };
    const hasActiveOrders = () => _loadOrders().some(o => o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'READY');

    return Object.freeze({ getProfile, exists, recordOrder, getLastOrder, repeatLastOrder, getLoyaltyData, clear, getName, setName, hasName, getPhone, setPhone, hasPhone, getTheme, setTheme, saveOrder, updateOrderStatus, getOrders, getOrder, removeOrder, hasActiveOrders });
})();

/* ═══════════════════════════════════
 * 6. UI
 * ═══════════════════════════════════ */
const UI = (() => {
    const $ = (s, ctx = document) => ctx.querySelector(s);
    const $$ = (s, ctx = document) => ctx.querySelectorAll(s);

    const _prevQty = new Map();
    let _lastCartCount = 0;
    let _checkoutStep = 'cart';
    let _customerInfo = {};

    const _safePrices = (item) => {
        if (Array.isArray(item?.prices) && item.prices.length) return item.prices;
        return [{ label: 'Regular', value: 0 }];
    };
    const _firstPriceValue = (item) => Number(_safePrices(item)[0]?.value || 0);
    const _esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

    const renderStats = () => {
        const items = MenuData.allItems();
        const specials = items.filter(i => i.special).length;
        const avg = items.length ? Math.round(items.reduce((s, i) => s + _firstPriceValue(i), 0) / items.length) : 0;
        const totalEl = $('#stat-total'), specialsEl = $('#stat-specials'), avgEl = $('#stat-avg');
        if (totalEl) totalEl.textContent = items.length;
        if (specialsEl) specialsEl.textContent = specials;
        if (avgEl) avgEl.textContent = `₹${avg}`;

        const indicator = $('#liveIndicator');
        if (indicator && typeof MenuData.isLive === 'function') {
            if (MenuData.isLive()) { indicator.innerHTML = '<span class="live-dot"></span> Live'; indicator.classList.add('live-indicator--on'); indicator.classList.remove('live-indicator--off'); }
            else { indicator.innerHTML = '<span class="live-dot"></span> Offline'; indicator.classList.remove('live-indicator--on'); indicator.classList.add('live-indicator--off'); }
        }
    };

    /* ── Dynamic category tabs ── */
    const renderCategoryTabs = () => {
        const tabsEl = $('#menuTabs');
        if (!tabsEl) return;
        const catKeys = MenuData.keys();
        let html = '<button class="tab active" data-category="all" role="tab" aria-selected="true">All</button>';
        catKeys.forEach(key => {
            const cat = MenuData.get(key);
            if (cat) html += `<button class="tab" data-category="${key}" role="tab" aria-selected="false">${cat.icon || '🍽️'} ${cat.title}</button>`;
        });
        html += '<span class="tab-indicator" aria-hidden="true"></span>';
        tabsEl.innerHTML = html;
    };

    const showSkeleton = () => {
        const container = $('#menuContainer');
        container.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton-section"><div class="skeleton skeleton--header"></div><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div></div>').join('');
    };

    const _matchSearch = (item, query) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return String(item.name || '').toLowerCase().includes(q) || String(item.desc || '').toLowerCase().includes(q);
    };
    const _matchFilter = (item, filter) => {
        const price = _firstPriceValue(item);
        if (filter === 'special') return !!item.special;
        if (filter === 'under50') return price < 50;
        if (filter === 'under100') return price < 100;
        return true;
    };

    const _cartButton = (item, label, value) => {
        const q = Cart.qty(item._id, label);
        if (q === 0) {
            return `<div class="card-corner-action cart-ctrl cart-ctrl--fab"><button class="card-add-fab" data-action="cart-add" data-id="${item._id}" data-size="${label}" data-price="${value}" aria-label="Add ${_esc(item.name || 'item')}">➕</button></div>`;
        }
        return `<div class="card-corner-action cart-ctrl cart-ctrl--fab"><div class="card-qty-fab"><button class="card-qty-btn" data-action="cart-dec" data-id="${item._id}" data-size="${label}" data-price="${value}" aria-label="Decrease">−</button><span class="card-qty-val" aria-live="polite">${q}</span><button class="card-qty-btn" data-action="cart-inc" data-id="${item._id}" data-size="${label}" data-price="${value}" aria-label="Increase">+</button></div></div>`;
    };

    const _getItemEmoji = (item, categoryKey) => {
        if (item.icon) return _esc(item.icon);
        if (item.emoji) return _esc(item.emoji);
        const emojiMap = {
            'momos': '🥟', 'rolls': '🌯', 'fried': '🍟',
            'drinks': '🥤', 'beverages': '🥤',
            'starters': '🥗', 'appetizers': '🥟', 'starter': '🥗',
            'main-course': '🍕', 'mains': '🍽️', 'main': '🍕', 'pizza': '🍕', 
            'pasta': '🍝', 'burger': '🍔', 'burgers': '🍔',
            'beverage': '🥤',
            'desserts': '🍰', 'dessert': '🧁', 'sweets': '🍩',
            'snacks': '🍿', 'sides': '🍟'
        };
        return emojiMap[categoryKey?.toLowerCase()] || '🍽️';
    };

    const _getItemBadge = (item) => {
        // Identify popular items by name patterns or special flag
        const name = (item.name || '').toLowerCase();
        const isPopular = item.popular || name.includes('paneer') || name.includes('chicken') || name.includes('special');
        const isBestseller = item.bestseller || item.best_seller;
        
        if (isBestseller) return '<span class="badge-bestseller">⭐ Bestseller</span>';
        if (isPopular) return '<span class="badge-popular">🔥 Popular</span>';
        return '';
    };

    const _renderPriceOptions = (item, prices) => {
        if (!prices.length) return '';
        return `<div class="card__prices price-options">${prices.map((p) => {
            const sizeLabel = _esc(p.label || 'Regular');
            const price = Number(p.value) || 0;
            const q = Cart.qty(item._id, p.label || 'Regular');
            let cartBtn;
            if (q === 0) {
                cartBtn = `<div class="cart-ctrl cart-ctrl--empty"><button class="add-btn" data-action="cart-add" data-id="${item._id}" data-size="${sizeLabel}" data-price="${price}" aria-label="Add ${_esc(item.name || 'item')} ${sizeLabel}">+ Add</button></div>`;
            } else {
                cartBtn = `<div class="cart-ctrl cart-ctrl--qty"><div class="qty-ctrl"><button class="qty-btn" data-action="cart-dec" data-id="${item._id}" data-size="${sizeLabel}" data-price="${price}" aria-label="Decrease">−</button><span class="qty-val" aria-live="polite">${q}</span><button class="qty-btn" data-action="cart-inc" data-id="${item._id}" data-size="${sizeLabel}" data-price="${price}" aria-label="Increase">+</button></div></div>`;
            }
            return `<div class="price-col price-card"><span class="price-label">${sizeLabel}</span><span class="price-val">₹${price}</span>${cartBtn}</div>`;
        }).join('')}</div>`;
    };

    let _sectionObserver = null;
    const _revealSections = () => {
        const sections = $$('.menu-reveal');
        if (!sections.length) return;
        if (_sectionObserver) _sectionObserver.disconnect();
        if (!('IntersectionObserver' in window)) {
            sections.forEach((section) => section.classList.add('is-visible'));
            return;
        }
        _sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        sections.forEach((section) => _sectionObserver.observe(section));
    };

    /* ── Category Grouping Utilities ── */
    const groupItemsByCategory = (items) => {
        const groups = {};
        items.forEach(item => {
            let cat = item.category || item.group || 'Others';
            cat = cat.trim().toLowerCase();
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return groups;
    };

    const formatCategoryName = (cat) => {
        const map = {
            'momos-steam': '🥟 Steam Momos',
            'momos-fried': '🍤 Fried Momos',
            'momos-gravy': '🍲 Gravy Momos',
            'momos-kurkure': '🌶️ Kurkure Momos',
            momos: '🥟 Momos',
            steam: '🥟 Steam Momos',
            fried: '🍤 Fried Momos',
            rolls: '🌯 Rolls',
            snacks: '🍟 Snacks',
            pizza: '🍕 Pizza',
            burgers: '🍔 Burgers',
            burger: '🍔 Burgers',
            pasta: '🍝 Pasta',
            drinks: '🥤 Drinks',
            beverages: '🥤 Beverages',
            desserts: '🍰 Desserts',
            dessert: '🍰 Desserts',
            starters: '🥗 Starters',
            starter: '🥗 Starters',
            special: '🔥 Specials',
            specials: '🔥 Specials'
        };
        const key = String(cat || '').toLowerCase().trim();
        if (map[key]) return map[key];
        // Capitalize first letter of each word
        return cat.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    /* ── Category Collapse/Expand ── */
    const _initCategoryCollapse = () => {
        const sections = $$('.cat-section[data-category]');
        
        // First category expanded, rest collapsed
        sections.forEach((section, index) => {
            const grid = section.querySelector('.category-grid');
            if (index === 0) {
                // First category: expanded
                section.classList.remove('category-collapsed');
                grid.style.maxHeight = 'none';
            } else {
                // All others: collapsed
                section.classList.add('category-collapsed');
                grid.style.maxHeight = '0';
            }
        });
        
        const headers = $$('[data-toggle="category"]');
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const section = header.closest('.cat-section');
                const grid = section.querySelector('.category-grid');
                
                if (section.classList.contains('category-collapsed')) {
                    // Expand this one, collapse all others (accordion behavior)
                    sections.forEach(otherSection => {
                        if (otherSection === section) return;
                        const otherGrid = otherSection.querySelector('.category-grid');
                        if (!otherSection.classList.contains('category-collapsed')) {
                            if (otherGrid) {
                                otherGrid.style.maxHeight = otherGrid.scrollHeight + 'px';
                                requestAnimationFrame(() => {
                                    otherSection.classList.add('category-collapsed');
                                    otherGrid.style.maxHeight = '0';
                                });
                            } else {
                                otherSection.classList.add('category-collapsed');
                            }
                        }
                    });

                    section.classList.remove('category-collapsed');
                    grid.style.maxHeight = grid.scrollHeight + 'px';
                    setTimeout(() => { grid.style.maxHeight = 'none'; }, 350);
                } else {
                    // Collapse
                    grid.style.maxHeight = grid.scrollHeight + 'px';
                    requestAnimationFrame(() => {
                        section.classList.add('category-collapsed');
                        grid.style.maxHeight = '0';
                    });
                }
            });
        });
    };

    /* ── Scroll Spy for Auto Category Highlight ── */
    let _scrollSpyObserver = null;
    const _initScrollSpy = () => {
        if (_scrollSpyObserver) _scrollSpyObserver.disconnect();
        
        const sections = $$('.cat-section[data-category]');
        if (!sections.length) return;
        
        if (!('IntersectionObserver' in window)) return;
        
        _scrollSpyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const categoryKey = entry.target.dataset.category;
                    if (categoryKey && State.get('category') === 'all') {
                        // Only auto-highlight if in 'all' view
                        const tab = document.querySelector(`.tab[data-category="${categoryKey}"]`);
                        if (tab && !tab.classList.contains('active')) {
                            setActiveTab(categoryKey);
                            updateTabIndicator(tab);
                            // Scroll tab into view smoothly
                            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }
                    }
                }
            });
        }, { 
            threshold: 0.3,
            rootMargin: '-100px 0px -60% 0px' // Trigger when section is near top
        });
        
        sections.forEach(section => _scrollSpyObserver.observe(section));
    };

    const renderMenu = () => {
        const container = $('#menuContainer');
        const category = State.get('category'), search = State.get('search'), filter = State.get('filter');
        const cats = category === 'all' ? MenuData.keys() : [category];
        let html = '';
        if (filter === 'special') html += '<div class="special-ribbon" role="status">Today\'s Specials</div>';

        cats.forEach(key => {
            const cat = MenuData.get(key);
            if (!cat) return;
            const visible = cat.items.filter(i => _matchSearch(i, search)).filter(i => _matchFilter(i, filter));
            if (!visible.length) return;
            
            // Use formatCategoryName for cleaner display
            const displayTitle = formatCategoryName(cat.title || key);
            const displayIcon = cat.icon || '🍽️';
            
            html += `<section class="cat-section menu-reveal menu-category" data-category="${key}" aria-label="${_esc(displayTitle)}"><div class="cat-head category-header" data-toggle="category" data-key="${key}"><span class="cat-icon">${_esc(displayIcon)}</span><h2 class="cat-title">${_esc(displayTitle)}<span class="cat-count">${visible.length}</span></h2><span class="category-arrow">▼</span></div><div class="menu-grid category-grid">${visible.map((item, i) => {
                const prices = _safePrices(item);
                const emoji = _getItemEmoji(item, key);
                const badge = _getItemBadge(item);
                // Older MenuNova-style card: emoji-left, name, desc, price chips or single price with footer
                const primaryPrice = Number(prices[0]?.value || 0);
                const multiplePrices = prices.length > 1;
                const emojiMarkup = `<span class="card__emoji" aria-hidden="true">${_esc(_getItemEmoji(item, key))}</span>`;

                let priceSection = '';
                if (multiplePrices) {
                    priceSection = `<div class="price-chip-list">${prices.map(p => {
                        const sizeLabel = _esc(p.label || 'Regular');
                        const price = Number(p.value) || 0;
                        return `<button class="price-chip" data-action="cart-add" data-id="${item._id}" data-size="${sizeLabel}" data-price="${price}"><span class="price-chip__value">₹${price}</span><span class="price-chip__label">${sizeLabel}</span></button>`;
                    }).join('')}</div>`;
                } else {
                    priceSection = `<div class="card__footer card__footer--action"><div><span class="card__price-simple">₹${primaryPrice}</span></div><div class="cart-ctrl">${Cart.qty(item._id, prices[0]?.label || 'Regular') === 0 ? `<button class="card__add-btn" data-action="cart-add" data-id="${item._id}" data-size="${_esc(prices[0]?.label || 'Regular')}" data-price="${primaryPrice}">+ Add</button>` : `<div class="card-qty-fab"><button class="card-qty-btn" data-action="cart-dec" data-id="${item._id}" data-size="${_esc(prices[0]?.label || 'Regular')}" data-price="${primaryPrice}">−</button><span class="card-qty-val">${Cart.qty(item._id, prices[0]?.label || 'Regular')}</span><button class="card-qty-btn" data-action="cart-inc" data-id="${item._id}" data-size="${_esc(prices[0]?.label || 'Regular')}" data-price="${primaryPrice}">+</button></div>`}</div></div>`;
                }

                return `
                <article class="card menu-card${item.special ? ' card--special' : ''}" tabindex="0" role="button" aria-label="Add ${_esc(item.name || 'item')} (${_esc(prices[0]?.label || 'Regular')})" data-item-id="${item._id}" data-item-price="${primaryPrice}" data-item-size="${_esc(prices[0]?.label || 'Regular')}" style="--stagger:${i * 70}ms">
                    ${badge}
                    <div class="card__head">
                        ${emojiMarkup}
                        <span class="card__name">${_esc(item.name || 'Item')}</span>
                        ${item.special ? '<span class="badge-special">★ Special</span>' : ''}
                    </div>
                    ${item.desc ? `<p class="card__desc">${_esc(item.desc)}</p>` : ''}
                    ${priceSection}
                    <div class="card__affordance">Tap to add</div>
                </article>`;
            }).join('')}</div></section>`;
        });

        if (!html) html = '<div class="empty-state" role="status"><span class="empty-state__icon">🔍</span><p class="empty-state__text">No items found</p><p class="empty-state__hint">Try a different search or filter</p></div>';

        const prevHeight = container.offsetHeight;
        if (prevHeight) container.style.minHeight = `${prevHeight}px`;
        container.classList.remove('menu-fade-in'); container.classList.add('menu-fade-out');
        requestAnimationFrame(() => {
            container.innerHTML = html;
            _revealSections();
            _initCategoryCollapse();
            _initScrollSpy();
            container.classList.remove('menu-fade-out'); container.classList.add('menu-fade-in');
            requestAnimationFrame(() => { container.style.minHeight = ''; window.setTimeout(() => container.classList.remove('menu-fade-in'), 220); });
        });
    };

    const renderCartBadge = () => { const badge = $('#cartBadge'); const c = Cart.count(); badge.textContent = c; badge.style.display = c > 0 ? 'flex' : 'none'; if (c > _lastCartCount) { badge.classList.remove('badge-pop'); void badge.offsetWidth; badge.classList.add('badge-pop'); } _lastCartCount = c; };

    const _renderSuggestions = () => {
        const cartIds = new Set(Cart.snapshot().map(i => i.itemId));
        const available = MenuData.allItems().filter(i => !cartIds.has(i._id));
        if (!available.length) return '';
        const picks = available.sort(() => Math.random() - 0.5).slice(0, 2);
        return `<div class="cart-suggestions"><p class="cart-suggestions__title">You may also like</p><div class="cart-suggestions__list">${picks.map(item => {
            const p = _safePrices(item)[0];
            return `<div class="suggest-card"><div class="suggest-card__info"><span class="suggest-card__name">${_esc(item.name || 'Item')}</span><span class="suggest-card__price">₹${Number(p.value) || 0}</span></div><button class="suggest-card__add" data-action="suggest-add" data-id="${item._id}" data-size="${_esc(p.label || 'Regular')}" data-price="${Number(p.value) || 0}">+ Add</button></div>`;
        }).join('')}</div></div>`;
    };

    const renderCartModal = () => {
        const listEl = $('#cartItems'), footerEl = $('#cartFooter'), titleEl = $('.cart-modal__title');

        if (_checkoutStep === 'form') { if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">📋</span> Details'; _renderCheckoutForm(listEl, footerEl); return; }
        if (_checkoutStep === 'summary') { if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">📦</span> Summary'; _renderOrderSummary(listEl, footerEl); return; }

        if (titleEl) titleEl.innerHTML = '<span class="cart-modal__title-icon">🛒</span> Your Cart';
        const items = Cart.snapshot();
        if (!items.length) {
            const hasLastOrder = Customer.getLastOrder();
            listEl.innerHTML = `<div class="empty-cart"><span class="empty-cart__icon">🛒</span><p class="empty-cart__title">Your cart is empty</p><p class="empty-cart__hint">Add items from the menu to get started</p>${hasLastOrder ? '<button class="repeat-order-btn" data-action="repeat-order">🔁 Repeat Last Order</button>' : ''}</div>`;
            footerEl.hidden = true; return;
        }

        let html = '<div class="cart-actions"><button class="clear-cart-btn" data-action="clear-cart">🗑 Clear Cart</button></div>';
        html += items.map(i => `<div class="cart-row"><div class="cart-row__info"><span class="cart-row__name">${i.name}</span><span class="cart-row__meta">${i.size}</span></div><div class="cart-row__controls"><button class="cart-row__btn" data-action="cart-modal-dec" data-id="${i.itemId}" data-size="${i.size}" data-price="${i.price}">−</button><span class="cart-row__qty">${i.quantity}</span><button class="cart-row__btn" data-action="cart-modal-inc" data-id="${i.itemId}" data-size="${i.size}" data-price="${i.price}">+</button></div><span class="cart-row__price">₹${i.price * i.quantity}</span></div>`).join('');
        html += _renderSuggestions();
        listEl.innerHTML = html;
        footerEl.hidden = false;
        footerEl.innerHTML = `<div class="cart-total"><span>Total</span><span class="cart-total__val" id="cartTotal">₹${Cart.total()}</span></div><button class="checkout-btn" id="checkoutBtn" data-action="checkout-start">🛒 Place Order</button>`;
    };

    const _renderCheckoutForm = (listEl, footerEl) => {
        const saved = Customer.getProfile();
        const lsName = localStorage.getItem(RestaurantConfig.storageKey('customer_name')) || '';
        const lsPhone = localStorage.getItem(RestaurantConfig.storageKey('customer_phone')) || '';
        const ci = { name: _customerInfo.name || saved?.name || lsName, phone: _customerInfo.phone || saved?.phone || lsPhone, orderType: _customerInfo.orderType || '', persons: _customerInfo.persons || '', table: _customerInfo.table || '', note: _customerInfo.note || '' };
        const phoneIsStored = !!lsPhone;
        listEl.innerHTML = `<div class="checkout-form"><div class="form-group"><label class="form-label" for="custName">Name *</label><input type="text" id="custName" class="form-input" placeholder="Your name" required autocomplete="name" value="${ci.name || ''}"></div><div class="form-group"><label class="form-label" for="custPhone">Phone *</label><input type="tel" id="custPhone" class="form-input${phoneIsStored ? ' readonly-phone' : ''}" placeholder="10-digit number" maxlength="10" required autocomplete="tel" value="${ci.phone || ''}"${phoneIsStored ? ' readonly' : ''}></div><div class="form-group"><label class="form-label">Order Type *</label><div class="order-type-toggle"><label class="order-type-opt${(!ci.orderType || ci.orderType === 'Dine-In') ? ' order-type-opt--active' : ''}"><input type="radio" name="orderType" value="Dine-In" ${(!ci.orderType || ci.orderType === 'Dine-In') ? 'checked' : ''}> 🍽 Dine-In</label><label class="order-type-opt${ci.orderType === 'Takeaway' ? ' order-type-opt--active' : ''}"><input type="radio" name="orderType" value="Takeaway" ${ci.orderType === 'Takeaway' ? 'checked' : ''}> 🥡 Takeaway</label></div></div><div class="form-group dine-in-fields" id="dineInFields" ${ci.orderType === 'Takeaway' ? 'hidden' : ''}><div class="form-row"><div class="form-group form-group--half"><label class="form-label" for="custPersons">Persons</label><input type="number" id="custPersons" class="form-input" placeholder="e.g. 3" min="1" max="50" value="${ci.persons || ''}"></div><div class="form-group form-group--half"><label class="form-label" for="custTable">Table No.</label><input type="text" id="custTable" class="form-input" placeholder="e.g. 4" value="${ci.table || ''}"></div></div></div><div class="form-group"><label class="form-label" for="custNote">Note (optional)</label><textarea id="custNote" class="form-input form-input--textarea" placeholder="Any special request…" rows="2">${ci.note || ''}</textarea></div></div>`;
        if (IS_DEMO) {
            const form = listEl.querySelector('.checkout-form');
            if (form) {
                const hint = document.createElement('p');
                hint.className = 'demo-checkout-note';
                hint.textContent = 'Demo mode: place a test order to see live updates. No payment and no phone verification.';
                form.prepend(hint);
            }
            const phoneInput = document.getElementById('custPhone');
            if (phoneInput && !phoneIsStored) phoneInput.placeholder = 'Enter any test 10-digit phone number';
        }
        footerEl.hidden = false;
        footerEl.innerHTML = '<div class="checkout-nav"><button class="checkout-back-btn" data-action="checkout-back">← Back</button><button class="checkout-next-btn" data-action="checkout-review">Review Order →</button></div>';
    };

    const _renderOrderSummary = (listEl, footerEl) => {
        const ci = _customerInfo; const items = Cart.snapshot();
        let html = `<div class="order-summary"><div class="order-summary__info"><div class="order-summary__row"><span>👤</span><span>${ci.name}</span></div><div class="order-summary__row"><span>📞</span><span>${ci.phone}</span></div><div class="order-summary__row"><span>📦</span><span>${ci.orderType}</span></div>`;
        if (ci.orderType === 'Dine-In') { if (ci.persons) html += `<div class="order-summary__row"><span>👥</span><span>${ci.persons} persons</span></div>`; if (ci.table) html += `<div class="order-summary__row"><span>🪑</span><span>Table ${ci.table}</span></div>`; }
        if (ci.note) html += `<div class="order-summary__row"><span>📝</span><span>${ci.note}</span></div>`;
        html += '</div><div class="order-summary__divider"></div><div class="order-summary__items">';
        items.forEach(i => { html += `<div class="order-summary__item"><div class="order-summary__item-info"><span class="order-summary__item-name">${i.name}</span><span class="order-summary__item-meta">${i.size} × ${i.quantity}</span></div><span class="order-summary__item-price">₹${i.price * i.quantity}</span></div>`; });
        html += `</div><div class="order-summary__divider"></div><div class="order-summary__total"><span>Total</span><span class="order-summary__total-val">₹${Cart.total()}</span></div></div>`;
        listEl.innerHTML = html;
        footerEl.hidden = false;
        const connected = window.__BACKEND_CONNECTED__;
        footerEl.innerHTML = `<div class="checkout-nav"><button class="checkout-back-btn" data-action="checkout-back-form">← Edit</button><button class="checkout-confirm-btn checkout-confirm-btn--primary" data-action="checkout-confirm">✅ Place Order</button>${!connected ? '<button class="checkout-confirm-btn checkout-confirm-btn--wa" data-action="checkout-wa">💬 Place Order via WhatsApp</button>' : ''}</div>${!connected ? '<p class="checkout-server-hint">⚠️ Server may be waking up — WhatsApp is available as backup</p>' : ''}`;
    };

    const setCheckoutStep = (step) => { _checkoutStep = step; renderCartModal(); };
    const getCheckoutStep = () => _checkoutStep;
    const setCustomerInfo = (info) => { _customerInfo = info; };
    const getCustomerInfo = () => ({ ..._customerInfo });

    const toggleCart = (force) => {
        const open = force !== undefined ? force : !State.get('cartOpen');
        State.set('cartOpen', open);
        $('#cartModal').classList.toggle('show', open);
        $('#modalOverlay').classList.toggle('show', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (!open && _checkoutStep !== 'cart') { _checkoutStep = 'cart'; renderCartModal(); }
        // Ensure mini-cart is not visible while the cart modal is open
        const miniCart = $('#miniCart');
        if (miniCart) {
            if (open) miniCart.classList.remove('active');
            else if (Cart.count() > 0) miniCart.classList.add('active');
        }
    };

    let _toastTimer;
    const showToast = (message) => {
        let el = $('#toast');
        if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
        clearTimeout(_toastTimer); el.textContent = message; el.classList.add('toast--visible');
        _toastTimer = setTimeout(() => el.classList.remove('toast--visible'), 2200);
    };

    const setActiveTab = (key) => { $$('.tab').forEach(t => { const active = t.dataset.category === key; t.classList.toggle('active', active); t.setAttribute('aria-selected', active); }); };
    const setActiveChip = (key) => { $$('.chip').forEach(c => { const active = c.dataset.filter === key; c.classList.toggle('active', active); c.setAttribute('aria-pressed', active); }); };

    const renderGreeting = () => {
        const bar = $('#greetingBar'); if (!bar) return;
        const name = localStorage.getItem(RestaurantConfig.storageKey('customer_name')) || '';
        if (!name) { bar.hidden = true; return; }
        bar.hidden = false;
        const hi = $('#greetingHi'), sub = $('#greetingSub'), dot = $('#orderDot');
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        if (hi) hi.textContent = `${greeting}, ${name} 👋`;
        if (sub) { const loyalty = Customer.getLoyaltyData(); const pts = loyalty?.points || 0; const orders = loyalty?.orders || 0; sub.textContent = pts > 0 ? `⭐ ${pts} pts · 🏅 ${orders} orders` : 'Ready to order something delicious?'; }
        if (dot) dot.classList.toggle('greeting__order-dot--active', Customer.hasActiveOrders());
    };

    const renderAuthButton = () => {
        const btn = $('#heroAuthBtn'); if (!btn) return;
        const name = Customer.getName();
        if (name) { const initial = name.charAt(0).toUpperCase(); btn.className = 'hero__auth hero__auth--profile'; btn.innerHTML = `<span class="hero__auth-avatar">${initial}</span>`; btn.setAttribute('aria-label', name); btn.title = name; }
        else { btn.className = 'hero__auth'; btn.innerHTML = '✏️ Sign Up'; btn.setAttribute('aria-label', 'Sign Up'); }
    };

    const renderThemeToggle = () => { const btn = $('#themeToggle'); if (!btn) return; const theme = Customer.getTheme(); btn.textContent = theme === 'dark' ? '☀️' : '🌙'; };

    const _formatOrderDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr); const now = new Date(); const diffMin = Math.floor((now - d) / 60000);
        if (diffMin < 1) return 'Just now'; if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60); if (diffHr < 24) return `${diffHr}h ago`;
        const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${d.getDate()} ${M[d.getMonth()]}, ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2,'0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
    };

    const renderOrdersPanel = () => {
        const body = $('#ordersList'); if (!body) return;
        const orders = Customer.getOrders();
        if (!orders.length) { body.innerHTML = '<div class="orders-panel__empty"><span class="orders-panel__empty-icon">📦</span><p class="orders-panel__empty-text">No orders yet</p><p class="orders-panel__empty-hint">Your order history will appear here</p></div>'; return; }

        body.innerHTML = orders.map(order => {
            const statusKey = (order.status || 'PENDING').toUpperCase();
            const isPending = statusKey === 'PENDING', isCancelled = statusKey === 'CANCELLED', isCompleted = statusKey === 'COMPLETED';
            const items = order.items || [];
            let itemsHtml = items.slice(0, 4).map(i => `<div class="order-card__item"><span class="order-card__item-name">${i.name || 'Item'}</span><span class="order-card__item-qty">${i.size ? i.size + ' × ' : ''}${i.quantity || 1}</span></div>`).join('');
            if (items.length > 4) itemsHtml += `<div class="order-card__item"><span class="order-card__item-name" style="color:var(--c-text-lighter)">+${items.length - 4} more</span></div>`;

            return `<div class="order-card${isCancelled ? ' order-card--cancelled' : ''}${isCompleted ? ' order-card--completed' : ''}" data-order-id="${order.orderId || ''}" data-id="${order._id || ''}"><div class="order-card__head"><span class="order-card__id">${order.orderId || '—'}</span><span class="order-card__date">${_formatOrderDate(order.date)}</span></div><span class="order-card__status order-status order-card__status--${statusKey.toLowerCase()}">${statusKey}</span><div class="order-card__items">${itemsHtml}</div><div class="order-card__foot"><span class="order-card__total">₹${order.total || 0}</span><div class="order-card__foot-actions">${!isCancelled ? `<button class="track-btn" onclick="openTrackModal('${order.orderId || order._id || ''}')">📍 Track</button>` : ''}${isPending ? `<button class="cancel-order" data-id="${order._id || order.orderId}">✕ Cancel</button>` : ''}${isCompleted ? `<button class="order-card__reorder" data-action="panel-reorder" data-order-id="${order.orderId}">🔁 Reorder</button>` : ''}${isCancelled ? `<button class="delete-cancelled" data-id="${order._id || order.orderId}">🗑 Delete</button>` : ''}</div></div></div>`;
        }).join('');
    };

    const toggleOrdersPanel = (force) => {
        const panel = $('#ordersPanel'), overlay = $('#ordersOverlay'); if (!panel || !overlay) return;
        const open = force !== undefined ? force : !panel.classList.contains('orders-panel--visible');
        panel.classList.toggle('orders-panel--visible', open);
        overlay.classList.toggle('orders-overlay--visible', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) renderOrdersPanel();
    };

    const updateOrderCard = (order) => {
        if (!order) return; const id = order._id; if (!id) return;
        const card = document.querySelector(`[data-id="${id}"]`); if (!card) return;
        const statusKey = (order.status || '').toUpperCase();
        const badge = card.querySelector('.order-status');
        if (badge) { badge.textContent = statusKey; badge.className = `order-card__status order-status order-card__status--${statusKey.toLowerCase()}`; }
        card.classList.add('pulse'); setTimeout(() => card.classList.remove('pulse'), 600);
    };

    return Object.freeze({ $, $$, renderStats, renderCategoryTabs, showSkeleton, renderMenu, renderCartBadge, renderCartModal, toggleCart, showToast, setActiveTab, setActiveChip, setCheckoutStep, getCheckoutStep, setCustomerInfo, getCustomerInfo, renderAuthButton, renderGreeting, renderThemeToggle, renderOrdersPanel, toggleOrdersPanel, updateOrderCard });
})();

/* ═══════════════════════════════════
 * 7. APP (BOOT)
 * ═══════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const { $, $$, renderMenu, renderStats, renderCartBadge, renderCartModal, toggleCart, showToast, setActiveTab, setActiveChip, renderCategoryTabs } = UI;

    const hero = document.querySelector('.hero');
    const tabs = $('#menuTabs');
    const tabIndicator = document.querySelector('.tab-indicator');
    const cartModal = $('#cartModal');
    const modalOverlay = $('#modalOverlay');
    let lastFocusedEl = null;

    const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

    if (IS_DEMO) {
        applyDemoBranding();
        injectDemoBadge();
        injectDemoConversionSection();
        showDemoIntroOnce();
    }

    /* ── Apply saved theme ── */
    const savedTheme = Customer.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    UI.renderThemeToggle();

    let _runtimeStarted = false;
    const _onSessionReady = () => { UI.renderGreeting(); UI.renderAuthButton(); _initCustomerSocket(); _fetchOrdersByPhone(); };

    const _resolveRestaurantName = (payload) => {
        const fromPayload = payload?.restaurantName || payload?.restaurant?.name || payload?.restaurant?.title;
        if (fromPayload) return String(fromPayload);
        const heroTitle = document.getElementById('heroTitle')?.textContent?.trim();
        return heroTitle || RestaurantConfig.slug;
    };

    const _initCustomerOnServer = async (name, phone) => {
        const response = await Api.initCustomer({ name, phone });
        if (!response?.ok) return { ok: false, error: response?.error || 'Server temporarily unavailable. Try again.' };
        const payload = response.data || {};
        return {
            ok: true,
            returning: payload.returning === true,
            customerName: payload.name || payload.customerName || name,
            restaurantName: _resolveRestaurantName(payload),
        };
    };

    /* ── Mini Cart Update ── */
    const updateMiniCart = () => {
        const miniCart = $('#miniCart');
        const miniCartItems = $('#miniCartItems');
        const miniCartTotal = $('#miniCartTotal');
        if (!miniCart || !miniCartItems || !miniCartTotal) return;
        
        const count = Cart.count();
        const total = Cart.total();
        // Always update content, but never show mini cart while cart modal is open
        miniCartItems.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
        miniCartTotal.textContent = `₹${total}`;
        if (State.get('cartOpen')) {
            miniCart.classList.remove('active');
            return;
        }
        if (count > 0) miniCart.classList.add('active'); else miniCart.classList.remove('active');
    };

    /* ── Background connect ── */
    const _connectBanner = (() => {
        const el = document.createElement('div'); el.id = 'connectBanner';
        Object.assign(el.style, { position: 'fixed', top: '0', left: '0', right: '0', zIndex: '9999', background: '#fef3c7', color: '#92400e', textAlign: 'center', padding: '6px 16px', fontSize: '13px', fontWeight: '500', transform: 'translateY(-100%)', transition: 'transform 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' });
        el.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;animation:cbPulse 1.5s infinite"></span> Connecting to live server…';
        if (!document.getElementById('cbPulseStyle')) { const s = document.createElement('style'); s.id = 'cbPulseStyle'; s.textContent = '@keyframes cbPulse{0%,100%{opacity:1}50%{opacity:.3}}'; document.head.appendChild(s); }
        document.body.appendChild(el);
        requestAnimationFrame(() => { el.style.transform = 'translateY(0)'; });
        return el;
    })();

    let _bgPingTimer = null, _isPinging = false;
    const _backgroundConnect = async () => {
        let demoSeeded = false;
        let attempts = 0;
        const tryConnect = async () => {
            if (_isPinging) return false; _isPinging = true; attempts++;
            try {
                const result = await MenuData.connectLive();
                if (result.live) {
                    window.__BACKEND_CONNECTED__ = true;
                    clearInterval(_bgPingTimer); _bgPingTimer = null;
                    _connectBanner.style.transform = 'translateY(-100%)';
                    setTimeout(() => _connectBanner.remove(), 300);
                    if (typeof hideLoader === 'function') hideLoader();
                    renderCategoryTabs(); renderStats();
                    if (result.changedIds && result.changedIds.length > 0) renderMenu();
                    renderCartModal();
                    updateMiniCart();
                    return true;
                }
                if (IS_DEMO && !demoSeeded) {
                    MenuData.setLiveData(DEMO_MENU_SEED);
                    renderCategoryTabs();
                    renderStats();
                    renderMenu();
                    renderCartModal();
                    updateMiniCart();
                    demoSeeded = true;
                }
            } catch (err) { console.log(`[live] Attempt ${attempts} failed:`, err.message); } finally { _isPinging = false; }
            if (attempts >= 40) {
                clearInterval(_bgPingTimer); _bgPingTimer = null;
                _connectBanner.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444"></span> Offline — using cached menu';
                if (typeof hideLoader === 'function') hideLoader();
                setTimeout(() => { _connectBanner.style.transform = 'translateY(-100%)'; setTimeout(() => _connectBanner.remove(), 300); }, 4000);
            }
            return false;
        };
        if (await tryConnect()) return;
        _bgPingTimer = setInterval(() => tryConnect(), 3000);
    };

    const _startRuntimeIfNeeded = () => {
        if (_runtimeStarted) return;
        _runtimeStarted = true;
        _onSessionReady();
        _backgroundConnect();
    };

    /* ── User setup ── */
    const _initUserSetup = async () => {
        const nameKey = RestaurantConfig.storageKey('customer_name');
        const phoneKey = RestaurantConfig.storageKey('customer_phone');
        const nameAliasKey = RestaurantConfig.storageKey('customerName');
        const phoneAliasKey = RestaurantConfig.storageKey('customerPhone');

        const existingName = localStorage.getItem(nameKey) || localStorage.getItem(nameAliasKey) || '';
        const existingPhone = localStorage.getItem(phoneKey) || localStorage.getItem(phoneAliasKey) || '';

        const modal = $('#userSetupModal'), nameIn = $('#setupName'), phoneIn = $('#setupPhone'), errEl = $('#setupError'), submitBtn = $('#setupSubmit');
        if (!modal) return;

        const _setModalVisible = (visible) => {
            modal.classList.toggle('user-setup--visible', !!visible);
            document.body.style.overflow = visible ? 'hidden' : '';
        };
        const _showErr = (msg) => { errEl.textContent = msg; errEl.hidden = false; };
        const _clearErr = () => { errEl.hidden = true; errEl.textContent = ''; };
        const _persistCustomer = (name, phone) => {
            localStorage.setItem(nameKey, name);
            localStorage.setItem(phoneKey, phone);
            localStorage.setItem(nameAliasKey, name);
            localStorage.setItem(phoneAliasKey, phone);
            Customer.setName(name);
            Customer.setPhone(phone);
        };
        const _welcome = (state) => {
            if (state.returning) showToast(`Welcome back, ${state.customerName} 👋`);
            else showToast(`Welcome to ${state.restaurantName} 🍽`);
        };
        const _finish = (state) => {
            _setModalVisible(false);
            setTimeout(() => modal.remove(), 300);
            _welcome(state);
            _startRuntimeIfNeeded();
        };

        if (existingName && /^\d{10}$/.test(existingPhone)) {
            if (nameIn) nameIn.value = existingName;
            if (phoneIn) phoneIn.value = existingPhone;
            if (typeof showLoader === 'function') showLoader('Restoring your session...');
            const restored = await _initCustomerOnServer(existingName, existingPhone);
            if (typeof hideLoader === 'function') hideLoader();
            if (restored.ok) {
                _persistCustomer(existingName, existingPhone);
                _finish(restored);
                return;
            }
            showToast('Server temporarily unavailable. Try again.');
        }

        requestAnimationFrame(() => _setModalVisible(true));
        setTimeout(() => { if (nameIn) nameIn.focus(); }, 400);

        const _submit = async () => {
            _clearErr();
            const name = nameIn.value.trim(), phone = phoneIn.value.replace(/\s/g, '');
            if (!name || name.length < 2) { _showErr('Name must be at least 2 characters'); nameIn.focus(); return; }
            if (!/^\d{10}$/.test(phone)) { _showErr('Phone must be exactly 10 digits'); phoneIn.focus(); return; }

            submitBtn.disabled = true;
            const prevLabel = submitBtn.textContent;
            submitBtn.textContent = 'Please wait…';

            const initState = await _initCustomerOnServer(name, phone);
            if (!initState.ok) {
                submitBtn.disabled = false;
                submitBtn.textContent = prevLabel;
                _showErr('Unable to connect to server. Please try again.');
                showToast('Server temporarily unavailable. Try again.');
                return;
            }

            _persistCustomer(name, phone);
            submitBtn.disabled = false;
            submitBtn.textContent = prevLabel;
            _finish(initState);
        };

        submitBtn.addEventListener('click', _submit);
        [nameIn, phoneIn].forEach(inp => inp?.addEventListener('keydown', (e) => { if (e.key === 'Enter') _submit(); }));
    };

    /* ── Escape HTML ── */
    const _esc = (s) => { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

    /* ── Connection indicator ── */
    const _updateConnectionIndicator = (state) => {
        let el = document.getElementById('connIndicator');
        if (!el) { el = document.createElement('div'); el.id = 'connIndicator'; el.className = 'conn-indicator'; document.body.appendChild(el); }
        const map = { connected: { dot: '🟢', label: 'Connected', cls: 'conn-indicator--on' }, connecting: { dot: '🟡', label: 'Connecting', cls: 'conn-indicator--mid' }, offline: { dot: '🔴', label: 'Offline', cls: 'conn-indicator--off' } };
        const info = map[state] || map.offline;
        el.className = `conn-indicator ${info.cls}`;
        el.innerHTML = `${info.dot} <span>${info.label}</span>`;
        if (state === 'connected') { clearTimeout(el._hideTimer); el._hideTimer = setTimeout(() => el.classList.add('conn-indicator--hidden'), 3000); } else { clearTimeout(el._hideTimer); el.classList.remove('conn-indicator--hidden'); }
    };

    document.addEventListener('api:cold-start', () => showToast('⏳ Server waking up — please wait…'));

    /* ── Notify sound ── */
    const _notifySound = new Audio('data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToGAAD+/wIA/P8EAPv/BgD5/wgA9/8KAPb/CwD1/wwA9f8MAPT/DQD0/w0A9P8NAPX/DAD1/wwA9v8LAPX/DADz/w4A8P8RAPD/EQDx/xAA8v8PAPL/DwDy/w8A8P8RAPP/DgD4/wkA+/8GAP3/BAD+/wMA//8CAP//AgD//wIA//8CAP//AgD+/wMA/f8EAPz/BQD7/wYA+v8HAPn/CAD4/wkA+P8JAPj/CQD5/wgA+v8HAPv/BgD8/wUA/f8EAP7/AwD//wIA//8BAP//AQD//wEA//8BAP//AQD//wEAAAAAAAAAAAAA');
    _notifySound.volume = 0.7;
    const _playNotifySound = () => { try { _notifySound.currentTime = 0; _notifySound.play().catch(() => {}); } catch {} };

    /* ── Notification throttle ── */
    const _notifThrottle = new Map();
    const _shouldNotify = (orderId) => { if (!orderId) return true; const last = _notifThrottle.get(orderId); const now = Date.now(); if (last && now - last < 3000) return false; _notifThrottle.set(orderId, now); return true; };

    /* ── Push notifications ── */
    const _requestNotifPermission = () => { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); };
    const _sendPushNotification = (title, body) => { if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !document.hidden) return; try { new Notification(title, { body, icon: '🍽️', tag: 'mn-order-update' }); } catch {} };
    document.addEventListener('click', function _reqPerm() { _requestNotifPermission(); document.removeEventListener('click', _reqPerm); });

    /* ── Customer Socket ── */
    let _customerSocket = null;
    let _lastOrderId = null;

    const _initCustomerSocket = () => {
        if (typeof io === 'undefined') return;
        _updateConnectionIndicator('connecting');
        _customerSocket = (window.MenuNovaSocket && MenuNovaSocket.create({ reconnectionDelay: 3000, reconnectionAttempts: 10 })) || io(RestaurantConfig.SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 3000, reconnectionAttempts: 10 });

        _customerSocket.on('connect', () => {
            _updateConnectionIndicator('connected');
            const phone = localStorage.getItem(RestaurantConfig.storageKey('customer_phone'));
            if (phone && window.MenuNovaSocket) {
                MenuNovaSocket.joinUserRoom(_customerSocket, phone);
            }
        });

        _customerSocket.on('restaurant:order-status', (data) => {
            if (!data) return;
            _showOrderNotification(data);
            if (data.orderId) { Customer.updateOrderStatus(data.orderId, data.status); UI.renderGreeting(); UI.renderOrdersPanel(); }
        });

        _customerSocket.on('restaurant:new-order', (data) => {
            if (!data) return;
            const profile = Customer.getProfile();
            if (profile && data.phone && data.phone === profile.phone && data.orderId) {
                Customer.saveOrder({ orderId: data.orderId, status: data.status || 'PENDING', total: data.total, items: data.items || [], date: data.date || new Date().toISOString(), customerName: data.customerName, phone: data.phone });
                UI.renderGreeting(); UI.renderOrdersPanel();
            }
        });

        _customerSocket.on('restaurant:order-updated', (order) => {
            if (!order) return;
            UI.updateOrderCard(order);
            const id = order._id || order.orderId;
            const status = (order.status || '').toUpperCase();
            if (id) Customer.updateOrderStatus(id, status);
            if (typeof currentTrackedOrderId !== 'undefined' && currentTrackedOrderId && (order.orderId === currentTrackedOrderId || order._id === currentTrackedOrderId)) {
                if (typeof renderTrackContent === 'function') renderTrackContent(order);
            }
            if (_shouldNotify(id) && ['PREPARING', 'READY', 'COMPLETED'].includes(status)) { _playNotifySound(); _sendPushNotification('Order Update', `Order is now ${status}`); }
            _showOrderNotification({ orderId: id, status });
            UI.renderGreeting();
        });

        _customerSocket.on('restaurant:order-deleted', ({ orderId }) => { const card = document.querySelector(`[data-id="${orderId}"]`); if (card) card.remove(); });
        _customerSocket.on('disconnect', () => _updateConnectionIndicator('offline'));
        _customerSocket.on('reconnect_attempt', () => _updateConnectionIndicator('connecting'));
        _customerSocket.on('connect_error', () => _updateConnectionIndicator('offline'));

        _customerSocket.on('restaurant:menu-updated', () => {
            if (typeof MenuData !== 'undefined' && MenuData.clearCache) MenuData.clearCache();
            MenuData.connectLive().then((result) => { if (result.live) { renderCategoryTabs(); renderStats(); renderMenu(); showToast('Menu updated! 🔄'); } });
        });
    };

    const _trackOrder = (orderId) => { _lastOrderId = orderId; localStorage.setItem(RestaurantConfig.storageKey('last_order'), orderId); };

    const _fetchOrdersByPhone = async () => {
        const phone = localStorage.getItem(RestaurantConfig.storageKey('customer_phone'));
        if (!phone) return;
        try {
            const res = await Api.fetchOrdersByPhone(phone);
            if (res.ok && Array.isArray(res.data)) {
                res.data.forEach(order => { Customer.saveOrder({ orderId: order.orderId || order._id, _id: order._id, status: (order.status || 'PENDING').toUpperCase(), total: order.total, items: order.items || [], date: order.createdAt || order.date || new Date().toISOString(), customerName: order.customerName, phone: order.phone }); });
                UI.renderOrdersPanel(); UI.renderGreeting();
            }
        } catch (err) { console.warn('[Orders] Fetch error:', err.message); }
    };

    const _showOrderNotification = (data) => {
        const statusLabels = { PENDING: { icon: '⏳', label: 'Order Received', desc: 'Your order has been received' }, PREPARING: { icon: '🔥', label: 'Preparing', desc: 'Your order is being prepared!' }, READY: { icon: '📦', label: 'Ready!', desc: 'Your order is ready for pickup' }, COMPLETED: { icon: '✅', label: 'Completed', desc: 'Your order is complete — enjoy!' }, CANCELLED: { icon: '❌', label: 'Cancelled', desc: 'Your order has been cancelled' } };
        const info = statusLabels[data.status] || { icon: '📦', label: data.status, desc: 'Order status updated' };
        const customerName = Customer.getName() || 'Guest';
        const existing = document.getElementById('orderNotification'); if (existing) existing.remove();
        const notif = document.createElement('div'); notif.id = 'orderNotification'; notif.className = `order-notif order-notif--${(data.status || '').toLowerCase()}`; notif.setAttribute('role', 'alert');
        notif.innerHTML = `<div class="order-notif__inner"><span class="order-notif__icon">${info.icon}</span><div class="order-notif__text"><strong class="order-notif__title">${customerName}, ${info.label}</strong><span class="order-notif__desc">${info.desc}</span>${data.orderId ? `<span class="order-notif__id">Order: ${data.orderId}</span>` : ''}</div><button class="order-notif__close" aria-label="Dismiss">✕</button></div>`;
        document.body.appendChild(notif);
        requestAnimationFrame(() => notif.classList.add('order-notif--visible'));
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        notif.querySelector('.order-notif__close').addEventListener('click', () => { notif.classList.remove('order-notif--visible'); setTimeout(() => notif.remove(), 300); });
        setTimeout(() => { if (notif.parentNode) { notif.classList.remove('order-notif--visible'); setTimeout(() => notif.remove(), 300); } }, 8000);
    };

    /* ── Order result popup ── */
    const _showOrderResult = (success, data = {}) => {
        const existing = document.getElementById('orderResultPopup'); if (existing) existing.remove();
        const popup = document.createElement('div'); popup.id = 'orderResultPopup'; popup.className = `order-popup order-popup--${success ? 'success' : 'error'}`; popup.setAttribute('role', 'alertdialog');
        if (success) {
            popup.innerHTML = `<div class="order-popup__inner"><span class="order-popup__icon">✅</span><h3 class="order-popup__title">Order Placed!</h3><p class="order-popup__sub">Hi ${_esc(data.name || '')}, your order is confirmed</p><div class="order-popup__id-row"><span class="order-popup__id">🧾 ${data.orderId || '—'}</span><button class="order-popup__copy" data-copy="${data.orderId || ''}" title="Copy Order ID">📋</button></div><p class="order-popup__total">Total: ₹${data.total || 0}</p><div class="order-popup__actions"><button class="track-btn order-popup__btn--track" onclick="openTrackModal('${data.orderId || ''}')">📍 Track Your Order</button>${data.url ? `<button class="order-popup__btn order-popup__btn--wa" data-wa-url="${data.url}">💬 Send via WhatsApp</button>` : ''}<button class="order-popup__btn order-popup__btn--close">Close</button></div>${data.viaWhatsApp ? '<p class="order-popup__hint">Order sent via WhatsApp — check your chat</p>' : '<p class="order-popup__hint">You\'ll get notified when your order status changes</p>'}</div>`;
            if (data.orderId) { if (typeof autoOpenTimer !== 'undefined') clearTimeout(autoOpenTimer); window.userClosedTracking = false; autoOpenTimer = setTimeout(() => { if (!window.userClosedTracking) openTrackModal(data.orderId); }, 1000); }
        } else if (data.serverDown && data.url) {
            popup.innerHTML = `<div class="order-popup__inner"><span class="order-popup__icon">⚠️</span><h3 class="order-popup__title">Server Issue</h3><p class="order-popup__sub">Sorry, our server is waking up. You can still order via WhatsApp.</p><p class="order-popup__hint">Your cart is safe — no items lost</p><div class="order-popup__actions"><button class="order-popup__btn order-popup__btn--wa" data-wa-url="${data.url}">💬 Order via WhatsApp</button><button class="order-popup__btn order-popup__btn--close">Close</button></div></div>`;
        } else {
            popup.innerHTML = `<div class="order-popup__inner"><span class="order-popup__icon">❌</span><h3 class="order-popup__title">Order Failed</h3><p class="order-popup__sub">${_esc(data.error || 'Something went wrong')}</p><p class="order-popup__hint">Your cart is safe — please try again</p><div class="order-popup__actions"><button class="order-popup__btn order-popup__btn--close">OK</button></div></div>`;
        }
        document.body.appendChild(popup);
        requestAnimationFrame(() => popup.classList.add('order-popup--visible'));
        popup.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('[data-copy]'); if (copyBtn) { navigator.clipboard.writeText(copyBtn.dataset.copy).then(() => { copyBtn.textContent = '✅'; setTimeout(() => copyBtn.textContent = '📋', 1200); }).catch(() => showToast('Copy failed')); return; }
            const waBtn = e.target.closest('[data-wa-url]'); if (waBtn && waBtn.dataset.waUrl) { window.open(waBtn.dataset.waUrl, '_blank'); return; }
            if (e.target.closest('.order-popup__btn--close')) { popup.classList.remove('order-popup--visible'); setTimeout(() => popup.remove(), 300); }
        });
        setTimeout(() => { if (popup.parentNode) { popup.classList.remove('order-popup--visible'); setTimeout(() => popup.remove(), 300); } }, 15000);
    };

    /* ── Init render ── */
    State.set('loading', false);
    renderStats();
    UI.showSkeleton();
    _initUserSetup();
    updateMiniCart(); // Initialize mini cart on boot

    /* ── Confetti Effect ── */
    let _hasShownConfetti = false;
    const _triggerConfetti = () => {
        if (_hasShownConfetti) return;
        _hasShownConfetti = true;
        
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        
        const colors = ['#ff7a18', '#ff8a00', '#ffd700', '#ff4d00', '#ffaa00'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.3 + 's';
                confetti.style.animationDuration = (Math.random() * 1 + 2) + 's';
                container.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
        
        setTimeout(() => container.remove(), 4000);
    };

    /* ── Ripple Effect ── */
    const _createRipple = (e, button) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    };

    /* ── Cart Badge Shake ── */
    const _shakeCartBadge = () => {
        const badge = $('#cartBadge');
        if (badge) {
            badge.classList.remove('cart-shake');
            void badge.offsetWidth;
            badge.classList.add('cart-shake');
            setTimeout(() => badge.classList.remove('cart-shake'), 400);
        }
    };
    /* ── Tab indicator ── */
    const updateTabIndicator = (activeTab) => {
        const tabsEl = $('#menuTabs');
        const ind = tabsEl?.querySelector('.tab-indicator');
        if (!tabsEl || !ind || !activeTab) return;
        requestAnimationFrame(() => {
            const rect = activeTab.getBoundingClientRect();
            const parentRect = tabsEl.getBoundingClientRect();
            ind.style.transform = `translateX(${rect.left - parentRect.left + tabsEl.scrollLeft}px)`;
            ind.style.width = `${rect.width}px`;
        });
    };

    /* ── State listeners ── */
    State.on('category', (v) => { setActiveTab(v); renderMenu(); updateTabIndicator(document.querySelector(`.tab[data-category="${v}"]`)); });
    State.on('filter', (v) => { setActiveChip(v); renderMenu(); });
    State.on('search', () => renderMenu());
    State.on('cartOpen', (open) => {
        document.body.classList.toggle('modal-open', open);
        modalOverlay.setAttribute('aria-hidden', String(!open));
        if (open) { lastFocusedEl = document.activeElement; const f = cartModal.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'); if (f) f.focus(); }
        else if (lastFocusedEl) lastFocusedEl.focus();
    });

    document.addEventListener('cart:changed', () => { renderMenu(); renderCartBadge(); renderCartModal(); updateMiniCart(); });

    /* ── Menu clicks ── */
    // Card click: subtle add when clicking a card (but not its controls or excluded regions)
    $('#menuContainer').addEventListener('click', (e) => {
        // Exclude clicks on interactive controls and specific regions
        const inControl = e.target.closest('[data-action],button,a,input,select,textarea,.price-chip,.price-card,.price-col,.card__desc,.badge-special,.badge-popular,.badge-bestseller,.card__emoji');
        if (inControl) return;
        const card = e.target.closest('.card'); if (!card) return;
        const id = card.dataset.itemId; const price = Number(card.dataset.itemPrice || 0); const size = card.dataset.itemSize || 'Regular';
        if (!id) return;
        const prev = Cart.count();
        Cart.add(id, size, price);
        _shakeCartBadge();
        card.classList.add('card-add-anim'); setTimeout(() => card.classList.remove('card-add-anim'), 280);
        showToast(`Added ${MenuData.findById(id)?.name || 'item'}`);
        if (navigator.vibrate) navigator.vibrate(10);
        if (prev === 0 && Cart.count() === 1) { toggleCart(true); _triggerConfetti(); }
        return;
    });

    // Existing data-action click handler (buttons, chips, qty controls)
    $('#menuContainer').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const { action, id, size, price } = btn.dataset;
        
        // Add ripple effect to button clicks
        if (btn.classList.contains('add-btn') || btn.classList.contains('qty-btn')) {
            _createRipple(e, btn);
        }
        
        switch (action) {
            case 'cart-add': { 
                const prev = Cart.count(); 
                Cart.add(id, size, Number(price)); 
                
                // Trigger confetti on first order
                if (prev === 0 && Cart.count() === 1) {
                    toggleCart(true); 
                    _triggerConfetti();
                }
                
                // Shake cart badge
                _shakeCartBadge();
                
                // Add bounce animation to button
                btn.classList.add('btn-bounce');
                setTimeout(() => btn.classList.remove('btn-bounce'), 300);
                
                showToast(`Added ${MenuData.findById(id)?.name || 'item'}`); 
                if (navigator.vibrate) navigator.vibrate(12); 
                break; 
            }
            case 'cart-inc': 
                Cart.update(id, size, Number(price), 1); 
                _shakeCartBadge();
                break;
            case 'cart-dec': 
                Cart.update(id, size, Number(price), -1); 
                break;
        }
    });

    // Keyboard support: Enter/Space on focused card adds primary size
    $('#menuContainer').addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('card') ? document.activeElement : null;
        if (!card) return;
        // Ignore if focus is on a control inside card
        const inControl = document.activeElement.querySelector && document.activeElement.querySelector('[data-action],button,a,input,select,textarea,.price-chip,.price-card,.price-col,.card__desc,.badge-special,.badge-popular,.badge-bestseller,.card__emoji');
        if (inControl) return;
        e.preventDefault();
        const id = card.dataset.itemId; const price = Number(card.dataset.itemPrice || 0); const size = card.dataset.itemSize || 'Regular';
        if (!id) return;
        const prev = Cart.count();
        Cart.add(id, size, price);
        _shakeCartBadge();
        card.classList.add('card-add-anim'); setTimeout(() => card.classList.remove('card-add-anim'), 280);
        showToast(`Added ${MenuData.findById(id)?.name || 'item'}`);
        if (navigator.vibrate) navigator.vibrate(10);
        if (prev === 0 && Cart.count() === 1) { toggleCart(true); _triggerConfetti(); }
    });

    /* ── Tab clicks ── */
    $('#menuTabs').addEventListener('click', (e) => { 
        const tab = e.target.closest('.tab'); 
        if (!tab) return; 
        
        const categoryKey = tab.dataset.category;
        State.set('category', categoryKey); 
        
        // Scroll to category section (smooth scroll)
        if (categoryKey !== 'all') {
            const section = document.querySelector(`.cat-section[data-category="${categoryKey}"]`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        // Scroll tab into view in horizontal tabs bar
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); 
        updateTabIndicator(tab); 
    });
    $('#filterBar').addEventListener('click', (e) => { const chip = e.target.closest('.chip'); if (!chip) return; State.set('filter', chip.dataset.filter); });

    /* ── Search ── */
    const searchInput = $('#searchInput'), searchClear = $('#searchClear');
    const debouncedSearch = debounce((q) => State.set('search', q), 180);
    searchInput.addEventListener('input', (e) => { searchClear.classList.toggle('show', e.target.value.length > 0); debouncedSearch(e.target.value); });
    searchClear.addEventListener('click', () => { searchInput.value = ''; searchClear.classList.remove('show'); State.set('search', ''); searchInput.focus(); });

    /* ── Cart triggers ── */
    $('#cartBtn').addEventListener('click', () => toggleCart());
    $('#modalOverlay').addEventListener('click', () => toggleCart(false));
    $('#closeCart').addEventListener('click', () => toggleCart(false));
    $('#miniCartBtn').addEventListener('click', () => toggleCart());

    /* ── Cart modal clicks ── */
    cartModal.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const { action, id, size, price } = btn.dataset;
        switch (action) {
            case 'cart-modal-inc': Cart.update(id, size, Number(price), 1); break;
            case 'cart-modal-dec': Cart.update(id, size, Number(price), -1); break;
            case 'suggest-add': Cart.add(id, size, Number(price)); showToast(`Added ${MenuData.findById(id)?.name || 'item'}`); break;
            case 'clear-cart': Cart.clear(); showToast('Cart cleared'); break;
            case 'checkout-start': UI.setCheckoutStep('form'); break;
            case 'checkout-back': UI.setCheckoutStep('cart'); break;
            case 'checkout-review': {
                const name = $('#custName')?.value.trim(), phone = $('#custPhone')?.value.trim();
                const orderType = cartModal.querySelector('input[name="orderType"]:checked')?.value || 'Dine-In';
                if (!name) { showToast('Please enter your name'); return; }
                if (!phone || !/^\d{10}$/.test(phone)) { showToast('Enter valid 10-digit phone'); return; }
                localStorage.setItem(RestaurantConfig.storageKey('customer_name'), name);
                localStorage.setItem(RestaurantConfig.storageKey('customer_phone'), phone);
                localStorage.setItem(RestaurantConfig.storageKey('customerName'), name);
                localStorage.setItem(RestaurantConfig.storageKey('customerPhone'), phone);
                UI.setCustomerInfo({ name, phone, orderType, persons: $('#custPersons')?.value, table: $('#custTable')?.value.trim(), note: $('#custNote')?.value.trim() });
                UI.setCheckoutStep('summary');
                break;
            }
            case 'checkout-back-form': UI.setCheckoutStep('form'); break;
            case 'checkout-confirm': {
                const info = UI.getCustomerInfo(); if (!Cart.count()) return;
                btn.disabled = true; btn.textContent = '⏳ Placing order…';
                if (typeof showLoader === 'function') showLoader('Placing your order...');
                (async () => {
                    try {
                        const result = await Cart.submitOrder(info);
                        if (result.ok && result.source === 'server') {
                            window.__BACKEND_CONNECTED__ = true;
                            const { earnedPoints } = Customer.recordOrder(info, result.total, Cart.snapshot());
                            Api.syncCustomerAfterOrder({
                                name: info.name,
                                phone: info.phone,
                                orderCountIncrement: 1,
                                totalSpentIncrement: Number(result.total || 0),
                                orderTotal: Number(result.total || 0),
                            }).catch(() => {});
                            if (earnedPoints > 0) showToast(`+${earnedPoints} loyalty points earned!`);
                            Customer.saveOrder({ orderId: result.orderId, _id: result._id || null, status: 'PENDING', total: result.total, items: Cart.snapshot(), date: new Date().toISOString(), customerName: info.name, phone: info.phone });
                            UI.renderGreeting();
                            if (typeof hideLoader === 'function') hideLoader();
                            _showOrderResult(true, { orderId: result.orderId, total: result.total, name: info.name });
                            if (result.orderId) _trackOrder(result.orderId);
                            setTimeout(() => { btn.disabled = false; btn.textContent = '✅ Place Order'; Cart.clear(); UI.setCheckoutStep('cart'); toggleCart(false); }, 2000);
                            return;
                        }
                        window.__BACKEND_CONNECTED__ = false;
                        if (typeof hideLoader === 'function') hideLoader();
                        const waData = Cart.sendViaWhatsApp(info);
                        _showOrderResult(false, { error: 'Sorry, our server is temporarily unavailable.', serverDown: true, url: waData.url });
                        btn.disabled = false; btn.textContent = '✅ Place Order'; renderCartModal();
                    } catch (err) {
                        window.__BACKEND_CONNECTED__ = false; if (typeof hideLoader === 'function') hideLoader();
                        const waData = Cart.sendViaWhatsApp(info);
                        _showOrderResult(false, { error: 'Sorry, our server is temporarily unavailable.', serverDown: true, url: waData.url });
                        btn.disabled = false; btn.textContent = '✅ Place Order'; renderCartModal();
                    }
                })();
                break;
            }
            case 'checkout-wa': { const waInfo = UI.getCustomerInfo(); if (!Cart.count()) return; Customer.recordOrder(waInfo, Cart.total(), Cart.snapshot()); const waResult = Cart.sendViaWhatsApp(waInfo); if (waResult.url) { window.open(waResult.url, '_blank'); showToast('Opening WhatsApp…'); _showOrderResult(true, { orderId: waResult.orderId, total: waResult.total, name: waInfo.name, url: waResult.url, viaWhatsApp: true }); } break; }
            case 'repeat-order': { if (Customer.repeatLastOrder()) showToast('Last order restored!'); else showToast('No previous order found'); break; }
        }
    });

    /* ── Order type toggle ── */
    cartModal.addEventListener('change', (e) => {
        if (e.target.name === 'orderType') { const dineIn = $('#dineInFields'); if (dineIn) dineIn.hidden = e.target.value === 'Takeaway'; cartModal.querySelectorAll('.order-type-opt').forEach(lbl => lbl.classList.toggle('order-type-opt--active', lbl.querySelector('input').checked)); }
    });

    /* ── Keyboard ── */
    document.addEventListener('keydown', (e) => {
        if (!State.get('cartOpen')) return;
        if (e.key === 'Escape') return toggleCart(false);
        if (e.key !== 'Tab') return;
        const focusables = cartModal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        if (e.shiftKey && document.activeElement === focusables[0]) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === focusables[focusables.length - 1]) { e.preventDefault(); focusables[0].focus(); }
    });

    /* ── Scroll ── */
    const btt = $('#backToTop'); let scrollTick = false;
    window.addEventListener('scroll', () => { if (scrollTick) return; scrollTick = true; requestAnimationFrame(() => { btt.classList.toggle('show', window.scrollY > 400); if (hero) hero.classList.toggle('hero--compact', window.scrollY > 60); scrollTick = false; }); }, { passive: true });

    if (tabs) tabs.addEventListener('scroll', () => { const active = document.querySelector('.tab.active'); updateTabIndicator(active); }, { passive: true });
    window.addEventListener('resize', () => updateTabIndicator(document.querySelector('.tab.active')));
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    updateTabIndicator(document.querySelector('.tab.active'));

    document.addEventListener('customer:updated', () => UI.renderGreeting());
    document.addEventListener('orders:updated', () => UI.renderGreeting());

    /* ── Theme toggle ── */
    const themeToggle = $('#themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', () => { const next = Customer.getTheme() === 'dark' ? 'light' : 'dark'; Customer.setTheme(next); UI.renderThemeToggle(); showToast(next === 'dark' ? '🌙 Dark mode' : '☀️ Light mode'); });

    /* ── Orders panel ── */
    const ordersBtn = $('#ordersBtn'); if (ordersBtn) ordersBtn.addEventListener('click', () => UI.toggleOrdersPanel(true));
    const closeOrders = $('#closeOrders'); if (closeOrders) closeOrders.addEventListener('click', () => UI.toggleOrdersPanel(false));
    const ordersOverlay = $('#ordersOverlay'); if (ordersOverlay) ordersOverlay.addEventListener('click', () => UI.toggleOrdersPanel(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const panel = $('#ordersPanel'); if (panel && panel.classList.contains('orders-panel--visible')) UI.toggleOrdersPanel(false); } });

    const ordersPanel = $('#ordersPanel');
    if (ordersPanel) ordersPanel.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="panel-reorder"]'); if (!btn) return;
        const order = Customer.getOrder(btn.dataset.orderId);
        if (!order?.items?.length) { showToast('No items to reorder'); return; }
        Cart.clear(); order.items.forEach(i => { for (let q = 0; q < (i.quantity || 1); q++) Cart.add(i.itemId || i.id, i.size, i.price); });
        UI.toggleOrdersPanel(false); toggleCart(true); showToast('Order restored! 🔁');
    });

    /* ── Cancel / Delete ── */
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.cancel-order'); if (!btn) return;
        const id = btn.dataset.id; if (!id || btn.disabled) return;
        btn.disabled = true; const orig = btn.innerHTML; btn.innerHTML = '<span class="cancel-order__spinner"></span> Cancelling…'; btn.classList.add('cancel-order--loading');
        try {
            const url = `${RestaurantConfig.API_URL}/orders/${id}/cancel`;
            console.log('Calling:', url);
            const res = await fetch(url, { method: 'PATCH' });
            let json = null; const ct = res.headers.get('content-type') || ''; if (ct.includes('application/json')) json = await res.json();
            if (!res.ok) { showToast((json?.message || json?.error) || `Error ${res.status}`, 'error'); btn.disabled = false; btn.innerHTML = orig; btn.classList.remove('cancel-order--loading'); return; }
            Customer.updateOrderStatus(id, 'CANCELLED'); UI.updateOrderCard({ _id: id, status: 'CANCELLED' }); UI.renderOrdersPanel(); UI.renderGreeting(); showToast('Order cancelled', 'success');
        } catch { showToast('Failed to cancel — check connection', 'error'); btn.disabled = false; btn.innerHTML = orig; btn.classList.remove('cancel-order--loading'); }
    });

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-cancelled'); if (!btn) return;
        const id = btn.dataset.id; if (!id || btn.disabled) return;
        btn.disabled = true; btn.innerHTML = '⏳ Deleting…';
        try {
            const card = btn.closest('.order-card');
            if (card) { card.style.transition = 'opacity .3s ease, transform .3s ease'; card.style.opacity = '0'; card.style.transform = 'scale(0.95)'; setTimeout(() => card.remove(), 300); }
            if (Customer.removeOrder) Customer.removeOrder(id);
            showToast('Cancelled order deleted', 'success');
        } catch { btn.disabled = false; btn.innerHTML = '🗑 Delete'; showToast('Failed to delete order'); }
    });
});

/* ═══════════════════════════════════════════
 * TRACK MODAL ENGINE (global scope for onclick handlers)
 * ═══════════════════════════════════════════ */
window.currentTrackedOrderId = null;
window.autoOpenTimer = null;

let lastTrackStatus = null, miniInterval = null, _trackCountdown = null, _ratingTimeout = null, autoCloseTimer = null;
window.userClosedTracking = false;
window.confettiLaunched = false;

const TRACK_API = RestaurantConfig.API_URL;
const _popSound = new Audio('data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToGAAD+/wIA/P8EAPv/BgD5/wgA9/8KAPb/CwD1/wwA9f8MAPT/DQD0/w0A9P8NAPX/DAD1/wwA9v8LAPX/DADz/w4A8P8RAPD/EQDx/xAA8v8PAPL/DwDy/w8A8P8RAPP/DgD4/wkA+/8GAP3/BAD+/wMA//8CAP//AgD//wIA//8CAP//AgD+/wMA/f8EAPz/BQD7/wYA+v8HAPn/CAD4/wkA+P8JAPj/CQD5/wgA+v8HAPv/BgD8/wUA/f8EAP7/AwD//wIA//8BAP//AQD//wEA//8BAP//AQD//wEAAAAAAAAAAAAA');
_popSound.volume = 0.5;

const statusMessages = {
    PENDING: ['🧾 Your order has entered the system.', '👀 The kitchen just noticed your order!', "📦 We're getting things ready...", '⏳ Sit tight, magic is about to begin.'],
    PREPARING: ['👨‍🍳 Chef is cooking with full focus!', '🔥 Flames are on. Smells amazing already!', '🥟 Freshly being made just for you.', '⏳ Almost there... patience = reward.'],
    COMPLETED: ['✅ Boom! Your order is ready!', "🎉 That was quick, wasn't it?", '🍽 Ready to be enjoyed!', '💚 Made with care. Delivered with love.']
};
function getRandomMessage(status) { const msgs = statusMessages[(status || '').toUpperCase()]; return msgs ? msgs[Math.floor(Math.random() * msgs.length)] : ''; }

function startParticles() { stopParticles(); const canvas = document.getElementById('particle-bg'); if (!canvas) return; const ctx = canvas.getContext('2d'); const modal = canvas.parentElement; canvas.width = modal.offsetWidth; canvas.height = modal.offsetHeight; const particles = Array.from({length: 25}, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 3 + 1, d: Math.random() * 1 + 0.5 })); function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = '#ff6b00'; ctx.fill(); p.y -= p.d; if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; } }); window._particleFrame = requestAnimationFrame(animate); } animate(); }
function stopParticles() { if (window._particleFrame) { cancelAnimationFrame(window._particleFrame); window._particleFrame = null; } const c = document.getElementById('particle-bg'); if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); }
function launchConfetti() { if (typeof confetti !== 'function') return; const end = Date.now() + 1500; (function frame() { confetti({ particleCount: 5, spread: 70, origin: { y: 0.6 } }); if (Date.now() < end) requestAnimationFrame(frame); })(); }
function animateProgress(percent) { const el = document.querySelector('.progress-ring-fill'); if (!el) return; el.style.strokeDashoffset = 2 * Math.PI * 40 - (percent / 100) * 2 * Math.PI * 40; }
function startMiniCountdown(targetTime) { clearInterval(miniInterval); const circle = document.querySelector('.mini-fill'); const text = document.getElementById('mini-timer-text'); if (!circle || !text) return; const total = Math.max(1, new Date(targetTime) - new Date()); const circumference = 2 * Math.PI * 30; const tick = () => { const remaining = new Date(targetTime) - new Date(); const pct = Math.max(0, remaining / total); circle.style.strokeDashoffset = circumference - pct * circumference; text.textContent = Math.max(0, Math.floor(remaining / 60000)) + 'm'; if (remaining <= 0) clearInterval(miniInterval); }; tick(); miniInterval = setInterval(tick, 1000); }
function shareOrderStatus() { const text = `Order #${window.currentTrackedOrderId || '?'}\nStatus: ${lastTrackStatus || 'Unknown'}\nTrack here: ${window.location.origin}`; if (navigator.share) navigator.share({ title: 'Track My Order', text }).catch(() => {}); else navigator.clipboard.writeText(text).then(() => { const btn = document.querySelector('.share-btn'); if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => btn.textContent = '📤 Share Status', 1500); } }).catch(() => {}); }
function showRatingPopup() { const el = document.getElementById('rating-popup'); if (el) el.classList.remove('hidden'); }
function submitRating(rating) { const el = document.getElementById('rating-popup'); if (el) el.innerHTML = '<p style="text-align:center;padding:8px;">❤️ Thanks for your feedback!</p>'; }
document.addEventListener('click', (e) => { const star = e.target.closest('.stars span[data-rate]'); if (star) submitRating(star.dataset.rate); });

function resetTrackState() {
    clearInterval(miniInterval); clearInterval(_trackCountdown); clearTimeout(_ratingTimeout); clearTimeout(autoOpenTimer); clearTimeout(autoCloseTimer);
    stopParticles(); lastTrackStatus = null; window.confettiLaunched = false;
    const modal = document.getElementById('track-modal'); if (modal) modal.classList.remove('completed-glow', 'completed-gradient', 'cancelled-glow');
    const rp = document.getElementById('rating-popup'); if (rp) { rp.classList.add('hidden'); rp.innerHTML = '<p>⭐ Rate Your Order</p><div class="stars" id="rating-stars"><span data-rate="1">★</span><span data-rate="2">★</span><span data-rate="3">★</span><span data-rate="4">★</span><span data-rate="5">★</span></div>'; }
}

window.openTrackModal = async function(orderId) {
    if (!orderId) return;
    const overlay = document.getElementById('track-overlay'); if (overlay.classList.contains('active')) return;
    resetTrackState(); window.userClosedTracking = false; window.currentTrackedOrderId = orderId;
    document.getElementById('track-content').innerHTML = '<p style="text-align:center;color:#aaa;padding:30px;">Loading…</p>';
    overlay.classList.add('active'); document.body.style.overflow = 'hidden';
    try { const url = `${TRACK_API}/orders/${orderId}`; console.log('Calling:', url); const res = await fetch(url); const data = await res.json(); if (!data.success || !data.order) { document.getElementById('track-content').innerHTML = '<div style="text-align:center;color:#ff6b00;padding:30px;">Order not found.</div>'; return; } setTimeout(() => renderTrackContent(data.order), 120); } catch { document.getElementById('track-content').innerHTML = '<div style="text-align:center;color:#ff6b00;padding:30px;">Order not found.</div>'; }
};

window.closeTrackModal = function() {
    document.getElementById('track-overlay').classList.remove('active'); document.body.style.overflow = '';
    clearTimeout(autoOpenTimer); clearTimeout(autoCloseTimer); clearInterval(miniInterval); clearInterval(_trackCountdown); clearTimeout(_ratingTimeout);
    stopParticles(); lastTrackStatus = null; window.confettiLaunched = false; window.currentTrackedOrderId = null;
    const modal = document.getElementById('track-modal'); if (modal) modal.classList.remove('completed-glow', 'completed-gradient', 'cancelled-glow');
};

document.getElementById('track-overlay')?.addEventListener('click', (e) => { if (e.target.id === 'track-overlay') { window.userClosedTracking = true; closeTrackModal(); } });

window.renderTrackContent = function(order) {
    const container = document.getElementById('track-content'); const modal = document.getElementById('track-modal');
    if (!container || !order) return;
    const status = (order.status || 'Pending').toUpperCase(); const statusKey = status.toLowerCase();
    const statusEmoji = { pending:'⏳', preparing:'🔥', ready:'📦', completed:'✅', cancelled:'❌' };
    const emoji = statusEmoji[statusKey] || '📦'; const message = getRandomMessage(order.status);
    const isPreparing = status === 'PREPARING', isCompleted = status === 'COMPLETED', isCancelled = status === 'CANCELLED';

    if (lastTrackStatus && lastTrackStatus !== status) { try { _popSound.currentTime = 0; _popSound.play().catch(()=>{}); } catch{} if (isCompleted && navigator.vibrate) navigator.vibrate([200, 100, 200]); }
    lastTrackStatus = status;

    let html = `<h2 style="margin:0 0 12px;font-size:20px;font-weight:800;">Order #${order.orderId || order._id || 'N/A'}</h2><div class="track-status track-status--${statusKey}">${emoji} ${order.status || 'Pending'}</div><div class="status-message"><span>${emoji}</span> ${message}</div>`;
    if (isPreparing) html += `<div class="preparing-visuals"><div class="progress-ring-container"><svg class="progress-ring" width="100" height="100"><circle class="progress-ring-bg" stroke="#222" stroke-width="8" fill="transparent" r="40" cx="50" cy="50"/><circle class="progress-ring-fill" stroke="#ff6b00" stroke-width="8" fill="transparent" r="40" cx="50" cy="50" stroke-linecap="round" style="stroke-dasharray:251.327;stroke-dashoffset:251.327;"/></svg><div class="progress-text">Preparing</div></div><div class="mini-timer"><svg width="70" height="70"><circle class="mini-bg" stroke="#222" stroke-width="6" fill="transparent" r="30" cx="35" cy="35"/><circle class="mini-fill" stroke="#ff6b00" stroke-width="6" fill="transparent" r="30" cx="35" cy="35" stroke-linecap="round" style="stroke-dasharray:188.496;stroke-dashoffset:188.496;"/></svg><div class="mini-text" id="mini-timer-text">0m</div></div></div><div class="chef-typing">👨‍🍳 Chef is preparing<span class="dots"></span></div>`;
    html += `<p style="margin:12px 0;font-size:15px;">Total: <strong style="color:#ff6b00;">₹${Number(order.total) || 0}</strong></p><div id="track-items" style="margin:12px 0;border-top:1px solid rgba(255,255,255,.06);padding-top:10px;"></div><div id="time-info"></div>`;
    if (isCompleted) html += '<button class="share-btn" onclick="shareOrderStatus()">📤 Share Status</button>';
    if (isCancelled) html += '<div class="cancel-note">We sincerely apologize for the inconvenience. Please try ordering again or contact support.</div>';
    container.innerHTML = html;

    const itemsEl = document.getElementById('track-items');
    if (itemsEl && Array.isArray(order.items)) order.items.forEach(item => { const div = document.createElement('div'); div.style.cssText = 'display:flex;justify-content:space-between;padding:4px 0;font-size:14px;color:#ccc;'; div.innerHTML = `<span>${(item.name||'Item')}${item.size?' ('+item.size+')':''} × ${item.quantity||1}</span><span style="color:#22c55e;font-weight:600;">₹${(Number(item.price)||0)*(item.quantity||1)}</span>`; itemsEl.appendChild(div); });

    if (isPreparing) { startParticles(); setTimeout(() => animateProgress(70), 300); if (order.estimatedCompletionTime) startMiniCountdown(order.estimatedCompletionTime); } else stopParticles();
    if (isCompleted && modal) { modal.classList.add('completed-glow', 'completed-gradient'); if (!window.confettiLaunched) { launchConfetti(); window.confettiLaunched = true; } clearTimeout(_ratingTimeout); _ratingTimeout = setTimeout(showRatingPopup, 1500); clearTimeout(autoCloseTimer); autoCloseTimer = setTimeout(() => closeTrackModal(), 15000); }
    else if (isCancelled && modal) { modal.classList.add('cancelled-glow'); modal.classList.remove('completed-glow', 'completed-gradient'); }
    else if (modal) modal.classList.remove('completed-glow', 'completed-gradient', 'cancelled-glow');
};

} /* end _bootMenu */
