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

        const innerA = this.reduce(U[4] + U[6]);
        const innerB = this.reduce(U[4] + innerA);
        const innerC = this.reduce(U[6] + innerA);

        const moneyChannel = [innerB, innerA, innerC];
        const relPoint = this.reduce(centerValue + br);
        const relChannel = [centerValue, relPoint, br];

        return {
            date: { day, month, year },
            points: { rDay, rMonth, rYear, sumBottom, centerValue, tl, tr, br, bl },
            values, U, Y,
            innerA, innerB, innerC,
            moneyChannel, relChannel,
            destiny: { sky, earth, personal: this.reduce(sky + earth), maleLine, femaleLine, social: this.reduce(maleLine + femaleLine) }
        };
    },

    getPersonalYear(birthDay, birthMonth) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const bdayThisYear = new Date(currentYear, birthMonth - 1, birthDay);
        return today >= bdayThisYear ? currentYear : currentYear - 1;
    },

    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    },

    calculate(day, month, inputYear) {
        // Как просил пользователь: вводим 06.11.2026 -> начинаем с 06.11.2025
        const targetYear = inputYear - 1;
        const pad = n => String(n).padStart(2, '0');

        // Матрица года на дату начала персонального года
        const dateStr = `${targetYear}-${pad(month)}-${pad(day)}`;
        const base = this.calculateBase(dateStr);

        // ВАРИАНТ 2: Личный ритм (честная математика)
        // Длины месяцев фиксированы: 31, 28/29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31

        function hasFeb29(start, end) {
            for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
                const isL = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
                if (isL) {
                    const feb29 = new Date(y, 1, 29);
                    if (feb29 >= start && feb29 < end) return true;
                }
            }
            return false;
        }

        const startDate = new Date(targetYear, month - 1, day);
        const endDate = new Date(targetYear + 1, month - 1, day);
        const leapInCycle = hasFeb29(startDate, endDate);

        const monthLengths = [31, (leapInCycle ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        const months = [];
        let curPointer = new Date(targetYear, month - 1, day);

        for (let i = 0; i < 12; i++) {
            let start = new Date(curPointer);
            let end = new Date(curPointer);
            const currentLen = monthLengths[i];

            // Конец месяца = старт + длина - 1 день
            end.setDate(end.getDate() + currentLen - 1);

            const fmt = d => pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();

            // Расчет энергии месяца
            const m_idx = i + 1;
            const rA = this.reduce(day);
            const rB = this.reduce(m_idx);
            const rC = this.reduce(String(targetYear).split('').reduce((a, b) => a + parseInt(b), 0));
            const rD = this.reduce(rA + rB + rC);
            const rE = this.reduce(rA + rB + rC + rD);

            months.push({
                seq: i,
                label: i + 1,
                dateStart: fmt(start),
                dateEnd: fmt(end),
                value: rE
            });

            // Следующий месяц начинается на следующий день после конца текущего
            curPointer = new Date(end);
            curPointer.setDate(curPointer.getDate() + 1);
        }

        base.months = months;
        base.targetYear = targetYear;
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
        const lerp = (p1, p2, t) => ({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });
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
            // Рисуем радиальные линии между секторами (месяцами)
            data.months.forEach((m, i) => {
                const lineAngleRad = (210 + i * 30) * Math.PI / 180;
                const rStart = 28 * rScale, rEnd = 281;
                lineLayer.append(createSVGElement('line', {
                    x1: cx + rStart * Math.cos(lineAngleRad),
                    y1: cy + rStart * Math.sin(lineAngleRad),
                    x2: cx + rEnd * Math.cos(lineAngleRad),
                    y2: cy + rEnd * Math.sin(lineAngleRad),
                    stroke: '#ccc',
                    'stroke-width': 2
                }));
            });

            // Декоративное кольцо вокруг дат (радиус 160)
            lineLayer.append(createSVGElement('circle', {
                cx: cx,
                cy: cy,
                r: 160,
                fill: 'none',
                stroke: '#ccc',
                'stroke-width': 2
            }));

            data.months.forEach((m, i) => {
                const angleRad = (210 - 15 + i * 30) * Math.PI / 180;
                const mx = cx + R_MONTHS * Math.cos(angleRad), my = cy + R_MONTHS * Math.sin(angleRad);
                // Малый кружок
                nodeLayer.append(createSVGElement('circle', { cx: mx, cy: my, r: 10 * rScale, fill: '#fff', stroke: '#3388ff', 'stroke-width': 2 }));
                const mt = createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#3388ff', 'font-weight': 'bold', 'font-size': 10 * tScale });
                mt.textContent = i + 1;
                textLayer.append(mt);

                // Даты (развернуты горизонтально, с годом)
                const tx = cx + 90 * Math.cos(angleRad), ty = cy + 90 * Math.sin(angleRad);
                const g = createSVGElement('g', { transform: `translate(${tx},${ty})` });
                const d1 = createSVGElement('text', { x: 0, y: -4, 'text-anchor': 'middle', 'font-size': 5.5 * tScale, fill: '#3388ff', 'font-weight': 'bold' });
                d1.textContent = m.dateStart;
                const d2 = createSVGElement('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 5.5 * tScale, fill: '#3388ff', 'font-weight': 'bold' });
                d2.textContent = m.dateEnd;
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
        // Lines (Outer and Inner squares removed as per user request)
        connect(0, 4, outerPoints); connect(2, 6, outerPoints);

        // Nodes
        const outerColors = ["#9A71C9", "#ffffff", "#9A71C9", "#ffffff", "#F34B47", "#ffffff", "#F34B47", "#ffffff"];
        outerPoints.forEach((p, i) => drawNode(p.x, p.y, 22, outerColors[i], "#000", data.values[i], (i % 2 === 0 ? "#fff" : "#000")));
        drawNode(cx, cy, 28, "#F4F866", "#000", data.points.centerValue, "#000", 18);

        // Y and U
        const uColors = ["#3EB4F0", "#fff", "#3EB4F0", "#fff", "#D88A4B", "#fff", "#D88A4B", "#fff"];
        const uNodePoints = angles.map(a => ({ x: cx + innerRadius2 * Math.cos(a), y: cy + innerRadius2 * Math.sin(a) }));
        for (let i = 0; i < 8; i++) {
            const fillY = (i === 0 || i === 2) ? "#3366CC" : "#fff";
            drawNode(cx + innerRadius * Math.cos(angles[i]), cy + innerRadius * Math.sin(angles[i]), 18, fillY, "#000", data.Y[i], (fillY === "#3366CC" ? "#fff" : "#000"), 20);
            drawNode(uNodePoints[i].x, uNodePoints[i].y, 15, uColors[i], "#000", data.U[i], (i % 2 === 0 ? "#fff" : "#000"), 16);
        }

        // Money and Relationship Channel (Restored to previous stable placement)
        const drawExtra = (x, y, val, letter, lOffX, lOffY, col, dol, hrt) => {
            drawNode(x, y, 12, col, "#000", val, "#000", 14);
            // Letter Circle
            nodeLayer.append(createSVGElement('circle', { cx: x + lOffX, cy: y + lOffY, r: 7 * rScale, fill: "#000" }));
            textLayer.append(createSVGElement('text', { x: x + lOffX, y: y + lOffY, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#fff", 'font-weight': 'bold', 'font-size': 9 * tScale }));
            const txt = textLayer.lastChild;
            txt.textContent = letter;

            if (dol) {
                const d = createSVGElement('text', { x: x - 15, y: y - 28, fill: "#04dd00", 'font-weight': 'bold', 'font-size': 26 * tScale });
                d.textContent = "$"; textLayer.append(d);
            }
            if (hrt) {
                const hx = x - 45, hy = y - 30;
                const p = createSVGElement('path', { d: `M ${hx} ${hy} c ${-5 * rScale} ${-5 * rScale}, ${-15 * rScale} 0, ${-10 * rScale} ${10 * rScale} c ${5 * rScale} ${10 * rScale}, ${15 * rScale} ${10 * rScale}, ${20 * rScale} 0 c ${5 * rScale} ${-10 * rScale}, ${-5 * rScale} ${-15 * rScale}, ${-10 * rScale} ${-10 * rScale} Z`, fill: "#e84e42", stroke: "#000" });
                nodeLayer.append(p);
            }
        };

        const pEdgeStep4 = { x: cx + 200 * Math.cos(angles[4]), y: cy + 200 * Math.sin(angles[4]) };
        const pEdgeStep6 = { x: cx + 200 * Math.cos(angles[6]), y: cy + 200 * Math.sin(angles[6]) };
        lineLayer.append(createSVGElement('line', {
            x1: pEdgeStep4.x, y1: pEdgeStep4.y,
            x2: pEdgeStep6.x, y2: pEdgeStep6.y,
            stroke: '#000', 'stroke-width': 1, 'stroke-dasharray': '5,5'
        }));

        const pMinnerB = lerp(pEdgeStep4, pEdgeStep6, 0.25);
        const pMinnerA = lerp(pEdgeStep4, pEdgeStep6, 0.50);
        const pMinnerC = lerp(pEdgeStep4, pEdgeStep6, 0.75);

        drawExtra(pMinnerA.x, pMinnerA.y, data.innerA, "К", -17, -17, "#fff", false, false);
        drawExtra(pMinnerB.x, pMinnerB.y, data.innerB, "О", -17, -17, "#fff", true, false);
        drawExtra(pMinnerC.x, pMinnerC.y, data.innerC, "Н", -17, -17, "#fff", false, true);

        // SVG text post-processing for 'content' attribute (consistent with app.js)
        svg.querySelectorAll('text').forEach(t => { if (t.getAttribute('content')) { t.textContent = t.getAttribute('content'); t.removeAttribute('content'); } });

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
