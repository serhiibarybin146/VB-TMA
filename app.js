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

    // 1. Calculate Data using our shared logic
    const baseData = MatrixLogic.calculateBase(dateStr);
    const healthData = MatrixLogic.calculateHealth(baseData);

    // 2. Populate UI Text/Tables
    populateResultUI(baseData, healthData);

    // 3. Draw DETAILED SVG
    drawMatrixSVG(baseData);

    // 4. Show Result View
    showView('resultView');
    tg.HapticFeedback.notificationOccurred('success');
}

/**
 * Fill Result Text Fields and Tables
 */
function populateResultUI(data, health) {
    const { date, destiny, points } = data;

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
            <span class="destiny-label">Небо</span>
            <span class="destiny-value">${destiny.sky}</span>
        </div>
        <div class="destiny-item">
            <span class="destiny-label">Земля</span>
            <span class="destiny-value">${destiny.earth}</span>
        </div>
        <div class="destiny-item">
            <span class="destiny-label">Личное</span>
            <span class="destiny-value">${destiny.personal}</span>
        </div>
        <div class="destiny-item">
            <span class="destiny-label">Социальное</span>
            <span class="destiny-value">${destiny.social}</span>
        </div>
    `;

    // Populate Health Table (Chakras)
    const healthBody = document.getElementById('healthTableBody');
    if (healthBody) {
        healthBody.innerHTML = health.chakras.map(c => `
            <tr class="row-${c.color}">
                <td class="cell-name">${c.name}</td>
                <td>${c.body}</td>
                <td>${c.energy}</td>
                <td>${c.emotion}</td>
            </tr>
        `).join('') + `
            <tr class="row-total">
                <td class="cell-name">ИТОГО</td>
                <td>${health.totals.reducedBody}</td>
                <td>${health.totals.reducedEnergy}</td>
                <td>${health.totals.reducedEmotion}</td>
            </tr>
        `;
    }
}

/**
 * Draw the DETAILED matrix SVG (Matches original site)
 */
function drawMatrixSVG(data) {
    const svg = document.getElementById('matrixSvg');
    svg.innerHTML = '';

    const cx = 350, cy = 350, outerRadius = 270, innerRadius2 = 197;
    const angles = [Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75, 0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75];

    const outerPoints = angles.map(a => ({ x: cx + outerRadius * Math.cos(a), y: cy + outerRadius * Math.sin(a) }));
    const uPoints = angles.map(a => ({ x: cx + innerRadius2 * Math.cos(a), y: cy + innerRadius2 * Math.sin(a) }));

    // Layers
    const lineLayer = createSVGElement('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 1.5 });
    const nodeLayer = createSVGElement('g');
    const textLayer = createSVGElement('g');
    svg.append(lineLayer, nodeLayer, textLayer);

    // Helpers
    const connect = (p1, p2, opacity = 0.5) => {
        lineLayer.append(createSVGElement('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, opacity }));
    };

    const drawNode = (x, y, r, fill, val, txtCol, fontSize = 20) => {
        nodeLayer.append(createSVGElement('circle', { cx: x, cy: y, r: r, fill: fill, stroke: '#000', 'stroke-width': 1.5 }));
        const t = createSVGElement('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: txtCol, 'font-weight': 'bold', 'font-size': fontSize });
        t.textContent = val;
        textLayer.append(t);
    };

    // 1. DRAW SQUARES & AXES
    // Personal Square
    [0, 2, 4, 6].forEach((i, idx, arr) => connect(outerPoints[i], outerPoints[arr[(idx + 1) % 4]]));
    // Ancestral Square
    [1, 3, 5, 7].forEach((i, idx, arr) => connect(outerPoints[i], outerPoints[arr[(idx + 1) % 4]]));
    // Main Axes
    connect(outerPoints[0], outerPoints[4]);
    connect(outerPoints[2], outerPoints[6]);

    // 2. NODES
    const values = data.values;
    const colors = ["#9A71C9", "#ffffff", "#9A71C9", "#ffffff", "#F34B47", "#ffffff", "#F34B47", "#ffffff"];
    const txtColors = ["#fff", "#000", "#fff", "#000", "#fff", "#000", "#fff", "#000"];

    // Outer Points
    outerPoints.forEach((p, i) => drawNode(p.x, p.y, 22, colors[i], values[i], txtColors[i]));

    // Middle Points (U)
    const uColors = ["#3EB4F0", "#fff", "#3EB4F0", "#fff", "#D88A4B", "#fff", "#D88A4B", "#fff"];
    uPoints.forEach((p, i) => drawNode(p.x, p.y, 16, uColors[i], data.U[i], i % 2 === 0 ? '#fff' : '#000', 14));

    // Center
    drawNode(cx, cy, 28, "#F4F866", data.points.centerValue, "#000", 22);

    // 3. PERIMETER AGE MARKERS
    const markerData = [
        { letter: "A", age: "0 лет", off: [-35, 0], align: "end" },
        { letter: "Д", age: "10 лет", off: [-25, -25], align: "end" },
        { letter: "Б", age: "20 лет", off: [0, -35], align: "start" },
        { letter: "Е", age: "30 лет", off: [25, -25], align: "start" },
        { letter: "В", age: "40 лет", off: [35, 0], align: "start" },
        { letter: "Ж", age: "50 лет", off: [25, 25], align: "start" },
        { letter: "Г", age: "60 лет", off: [0, 35], align: "start" },
        { letter: "З", age: "70 лет", off: [-25, 25], align: "end" }
    ];

    markerData.forEach((m, i) => {
        const p = outerPoints[i];
        const mx = p.x + m.off[0], my = p.y + m.off[1];
        // Marker circle
        nodeLayer.append(createSVGElement('circle', { cx: mx, cy: my, r: 10, fill: i % 2 === 0 ? '#a185c8' : '#000' }));
        const lt = createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-size': 9, 'font-weight': 'bold' });
        lt.textContent = m.letter;
        textLayer.append(lt);
        // Age Text
        const at = createSVGElement('text', { x: mx + (m.align === 'start' ? 12 : -12), y: my, 'text-anchor': m.align, 'dominant-baseline': 'central', fill: '#000', 'font-size': 10, 'font-weight': 'bold' });
        at.textContent = m.age;
        textLayer.append(at);
    });
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
