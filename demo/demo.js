/* ============================================
   MenuNova Demo - Interactive JavaScript
   100% Static - No Backend Calls
   ============================================ */

// ============================================
// MOCK DATA
// ============================================

const MOCK_RESTAURANT = {
    name: "Demo Bistro",
    tagline: "Your digital dining experience"
};

const MOCK_MENU = {
    starters: [
        {
            id: 1,
            name: "Margherita Pizza",
            description: "Classic tomato, mozzarella, and fresh basil",
            price: 320,
            emoji: "🍕"
        },
        {
            id: 2,
            name: "Caesar Salad",
            description: "Crisp romaine, parmesan, croutons, caesar dressing",
            price: 240,
            emoji: "🥗"
        },
        {
            id: 3,
            name: "Garlic Bread",
            description: "Toasted sourdough with herb butter",
            price: 150,
            emoji: "🥖"
        },
        {
            id: 4,
            name: "Spring Rolls",
            description: "Crispy vegetable rolls with sweet chili sauce",
            price: 180,
            emoji: "🥟"
        }
    ],
    mains: [
        {
            id: 5,
            name: "Pasta Carbonara",
            description: "Creamy pasta with bacon and parmesan",
            price: 420,
            emoji: "🍝"
        },
        {
            id: 6,
            name: "Grilled Chicken",
            description: "Herb-marinated chicken with seasonal vegetables",
            price: 480,
            emoji: "🍗"
        },
        {
            id: 7,
            name: "Vegetable Stir Fry",
            description: "Fresh veggies in Asian sauce with jasmine rice",
            price: 360,
            emoji: "🥘"
        },
        {
            id: 8,
            name: "Fish & Chips",
            description: "Crispy battered fish with golden fries",
            price: 440,
            emoji: "🐟"
        }
    ],
    beverages: [
        {
            id: 9,
            name: "Fresh Juice",
            description: "Orange, apple, or mixed fruit",
            price: 120,
            emoji: "🥤"
        },
        {
            id: 10,
            name: "Iced Coffee",
            description: "Cold brew with milk and ice",
            price: 150,
            emoji: "☕"
        },
        {
            id: 11,
            name: "Mojito Mocktail",
            description: "Refreshing mint and lime drink",
            price: 180,
            emoji: "🍹"
        },
        {
            id: 12,
            name: "Milkshake",
            description: "Chocolate, vanilla, or strawberry",
            price: 160,
            emoji: "🥛"
        }
    ]
};

const MOCK_ORDERS = [
    {
        id: 1234,
        items: [
            { name: "Margherita Pizza", quantity: 2, price: 320 },
            { name: "Caesar Salad", quantity: 1, price: 240 }
        ],
        total: 880,
        status: "pending",
        time: "2 mins ago"
    },
    {
        id: 1235,
        items: [
            { name: "Pasta Carbonara", quantity: 1, price: 420 },
            { name: "Fresh Juice", quantity: 2, price: 120 }
        ],
        total: 660,
        status: "preparing",
        time: "5 mins ago"
    },
    {
        id: 1236,
        items: [
            { name: "Grilled Chicken", quantity: 1, price: 480 },
            { name: "Garlic Bread", quantity: 1, price: 150 },
            { name: "Iced Coffee", quantity: 1, price: 150 }
        ],
        total: 780,
        status: "preparing",
        time: "8 mins ago"
    }
];

const TOUR_STEPS = [
    {
        target: ".hero-title",
        title: "Welcome to MenuNova Demo",
        description: "This interactive demo showcases how MenuNova powers modern restaurants digitally.",
        position: { top: "20%", left: "20%" }
    },
    {
        target: ".mode-toggle",
        title: "Switch Between Views",
        description: "Toggle between customer menu view and admin dashboard to see both perspectives.",
        position: { top: "25%", left: "50%", transform: "translateX(-50%)" }
    },
    {
        target: ".menu-categories",
        title: "Digital Menu",
        description: "Customers browse your menu, add items to cart, and place orders instantly.",
        position: { top: "35%", left: "20%" }
    },
    {
        target: ".cart-indicator",
        title: "Real-Time Cart",
        description: "Every action updates instantly - no page refresh needed.",
        position: { top: "25%", right: "20%" }
    }
];

// ============================================
// STATE MANAGEMENT
// ============================================

const AppState = {
    currentView: 'menu',
    cart: [],
    currentOrderId: 1237,
    orders: [...MOCK_ORDERS],
    tourStep: 0,
    tourActive: false
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatPrice(price) {
    return `₹${price}`;
}

function generateOrderId() {
    return AppState.currentOrderId++;
}

function animateCount(element, target, prefix = '', duration = 1500) {
    const isRevenue = prefix === '₹';
    const start = 0;
    const increment = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = prefix + Math.floor(current).toLocaleString('en-IN');
    }, 16);
}

// ============================================
// MENU VIEW
// ============================================

function renderMenuView() {
    const container = document.getElementById('menuCategories');
    container.innerHTML = '';

    const categories = [
        { key: 'starters', title: 'Starters', icon: '🥗' },
        { key: 'mains', title: 'Main Course', icon: '🍕' },
        { key: 'beverages', title: 'Beverages', icon: '🥤' }
    ];

    categories.forEach((category, index) => {
        const section = document.createElement('section');
        section.className = 'cat-section';
        section.style.animationDelay = `${index * 100}ms`;

        const head = document.createElement('div');
        head.className = 'cat-head';
        head.innerHTML = `
            <span class="cat-icon">${category.icon}</span>
            <h2 class="cat-title">${category.title}</h2>
            <span class="cat-count">${MOCK_MENU[category.key].length}</span>
        `;
        section.appendChild(head);

        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'menu-grid';

        MOCK_MENU[category.key].forEach(item => {
            const itemCard = createMenuItem(item);
            itemsGrid.appendChild(itemCard);
        });

        section.appendChild(itemsGrid);
        container.appendChild(section);
    });
}

function createMenuItem(item) {
    const card = document.createElement('div');
    card.className = 'card menu-card';

    card.innerHTML = `
        <span class="card__emoji">${item.emoji}</span>
        <div class="card__content">
            <h3 class="card__name--center">${item.name}</h3>
            <p class="card__desc--center">${item.description}</p>
        </div>
        <div class="card__footer">
            <span class="card__price-simple">₹${item.price}</span>
            <button class="card__add-btn">Add</button>
        </div>
    `;

    const addBtn = card.querySelector('.card__add-btn');
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(item);
    });

    return card;
}

function addToCart(item) {
    const existingItem = AppState.cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        AppState.cart.push({ ...item, quantity: 1 });
    }

    updateCartIndicator();
    showCartAnimation();
}

function updateCartIndicator() {
    const count = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
    const indicator = document.getElementById('cartIndicator');
    const countEl = indicator.querySelector('.cart-count');
    
    countEl.textContent = count;
    
    // Animation
    indicator.style.transform = 'scale(1.2)';
    setTimeout(() => {
        indicator.style.transform = 'scale(1)';
    }, 200);
}

function showCartAnimation() {
    // Small visual feedback
    const indicator = document.getElementById('cartIndicator');
    indicator.style.boxShadow = '0 0 30px rgba(255, 106, 0, 0.8)';
    setTimeout(() => {
        indicator.style.boxShadow = '';
    }, 300);
}

// ============================================
// CART MODAL
// ============================================

function showCart() {
    const modal = document.getElementById('cartModal');
    const itemsContainer = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    if (AppState.cart.length === 0) {
        itemsContainer.innerHTML = '<p style="text-align: center; color: var(--c-text-dim);">Your cart is empty</p>';
        totalEl.textContent = formatPrice(0);
    } else {
        itemsContainer.innerHTML = '';
        let total = 0;

        AppState.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <span class="cart-item-emoji">${item.emoji}</span>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>Qty: ${item.quantity}</p>
                    </div>
                </div>
                <div class="cart-item-price">${formatPrice(itemTotal)}</div>
            `;
            itemsContainer.appendChild(cartItem);
        });

        totalEl.textContent = formatPrice(total);
    }

    modal.classList.add('active');
}

function hideCart() {
    document.getElementById('cartModal').classList.remove('active');
}

function checkout() {
    if (AppState.cart.length === 0) return;

    hideCart();

    const orderId = generateOrderId();
    const total = AppState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Show success modal
    const successModal = document.getElementById('orderSuccessModal');
    document.getElementById('orderId').textContent = `#${orderId}`;
    successModal.classList.add('active');

    // Simulate status progression
    simulateOrderStatus();

    // Clear cart
    AppState.cart = [];
    updateCartIndicator();
}

function simulateOrderStatus() {
    const steps = ['placed', 'preparing', 'ready'];
    let currentStep = 0;

    const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps.length) {
            clearInterval(interval);
            return;
        }

        const stepEl = document.querySelector(`.status-step[data-status="${steps[currentStep]}"]`);
        if (stepEl) {
            stepEl.classList.add('active');
        }
    }, 2000);
}

function closeSuccessModal() {
    document.getElementById('orderSuccessModal').classList.remove('active');
    
    // Reset status tracker
    document.querySelectorAll('.status-step').forEach((step, index) => {
        if (index === 0) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// ============================================
// ADMIN VIEW
// ============================================

function renderAdminView() {
    renderOrdersList();
    animateAnalytics();
}

function renderOrdersList() {
    const container = document.getElementById('ordersList');
    container.innerHTML = '';

    AppState.orders.forEach(order => {
        const orderCard = createOrderCard(order);
        container.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';

    const itemsHtml = order.items.map(item => `
        <div class="order-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">#${order.id}</div>
            <div class="order-time">${order.time}</div>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total">
            <span>Total</span>
            <span>${formatPrice(order.total)}</span>
        </div>
        <div class="order-actions">
            <span class="order-status-badge ${order.status}">${order.status}</span>
            ${order.status === 'pending' ? '<button class="btn-order-action" onclick="updateOrderStatus(' + order.id + ', \'preparing\')">Start Preparing</button>' : ''}
            ${order.status === 'preparing' ? '<button class="btn-order-action" onclick="updateOrderStatus(' + order.id + ', \'ready\')">Mark Ready</button>' : ''}
        </div>
    `;

    return card;
}

function updateOrderStatus(orderId, newStatus) {
    const order = AppState.orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        renderOrdersList();
    }
}

function animateAnalytics() {
    const numberElements = document.querySelectorAll('.analytics-number');
    
    numberElements.forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));
        if (target) {
            const isRevenue = el.textContent.includes('₹');
            animateCount(el, target, isRevenue ? '₹' : '');
        }
    });
}

// ============================================
// VIEW SWITCHING
// ============================================

function switchView(view) {
    AppState.currentView = view;

    // Update buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === view);
    });

    // Update views
    document.querySelectorAll('.demo-view').forEach(viewEl => {
        viewEl.classList.remove('active');
    });

    if (view === 'menu') {
        document.getElementById('menuView').classList.add('active');
    } else if (view === 'admin') {
        document.getElementById('adminView').classList.add('active');
        // Re-animate analytics when switching to admin
        setTimeout(() => animateAnalytics(), 300);
    }
}

// ============================================
// GUIDED TOUR
// ============================================

function startTour() {
    AppState.tourActive = true;
    AppState.tourStep = 0;
    document.getElementById('tourOverlay').classList.add('active');
    showTourStep();
}

function showTourStep() {
    const step = TOUR_STEPS[AppState.tourStep];
    if (!step) {
        endTour();
        return;
    }

    const tooltip = document.getElementById('tourTooltip');
    const title = document.getElementById('tourTitle');
    const description = document.getElementById('tourDescription');

    title.textContent = step.title;
    description.textContent = step.description;

    // Position tooltip
    Object.assign(tooltip.style, step.position);

    // Highlight target element
    const targetEl = document.querySelector(step.target);
    if (targetEl) {
        targetEl.style.position = 'relative';
        targetEl.style.zIndex = '10000';
    }
}

function nextTourStep() {
    // Reset previous highlight
    const prevStep = TOUR_STEPS[AppState.tourStep];
    if (prevStep) {
        const prevTarget = document.querySelector(prevStep.target);
        if (prevTarget) {
            prevTarget.style.position = '';
            prevTarget.style.zIndex = '';
        }
    }

    AppState.tourStep++;
    
    if (AppState.tourStep >= TOUR_STEPS.length) {
        endTour();
    } else {
        showTourStep();
    }
}

function endTour() {
    AppState.tourActive = false;
    AppState.tourStep = 0;
    document.getElementById('tourOverlay').classList.remove('active');

    // Reset all highlights
    TOUR_STEPS.forEach(step => {
        const target = document.querySelector(step.target);
        if (target) {
            target.style.position = '';
            target.style.zIndex = '';
        }
    });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    observer.observe(document.querySelector('.demo-interface'));
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Render menu
    renderMenuView();
    renderAdminView();

    // Start Demo Button
    document.getElementById('startDemoBtn').addEventListener('click', () => {
        document.querySelector('.demo-interface').scrollIntoView({ 
            behavior: 'smooth' 
        });
    });

    // Mode Toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.mode);
        });
    });

    // Cart
    document.getElementById('cartIndicator').addEventListener('click', showCart);
    document.getElementById('closeCartBtn').addEventListener('click', hideCart);
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.getElementById('closeSuccessBtn').addEventListener('click', closeSuccessModal);

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Tour
    document.getElementById('tourTrigger').addEventListener('click', startTour);
    document.getElementById('tourNext').addEventListener('click', nextTourStep);
    document.getElementById('tourSkip').addEventListener('click', endTour);

    // Scroll animations
    initScrollAnimations();

    // Update cart indicator initially
    updateCartIndicator();

    console.log('🚀 MenuNova Demo initialized - 100% static, no backend');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
