/**
 * Year Forecast Matrix — ПОЛНАЯ ЛОГИКА + ТОЧНЫЙ ВИЗУАЛ ОСНОВНОЙ МАТРИЦЫ
 * Базируется на matrix-logic.js + точная копия рендерера из app.js
 */

const YearMatrixLogic = {

    /* ─── МАТЕМАТИЧЕСКАЯ БАЗА (из matrix-logic.js) ─── */

    reduce(n) {
        let val = parseInt(n) || 0;
        if (val === 0) return 0;
        while (val > 22) {
            val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return val;
    },

    reduce9(n) {
        let val = parseInt(n) || 0;
        if (val === 0) return 0;
        while (val > 9) {
            val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return val;
    },

    calculateMoneyCode(day, month, year) {
        const c1 = this.reduce9(day);
        const c2 = this.reduce9(month);
        const c3 = this.reduce9(year);
        const c4 = this.reduce9(c1 + c2 + c3);
        const c5 = this.reduce9(c1 + c2 + c3 + c4);
        return { corners: [c1, c2, c3, c4, c5], code: `${c1}${c2}${c3}${c4}${c5}` };
    },

    calculateBase(dateStr) {
        const [yearStr, monthStr, dayStr] = dateStr.split("-");
        const day = parseInt(dayStr);
        const month = parseInt(monthStr);
        const year = parseInt(yearStr);

        const rDay = this.reduce(day);
        const rMonth = this.reduce(month);
        const rYear = this.reduce(yearStr.split("").reduce((a, b) => a + parseInt(b), 0));
        const sumBottom = this.reduce(rDay + rMonth + rYear);

        const centerValue = this.reduce(rDay + rMonth + rYear + sumBottom);

        const tl = this.reduce(rDay + rMonth);
        const tr = this.reduce(rMonth + rYear);
        const br = this.reduce(rYear + sumBottom);
        const bl = this.reduce(sumBottom + rDay);

        const values = [rDay, tl, rMonth, tr, rYear, br, sumBottom, bl];
        const U = values.map(v => this.reduce(v + centerValue));
        const Y = values.map((v, idx) => this.reduce(v + U[idx]));

        const sky = this.reduce(rMonth + sumBottom);
        const earth = this.reduce(rDay + rYear);
        const maleLine = this.reduce(tl + br);
        const femaleLine = this.reduce(tr + bl);

        return {
            date: { day, month, year },
            points: { rDay, rMonth, rYear, sumBottom, centerValue, tl, tr, br, bl },
            values, U, Y,
            destiny: { sky, earth, personal: this.reduce(sky + earth), maleLine, femaleLine, social: this.reduce(maleLine + femaleLine) }
        };
    },

    calculate(day, month, year) {
        const pad = n => String(n).padStart(2, '0');
        const dateStr = `${year}-${pad(month)}-${pad(day)}`;
        const base = this.calculateBase(dateStr);

        // 12 месяцев (Прогноз)
        const months = [];
        let cur = new Date(year, month - 1, day);
        for (let i = 0; i < 12; i++) {
            let start = new Date(cur);
            let end = new Date(cur);
            end.setMonth(end.getMonth() + 1);
            end.setDate(end.getDate() - 1);
            const fmt = d => ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();
            months.push({
                seq: i,
                label: i === 0 ? 12 : i,
                dateStart: fmt(start),
                dateEnd: fmt(end),
                value: this.reduce(base.points.rYear + i) // Placeholder
            });
            cur = new Date(end); cur.setDate(cur.getDate() + 1);
        }
        base.months = months;
        return base;
    },

    /* ─── ВИЗУАЛИЗАЦИЯ (ТОЧНАЯ КОПИЯ ИЗ app.js + months) ─── */

    drawSVG(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const W = 700, H = 700;
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.style.width = '100%';
        svg.style.height = 'auto';
        container.appendChild(svg);

        const cx = 350, cy = 350, radius = 270;
        const rScale = 1.25, tScale = 1.20;
        const innerRadius = 220, innerRadius2 = 178.75;
        const R_MONTHS = 55; // Смещаем кольцо месяцев к центру (было 225)

        const angles = [
            Math.PI, Math.PI * 5 / 4, Math.PI * 3 / 2, Math.PI * 7 / 4,
            0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4
        ];
        const outerPoints = angles.map(a => ({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }));
        const uPoints = angles.map(a => ({ x: cx + innerRadius2 * Math.cos(a), y: cy + innerRadius2 * Math.sin(a) }));

        const lineLayer = createSVGElement('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 2 });
        const nodeLayer = createSVGElement('g');
        const textLayer = createSVGElement('g');
        const ageLayer = createSVGElement('g', { class: 'age-labels' });
        const monthLayer = createSVGElement('g'); // Слой для месяцев
        svg.append(lineLayer, ageLayer, monthLayer, nodeLayer, textLayer);

        function createSVGElement(tag, attrs = {}) {
            const el = document.createElementNS(svgNS, tag);
            for (let key in attrs) el.setAttribute(key, attrs[key]);
            return el;
        }

        function drawNode(x, y, r, fill, stroke, val, txtCol, fontSize = 25) {
            nodeLayer.append(createSVGElement('circle', { cx: x, cy: y, r: r * rScale, fill: fill, stroke: stroke, 'stroke-width': 2 }));
            const t = createSVGElement('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: txtCol, 'font-weight': 'bold', 'font-size': fontSize * tScale });
            t.textContent = val;
            textLayer.append(t);
        }

        // --- 12 МЕСЯЦЕВ (Уникально для YearMatrix) ---
        if (data.months) {
            data.months.forEach((m, i) => {
                const angleRad = (180 - 15 + i * 30) * Math.PI / 180;
                const mx = cx + R_MONTHS * Math.cos(angleRad), my = cy + R_MONTHS * Math.sin(angleRad);
                // Малый кружок
                nodeLayer.append(createSVGElement('circle', { cx: mx, cy: my, r: 10 * rScale, fill: '#fff', stroke: '#3388ff', 'stroke-width': 2 }));
                const mt = createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#3388ff', 'font-weight': 'bold', 'font-size': 10 * tScale });
                mt.textContent = i === 0 ? 12 : i;
                textLayer.append(mt);

                // Даты
                const tx = cx + (R_MONTHS + 25) * Math.cos(angleRad), ty = cy + (R_MONTHS + 25) * Math.sin(angleRad);
                let rot = (180 - 15 + i * 30); if (rot > 90 && rot < 270) rot += 180;
                const g = createSVGElement('g', { transform: `translate(${tx},${ty}) rotate(${rot})` });
                const d1 = createSVGElement('text', { x: 0, y: -5, 'text-anchor': 'middle', 'font-size': 7 * tScale, fill: '#3388ff', 'font-weight': 'bold' });
                d1.textContent = m.dateStart.slice(0, 5);
                const d2 = createSVGElement('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 7 * tScale, fill: '#3388ff', 'font-weight': 'bold' });
                d2.textContent = m.dateEnd.slice(0, 5);
                g.append(d1, d2);
                textLayer.append(g);
            });
        }

        // --- ОСТАЛЬНОЕ (Копия из app.js) ---
        // Ages (Removed as per user request: "удали только цифры 1-2, 5 лет и т.д.")
        // (function drawAgeLabels() { ... })();

        // Lines
        const connect = (i1, i2, pts, off = 22) => {
            const p1 = pts[i1], p2 = pts[i2], ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            lineLayer.append(createSVGElement('line', { x1: p1.x + off * Math.cos(ang), y1: p1.y + off * Math.sin(ang), x2: p2.x - off * Math.cos(ang), y2: p2.y - off * Math.sin(ang), stroke: '#ccc', 'stroke-width': 2 }));
        }
        connect(0, 2, outerPoints); connect(2, 4, outerPoints); connect(4, 6, outerPoints); connect(6, 0, outerPoints);
        connect(1, 3, outerPoints); connect(3, 5, outerPoints); connect(5, 7, outerPoints); connect(7, 1, outerPoints);
        connect(0, 4, outerPoints); connect(2, 6, outerPoints);

        // Nodes
        const outerColors = ["#9A71C9", "#ffffff", "#9A71C9", "#ffffff", "#F34B47", "#ffffff", "#F34B47", "#ffffff"];
        outerPoints.forEach((p, i) => drawNode(p.x, p.y, 22, outerColors[i], "#000", data.values[i], (i % 2 === 0 ? "#fff" : "#000")));
        drawNode(cx, cy, 28, "#F4F866", "#000", data.points.centerValue, "#000", 18);

        // Y and U
        const uColors = ["#3EB4F0", "#fff", "#3EB4F0", "#fff", "#D88A4B", "#fff", "#D88A4B", "#fff"];
        for (let i = 0; i < 8; i++) {
            const fillY = (i === 0 || i === 2) ? "#3366CC" : "#fff";
            drawNode(cx + innerRadius * Math.cos(angles[i]), cy + innerRadius * Math.sin(angles[i]), 18, fillY, "#000", data.Y[i], (fillY === "#3366CC" ? "#fff" : "#000"), 20);
            drawNode(uPoints[i].x, uPoints[i].y, 15, uColors[i], "#000", data.U[i], (i % 2 === 0 ? "#fff" : "#000"), 16);
        }

        // Mids & Extras (Removed as per user request: "удали теперь зеленные кружки")
        /*
        const midU1 = this.reduce(data.U[0] + data.points.centerValue), midU2 = this.reduce(data.U[2] + data.points.centerValue);
        drawNode(cx + (innerRadius2 / 2) * Math.cos(angles[0]), cy + (innerRadius2 / 2) * Math.sin(angles[0]), 15, "#73b55f", "#000", midU1, "#fff", 14);
        drawNode(cx + (innerRadius2 / 2) * Math.cos(angles[2]), cy + (innerRadius2 / 2) * Math.sin(angles[2]), 15, "#73b55f", "#000", midU2, "#fff", 14);
        */

        // Markers & Rays (Removed as per user request: "линии со стрелочками и надписи линии мужского рода, линии женского рода")
        /*
        const defs = createSVGElement('defs'); svg.appendChild(defs);
        ...
        ray(5, "#3E67EE", "", false, 'arrowMale'); ray(7, "#F7494C", "", true, 'arrowFemale');
        */

        // Perimeter Dots & Labels
        for (let i = 0; i < 8; i++) {
            const p1 = outerPoints[i], p2 = outerPoints[(i + 1) % 8], dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy);
            let nx = -dy / len, ny = dx / len; if (nx * ((p1.x + p2.x) / 2 - cx) + ny * ((p1.y + p2.y) / 2 - cy) < 0) { nx = -nx; ny = -ny; }
            const ux = dx / len, uy = dy / len;
            lineLayer.append(createSVGElement('line', { x1: p1.x + nx * 30 - ux * 15, y1: p1.y + ny * 30 - uy * 15, x2: p2.x + nx * 30 + ux * 15, y2: p2.y + ny * 30 + uy * 15, stroke: "#000", opacity: 0.3 }));
            const v1 = data.values[i], v2 = data.values[(i + 1) % 8], p4 = this.reduce(v1 + v2), p2_ = this.reduce(p4 + v1), p1_ = this.reduce(p2_ + v1), p6 = this.reduce(p4 + v2), p7 = this.reduce(p6 + v2);
            [null, p1_, p2_, this.reduce(p2_ + p4), p4, this.reduce(p4 + p6), p6, p7].forEach((v, j) => {
                if (j === 0) return;
                const t = 0.5 + (j - 4) / 9, px = p1.x + ux * len * t + nx * 30, py = p1.y + uy * len * t + ny * 30;
                nodeLayer.append(createSVGElement('circle', { cx: px, cy: py, r: (j === 4 ? 4 : 2) * rScale, fill: "#cc3366" }));
                const l = createSVGElement('text', { x: p1.x + ux * len * t + nx * 48, y: p1.y + uy * len * t + ny * 48, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': (j === 4 ? 13 : 11) * tScale, 'font-weight': j === 4 ? 'bold' : 'normal' });
                l.textContent = v; textLayer.append(l);
            });
        }

        // Final Markers
        const mLetters = ["A", "Д", "Б", "Е", "В", "Ж", "Г", "З"], mOffsets = [[-42.5, 0], [-30, -30], [0, -42.5], [30, -30], [42.5, 0], [30, 30], [0, 42.5], [-30, 30]];
        outerPoints.forEach((p, i) => {
            const mx = p.x + mOffsets[i][0], my = p.y + mOffsets[i][1];
            nodeLayer.append(createSVGElement('circle', { cx: mx, cy: my, r: 12 * rScale, fill: (["В", "Г"].includes(mLetters[i]) ? "#e84e42" : (i % 2 !== 0 ? "#000" : "#a185c8")) }));
            const txt = createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#fff", 'font-weight': 'bold', 'font-size': 15 * tScale });
            txt.textContent = mLetters[i]; textLayer.append(txt);
        });
    }
};

window.YearMatrixLogic = YearMatrixLogic;
