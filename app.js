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
const birthDateInput = document.getElementById('birthDateInput');

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
    tg.expand();

    // Get User Data
    const userData = tg.initDataUnsafe?.user;
    if (userData) {
        currentState.user = userData;
        userName.textContent = userData.first_name || 'Пользователь';
        if (userData.photo_url) {
            userAvatar.innerHTML = `<img src="${userData.photo_url}" alt="${userData.first_name}">`;
        }
    } else {
        userName.textContent = 'Гость';
    }

    // Remove loading state
    body.classList.remove('loading');

    initEventListeners();
}

/**
 * Event Listeners
 */
function initEventListeners() {
    // Mask for Date Input (DD.MM.YYYY)
    if (birthDateInput) {
        birthDateInput.addEventListener('input', function (e) {
            let v = this.value.replace(/\D/g, '');
            if (v.length > 8) v = v.substring(0, 8);
            let formatted = '';
            if (v.length > 0) formatted += v.substring(0, 2);
            if (v.length > 2) formatted += '.' + v.substring(2, 4);
            if (v.length > 4) formatted += '.' + v.substring(4, 8);
            this.value = formatted;
        });
    }

    // Locked Cards Click
    lockedCards.forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.getAttribute('data-feature');
            showLockedModal(feature);
        });
    });

    closeModal.addEventListener('click', hideLockedModal);
    lockedModal.querySelector('.modal-overlay').addEventListener('click', hideLockedModal);
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

    // SPECIAL CASE: Hide Header and Footer on Result View
    const header = document.querySelector('.tma-header');
    const nav = document.querySelector('.tma-nav');

    if (viewId === 'resultView') {
        header.style.display = 'none';
        nav.style.display = 'none';
        document.body.style.paddingBottom = '0';
    } else {
        header.style.display = 'flex';
        nav.style.display = 'flex';
        document.body.style.paddingBottom = 'calc(80px + var(--safe-area-bottom))';
    }
}

function switchTab(tabId, element) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    showView(tabId + 'View');
    tg.HapticFeedback.selectionChanged();
}

function navigateTo(pageId) {
    tg.HapticFeedback.impactOccurred('light');
    if (pageId === 'calculate') showView('calcView');
    else if (pageId === 'home') showView('homeView');
}

/**
 * Perform Calculation
 */
function performCalculation() {
    const val = birthDateInput.value;
    const parts = val.split('.');
    if (parts.length !== 3 || parts[2].length !== 4) {
        tg.showAlert('Пожалуйста, введите дату в формате ДД.ММ.ГГГГ');
        return;
    }

    const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    const baseData = MatrixLogic.calculateBase(isoDate);
    const healthData = MatrixLogic.calculateHealth(baseData);

    populateResultUI(baseData, healthData);
    drawFullMatrixSVG(baseData);

    showView('resultView');
    tg.HapticFeedback.notificationOccurred('success');
}

function populateResultUI(data, health) {
    const { date, destiny } = data;
    document.getElementById('resultDate').textContent = `${String(date.day).padStart(2, '0')}.${String(date.month).padStart(2, '0')}.${date.year}`;

    const bDate = new Date(date.year, date.month - 1, date.day);
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    if (today.getMonth() < bDate.getMonth() || (today.getMonth() === bDate.getMonth() && today.getDate() < bDate.getDate())) age--;
    document.getElementById('resultAge').textContent = `${age} лет`;

    const summary = document.getElementById('destinySummary');
    summary.innerHTML = `
        <div class="destiny-item"><span class="destiny-label">Небо</span><span class="destiny-value">${destiny.sky}</span></div>
        <div class="destiny-item"><span class="destiny-label">Земля</span><span class="destiny-value">${destiny.earth}</span></div>
        <div class="destiny-item"><span class="destiny-label">Личное</span><span class="destiny-value">${destiny.personal}</span></div>
        <div class="destiny-item"><span class="destiny-label">Социальное</span><span class="destiny-value">${destiny.social}</span></div>
    `;

    const healthBody = document.getElementById('healthTableBody');
    if (healthBody) {
        healthBody.innerHTML = health.chakras.map(c => `
            <tr class="row-${c.color}"><td class="cell-name">${c.name}</td><td>${c.body}</td><td>${c.energy}</td><td>${c.emotion}</td></tr>
        `).join('') + `
            <tr class="row-total"><td class="cell-name">ИТОГО</td><td>${health.totals.reducedBody}</td><td>${health.totals.reducedEnergy}</td><td>${health.totals.reducedEmotion}</td></tr>
        `;
    }
}

/**
 * FULL SVG DRAWING LOGIC (PORTED FROM SITE)
 */
function drawFullMatrixSVG(data) {
    const svg = document.getElementById('matrixSvg');
    svg.innerHTML = '';
    const reduce = MatrixLogic.reduce;
    const cx = 350, cy = 350, radius = 270, innerRadius = 230, innerRadius2 = 197;
    const angles = [Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75, 0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75];

    const outerPoints = angles.map(a => ({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }));
    const uPoints = angles.map(a => ({ x: cx + innerRadius2 * Math.cos(a), y: cy + innerRadius2 * Math.sin(a) }));
    const yPoints = angles.map(a => ({ x: cx + innerRadius * Math.cos(a), y: cy + innerRadius * Math.sin(a) }));

    const lineLayer = createSVGElement('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 1.5 });
    const nodeLayer = createSVGElement('g');
    const textLayer = createSVGElement('g');
    svg.append(lineLayer, nodeLayer, textLayer);

    const drawNode = (x, y, r, fill, val, txtCol, fontSize = 20, stroke = "#000") => {
        nodeLayer.append(createSVGElement('circle', { cx: x, cy: y, r: r, fill: fill, stroke: stroke, 'stroke-width': 1.5 }));
        const t = createSVGElement('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: txtCol, 'font-weight': 'bold', 'font-size': fontSize });
        t.textContent = val;
        textLayer.append(t);
    };

    const connect = (p1, p2, opacity = 0.5) => {
        lineLayer.append(createSVGElement('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, opacity }));
    };

    // Squares
    // 1. Personal Square (Outer 0, 2, 4, 6)
    [0, 2, 4, 6].forEach((i, idx, arr) => connect(outerPoints[i], outerPoints[arr[(idx + 1) % 4]]));

    // 2. Ancestral Square (Calculated Y-Points 1, 3, 5, 7 - One row inward)
    [1, 3, 5, 7].forEach((i, idx, arr) => connect(yPoints[i], yPoints[arr[(idx + 1) % 4]]));

    // Main Axes
    connect(outerPoints[0], outerPoints[4]);
    connect(outerPoints[2], outerPoints[6]);

    // Nodes (Outer)
    const values = data.values;
    const outerCols = ["#9A71C9", "#ffffff", "#9A71C9", "#ffffff", "#F34B47", "#ffffff", "#F34B47", "#ffffff"];
    outerPoints.forEach((p, i) => drawNode(p.x, p.y, 22, outerCols[i], values[i], i % 2 === 0 ? '#fff' : '#000'));

    // Center
    drawNode(cx, cy, 28, "#F4F866", data.points.centerValue, "#000", 22);

    // Inner Nodes (U & Y)
    const uColors = ["#3EB4F0", "#fff", "#3EB4F0", "#fff", "#D88A4B", "#fff", "#D88A4B", "#fff"];
    const Y = data.Y;
    const U = data.U;

    for (let i = 0; i < 8; i++) {
        const px = cx + innerRadius * Math.cos(angles[i]);
        const py = cy + innerRadius * Math.sin(angles[i]);
        drawNode(px, py, 18, (i === 0 || i === 2) ? "#3366CC" : "#fff", Y[i], (i === 0 || i === 2) ? "#fff" : "#000", 18);
        drawNode(uPoints[i].x, uPoints[i].y, 15, uColors[i], U[i], i % 2 === 0 ? '#fff' : '#000', 14);
    }

    // Extra Icons (Heart, Dollar)
    const innerA = reduce(U[4] + U[6]);
    const innerB = reduce(U[4] + innerA);
    const innerC = reduce(U[6] + innerA);

    const drawExtra = (aIdx, ox, oy, val, let, lx, ly, col, dol, hrt) => {
        const x = cx + innerRadius2 * 0.5 * Math.cos(angles[aIdx]) + ox;
        const y = cy + innerRadius2 * 0.5 * Math.sin(angles[aIdx]) + oy;
        drawNode(x, y, 12, "#fff", val, "#000", 12);
        if (dol) {
            const t = createSVGElement('text', { x: x - 15, y: y - 37, fill: "#04dd00", 'font-weight': 'bold', 'font-size': 26 });
            t.textContent = "$"; textLayer.append(t);
        }
        if (hrt) {
            const p = createSVGElement('path', { d: `M ${x - 35} ${y - 35} c -5 -5, -15 0, -10 10 c 5 10, 15 10, 20 0 c 5 -10, -5 -15, -10 -10 Z`, fill: "#e84e42", stroke: "#000" });
            nodeLayer.append(p);
        }
    };
    drawExtra(5, 10, 10, innerA, 'К', -13, -13, "#fff", false, false);
    drawExtra(5, 80, 10, innerB, 'О', -13, -13, "#fff", true, false);
    drawExtra(5, 10, 80, innerC, 'Н', -13, -13, "#fff", false, true);

    // Diagonal Rays
    const drawRay = (idx, col, txt, flip) => {
        const pIn = uPoints[idx];
        const line = createSVGElement('line', { x1: cx, y1: cy, x2: pIn.x, y2: pIn.y, stroke: col, 'stroke-width': 2 });
        lineLayer.append(line);
        if (txt) {
            const mx = (cx + pIn.x) / 2, my = (cy + pIn.y) / 2;
            let deg = (angles[idx] * 180 / Math.PI) + (flip ? 180 : 0);
            const t = createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'font-size': 9, transform: `rotate(${deg} ${mx} ${my}) translate(0, -5)` });
            t.textContent = txt; textLayer.append(t);
        }
    };
    drawRay(1, "#3E67EE", "линия мужского рода", true);
    drawRay(3, "#F7494C", "линия женского рода", false);
    drawRay(5, "#3E67EE", "", false);
    drawRay(7, "#F7494C", "", true);

    // Perimeter Dots & Labels
    const drawPerimeter = (i1, i2, v1, v2) => {
        const p1 = outerPoints[i1], p2 = outerPoints[i2];
        const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len, ny = dx / len, ux = dx / len, uy = dy / len;
        const offset = 18;
        const p4 = reduce(v1 + v2), p2_ = reduce(p4 + v1), p1_ = reduce(p2_ + v1), p3 = reduce(p2_ + p4), p6 = reduce(p4 + v2), p5 = reduce(p4 + p6), p7 = reduce(p6 + v2);
        const dots = [null, p1_, p2_, p3, p4, p5, p6, p7];

        for (let j = 1; j <= 7; j++) {
            const t = 0.5 + (j - 4) / 9;
            const tx = p1.x + ux * len * t + nx * offset, ty = p1.y + uy * len * t + ny * offset;
            const d = createSVGElement('circle', { cx: tx, cy: ty, r: j === 4 ? 4 : 2, fill: "#cc3366" });
            nodeLayer.append(d);
            const l = createSVGElement('text', { x: tx - 8, y: ty, 'font-size': j === 4 ? 10 : 8 });
            l.textContent = dots[j]; textLayer.append(l);
        }
    };
    for (let i = 0; i < 8; i++) drawPerimeter(i, (i + 1) % 8, values[i], values[(i + 1) % 8]);

    // Age Markers
    const markers = ["A", "Д", "Б", "Е", "В", "Ж", "Г", "З"];
    const ages = ["0 лет", "10 лет", "20 лет", "30 лет", "40 лет", "50 лет", "60 лет", "70 лет"];
    outerPoints.forEach((p, i) => {
        const mx = p.x + ([-35, -25, 0, 25, 35, 25, 0, -25][i]), my = p.y + ([0, -25, -35, -25, 0, 25, 35, 25][i]);
        drawNode(mx, my, 12, (m) => (i % 2 === 0 ? "#a185c8" : "#000"), markers[i], "#fff", 12);
        const at = createSVGElement('text', { x: mx + ([-12, -12, 12, 12, 12, 12, 12, -12][i]), y: my, 'text-anchor': i === 0 || i === 1 || i === 7 ? 'end' : 'start', 'font-size': 11, 'font-weight': 'bold' });
        at.textContent = ages[i]; textLayer.append(at);
    });
}

function createSVGElement(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (let key in attrs) el.setAttribute(key, attrs[key]);
    return el;
}

function showLockedModal(feature) {
    const modalTitle = document.getElementById('modalTitle');
    if (feature === 'compatibility') modalTitle.textContent = 'Совместимость';
    else if (feature === 'year') modalTitle.textContent = 'Прогноз на год';
    lockedModal.classList.add('active');
    tg.HapticFeedback.notificationOccurred('warning');
}

function hideLockedModal() { lockedModal.classList.remove('active'); }

window.addEventListener('load', initTMA);
