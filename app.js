/**
 * Мой личный Нумеролог - Telegram Mini App Logic
 */

const tg = window.Telegram.WebApp;

// DOM Elements
const body = document.body;
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const lockedModal = document.getElementById('lockedModal');
const closeModal = document.getElementById('closeModal');
const lockedCards = document.querySelectorAll('.matrix-card.locked');

// App State
let currentState = {
    activeTab: 'home',
    user: null
};

/**
 * Initialize Telegram Web App
 */
function initTMA() {
    tg.ready();
    tg.expand(); // Make the app full screen

    // Apply theme colors directly (extra safety)
    body.style.backgroundColor = tg.backgroundColor;

    // Get User Data
    const userData = tg.initDataUnsafe?.user;
    if (userData) {
        currentState.user = userData;
        userName.textContent = userData.first_name || 'Пользователь';

        // If user has photo, set it
        if (userData.photo_url) {
            userAvatar.innerHTML = `<img src="${userData.photo_url}" alt="${userData.first_name}">`;
        }
    } else {
        userName.textContent = 'Гость';
    }

    // Set Main Button (Initially hidden)
    tg.MainButton.setParams({
        text: 'ПРОДОЛЖИТЬ',
        color: '#7c4dff',
        text_color: '#ffffff'
    });

    // Remove loading state
    body.classList.remove('loading');

    initEventListeners();
}

/**
 * Event Listeners
 */
function initEventListeners() {
    // Locked Cards Click
    lockedCards.forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.getAttribute('data-feature');
            showLockedModal(feature);
        });
    });

    // Modal Close
    closeModal.addEventListener('click', hideLockedModal);
    lockedModal.querySelector('.modal-overlay').addEventListener('click', hideLockedModal);

    // Bottom Nav Click logic (already in HTML but can be enhanced here)
}

/**
 * Navigation View Switcher (Main Tabs)
 */
function switchTab(tabId, element) {
    // Update Nav UI
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    // Switch View
    showView(tabId + 'View');

    tg.HapticFeedback.selectionChanged();
}

/**
 * Universal View Switcher
 */
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Show target view
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add('active');
    }
}

/**
 * Navigation between pages / deep views
 */
function navigateTo(pageId) {
    tg.HapticFeedback.impactOccurred('light');

    if (pageId === 'calculate') {
        showView('calcView');
    } else if (pageId === 'home') {
        showView('homeView');
    }
}

/**
 * Perform Calculation and Show Result
 */
function performCalculation() {
    const input = document.getElementById('birthDateInput');
    const dateStr = input.value;

    if (!dateStr) {
        tg.showAlert('Пожалуйста, выберите дату рождения');
        return;
    }

    // 1. Calculate Data
    const baseData = MatrixLogic.calculateBase(dateStr);

    // 2. Populate UI
    populateResultUI(baseData);

    // 3. Draw SVG
    drawMatrixSVG(baseData);

    // 4. Show Result View
    showView('resultView');
    tg.HapticFeedback.notificationOccurred('success');
}

/**
 * Fill Result Text Fields
 */
function populateResultUI(data) {
    const { date, destiny } = data;

    // Header
    const formattedDate = `${String(date.day).padStart(2, '0')}.${String(date.month).padStart(2, '0')}.${date.year}`;
    document.getElementById('resultDate').textContent = formattedDate;

    // Age calc
    const today = new Date();
    const bDate = new Date(date.year, date.month - 1, date.day);
    let age = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
    document.getElementById('resultAge').textContent = `${age} лет`;

    // Destiny Summary
    const summary = document.getElementById('destinySummary');
    summary.innerHTML = `
        <div class="destiny-item">
            <span class="destiny-label">Личное</span>
            <span class="destiny-value">${destiny.personal}</span>
        </div>
        <div class="destiny-item">
            <span class="destiny-label">Социальное</span>
            <span class="destiny-value">${destiny.social}</span>
        </div>
        <div class="destiny-item">
            <span class="destiny-label">Духовное</span>
            <span class="destiny-value">${destiny.spiritual}</span>
        </div>
        <div class="destiny-item">
            <span class="destiny-label">Планетарное</span>
            <span class="destiny-value">${destiny.planetary}</span>
        </div>
    `;
}

/**
 * Draw the actual matrix SVG (simplified version of original site)
 */
function drawMatrixSVG(data) {
    const svg = document.getElementById('matrixSvg');
    svg.innerHTML = '';

    const cx = 350, cy = 350, radius = 280, innerRadius = 230;
    const angles = [Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75, 0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75];

    // Layers
    const gLines = createSVGElement('g', { stroke: 'rgba(255,255,255,0.2)', 'stroke-width': 2 });
    const gNodes = createSVGElement('g');
    svg.append(gLines, gNodes);

    // 1. Draw Squares (Simplified)
    // Personal Square (0, 2, 4, 6)
    const pPoints = [0, 2, 4, 6].map(i => ({
        x: cx + radius * Math.cos(angles[i]),
        y: cy + radius * Math.sin(angles[i])
    }));
    for (let i = 0; i < 4; i++) {
        const p1 = pPoints[i], p2 = pPoints[(i + 1) % 4];
        gLines.append(createSVGElement('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }));
    }

    // 2. Draw Nodes
    const pointValues = data.values;
    const colors = ["#9A71C9", "#ffffff", "#9A71C9", "#ffffff", "#F34B47", "#ffffff", "#F34B47", "#ffffff"];

    for (let i = 0; i < 8; i++) {
        const x = cx + radius * Math.cos(angles[i]);
        const y = cy + radius * Math.sin(angles[i]);

        const circle = createSVGElement('circle', { cx: x, cy: y, r: 24, fill: colors[i], stroke: '#000', 'stroke-width': 2 });
        const text = createSVGElement('text', {
            x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
            fill: i % 2 === 0 ? '#fff' : '#000', 'font-weight': 'bold', 'font-size': 20
        });
        text.textContent = pointValues[i];

        gNodes.append(circle, text);
    }

    // Center Node
    const centerCircle = createSVGElement('circle', { cx: cx, cy: cy, r: 30, fill: '#F4F866', stroke: '#000', 'stroke-width': 2 });
    const centerText = createSVGElement('text', {
        x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: '#000', 'font-weight': 'bold', 'font-size': 22
    });
    centerText.textContent = data.points.centerValue;
    gNodes.append(centerCircle, centerText);
}

/**
 * Helper to create SVG elements
 */
function createSVGElement(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let key in attrs) el.setAttribute(key, attrs[key]);
    return el;
}

/**
 * Modal Controls
 */
function showLockedModal(feature) {
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');

    // Custom text based on feature
    if (feature === 'compatibility') {
        modalTitle.textContent = 'Совместимость';
        modalDesc.textContent = 'Узнайте кармические задачи и точки соприкосновения в ваших отношениях.';
    } else if (feature === 'year') {
        modalTitle.textContent = 'Прогноз на год';
        modalDesc.textContent = 'Подробная карта ваших возможностей, финансов и личного роста на ближайшие 12 месяцев.';
    }

    lockedModal.classList.add('active');
    tg.HapticFeedback.notificationOccurred('warning');
}

function hideLockedModal() {
    lockedModal.classList.remove('active');
}

// Start the APP
window.addEventListener('load', initTMA);
