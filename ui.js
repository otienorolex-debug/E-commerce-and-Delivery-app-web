/**
 * JAMBO MALL - UI RENDERING & DOM MUTATION ENGINE MODULE
 * Updates tracking status interfaces, error alerts, and catalog templates
 */

const KSH_RATE = 130;
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#ecf0f1"/><text x="50%" y="50%" text-anchor="middle" fill="#95a5a6" font-size="14" font-family="sans-serif">No image</text></svg>'
);

export const toKsh = usd => Math.round(usd * KSH_RATE);

export function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/**
 * Renders the structural grid elements for store products 
 * @param {HTMLElement} container - Target DOM grid layout box
 * @param {Array} products - System state product array data
 */
export function renderCatalogueGrid(container, products) {
    if (!products) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="padding:20px; grid-column:1/-1; text-align:center;">No stock items match your search.</p>';
        return;
    }

    container.innerHTML = products.map(item => `
        <div class="product-card">
            <img src="${item.thumbnail}" alt="${escapeHTML(item.title)}" loading="lazy"
                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
            <strong>${escapeHTML(item.title)}</strong>
            <p class="price">Ksh ${toKsh(item.price).toLocaleString()}</p>
            <button class="add-to-cart-btn" data-id="${item.id}" aria-label="Add ${escapeHTML(item.title)} to cart">+</button>
        </div>
    `).join('');
}

/**
 * Updates status text messages across the header input context panel
 */
export function setGlobalFeedback(element, text = '', color = '#7f8c8d') {
    element.textContent = text;
    element.style.color = color;
}

/**
 * Spawns delivery tracking timeline indicators
 */
export function updateDeliveryTracker(uiElements, activeOrder, timeElapsed, stages) {
    const { tracker, orderIdEl, progressBar, etaEl, timelineEl, lastUpdatedEl, deliveryBox } = uiElements;
    
    tracker.classList.remove('hidden');
    orderIdEl.textContent = activeOrder.id;
    deliveryBox.innerHTML = `<strong>${escapeHTML(activeOrder.rider)}</strong> (Contacting via ${escapeHTML(activeOrder.customerPhone)})`;

    // Compute progress percentages across linear operational boundaries
    const totalDuration = stages[stages.length - 1].at;
    const progressPercent = Math.min((timeElapsed / totalDuration) * 100, 100);
    progressBar.style.width = `${progressPercent}%`;

    // Render timeline steps
    timelineEl.innerHTML = stages.map(stage => {
        const isPassed = timeElapsed >= stage.at;
        return `
            <li class="${isPassed ? 'completed' : 'pending'}">
                <span>${stage.icon}</span> ${escapeHTML(stage.label)}
            </li>
        `;
    }).join('');

    const secondsLeft = Math.max(totalDuration - timeElapsed, 0);
    etaEl.textContent = secondsLeft > 0 ? `Estimated Delivery: ${secondsLeft}s` : 'Order Completed Successfully!';
    lastUpdatedEl.textContent = `Last synchronization: ${new Date().toLocaleTimeString()}`;
}
