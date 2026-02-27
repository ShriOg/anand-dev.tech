/* ========================================
   Pramod Fast Food — Menu Script
   ======================================== */

const menuData = {
    steam: {
        title: "Steam Momos",
        icon: "🥟",
        items: [
            { id: 1, name: "Veg Momos", desc: "Freshly steamed vegetable momos", prices: [{label: "5 Pcs", value: 30}, {label: "10 Pcs", value: 50}] },
            { id: 2, name: "Paneer Momos", desc: "Soft paneer filling with spices", prices: [{label: "5 Pcs", value: 50}, {label: "10 Pcs", value: 90}] },
            { id: 3, name: "Soya Momos", desc: "Protein-rich soya momos", prices: [{label: "5 Pcs", value: 30}, {label: "10 Pcs", value: 50}] },
            { id: 4, name: "Cheese Sweet Corn Momos", desc: "Cheesy corn delight", prices: [{label: "5 Pcs", value: 70}, {label: "10 Pcs", value: 120}], special: true }
        ]
    },
    fried: {
        title: "Fried Momos",
        icon: "🍤",
        items: [
            { id: 5, name: "Veg Fried Momos", desc: "Crispy golden fried momos", prices: [{label: "5 Pcs", value: 40}, {label: "10 Pcs", value: 60}] },
            { id: 6, name: "Paneer Fried Momos", desc: "Crunchy paneer momos", prices: [{label: "5 Pcs", value: 60}, {label: "10 Pcs", value: 100}] },
            { id: 7, name: "Soya Fried Momos", desc: "Crispy soya momos", prices: [{label: "5 Pcs", value: 40}, {label: "10 Pcs", value: 60}] },
            { id: 8, name: "Cheese Sweet Corn Fried Momos", desc: "Crispy cheese corn momos", prices: [{label: "5 Pcs", value: 80}, {label: "10 Pcs", value: 140}], special: true }
        ]
    },
    gravy: {
        title: "Gravy Momos",
        icon: "🍲",
        items: [
            { id: 9, name: "Veg Gravy Momos", desc: "Momos in spicy gravy", prices: [{label: "5 Pcs", value: 50}, {label: "8 Pcs", value: 70}] },
            { id: 10, name: "Paneer Gravy Momos", desc: "Paneer momos in rich gravy", prices: [{label: "5 Pcs", value: 70}, {label: "8 Pcs", value: 100}] },
            { id: 11, name: "Soya Gravy Momos", desc: "Soya momos in tasty gravy", prices: [{label: "5 Pcs", value: 50}, {label: "8 Pcs", value: 70}] },
            { id: 12, name: "Cheese Sweet Corn Gravy Momos", desc: "Cheese corn momos in gravy", prices: [{label: "5 Pcs", value: 90}, {label: "8 Pcs", value: 140}], special: true }
        ]
    },
    kurkure: {
        title: "Kurkure Momos",
        icon: "✨",
        items: [
            { id: 13, name: "Veg Kurkure Momos", desc: "Extra crispy kurkure style", prices: [{label: "5 Pcs", value: 50}, {label: "8 Pcs", value: 70}] },
            { id: 14, name: "Paneer Kurkure Momos", desc: "Paneer kurkure special", prices: [{label: "5 Pcs", value: 70}, {label: "8 Pcs", value: 100}] },
            { id: 15, name: "Soya Kurkure Momos", desc: "Soya kurkure delight", prices: [{label: "5 Pcs", value: 50}, {label: "8 Pcs", value: 70}] },
            { id: 16, name: "Cheese Sweet Corn Kukure Momos", desc: "Ultimate kurkure experience", prices: [{label: "5 Pcs", value: 90}, {label: "8 Pcs", value: 140}], special: true }
        ]
    },
    noodles: {
        title: "Noodles",
        icon: "🍜",
        items: [
            { id: 17, name: "Veg Noodles", desc: "Classic veg noodles", prices: [{label: "Half", value: 40}, {label: "Full", value: 70}] },
            { id: 18, name: "Hakka Noodles", desc: "Authentic hakka style", prices: [{label: "Half", value: 70}, {label: "Full", value: 100}] },
            { id: 19, name: "Chilli Garlic Noodles", desc: "Spicy garlic flavor", prices: [{label: "Half", value: 60}, {label: "Full", value: 90}] },
            { id: 20, name: "Malaysian Noodles", desc: "Exotic Malaysian style", prices: [{label: "Half", value: 90}, {label: "Full", value: 140}], special: true },
            { id: 21, name: "Schezwan Noodles", desc: "Hot & spicy schezwan", prices: [{label: "Half", value: 70}, {label: "Full", value: 100}] },
            { id: 22, name: "Butter Garlic Noodles", desc: "Buttery garlic goodness", prices: [{label: "Half", value: 80}, {label: "Full", value: 120}] },
            { id: 23, name: "Singapuri Noodles", desc: "Singapore special", prices: [{label: "Half", value: 70}, {label: "Full", value: 100}] },
            { id: 24, name: "Hongkong Noodles", desc: "Premium Hongkong style", prices: [{label: "Half", value: 100}, {label: "Full", value: 150}], special: true }
        ]
    },
    potato: {
        title: "Chilli Potato",
        icon: "🥔",
        items: [
            { id: 25, name: "French Fry", desc: "Crispy golden fries", prices: [{label: "Half", value: 30}, {label: "Full", value: 60}] },
            { id: 26, name: "Honey Chilli Potato", desc: "Sweet & spicy combo", prices: [{label: "Half", value: 70}, {label: "Full", value: 120}], special: true },
            { id: 27, name: "Chilli Potato", desc: "Spicy potato bites", prices: [{label: "Half", value: 50}, {label: "Full", value: 90}] },
            { id: 28, name: "Schezwan Chilli Potato", desc: "Schezwan spicy potato", prices: [{label: "Half", value: 70}, {label: "Full", value: 120}] }
        ]
    },
    rolls: {
        title: "Rolls",
        icon: "🌯",
        items: [
            { id: 29, name: "Veg Roll", desc: "Fresh veg wrap", prices: [{label: "1 Pc", value: 30}, {label: "2 Pcs", value: 60}] },
            { id: 30, name: "Chowmein Spring Roll", desc: "Noodles in a roll", prices: [{label: "1 Pc", value: 30}, {label: "2 Pcs", value: 50}] },
            { id: 31, name: "Veg Paneer Roll", desc: "Paneer wrap delight", prices: [{label: "1 Pc", value: 60}, {label: "2 Pcs", value: 110}] },
            { id: 32, name: "Kathi Roll", desc: "Authentic kathi roll", prices: [{label: "1 Pc", value: 60}, {label: "2 Pcs", value: 120}] },
            { id: 33, name: "Today Spl. Roll", desc: "Chef's special", prices: [{label: "1 Pc", value: 70}], special: true },
            { id: 34, name: "Veg Kurkure Roll", desc: "Crispy veg roll", prices: [{label: "1 Pc", value: 50}, {label: "2 Pcs", value: 80}] },
            { id: 35, name: "Chowmin Kurkure Roll", desc: "Crispy noodle roll", prices: [{label: "1 Pc", value: 40}, {label: "2 Pcs", value: 70}] },
            { id: 36, name: "Paneer Kurkure Roll", desc: "Crispy paneer roll", prices: [{label: "1 Pc", value: 60}, {label: "2 Pcs", value: 100}] }
        ]
    },
    chilli: {
        title: "Chilli Momos",
        icon: "🌶️",
        items: [
            { id: 37, name: "Veg Chilli Momos", desc: "Momos in chilli sauce", prices: [{label: "5 Pcs", value: 50}, {label: "10 Pcs", value: 90}] },
            { id: 38, name: "Veg Soya Chilli Momos", desc: "Soya in chilli sauce", prices: [{label: "5 Pcs", value: 50}, {label: "10 Pcs", value: 90}] },
            { id: 39, name: "Paneer Chilli Momos", desc: "Paneer chilli fusion", prices: [{label: "5 Pcs", value: 70}, {label: "10 Pcs", value: 120}] }
        ]
    },
    main: {
        title: "Main Course",
        icon: "🍚",
        items: [
            { id: 40, name: "Veg Fried Rice", desc: "Classic fried rice", prices: [{label: "Half", value: 50}, {label: "Full", value: 80}] },
            { id: 41, name: "Paneer Fried Rice", desc: "Paneer fried rice", prices: [{label: "Half", value: 60}, {label: "Full", value: 100}] },
            { id: 42, name: "Singapuri Fried Rice", desc: "Singapore style rice", prices: [{label: "Half", value: 70}, {label: "Full", value: 120}] },
            { id: 43, name: "Veg Manchurian", desc: "Veg balls in sauce", prices: [{label: "Half", value: 50}, {label: "Full", value: 90}] },
            { id: 44, name: "Paneer Manchurian", desc: "Paneer in manchurian", prices: [{label: "Half", value: 80}, {label: "Full", value: 140}], special: true },
            { id: 45, name: "Paneer Chilli", desc: "Spicy paneer dish", prices: [{label: "Half", value: 80}, {label: "Full", value: 140}], special: true }
        ]
    }
};

// --- State ---
let currentCategory = 'all';
let searchQuery = '';
let currentFilter = 'all';
let cart = {};

// --- DOM References ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// --- Stats ---
function updateStats() {
    const allItems = Object.values(menuData).flatMap(cat => cat.items);
    const specialCount = allItems.filter(item => item.special).length;
    const avgPrice = Math.round(allItems.reduce((sum, item) => sum + item.prices[0].value, 0) / allItems.length);

    $('#totalItems').textContent = allItems.length;
    $('#specialItems').textContent = specialCount;
    $('#avgPrice').textContent = `₹${avgPrice}`;
}

// --- Filtering ---
function filterItems(items) {
    return items.filter(item => {
        if (currentFilter === 'special') return item.special;
        if (currentFilter === 'under50') return item.prices[0].value < 50;
        if (currentFilter === 'under100') return item.prices[0].value < 100;
        return true;
    });
}

// --- Render Menu ---
function renderMenu() {
    const container = $('#menuContainer');
    container.innerHTML = '';

    const categories = currentCategory === 'all' ? Object.keys(menuData) : [currentCategory];

    categories.forEach(category => {
        const categoryData = menuData[category];
        let filteredItems = categoryData.items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filteredItems = filterItems(filteredItems);
        if (filteredItems.length === 0) return;

        const section = document.createElement('div');
        section.className = 'category-section';

        section.innerHTML = `
            <div class="category-header">
                <div class="category-icon">${categoryData.icon}</div>
                <div class="category-title">${categoryData.title}</div>
                <div class="category-count">${filteredItems.length}</div>
            </div>
            <div class="menu-grid">
                ${filteredItems.map(item => `
                    <div class="menu-card${item.special ? ' special-card' : ''}">
                        <div class="item-name-row">
                            <span class="veg-indicator"></span>
                            <span class="item-name">${item.name}</span>
                            ${item.special ? '<span class="special-badge">Special</span>' : ''}
                        </div>
                        ${item.desc ? `<div class="item-description">${item.desc}</div>` : ''}
                        <div class="prices">
                            ${item.prices.map(price => `
                                <div class="price-item">
                                    <span class="price-label">${price.label}</span>
                                    <div class="price-value">₹${price.value}</div>
                                    ${renderCartButton(item, price.label, price.value)}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.appendChild(section);
    });

    if (container.innerHTML === '') {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-text">No items found</div>
            </div>
        `;
    }
}

// --- Cart Button Render ---
function renderCartButton(item, size, price) {
    const itemKey = `${item.id}-${size}`;
    const qty = cart[itemKey]?.quantity || 0;

    if (qty === 0) {
        return `<button class="add-btn" onclick="addToCart(${item.id}, '${size}', ${price})">+ Add</button>`;
    } else {
        return `
            <div class="quantity-control">
                <button class="qty-btn" onclick="updateCart(${item.id}, '${size}', ${price}, -1)">−</button>
                <span class="qty-value">${qty}</span>
                <button class="qty-btn" onclick="updateCart(${item.id}, '${size}', ${price}, 1)">+</button>
            </div>
        `;
    }
}

// --- Cart Operations ---
function addToCart(itemId, size, price) {
    const item = Object.values(menuData).flatMap(cat => cat.items).find(i => i.id === itemId);
    const itemKey = `${itemId}-${size}`;

    cart[itemKey] = {
        id: itemId,
        name: item.name,
        size: size,
        price: price,
        quantity: 1
    };

    updateCartUI();
    renderMenu();
}

function updateCart(itemId, size, price, change) {
    const itemKey = `${itemId}-${size}`;

    if (!cart[itemKey]) {
        addToCart(itemId, size, price);
        return;
    }

    cart[itemKey].quantity += change;

    if (cart[itemKey].quantity <= 0) {
        delete cart[itemKey];
    }

    updateCartUI();
    renderMenu();
}

function updateCartUI() {
    const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
    const cartBadge = $('#cartBadge');

    if (cartCount > 0) {
        cartBadge.style.display = 'flex';
        cartBadge.textContent = cartCount;
    } else {
        cartBadge.style.display = 'none';
    }

    renderCartModal();
}

function renderCartModal() {
    const cartItemsEl = $('#cartItems');
    const cartFooter = $('#cartFooter');
    const items = Object.values(cart);

    if (items.length === 0) {
        cartItemsEl.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <div class="empty-cart-text">Your cart is empty</div>
            </div>
        `;
        cartFooter.style.display = 'none';
    } else {
        cartItemsEl.innerHTML = items.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">${item.size} × ${item.quantity}</div>
                </div>
                <div class="cart-item-price">₹${item.price * item.quantity}</div>
            </div>
        `).join('');

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        $('#cartTotal').textContent = `₹${total}`;
        cartFooter.style.display = 'block';
    }
}

function toggleCart() {
    $('#cartModal').classList.toggle('show');
    $('#modalOverlay').classList.toggle('show');
}

function checkout() {
    const items = Object.values(cart);
    if (items.length === 0) return;

    let message = "🛒 *New Order from Menu*\n\n";
    items.forEach(item => {
        message += `• ${item.name} (${item.size}) × ${item.quantity} = ₹${item.price * item.quantity}\n`;
    });

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    message += `\n*Total: ₹${total}*`;

    const whatsappUrl = `https://wa.me/918595928413?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    $$('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;

            // Scroll active tab into view
            tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

            renderMenu();
        });
    });

    // Filter chips
    $$('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $$('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderMenu();
        });
    });

    // Search with debounce
    let searchTimeout;
    const searchInput = $('#searchInput');
    const searchClear = $('#searchClear');

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchQuery = e.target.value;

        // Show/hide clear button
        if (searchClear) {
            searchClear.classList.toggle('show', searchQuery.length > 0);
        }

        searchTimeout = setTimeout(() => renderMenu(), 150);
    });

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            searchClear.classList.remove('show');
            renderMenu();
            searchInput.focus();
        });
    }

    // Back to top
    const backToTop = $('#backToTop');
    let scrollTicking = false;

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                backToTop.classList.toggle('show', window.scrollY > 400);
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Initial render
    updateStats();
    renderMenu();
});
