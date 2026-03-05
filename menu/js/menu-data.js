'use strict';

window.__SERVER_READY__ = false;

window.__BACKEND_CONNECTED__ = false;

const MenuData = (() => {

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

    let categories = {};

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

    const _initStatic = () => {
        categories = _filterActive(_staticCategories);

        for (const cat of Object.values(categories)) {
            cat.items.forEach(item => {
                if (!item._id) item._id = String(item.id);
            });
        }
        debug('Static Menu Loaded', Object.values(categories).flatMap(c => c.items));
    };

    // Static menu initialization disabled — rely on live menu from API
    // _initStatic();

    const entries = () => Object.entries(categories);

    const allItems = () => Object.values(categories).flatMap(c => c.items);

    const findById = (id) => allItems().find(i => i._id === String(id));

    const keys = () => Object.keys(categories);

    const get = (key) => categories[key];

    const load = (data) => {
        Object.keys(categories).forEach(k => delete categories[k]);

        const active = _filterActive(data);

        for (const [key, cat] of Object.entries(active)) {
            categories[key] = cat;
        }
    };

    const _staticCategoryOrder = Object.keys(_staticCategories);

    const _staticMeta = {};
    for (const [key, cat] of Object.entries(_staticCategories)) {
        _staticMeta[key] = { title: cat.title, icon: cat.icon };
    }

    const _titleToKey = {};
    for (const [key, cat] of Object.entries(_staticCategories)) {
        _titleToKey[cat.title.toLowerCase()] = key;
    }

    const _staticItemByName = {};
    for (const cat of Object.values(_staticCategories)) {
        for (const item of cat.items) {
            _staticItemByName[item.name.toLowerCase()] = item;
        }
    }

    const _resolveCategory = (raw) => {
        if (!raw) return 'other';
        return String(raw).trim().toLowerCase().replace(/\s+/g, '-');
    };

    const _normalizePrices = (raw) => {
        if (!raw) return [];

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

    const _normalizeVeg = (value) => {
        if (value === false || value === 0) return false;
        if (typeof value === 'string') {
            const v = value.trim().toLowerCase();
            if (v === 'false' || v === '0' || v === 'non-veg' || v === 'nonveg') return false;
        }
        return true;
    };

    const _normalizeItem = (serverItem) => {
        const _id = String(serverItem._id || serverItem.id || '');
        const name = String(serverItem.name || '');
        const prices = _normalizePrices(serverItem.prices || serverItem.price);
        const special = !!serverItem.special;
        const veg = _normalizeVeg(serverItem.veg);
        const active = serverItem.active !== false;

        const desc = String(serverItem.desc || serverItem.description || '');

        return { _id, name, desc, special, veg, active, prices };
    };

    const normalizeMenuFromServer = (serverData) => {
        if (!serverData) return {};
        debug('Server Menu Raw', serverData);

        let flatItems = [];

        if (Array.isArray(serverData)) {

            flatItems = serverData;
        } else if (typeof serverData === 'object') {

            const root = serverData.categories || serverData;
            if (typeof root === 'object' && !Array.isArray(root)) {
                for (const [key, cat] of Object.entries(root)) {
                    if (!cat || !Array.isArray(cat.items)) continue;

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

        const buckets = {};
        const labels = {};

        for (const raw of flatItems) {
            if (raw.active === false) continue;

            const item = _normalizeItem(raw);
            if (item.active === false) continue;

            const key = _resolveCategory(raw.category);
            if (!buckets[key]) buckets[key] = [];
            if (!labels[key]) labels[key] = String(raw.category || key);
            buckets[key].push(item);
        }

        const result = {};
        for (const [key, items] of Object.entries(buckets)) {
            const rawLabel = labels[key] || key;
            const title = rawLabel
                .split(/[-_\s]+/)
                .filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            result[key] = {
                title,
                icon:  '🍽️',
                items,
            };
        }

        return result;
    };

    const setLiveData = (liveCats) => {
        const changedIds = [];
        const filtered = _filterActive(liveCats);

        for (const [key, liveCat] of Object.entries(filtered)) {
            if (!categories[key]) {

                categories[key] = {
                    title: liveCat.title || key,
                    icon:  liveCat.icon  || '🍽️',
                    items: liveCat.items.map(i => ({ ...i })),
                };
                liveCat.items.forEach(i => changedIds.push(i._id));
                continue;
            }

            const currentCat = categories[key];
            if (liveCat.title) currentCat.title = liveCat.title;
            if (liveCat.icon && liveCat.icon !== '🍽️') currentCat.icon = liveCat.icon;

            const currentMap = new Map(currentCat.items.map(i => [i._id, i]));

            for (const liveItem of liveCat.items) {
                const existing = currentMap.get(liveItem._id);
                if (!existing) {

                    currentCat.items.push({ ...liveItem });
                    changedIds.push(liveItem._id);
                    continue;
                }

                let changed = false;
                for (const prop of ['name', 'desc', 'special', 'veg', 'active']) {
                    if (existing[prop] !== liveItem[prop]) {
                        existing[prop] = liveItem[prop];
                        changed = true;
                    }
                }

                if (JSON.stringify(existing.prices) !== JSON.stringify(liveItem.prices)) {
                    existing.prices = liveItem.prices.map(p => ({ ...p }));
                    changed = true;
                }

                if (changed) changedIds.push(existing._id);
            }

            const liveIds = new Set(liveCat.items.map(i => i._id));
            const removed = currentCat.items.filter(i => !liveIds.has(i._id));
            removed.forEach(i => changedIds.push(i._id));
            currentCat.items = currentCat.items.filter(i => liveIds.has(i._id));
        }

        for (const key of Object.keys(categories)) {
            if (!filtered[key]) {
                categories[key].items.forEach(i => changedIds.push(i._id));
                delete categories[key];
            }
        }

        _isLive = true;
        window.__SERVER_READY__ = true;
        debug('Menu Hot Swapped');
        return changedIds;
    };

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

        _isLive = false;
        window.__SERVER_READY__ = false;
        return { live: false, error: res.error || 'Empty menu data (no static fallback)' };
    };

    const CACHE_KEY = 'pf_menu_cache';
    const CACHE_TIME_KEY = 'pf_menu_cache_time';
    const FIVE_MIN = 5 * 60 * 1000;

    const _getCached = () => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            const ts  = localStorage.getItem(CACHE_TIME_KEY);
            if (raw && ts && (Date.now() - parseInt(ts, 10) < FIVE_MIN)) {
                return JSON.parse(raw);
            }
        } catch {  }
        return null;
    };

    const _setCache = (data) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch {  }
    };

    const clearCache = () => {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
    };

    const connectLive = async () => {

        const cached = _getCached();
        if (cached && Object.keys(cached).length) {
            debug('Menu loaded from cache');
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

            debug('Server Menu Normalized', cats);
            _setCache(cats);
            const changedIds = setLiveData(cats);
            window.__BACKEND_CONNECTED__ = true;
            return { live: true, changedIds };
        } catch (err) {
            return { live: false, error: err.message || 'Network error' };
        }
    };

    const isLive = () => _isLive;

    return Object.freeze({
        entries, allItems, findById, keys, get, load,
        fetchFromApi, connectLive, setLiveData,
        normalizeMenuFromServer, isLive, clearCache,
    });
})();



