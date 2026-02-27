/**
 * menu-data.js — Single source of truth for menu items.
 *
 * Tries to fetch from backend via Api.fetchMenu() first.
 * If network fails, falls back to the hard-coded static menu.
 * Only items with active !== false are exposed to downstream consumers.
 *
 * Each category:  { title, icon, items[] }
 * Each item:      { id, name, desc, prices[{label,value}], special?, active? }
 */
'use strict';

/** Global server readiness flag */
window.__SERVER_READY__ = false;

/** Backend connection flag — true once any API call succeeds */
window.__BACKEND_CONNECTED__ = false;

const MenuData = (() => {

    /** Whether data was successfully loaded from the live API */
    let _isLive = false;

    const _staticCategories = {
        steam: {
            title: 'Steam Momos',
            icon: '🥟',
            items: [
                { id: 1,  name: 'Veg Momos',                    desc: 'Freshly steamed vegetable momos',   prices: [{ label: '5 Pcs',  value: 30  }, { label: '10 Pcs', value: 50  }] },
                { id: 2,  name: 'Paneer Momos',                 desc: 'Soft paneer filling with spices',   prices: [{ label: '5 Pcs',  value: 50  }, { label: '10 Pcs', value: 90  }] },
                { id: 3,  name: 'Soya Momos',                   desc: 'Protein-rich soya momos',           prices: [{ label: '5 Pcs',  value: 30  }, { label: '10 Pcs', value: 50  }] },
                { id: 4,  name: 'Cheese Sweet Corn Momos',      desc: 'Cheesy corn delight',               prices: [{ label: '5 Pcs',  value: 70  }, { label: '10 Pcs', value: 120 }], special: true },
            ],
        },
        fried: {
            title: 'Fried Momos',
            icon: '🍤',
            items: [
                { id: 5,  name: 'Veg Fried Momos',              desc: 'Crispy golden fried momos',         prices: [{ label: '5 Pcs',  value: 40  }, { label: '10 Pcs', value: 60  }] },
                { id: 6,  name: 'Paneer Fried Momos',           desc: 'Crunchy paneer momos',              prices: [{ label: '5 Pcs',  value: 60  }, { label: '10 Pcs', value: 100 }] },
                { id: 7,  name: 'Soya Fried Momos',             desc: 'Crispy soya momos',                 prices: [{ label: '5 Pcs',  value: 40  }, { label: '10 Pcs', value: 60  }] },
                { id: 8,  name: 'Cheese Sweet Corn Fried Momos',desc: 'Crispy cheese corn momos',          prices: [{ label: '5 Pcs',  value: 80  }, { label: '10 Pcs', value: 140 }], special: true },
            ],
        },
        gravy: {
            title: 'Gravy Momos',
            icon: '🍲',
            items: [
                { id: 9,  name: 'Veg Gravy Momos',              desc: 'Momos in spicy gravy',              prices: [{ label: '5 Pcs',  value: 50  }, { label: '8 Pcs',  value: 70  }] },
                { id: 10, name: 'Paneer Gravy Momos',           desc: 'Paneer momos in rich gravy',        prices: [{ label: '5 Pcs',  value: 70  }, { label: '8 Pcs',  value: 100 }] },
                { id: 11, name: 'Soya Gravy Momos',             desc: 'Soya momos in tasty gravy',         prices: [{ label: '5 Pcs',  value: 50  }, { label: '8 Pcs',  value: 70  }] },
                { id: 12, name: 'Cheese Sweet Corn Gravy Momos',desc: 'Cheese corn momos in gravy',        prices: [{ label: '5 Pcs',  value: 90  }, { label: '8 Pcs',  value: 140 }], special: true },
            ],
        },
        kurkure: {
            title: 'Kurkure Momos',
            icon: '✨',
            items: [
                { id: 13, name: 'Veg Kurkure Momos',            desc: 'Extra crispy kurkure style',        prices: [{ label: '5 Pcs',  value: 50  }, { label: '8 Pcs',  value: 70  }] },
                { id: 14, name: 'Paneer Kurkure Momos',         desc: 'Paneer kurkure special',            prices: [{ label: '5 Pcs',  value: 70  }, { label: '8 Pcs',  value: 100 }] },
                { id: 15, name: 'Soya Kurkure Momos',           desc: 'Soya kurkure delight',              prices: [{ label: '5 Pcs',  value: 50  }, { label: '8 Pcs',  value: 70  }] },
                { id: 16, name: 'Cheese Sweet Corn Kurkure Momos', desc: 'Ultimate kurkure experience',    prices: [{ label: '5 Pcs',  value: 90  }, { label: '8 Pcs',  value: 140 }], special: true },
            ],
        },
        noodles: {
            title: 'Noodles',
            icon: '🍜',
            items: [
                { id: 17, name: 'Veg Noodles',                  desc: 'Classic veg noodles',               prices: [{ label: 'Half',   value: 40  }, { label: 'Full',   value: 70  }] },
                { id: 18, name: 'Hakka Noodles',                desc: 'Authentic hakka style',             prices: [{ label: 'Half',   value: 70  }, { label: 'Full',   value: 100 }] },
                { id: 19, name: 'Chilli Garlic Noodles',        desc: 'Spicy garlic flavor',               prices: [{ label: 'Half',   value: 60  }, { label: 'Full',   value: 90  }] },
                { id: 20, name: 'Malaysian Noodles',            desc: 'Exotic Malaysian style',            prices: [{ label: 'Half',   value: 90  }, { label: 'Full',   value: 140 }], special: true },
                { id: 21, name: 'Schezwan Noodles',             desc: 'Hot & spicy schezwan',              prices: [{ label: 'Half',   value: 70  }, { label: 'Full',   value: 100 }] },
                { id: 22, name: 'Butter Garlic Noodles',        desc: 'Buttery garlic goodness',           prices: [{ label: 'Half',   value: 80  }, { label: 'Full',   value: 120 }] },
                { id: 23, name: 'Singapuri Noodles',            desc: 'Singapore special',                 prices: [{ label: 'Half',   value: 70  }, { label: 'Full',   value: 100 }] },
                { id: 24, name: 'Hongkong Noodles',             desc: 'Premium Hongkong style',            prices: [{ label: 'Half',   value: 100 }, { label: 'Full',   value: 150 }], special: true },
            ],
        },
        potato: {
            title: 'Chilli Potato',
            icon: '🥔',
            items: [
                { id: 25, name: 'French Fry',                   desc: 'Crispy golden fries',               prices: [{ label: 'Half',   value: 30  }, { label: 'Full',   value: 60  }] },
                { id: 26, name: 'Honey Chilli Potato',          desc: 'Sweet & spicy combo',               prices: [{ label: 'Half',   value: 70  }, { label: 'Full',   value: 120 }], special: true },
                { id: 27, name: 'Chilli Potato',                desc: 'Spicy potato bites',                prices: [{ label: 'Half',   value: 50  }, { label: 'Full',   value: 90  }] },
                { id: 28, name: 'Schezwan Chilli Potato',       desc: 'Schezwan spicy potato',             prices: [{ label: 'Half',   value: 70  }, { label: 'Full',   value: 120 }] },
            ],
        },
        rolls: {
            title: 'Rolls',
            icon: '🌯',
            items: [
                { id: 29, name: 'Veg Roll',                     desc: 'Fresh veg wrap',                    prices: [{ label: '1 Pc',   value: 30  }, { label: '2 Pcs',  value: 60  }] },
                { id: 30, name: 'Chowmein Spring Roll',         desc: 'Noodles in a roll',                 prices: [{ label: '1 Pc',   value: 30  }, { label: '2 Pcs',  value: 50  }] },
                { id: 31, name: 'Veg Paneer Roll',              desc: 'Paneer wrap delight',               prices: [{ label: '1 Pc',   value: 60  }, { label: '2 Pcs',  value: 110 }] },
                { id: 32, name: 'Kathi Roll',                   desc: 'Authentic kathi roll',              prices: [{ label: '1 Pc',   value: 60  }, { label: '2 Pcs',  value: 120 }] },
                { id: 33, name: 'Today Spl. Roll',              desc: "Chef's special of the day",         prices: [{ label: '1 Pc',   value: 70  }], special: true },
                { id: 34, name: 'Veg Kurkure Roll',             desc: 'Crispy veg roll',                   prices: [{ label: '1 Pc',   value: 50  }, { label: '2 Pcs',  value: 80  }] },
                { id: 35, name: 'Chowmin Kurkure Roll',         desc: 'Crispy noodle roll',                prices: [{ label: '1 Pc',   value: 40  }, { label: '2 Pcs',  value: 70  }] },
                { id: 36, name: 'Paneer Kurkure Roll',          desc: 'Crispy paneer roll',                prices: [{ label: '1 Pc',   value: 60  }, { label: '2 Pcs',  value: 100 }] },
            ],
        },
        chilli: {
            title: 'Chilli Momos',
            icon: '🌶️',
            items: [
                { id: 37, name: 'Veg Chilli Momos',             desc: 'Momos in chilli sauce',             prices: [{ label: '5 Pcs',  value: 50  }, { label: '10 Pcs', value: 90  }] },
                { id: 38, name: 'Veg Soya Chilli Momos',        desc: 'Soya in chilli sauce',              prices: [{ label: '5 Pcs',  value: 50  }, { label: '10 Pcs', value: 90  }] },
                { id: 39, name: 'Paneer Chilli Momos',          desc: 'Paneer chilli fusion',              prices: [{ label: '5 Pcs',  value: 70  }, { label: '10 Pcs', value: 120 }] },
            ],
        },
        main: {
            title: 'Main Course',
            icon: '🍚',
            items: [
                { id: 40, name: 'Veg Fried Rice',               desc: 'Classic fried rice',                prices: [{ label: 'Half',   value: 50  }, { label: 'Full',   value: 80  }] },
                { id: 41, name: 'Paneer Fried Rice',            desc: 'Paneer fried rice',                 prices: [{ label: 'Half',   value: 60  }, { label: 'Full',   value: 100 }] },
                { id: 42, name: 'Singapuri Fried Rice',         desc: 'Singapore style rice',              prices: [{ label: 'Half',   value: 70  }, { label: 'Full',   value: 120 }] },
                { id: 43, name: 'Veg Manchurian',               desc: 'Veg balls in manchurian sauce',     prices: [{ label: 'Half',   value: 50  }, { label: 'Full',   value: 90  }] },
                { id: 44, name: 'Paneer Manchurian',            desc: 'Paneer in manchurian sauce',        prices: [{ label: 'Half',   value: 80  }, { label: 'Full',   value: 140 }], special: true },
                { id: 45, name: 'Paneer Chilli',                desc: 'Spicy paneer dish',                 prices: [{ label: 'Half',   value: 80  }, { label: 'Full',   value: 140 }], special: true },
            ],
        },
    };

    /** Active categories — what downstream modules actually see */
    let categories = {};

    /** Filter out inactive items from a categories object */
    const _filterActive = (cats) => {
        const result = {};
        for (const [key, cat] of Object.entries(cats)) {
            const activeItems = cat.items.filter(i => i.active !== false);
            if (activeItems.length) {
                result[key] = { ...cat, items: activeItems };
            }
        }
        return result;
    };

    /** Populate categories from static data (immediate, synchronous) */
    const _initStatic = () => {
        categories = _filterActive(_staticCategories);
        debug('Static Menu Loaded', allItems());
    };

    // Start with static data so everything works synchronously
    _initStatic();

    /* ---------- Public helpers ---------- */

    /** All categories as an ordered array of [key, data] */
    const entries = () => Object.entries(categories);

    /** Flat list of every item across all categories */
    const allItems = () => Object.values(categories).flatMap(c => c.items);

    /** Lookup a single item by id */
    const findById = (id) => allItems().find(i => i.id === id);

    /** Category keys */
    const keys = () => Object.keys(categories);

    /** Single category by key */
    const get = (key) => categories[key];

    /**
     * Replace categories wholesale (for live API data).
     * Filters out inactive items automatically.
     * Preserves static category order when the incoming keys match.
     */
    const load = (data) => {
        Object.keys(categories).forEach(k => delete categories[k]);

        const active = _filterActive(data);

        // Insert in static order first, then any extra keys
        for (const key of _staticCategoryOrder) {
            if (active[key]) categories[key] = active[key];
        }
        for (const [key, cat] of Object.entries(active)) {
            if (!categories[key]) categories[key] = cat;
        }
    };

    /* ============================================================
       STATIC METADATA — category keys, titles, icons, order.
       Used as the canonical reference for normalizing server data.
    ============================================================ */

    /** Ordered array of canonical category keys (defines tab order) */
    const _staticCategoryOrder = Object.keys(_staticCategories);

    /** Map of { key → { title, icon } } from static data */
    const _staticMeta = {};
    for (const [key, cat] of Object.entries(_staticCategories)) {
        _staticMeta[key] = { title: cat.title, icon: cat.icon };
    }

    /**
     * Build a lookup: category title (lowercased) → static key
     * e.g. "steam momos" → "steam", "chilli potato" → "potato"
     */
    const _titleToKey = {};
    for (const [key, cat] of Object.entries(_staticCategories)) {
        _titleToKey[cat.title.toLowerCase()] = key;
    }

    /**
     * Build a lookup: item name (lowercased) → static item.
     * Used for fallback desc when server doesn't send one.
     */
    const _staticItemByName = {};
    for (const cat of Object.values(_staticCategories)) {
        for (const item of cat.items) {
            _staticItemByName[item.name.toLowerCase()] = item;
        }
    }

    /* ============================================================
       NORMALIZATION — convert any server shape into the exact
       categories structure the UI expects (keys, icons, order).
       ZERO changes to UI code required.
    ============================================================ */

    /**
     * Resolve a server category string to a static category key.
     * Tries exact title match first, then keyword heuristics.
     *
     * @param {string} raw — raw category string from backend
     * @returns {string} canonical static key, or slugified fallback
     */
    const _resolveCategory = (raw) => {
        if (!raw) return 'other';

        const lower = raw.toLowerCase().trim();

        // Exact title match: "Steam Momos" → "steam"
        if (_titleToKey[lower]) return _titleToKey[lower];

        // Exact key match: "steam" → "steam"
        if (_staticMeta[lower]) return lower;

        // Keyword heuristic (order matters — more specific first)
        const kwMap = [
            ['kurkure', 'kurkure'], ['gravy', 'gravy'], ['chilli momo', 'chilli'],
            ['fried momo', 'fried'], ['steam', 'steam'], ['noodle', 'noodles'],
            ['potato', 'potato'], ['fry', 'potato'], ['roll', 'rolls'],
            ['fried rice', 'main'], ['manchurian', 'main'], ['paneer chilli', 'main'],
            ['main', 'main'], ['chilli', 'chilli'],
        ];
        for (const [kw, key] of kwMap) {
            if (lower.includes(kw)) return key;
        }

        // Slugified fallback for truly unknown categories
        return lower.replace(/\s+/g, '-');
    };

    /**
     * Normalize a single item's prices to [ { label: string, value: number } ].
     * Handles every known backend format.
     */
    const _normalizePrices = (raw) => {
        if (!raw) return [];

        // Single price shorthand
        if (typeof raw === 'number') return [{ label: 'Regular', value: raw }];

        if (!Array.isArray(raw)) return [];

        return raw.map(p => {
            if (typeof p === 'number') return { label: 'Regular', value: p };
            return {
                label: String(p.label || p.size || 'Regular'),
                value: Number(p.value ?? p.price ?? 0),
            };
        });
    };

    /**
     * Normalize a single server item to the canonical shape the UI expects.
     *
     * Canonical shape:
     *   { id, name, desc, special, prices: [{ label, value }] }
     *
     * Server overrides: price, special, active.
     * Static provides: fallback desc.
     */
    const _normalizeItem = (serverItem) => {
        const id = Number(serverItem.id ?? serverItem._id);
        const name = String(serverItem.name || '');
        const prices = _normalizePrices(serverItem.prices || serverItem.price);
        const special = !!serverItem.special;
        const active = serverItem.active !== false;

        // Fallback desc from static if server didn't provide one
        const staticMatch = _staticItemByName[name.toLowerCase()];
        const desc = String(
            serverItem.desc || serverItem.description || staticMatch?.desc || ''
        );

        return { id, name, desc, special, active, prices };
    };

    /**
     * normalizeServerMenu(serverData)
     *
     * THE SINGLE PUBLIC NORMALIZER.
     *
     * Accepts any server response shape and returns an object
     * with the EXACT same key → { title, icon, items[] } structure
     * as _staticCategories.  Preserves static category order, icons,
     * and titles so the UI renders identically.
     *
     * Supported input shapes:
     *   1. Flat array of items    [ { _id, name, category, … } ]
     *   2. Wrapped categories     { categories: { key: { title, icon, items[] } } }
     *   3. Top-level categories   { steam: { title, icon, items[] }, … }
     *
     * @param {Array|Object} serverData
     * @returns {Object} canonical categories object
     */
    const normalizeMenuFromServer = (serverData) => {
        if (!serverData) return {};
        debug('Server Menu Raw', serverData);

        /* --- Step A: reduce any shape to a flat array of raw items --- */

        let flatItems = [];

        if (Array.isArray(serverData)) {
            // Shape 1: flat array
            flatItems = serverData;
        } else if (typeof serverData === 'object') {
            // Shape 2 or 3
            const root = serverData.categories || serverData;
            if (typeof root === 'object' && !Array.isArray(root)) {
                for (const [key, cat] of Object.entries(root)) {
                    if (!cat || !Array.isArray(cat.items)) continue;
                    // Inject category name into each item so resolver can work
                    for (const item of cat.items) {
                        flatItems.push({
                            ...item,
                            category: item.category || cat.title || key,
                        });
                    }
                }
            }
        }

        if (!flatItems.length) return {};

        /* --- Step B: filter inactive, normalise, bucket by static key --- */

        /** Buckets: key → normalised items[] */
        const buckets = {};

        for (const raw of flatItems) {
            if (raw.active === false) continue;          // skip inactive

            const item = _normalizeItem(raw);
            if (item.active === false) continue;          // double-check

            const key = _resolveCategory(raw.category);
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(item);
        }

        /* --- Step C: assemble output in static category order --- */

        const result = {};

        // First: known categories in their original order
        for (const key of _staticCategoryOrder) {
            if (!buckets[key] || !buckets[key].length) continue;
            const meta = _staticMeta[key] || {};
            result[key] = {
                title: meta.title || key,
                icon:  meta.icon  || '🍽️',
                items: buckets[key],
            };
        }

        // Then: any genuinely new categories from the server
        for (const [key, items] of Object.entries(buckets)) {
            if (result[key]) continue;                    // already placed
            result[key] = {
                title: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '),
                icon:  '🍽️',
                items,
            };
        }

        return result;
    };

    /* ============================================================
       LIVE DATA — deep-merge server data into running menu state
    ============================================================ */

    /**
     * Merge live (server) categories into the active menu without
     * resetting the whole DOM object.  Returns array of changed item IDs
     * so the UI can do a targeted re-render.
     *
     * Rules:
     *   - New items / categories are added
     *   - Changed fields (price, special, active, name, desc) are patched
     *   - Items removed on server are removed locally
     *   - Cart is NOT touched (it stores its own copy of data)
     *   - Static icons, titles, and category order are preserved
     *
     * @param {Object} liveCats — **already** normalised via normalizeMenuFromServer()
     * @returns {number[]} IDs of items that actually changed
     */
    const setLiveData = (liveCats) => {
        const changedIds = [];
        const filtered = _filterActive(liveCats);

        for (const [key, liveCat] of Object.entries(filtered)) {
            if (!categories[key]) {
                // Brand-new category from server — adopt static meta if available
                const meta = _staticMeta[key] || {};
                categories[key] = {
                    title: meta.title || liveCat.title || key,
                    icon:  meta.icon  || liveCat.icon  || '🍽️',
                    items: liveCat.items.map(i => ({ ...i })),
                };
                liveCat.items.forEach(i => changedIds.push(i.id));
                continue;
            }

            const currentCat = categories[key];

            // Always prefer static meta for title/icon to keep UI identical
            const meta = _staticMeta[key];
            if (meta) {
                currentCat.title = meta.title;
                currentCat.icon  = meta.icon;
            } else {
                // Non-static category — take server's title/icon if better
                if (liveCat.title) currentCat.title = liveCat.title;
                if (liveCat.icon && liveCat.icon !== '🍽️') currentCat.icon = liveCat.icon;
            }

            // Build fast-lookup for current items
            const currentMap = new Map(currentCat.items.map(i => [i.id, i]));

            for (const liveItem of liveCat.items) {
                const existing = currentMap.get(liveItem.id);
                if (!existing) {
                    // New item
                    currentCat.items.push({ ...liveItem });
                    changedIds.push(liveItem.id);
                    continue;
                }

                // Diff individual fields
                let changed = false;
                for (const prop of ['name', 'desc', 'special', 'active']) {
                    if (existing[prop] !== liveItem[prop]) {
                        existing[prop] = liveItem[prop];
                        changed = true;
                    }
                }

                // Deep-compare prices
                if (JSON.stringify(existing.prices) !== JSON.stringify(liveItem.prices)) {
                    existing.prices = liveItem.prices.map(p => ({ ...p }));
                    changed = true;
                }

                if (changed) changedIds.push(existing.id);
            }

            // Remove items deleted on server
            const liveIds = new Set(liveCat.items.map(i => i.id));
            const removed = currentCat.items.filter(i => !liveIds.has(i.id));
            removed.forEach(i => changedIds.push(i.id));
            currentCat.items = currentCat.items.filter(i => liveIds.has(i.id));
        }

        // Remove categories that no longer exist on server
        for (const key of Object.keys(categories)) {
            if (!filtered[key]) {
                categories[key].items.forEach(i => changedIds.push(i.id));
                delete categories[key];
            }
        }

        _isLive = true;
        window.__SERVER_READY__ = true;
        debug('Menu Hot Swapped');
        return changedIds;
    };

    /**
     * Fetch menu from backend API and load it.
     * Falls back to static data on any failure.
     * @returns {Promise<{live:boolean, error?:string}>}
     */
    const fetchFromApi = async () => {
        if (typeof Api === 'undefined') {
            _isLive = false;
            return { live: false, error: 'Api module not loaded' };
        }

        const res = await Api.fetchMenu();
        const isSuccess = res?.success ?? res?.ok;

        if (isSuccess && res.data) {
            const cats = normalizeMenuFromServer(res.data);
            if (cats && Object.keys(cats).length) {
                debug('Server Menu Normalized', cats);
                load(cats);
                _isLive = true;
                window.__SERVER_READY__ = true;
                window.__BACKEND_CONNECTED__ = true;
                return { live: true };
            }
        }

        // Fallback to static
        _initStatic();
        _isLive = false;
        window.__SERVER_READY__ = false;
        return { live: false, error: res.error || 'Empty menu data' };
    };

    /**
     * Non-destructive background connect: fetches live menu and deep-merges
     * into the running state.  Does NOT reset to static on failure.
     * Designed for background ping during cold-start.
     *
     * @returns {Promise<{live:boolean, changedIds?:number[], error?:string}>}
     */
    const connectLive = async () => {
        if (typeof Api === 'undefined') return { live: false, error: 'Api not loaded' };

        try {
            const res = await Api.fetchMenu();
            const isSuccess = res?.success ?? res?.ok;
            if (!isSuccess || !res.data) return { live: false, error: res.error || 'No data' };

            const cats = normalizeMenuFromServer(res.data);
            if (!cats || !Object.keys(cats).length) return { live: false, error: 'Empty menu' };

            debug('Server Menu Normalized', cats);
            const changedIds = setLiveData(cats);
            window.__BACKEND_CONNECTED__ = true;
            return { live: true, changedIds };
        } catch (err) {
            return { live: false, error: err.message || 'Network error' };
        }
    };

    /** Did the last load come from the live API? */
    const isLive = () => _isLive;

    return Object.freeze({
        entries, allItems, findById, keys, get, load,
        fetchFromApi, connectLive, setLiveData,
        normalizeMenuFromServer, isLive,
    });
})();
