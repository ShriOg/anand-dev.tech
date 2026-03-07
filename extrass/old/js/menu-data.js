'use strict';

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
    };

    _initStatic();

    const entries = () => Object.entries(categories);

    const allItems = () => Object.values(categories).flatMap(c => c.items);

    const findById = (id) => allItems().find(i => i.id === id);

    const keys = () => Object.keys(categories);

    const get = (key) => categories[key];

    const load = (data) => {
        Object.keys(categories).forEach(k => delete categories[k]);
        Object.assign(categories, _filterActive(data));
    };

    const fetchFromApi = async () => {
        _initStatic();
        _isLive = false;
        return { live: false };
    };

    const isLive = () => _isLive;

    return Object.freeze({ entries, allItems, findById, keys, get, load, fetchFromApi, isLive });
})();
