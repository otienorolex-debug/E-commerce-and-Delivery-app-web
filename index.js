// --- JAMBO MALL & SHOPPING CENTRE CORE ENGINE ---

const API_BASE = 'https://dummyjson.com';
const KSH_RATE = 130; // estimate: 1 USD ≈ 130 Ksh
const HISTORY_KEY = 'jambo_search_history';
const ORDER_KEY = 'jambo_active_order';
const MAX_HISTORY = 8;

const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#ecf0f1"/><text x="50%" y="50%" text-anchor="middle" fill="#95a5a6" font-size="14" font-family="sans-serif">No image</text></svg>'
    );

// Delivery stages: "at" = seconds after the order is placed.
// Make these bigger (e.g. 600, 1800...) for a longer, more realistic delivery.
const STAGES = [
    { at: 0,  label: 'Order confirmed',                      icon: '✅' },
    { at: 10, label: 'Packing at Jambo Mall Sorting Hub',    icon: '📦' },
    { at: 25, label: 'G4S Transit Hub - Outbound Logistics', icon: '🚚' },
    { at: 40, label: 'Rider on the way to you',              icon: '🛵' },
    { at: 60, label: 'Delivered! Enjoy your items',          icon: '🎉' }
];
const RIDERS = ['Brian Otieno', 'Faith Wanjiru', 'Kevin Mutua', 'Amina Hassan', 'Peter Kamau'];

// DOM elements
const searchBar = document.getElementById('search-bar');
const searchButton = document.getElementById('search-button');
const searchList = document.getElementById('search-list');
const clearHistoryBtn = document.getElementById('clear-history');
const catalogueGrid = document.getElementById('catalogue-grid');
const cartList = document.getElementById('cart-list');
const globalMessage = document.getElementById('message');

const orderForm = document.getElementById('order-form');
const custName = document.getElementById('cust-name');
const custPhone = document.getElementById('cust-phone');
const custAddress = document.getElementById('cust-address');
const custPayment = document.getElementById('cust-payment');
const orderError = document.getElementById('order-error');
const placeOrderBtn = document.getElementById('place-order');
const cancelCheckoutBtn = document.getElementById('cancel-checkout');

const deliveryBox = document.getElementById('being-delivered-by');
const tracker = document.getElementById('tracker');
const orderIdEl = document.getElementById('order-id');
const progressBar = document.getElementById('progress-bar');
const etaEl = document.getElementById('eta');
const timelineEl = document.getElementById('timeline');
const lastUpdatedEl = document.getElementById('last-updated');
const cancelOrderBtn = document.getElementById('cancel-order');

// State
let currentProducts = [];
let cart = []; // [{ item, qty }]
let history = [];
let activeOrder = null;
let trackingInterval = null;
let requestId = 0;

// ---------- Helpers ----------
function setMessage(text = '', color = '#7f8c8d') {
    globalMessage.textContent = text;
    globalMessage.style.color = color;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

const toKsh = usd => Math.round(usd * KSH_RATE);

function loadStored(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function saveStored(key, value) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable, ignore */ }
}

// ---------- 1. Product loader ----------
function fetchStoreCatalogue(url = `${API_BASE}/products?limit=30`) {
    const myId = ++requestId; // ignore stale responses
    catalogueGrid.innerHTML =
        '<p style="padding:20px; grid-column:1/-1; text-align:center; color:#7f8c8d;">Syncing Jambo Mall inventory...</p>';

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (myId !== requestId) return;
            if (!data || !Array.isArray(data.products)) throw new Error('Unexpected data format');

            currentProducts = data.products;

            if (currentProducts.length === 0) {
                catalogueGrid.innerHTML =
                    '<p style="padding:20px; grid-column:1/-1; text-align:center;">No stock items match your search.</p>';
                return;
            }

            catalogueGrid.innerHTML = currentProducts.map(item => `
                <div class="product-card">
                    <img src="${item.thumbnail}" alt="${escapeHTML(item.title)}" loading="lazy"
                         onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
                    <strong>${escapeHTML(item.title)}</strong>
                    <p class="price">Ksh ${toKsh(item.price).toLocaleString()}</p>
                    <button onclick="addItemToCart(${item.id})" aria-label="Add ${escapeHTML(item.title)} to cart">+</button>
                </div>
            `).join('');
        })
        .catch(error => {
            if (myId !== requestId) return;
            catalogueGrid.innerHTML = `
                <div style="color:#e74c3c; padding:20px; grid-column:1/-1; text-align:center;">
                    <p>⚠️ <strong>Could not load products</strong></p>
                    <p style="font-size:13px; color:#7f8c8d; margin-top:5px;">Reason: ${escapeHTML(error.message)}</p>
                    <p style="font-size:13px; color:#7f8c8d;">Check your internet connection and try again.</p>
                </div>`;
            console.error(error);
        });
}

// ---------- 2. Search + history ----------
function renderHistory() {
    searchList.innerHTML = '';

    if (history.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = 'No recent searches';
        empty.className = 'history-empty';
        searchList.appendChild(empty);
        clearHistoryBtn.classList.add('hidden');
        return;
    }

    clearHistoryBtn.classList.remove('hidden');

    history.forEach(term => {
        const li = document.createElement('li');
        li.className = 'history-item';

        const label = document.createElement('span');
        label.textContent = term;
        label.className = 'history-term';
        label.title = 'Search again';
        label.addEventListener('click', () => {
            searchBar.value = term;
            executeSearch();
        });

        const del = document.createElement('button');
        del.type = 'button';
        del.textContent = '×';
        del.className = 'history-delete';
        del.title = 'Remove this search';
        del.setAttribute('aria-label', `Remove "${term}" from history`);
        del.addEventListener('click', () => deleteHistoryItem(term));

        li.append(label, del);
        searchList.appendChild(li);
    });
}

function addToHistory(query) {
    history = history.filter(t => t !== query);
    history.unshift(query);
    history = history.slice(0, MAX_HISTORY);
    saveStored(HISTORY_KEY, history);
    renderHistory();
}

function deleteHistoryItem(term) {
    history = history.filter(t => t !== term);
    saveStored(HISTORY_KEY, history);
    renderHistory();
}

function clearHistory() {
    history = [];
    saveStored(HISTORY_KEY, history);
    renderHistory();
}

function executeSearch() {
    const query = searchBar.value.trim().toLowerCase();
    if (!query) {
        setMessage('Please enter something to search!', '#e74c3c');
        return;
    }

    setMessage('');
    addToHistory(query);

    // Local Kenyan terms DummyJSON doesn't stock: show groceries instead
    const localKeywords = ['unga', 'sukuma', 'maize', 'shamba', 'chapati', 'mandazi', 'kericho'];
    const isLocal = localKeywords.some(keyword => query.includes(keyword));

    if (isLocal) {
        setMessage(`Showing grocery alternatives for "${query}"`, '#e67e22');
        fetchStoreCatalogue(`${API_BASE}/products/category/groceries`);
    } else {
        fetchStoreCatalogue(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
    }
}

searchButton.addEventListener('click', executeSearch);
searchBar.addEventListener('keydown', e => {
    if (e.key === 'Enter') executeSearch();
});
clearHistoryBtn.addEventListener('click', clearHistory);

// ---------- 3. Cart ----------
window.addItemToCart = function (productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;

    const line = cart.find(l => l.item.id === productId);
    if (line) line.qty++;
    else cart.push({ item: product, qty: 1 });

    updateCartUI();
};

window.changeQty = function (productId, delta) {
    const line = cart.find(l => l.item.id === productId);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart = cart.filter(l => l.item.id !== productId);
    updateCartUI();
};

window.removeFromCart = function (productId) {
    cart = cart.filter(l => l.item.id !== productId);
    updateCartUI();
};

function cartTotal() {
    return cart.reduce((sum, l) => sum + toKsh(l.item.price) * l.qty, 0);
}

function updateCartUI() {
    if (cart.length === 0) {
        cartList.innerHTML = '<p style="font-size:14px; color:#95a5a6;">Your shopping cart is empty</p>';
        orderForm.classList.add('hidden');
        return;
    }

    const rows = cart.map(({ item, qty }) => `
        <div class="cart-item" style="padding:6px 0; font-size:14px; border-bottom:1px solid #eee;">
            <div style="display:flex; justify-content:space-between; gap:8px;">
                <span>📦 ${escapeHTML(item.title)}</span>
                <span>Ksh ${(toKsh(item.price) * qty).toLocaleString()}</span>
            </div>
            <div style="margin-top:4px; display:flex; align-items:center; gap:6px;">
                <button onclick="changeQty(${item.id}, -1)" aria-label="Decrease quantity">−</button>
                <span>${qty}</span>
                <button onclick="changeQty(${item.id}, 1)" aria-label="Increase quantity">+</button>
                <button onclick="removeFromCart(${item.id})" style="margin-left:auto;">Remove</button>
            </div>
        </div>
    `).join('');

    cartList.innerHTML = `
        ${rows}
        <div class="cart-total" style="margin-top:10px; font-weight:bold; text-align:right;">
            Total: Ksh ${cartTotal().toLocaleString()}
        </div>
        <button id="checkout-button" onclick="openOrderForm()" style="margin-top:10px; width:100%;">Proceed to Order</button>
    `;
}

// ---------- 4. Ordering ----------
window.openOrderForm = function () {
    if (cart.length === 0) return;
    if (activeOrder && !isDelivered(activeOrder)) {
        setMessage('You already have an order on the way. Wait for it to arrive or cancel it first.', '#e74c3c');
        return;
    }
    orderError.textContent = '';
    orderForm.classList.remove('hidden');
    custName.focus();
};

cancelCheckoutBtn.addEventListener('click', () => {
    orderForm.classList.add('hidden');
    orderError.textContent = '';
});

function validateOrder() {
    const name = custName.value.trim();
    const phone = custPhone.value.replace(/\s+/g, '');
    const address = custAddress.value.trim();

    if (name.length < 2) return 'Please enter your full name.';
    if (!/^(?:\+254|0)[17]\d{8}$/.test(phone)) return 'Enter a valid Kenyan phone number, e.g. 0712345678.';
    if (address.length < 5) return 'Please enter a delivery address.';
    return '';
}

orderForm.addEventListener('submit', async e => {
    e.preventDefault();

    const problem = validateOrder();
    if (problem) {
        orderError.textContent = problem;
        return;
    }
    orderError.textContent = '';

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing order...';

    // Send the order to the API (DummyJSON simulates saving it)
    let apiRef = null;
    try {
        const res = await fetch(`${API_BASE}/carts/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 1,
                products: cart.map(l => ({ id: l.item.id, quantity: l.qty }))
            })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        apiRef = data.id;
    } catch (err) {
        console.warn('Order API unreachable, continuing with a local order reference.', err);
    }

    activeOrder = {
        id: 'JM-' + (apiRef ?? String(Date.now()).slice(-6)),
        createdAt: Date.now(),
        rider: RIDERS[Math.floor(Math.random() * RIDERS.length)],
        total: cartTotal(),
        items: cart.map(l => ({ title: l.item.title, qty: l.qty })),
        customer: {
            name: custName.value.trim(),
            phone: custPhone.value.trim(),
            address: custAddress.value.trim(),
            payment: custPayment.value
        }
    };
    saveStored(ORDER_KEY, activeOrder);

    const count = cart.reduce((n, l) => n + l.qty, 0);
    setMessage(`Order ${activeOrder.id} placed for ${count} item${count > 1 ? 's' : ''}. Thank you for shopping at Jambo Mall!`, '#27ae60');

    cart = [];
    updateCartUI();
    orderForm.reset();
    orderForm.classList.add('hidden');
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = 'Place Order';

    startTracking();
});

// ---------- 5. Live delivery tracking ----------
function isDelivered(order) {
    const elapsed = (Date.now() - order.createdAt) / 1000;
    return elapsed >= STAGES[STAGES.length - 1].at;
}

function formatCountdown(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function renderTracker() {
    if (!activeOrder) return;

    const elapsed = (Date.now() - activeOrder.createdAt) / 1000;
    const totalTime = STAGES[STAGES.length - 1].at;

    let stageIndex = 0;
    STAGES.forEach((s, i) => { if (elapsed >= s.at) stageIndex = i; });

    const delivered = stageIndex === STAGES.length - 1;
    const percent = Math.min(100, (elapsed / totalTime) * 100);

    tracker.classList.remove('hidden');
    orderIdEl.textContent = activeOrder.id;
    progressBar.style.width = percent + '%';

    if (delivered) {
        deliveryBox.textContent = `✅ Delivered by ${activeOrder.rider}`;
        etaEl.textContent = `Delivered to ${activeOrder.customer.address}`;
        cancelOrderBtn.textContent = 'Clear';
    } else {
        deliveryBox.textContent = `${STAGES[stageIndex].icon} ${activeOrder.rider} - ${STAGES[stageIndex].label}`;
        etaEl.textContent = `Estimated arrival in ${formatCountdown(totalTime - elapsed)}`;
        cancelOrderBtn.textContent = 'Cancel order';
    }

    timelineEl.innerHTML = STAGES.map((s, i) => {
        const cls = i < stageIndex || (delivered && i === stageIndex) ? 'done'
                  : i === stageIndex ? 'current' : '';
        return `<li class="${cls}"><span class="dot">${s.icon}</span> ${escapeHTML(s.label)}</li>`;
    }).join('');

    lastUpdatedEl.textContent = 'Last updated: ' + new Date().toLocaleTimeString();

    if (delivered) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
}

function startTracking() {
    clearInterval(trackingInterval);
    renderTracker();
    if (activeOrder && !isDelivered(activeOrder)) {
        trackingInterval = setInterval(renderTracker, 1000); // updates every second
    }
}

function resetDelivery() {
    clearInterval(trackingInterval);
    trackingInterval = null;
    activeOrder = null;
    saveStored(ORDER_KEY, null);
    tracker.classList.add('hidden');
    deliveryBox.textContent = 'No active orders yet.';
}

cancelOrderBtn.addEventListener('click', () => {
    if (!activeOrder) return;
    if (isDelivered(activeOrder)) {
        resetDelivery();
        return;
    }
    if (confirm('Cancel this order?')) {
        resetDelivery();
        setMessage('Your order was cancelled.', '#e67e22');
    }
});

// ---------- Start-up ----------
window.addEventListener('DOMContentLoaded', () => {
    fetchStoreCatalogue();
    updateCartUI();

    history = loadStored(HISTORY_KEY, []);
    renderHistory();

    // Resume an order that was in progress before a refresh
    activeOrder = loadStored(ORDER_KEY, null);
    if (activeOrder) startTracking();
});