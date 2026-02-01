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

    // Request true fullscreen for deeper immersion (SDK 7.10+)
    if (tg.requestFullscreen) {
        tg.requestFullscreen();
    }

    // Sync with Telegram theme colors
    // Both set to 'bg_color' ensuring a seamless blend between Telegram and the app
    tg.setHeaderColor('bg_color');
    tg.setBackgroundColor('bg_color');

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

    // Make matrix clickable for zoom
    const matrixContainer = document.querySelector('.matrix-svg-container');
    if (matrixContainer) {
        matrixContainer.onclick = openMatrixZoom;
    }
}

/**
 * View Management
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

/**
 * MATRIX ZOOM LOGIC
 */
let zoomScale = 1;
let zoomPosX = 0;
let zoomPosY = 0;
let isZooming = false;
let startDist = 0;
let startScale = 1;
let startPosX = 0;
let startPosY = 0;
let lastTouchX = 0;
let lastTouchY = 0;

function openMatrixZoom() {
    const originalSvg = document.getElementById('matrixSvg');
    if (!originalSvg) return;

    const zoomOverlay = document.getElementById('matrixZoomOverlay');
    const zoomWrapper = document.getElementById('zoomSvgWrapper');

    // Clear and clone
    zoomWrapper.innerHTML = '';
    const clonedSvg = originalSvg.cloneNode(true);
    clonedSvg.id = 'matrixSvgZoomed';
    zoomWrapper.appendChild(clonedSvg);

    // Reset state
    zoomScale = 1;
    zoomPosX = 0;
    zoomPosY = 0;
    updateZoomTransform();

    zoomOverlay.classList.add('active');
    tg.HapticFeedback.impactOccurred('medium');
    document.body.style.overflow = 'hidden'; // Prevent scrolling background
}

function closeMatrixZoom() {
    const zoomOverlay = document.getElementById('matrixZoomOverlay');
    zoomOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function updateZoomTransform() {
    const wrapper = document.getElementById('zoomSvgWrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${zoomPosX}px, ${zoomPosY}px) scale(${zoomScale})`;
    }
}

function initZoomEvents() {
    const zoomContent = document.getElementById('zoomContent');
    if (!zoomContent) return;

    let gestureType = 'none'; // 'pan' or 'zoom'
    let lastTap = 0;

    zoomContent.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            isZooming = true;
            gestureType = 'zoom';
            startDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            startScale = zoomScale;
        } else if (e.touches.length === 1) {
            if (!isZooming) gestureType = 'pan';
            lastTouchX = e.touches[0].pageX;
            lastTouchY = e.touches[0].pageY;
        }
    }, { passive: false });

    zoomContent.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && isZooming) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            // Allow a bit of overscroll-out for smoothness, but clamp on touchend
            zoomScale = Math.min(Math.max(startScale * (dist / startDist), 0.8), 6);
            updateZoomTransform();
        } else if (e.touches.length === 1 && !isZooming) {
            const deltaX = e.touches[0].pageX - lastTouchX;
            const deltaY = e.touches[0].pageY - lastTouchY;

            if (zoomScale > 1) {
                e.preventDefault();
                zoomPosX += deltaX;
                zoomPosY += deltaY;
                updateZoomTransform();
            }

            lastTouchX = e.touches[0].pageX;
            lastTouchY = e.touches[0].pageY;
        }
    }, { passive: false });

    zoomContent.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
            // Clamping scale after gesture ends
            if (zoomScale < 1) zoomScale = 1;
            if (zoomScale > 5) zoomScale = 5;
            updateZoomTransform();
        }

        if (e.touches.length < 2) {
            isZooming = false;
        }

        // Double tap reset logic
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        // Only reset if it was a quick tap, not a long move/zoom
        if (tapLength < 300 && tapLength > 0 && gestureType === 'pan') {
            zoomScale = 1;
            zoomPosX = 0;
            zoomPosY = 0;
            updateZoomTransform();
            tg.HapticFeedback.notificationOccurred('success');
        }

        if (e.touches.length === 0) gestureType = 'none';
        lastTap = currentTime;
    });
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
    // Populate destiny values
    document.getElementById('val-sky').textContent = destiny.sky;
    document.getElementById('val-earth').textContent = destiny.earth;
    document.getElementById('val-personal').textContent = destiny.personal;
    document.getElementById('val-male').textContent = destiny.maleLine;
    document.getElementById('val-female').textContent = destiny.femaleLine;
    document.getElementById('val-social').textContent = destiny.social;
    document.getElementById('val-spiritual').textContent = destiny.spiritual;
    document.getElementById('val-planetary').textContent = destiny.planetary;

    // Populate codes section
    document.getElementById('val-male-code').textContent = destiny.maleCode.join(', ');
    document.getElementById('val-female-code').textContent = destiny.femaleCode.join(', ');
    document.getElementById('val-ancestral-power').textContent = destiny.ancestralPower;
    document.getElementById('val-internal-code').textContent = destiny.internalCode.join(', ');

    const healthBody = document.getElementById('healthTableBody');
    if (healthBody) {
        healthBody.innerHTML = health.chakras.map(c => `
            <tr class="row-${c.color}"><td>${c.body}</td><td>${c.energy}</td><td>${c.emotion}</td><td class="cell-name">${c.name}</td></tr>
        `).join('') + `
            <tr class="row-sum"><td>${health.totals.body}</td><td>${health.totals.energy}</td><td>${health.totals.emotion}</td><td class="cell-name">Сумма</td></tr>
            <tr class="row-total"><td>${health.totals.reducedBody}</td><td>${health.totals.reducedEnergy}</td><td>${health.totals.reducedEmotion}</td><td class="cell-name">Итого</td></tr>
        `;
    }
}

/**
 * FULL SVG DRAWING LOGIC (STRICTLY FROM original matrix.js)
 */
function drawFullMatrixSVG(data) {
    const svg = document.getElementById('matrixSvg');
    svg.innerHTML = '';
    const reduce = MatrixLogic.reduce;
    const cx = 350, cy = 350, radius = 270;

    const isMobile = true; // TMA is always mobile context
    const rScale = 1.25;
    const tScale = 1.20;

    const innerRadius = 220; // isMobile ? 220
    const innerRadius2 = 178.75; // isMobile ? 178.75

    const angles = [
        Math.PI,           // 0: Left
        Math.PI * 5 / 4,   // 1: Top-Left
        Math.PI * 3 / 2,   // 2: Top
        Math.PI * 7 / 4,   // 3: Top-Right
        0,                 // 4: Right
        Math.PI / 4,       // 5: Bottom-Right
        Math.PI / 2,       // 6: Bottom
        Math.PI * 3 / 4    // 7: Bottom-Left
    ];

    const outerPoints = angles.map(a => ({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }));
    const uPoints = angles.map(a => ({ x: cx + innerRadius2 * Math.cos(a), y: cy + innerRadius2 * Math.sin(a) }));

    const lineLayer = createSVGElement('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 2 });
    const nodeLayer = createSVGElement('g');
    const textLayer = createSVGElement('g');
    const ageLayer = createSVGElement('g', { class: 'age-labels' }); // New layer for ages
    svg.append(lineLayer, ageLayer, nodeLayer, textLayer); // ageLayer below nodes

    function drawGenericLine(p1, p2, col, width = 2, opacity = 0.5) {
        lineLayer.append(createSVGElement('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: col, 'stroke-width': width, opacity }));
    }

    // --- NEW: Draw Age Labels 1-79 ---
    (function drawAgeLabels() {
        for (let i = 0; i < 8; i++) {
            const p1 = outerPoints[i];
            const p2 = outerPoints[(i + 1) % 8];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            // Calculate normal vector pointing INWARDS (towards center)
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            const vcx = cx - mx;
            const vcy = cy - my;
            const distC = Math.hypot(vcx, vcy);
            const nx = vcx / distC;
            const ny = vcy / distC;

            const labelOffset = -2.5 * rScale; // Negative offset as requested

            for (let j = 1; j <= 9; j++) {
                const t = j / 10;
                const x = p1.x + dx * t;
                const y = p1.y + dy * t;

                // Position for label
                const lx = x + nx * labelOffset;
                const ly = y + ny * labelOffset;

                const ageVal = i * 10 + j;

                // Small dot on the line
                // lineLayer.append(createSVGElement('circle', { cx: x, cy: y, r: 2 * rScale, fill: '#ccc' })); // Optional: user asked for "figures", maybe dots too? "on same points" implies points.

                const isMid = (j === 5); // 5, 15, 25...

                // Text
                const ageText = createSVGElement('text', {
                    x: lx, y: ly,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'central',
                    fill: isMid ? '#000' : '#999',
                    'font-size': (isMid ? 11 : 10) * tScale,
                    'font-weight': isMid ? '700' : 'normal',
                    'font-family': 'Manrope, sans-serif'
                });
                ageText.textContent = ageVal;
                ageLayer.append(ageText);
            }
        }
    })();

    function connectNodes(idx1, idx2, pts, offsetR = 22, col = "#888", width = 2, opacity = 0.5) {
        const p1 = pts[idx1], p2 = pts[idx2];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const start = { x: p1.x + offsetR * Math.cos(angle), y: p1.y + offsetR * Math.sin(angle) };
        const end = { x: p2.x - offsetR * Math.cos(angle), y: p2.y - offsetR * Math.sin(angle) };
        drawGenericLine(start, end, col, width, opacity);
    }

    function drawNode(x, y, r, fill, stroke, val, txtCol, fontSize = 25) {
        const scaledR = r * rScale;
        const scaledFS = fontSize * tScale;
        nodeLayer.append(createSVGElement('circle', { cx: x, cy: y, r: scaledR, fill: fill, stroke: stroke, 'stroke-width': 2 }));
        const t = createSVGElement('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: txtCol, 'font-weight': 'bold', 'font-size': scaledFS });
        t.textContent = val;
        textLayer.append(t);
    }

    // 1. Personal Square (Diamond): 0-2-4-6
    connectNodes(0, 2, outerPoints); connectNodes(2, 4, outerPoints);
    connectNodes(4, 6, outerPoints); connectNodes(6, 0, outerPoints);

    // 2. Ancestral Square: 1-3-5-7
    connectNodes(1, 3, outerPoints); connectNodes(3, 5, outerPoints);
    connectNodes(5, 7, outerPoints); connectNodes(7, 1, outerPoints);

    // 2.5 MAIN AXES
    connectNodes(0, 4, outerPoints);
    connectNodes(2, 6, outerPoints);

    // Nodes (Outer)
    const values = data.values;
    const outerColors = ["#9A71C9", "#ffffff", "#9A71C9", "#ffffff", "#F34B47", "#ffffff", "#F34B47", "#ffffff"];
    const outerTxtCols = ["#fff", "#000", "#FFF", "#000", "#FFF", "#000", "#FFF", "#000"];
    outerPoints.forEach((p, i) => drawNode(p.x, p.y, 22, outerColors[i], "#000", values[i], outerTxtCols[i]));

    // Center
    drawNode(cx, cy, 28, "#F4F866", "#000", data.points.centerValue, "#000", 18);
    // ZK
    const zkDotY = cy + 50;
    nodeLayer.append(createSVGElement('circle', { cx: cx, cy: zkDotY, r: 10 * rScale, fill: "#F4F866", stroke: "#000", 'stroke-width': 1 }));
    textLayer.append(createSVGElement('text', { x: cx, y: zkDotY, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#000", 'font-weight': 'bold', 'font-size': 10 * tScale, content: "ЗК" }));
    // Note: 'content' is for later textContent assignment
    svg.querySelectorAll('text').forEach(t => { if (t.getAttribute('content')) { t.textContent = t.getAttribute('content'); t.removeAttribute('content'); } });

    // Inner Nodes (Y and U)
    const Y = data.Y;
    const U = data.U;
    const uColors = ["#3EB4F0", "#fff", "#3EB4F0", "#fff", "#D88A4B", "#fff", "#D88A4B", "#fff"];
    const uTxtColors = ["#fff", "#000", "#fff", "#000", "#fff", "#000", "#fff", "#000"];

    for (let i = 0; i < 8; i++) {
        const px = cx + innerRadius * Math.cos(angles[i]);
        const py = cy + innerRadius * Math.sin(angles[i]);
        let fill = (i % 2 !== 0) ? "#fff" : "#fff";
        if (i === 0 || i === 2) fill = "#3366CC";
        drawNode(px, py, 18, fill, "#000", Y[i], (fill === "#3366CC") ? "#fff" : "#000", 20);

        drawNode(uPoints[i].x, uPoints[i].y, 15, uColors[i], "#000", U[i], uTxtColors[i], 16);
    }

    // Mids
    const midU1 = reduce(U[0] + data.points.centerValue);
    const midU2 = reduce(U[2] + data.points.centerValue);
    const radMid = innerRadius2 / 2;
    drawNode(cx + radMid * Math.cos(angles[0]), cy + radMid * Math.sin(angles[0]), 15, "#73b55f", "#000", midU1, "#fff", 14);
    drawNode(cx + radMid * Math.cos(angles[2]), cy + radMid * Math.sin(angles[2]), 15, "#73b55f", "#000", midU2, "#fff", 14);

    // Extra Icons Logic
    const innerA = reduce(U[4] + U[6]);
    const innerB = reduce(U[4] + innerA);
    const innerC = reduce(U[6] + innerA);

    function drawExtra(angleIdx, offX, offY, val, letter, lOffX, lOffY, col, dol, hrt) {
        const rad = innerRadius2 * 0.5;
        const x = cx + rad * Math.cos(angles[angleIdx]) + offX;
        const y = cy + rad * Math.sin(angles[angleIdx]) + offY;
        drawNode(x, y, 12, col, "#000", val, "#000", 14);
        // Letter Circle
        nodeLayer.append(createSVGElement('circle', { cx: x + lOffX, cy: y + lOffY, r: 7 * rScale, fill: "#000" }));
        textLayer.append(createSVGElement('text', { x: x + lOffX, y: y + lOffY, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#fff", 'font-weight': 'bold', 'font-size': 9 * tScale, content: letter }));
        if (dol) {
            const d = createSVGElement('text', { x: x - 15, y: y - 37, fill: "#04dd00", 'font-weight': 'bold', 'font-size': 26 * tScale });
            d.textContent = "$"; textLayer.append(d);
        }
        if (hrt) {
            const hx = x - 35, hy = y - 35;
            const p = createSVGElement('path', { d: `M ${hx} ${hy} c ${-5 * rScale} ${-5 * rScale}, ${-15 * rScale} 0, ${-10 * rScale} ${10 * rScale} c ${5 * rScale} ${10 * rScale}, ${15 * rScale} ${10 * rScale}, ${20 * rScale} 0 c ${5 * rScale} ${-10 * rScale}, ${-5 * rScale} ${-15 * rScale}, ${-10 * rScale} ${-10 * rScale} Z`, fill: "#e84e42", stroke: "#000" });
            nodeLayer.append(p);
        }
    }
    drawExtra(5, 10, 10, innerA, "К", -13, -13, "#fff", false, false);
    drawExtra(5, 80, 10, innerB, "О", -13, -13, "#fff", true, false);
    drawExtra(5, 10, 80, innerC, "Н", -13, -13, "#fff", false, true);

    // Diagonal Rays
    function drawRay(idx, col, txt, isFlip) {
        const pInner = uPoints[idx];
        const line = createSVGElement('line', { x1: cx, y1: cy, x2: pInner.x, y2: pInner.y, stroke: col, 'stroke-width': 2 });
        lineLayer.append(line);
        if (txt) {
            const mx = (cx + pInner.x) / 2, my = (cy + pInner.y) / 2;
            let deg = (angles[idx] * 180 / Math.PI) + (isFlip ? 180 : 0);
            const t = createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'font-size': 9 * tScale, transform: `rotate(${deg} ${mx} ${my}) translate(0, -5)` });
            t.textContent = txt; textLayer.append(t);
        }
    }
    drawRay(1, "#3E67EE", "линия мужского рода", true);
    drawRay(3, "#F7494C", "линия женского рода", false);
    drawRay(5, "#3E67EE", "", false);
    drawRay(7, "#F7494C", "", true);

    // Detailed Perimeter (Perfectly aligned outside)
    function drawPerimeter(i1, i2, v1, v2) {
        const p1 = outerPoints[i1], p2 = outerPoints[i2];
        const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.sqrt(dx * dx + dy * dy);
        let nx = -dy / len, ny = dx / len; // Normal vector
        const mxGlobal = (p1.x + p2.x) / 2, myGlobal = (p1.y + p2.y) / 2;

        // Always push logic 'outward' from center
        if (nx * (mxGlobal - cx) + ny * (myGlobal - cy) < 0) { nx = -nx; ny = -ny; }

        const offsetLine = 30; // Line distance from nodes
        const offsetText = 48; // Text distance from nodes (stays outside line)
        const ux = dx / len, uy = dy / len;

        // Draw side line
        drawGenericLine({ x: p1.x + nx * offsetLine - ux * 15, y: p1.y + ny * offsetLine - uy * 15 }, { x: p2.x + nx * offsetLine + ux * 15, y: p2.y + ny * offsetLine + uy * 15 }, "#000", 1.5, 0.6);

        const p4 = reduce(v1 + v2), p2_ = reduce(p4 + v1), p1_ = reduce(p2_ + v1), p3 = reduce(p2_ + p4), p6 = reduce(p4 + v2), p5 = reduce(p4 + p6), p7 = reduce(p6 + v2);
        const vals = [null, p1_, p2_, p3, p4, p5, p6, p7];

        for (let j = 1; j <= 7; j++) {
            const t = 0.5 + (j - 4) / 9;
            const tx = p1.x + ux * len * t + nx * offsetLine;
            const ty = p1.y + uy * len * t + ny * offsetLine;

            // Text position (further out than line)
            const tax = p1.x + ux * len * t + nx * offsetText;
            const tay = p1.y + uy * len * t + ny * offsetText;

            // Dot
            nodeLayer.append(createSVGElement('circle', { cx: tx, cy: ty, r: (j === 4 ? 4 : 2) * rScale, fill: "#cc3366" }));

            // Label (Outside)
            const l = createSVGElement('text', {
                x: tax, y: tay,
                'text-anchor': 'middle', 'dominant-baseline': 'central',
                'font-size': (j === 4 ? 11 : 9) * tScale,
                'font-weight': j === 4 ? 'bold' : 'normal'
            });
            l.textContent = vals[j];
            textLayer.append(l);
        }
    }
    for (let i = 0; i < 8; i++) drawPerimeter(i, (i + 1) % 8, values[i], values[(i + 1) % 8]);

    // Age Markers (Outer labels)
    const mLetters = ["A", "Д", "Б", "Е", "В", "Ж", "Г", "З"], mAges = ["0 лет", "10 лет", "20 лет", "30 лет", "40 лет", "50 лет", "60 лет", "70 лет"];
    const mOffsets = [[-42.5, 0], [-30, -30], [0, -42.5], [30, -30], [42.5, 0], [30, 30], [0, 42.5], [-30, 30]];
    const mAligns = ["end", "end", "start", "start", "start", "start", "start", "end"];
    outerPoints.forEach((p, i) => {
        const mx = p.x + mOffsets[i][0], my = p.y + mOffsets[i][1];
        nodeLayer.append(createSVGElement('circle', { cx: mx, cy: my, r: 12 * rScale, fill: (["В", "Г"].includes(mLetters[i]) ? "#e84e42" : (i % 2 !== 0 ? "#000" : "#a185c8")) }));
        textLayer.append(createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#fff", 'font-weight': 'bold', 'font-size': 14 * tScale, content: mLetters[i] }));
        // Position age text: for 0 лет (i=0) and 40 лет (i=4) place below circle, others to the side
        if (i === 0 || i === 4) {
            textLayer.append(createSVGElement('text', { x: mx, y: my + 22 * tScale, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#000", 'font-weight': "bold", 'font-size': 12 * tScale, content: mAges[i] }));
        } else {
            textLayer.append(createSVGElement('text', { x: mx + (mAligns[i] === 'start' ? 15 : -15) * tScale, y: my, 'text-anchor': mAligns[i], 'dominant-baseline': 'central', fill: "#000", 'font-weight': "bold", 'font-size': 13 * tScale, content: mAges[i] }));
        }
    });

    // Final text content reassignment for safety
    svg.querySelectorAll('text').forEach(t => { if (t.getAttribute('content')) { t.textContent = t.getAttribute('content'); t.removeAttribute('content'); } });
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

initZoomEvents();
window.addEventListener('load', initTMA);
