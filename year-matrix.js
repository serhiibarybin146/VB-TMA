/**
 * Year Forecast Matrix — ПОЛНАЯ ЛОГИКА + ПОЛНЫЙ ВИЗУАЛ
 * Базируется на matrix-logic.js + продвинутый SVG рендерер.
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

        // Destiny calculations
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

    /**
     * Compatibility wrapper for app.js
     * Adds 12-month period calculations.
     */
    calculate(day, month, year) {
        const pad = n => String(n).padStart(2, '0');
        const dateStr = `${year}-${pad(month)}-${pad(day)}`;
        const base = this.calculateBase(dateStr);

        // Расчет 12 месяцев (Кольцо)
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
            cur = new Date(end);
            cur.setDate(cur.getDate() + 1);
        }

        base.months = months;
        return base;
    },

    /* ─── ВИЗУАЛИЗАЦИЯ (Продвинутый SVG) ─── */

    drawSVG(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const W = 700, H = 700, cx = 350, cy = 350;
        const R_OUTER = 270, R_INNER1 = 180, R_INNER2 = 110, R_MONTHS = 225;

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

        const bgLayer = el('g');
        const lineLayer = el('g', { stroke: '#ccc', 'stroke-width': 1.5 });
        const nodeLayer = el('g');
        const textLayer = el('g', { 'font-family': 'Manrope, sans-serif' });
        svg.append(bgLayer, lineLayer, nodeLayer, textLayer);

        function el(tag, attrs = {}) {
            const e = document.createElementNS(svgNS, tag);
            for (let k in attrs) e.setAttribute(k, attrs[k]);
            return e;
        }

        function drawNode(x, y, r, fill, stroke, val, txtColor = '#000', fontSize = 14) {
            nodeLayer.append(el('circle', { cx: x, cy: y, r: r, fill: fill, stroke: stroke, 'stroke-width': 2 }));
            const t = el('text', { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: txtColor, 'font-weight': 'bold', 'font-size': fontSize });
            t.textContent = val;
            textLayer.append(t);
        }

        const angles = [Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75, 0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75];
        const colors = ['#8e52c8', '#fff', '#8e52c8', '#fff', '#ff4d4d', '#fff', '#ff4d4d', '#fff'];
        const letters = ['А', '', 'Б', '', 'В', '', 'Г', ''];

        const outerPts = angles.map(a => ({ x: cx + R_OUTER * Math.cos(a), y: cy + R_OUTER * Math.sin(a) }));

        // Lines
        for (let i = 0; i < 8; i++) {
            const p1 = outerPts[i], p2 = outerPts[(i + 1) % 8];
            lineLayer.append(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }));
        }
        lineLayer.append(el('line', { x1: outerPts[0].x, y1: outerPts[0].y, x2: outerPts[4].x, y2: outerPts[4].y }));
        lineLayer.append(el('line', { x1: outerPts[2].x, y1: outerPts[2].y, x2: outerPts[6].x, y2: outerPts[6].y }));
        lineLayer.append(el('line', { x1: outerPts[1].x, y1: outerPts[1].y, x2: outerPts[5].x, y2: outerPts[5].y }));
        lineLayer.append(el('line', { x1: outerPts[3].x, y1: outerPts[3].y, x2: outerPts[7].x, y2: outerPts[7].y }));

        // 12 Months Ring
        if (data.months) {
            data.months.forEach((m, i) => {
                const angleRad = (180 + i * 30) * Math.PI / 180;
                const mx = cx + R_MONTHS * Math.cos(angleRad), my = cy + R_MONTHS * Math.sin(angleRad);
                drawNode(mx, my, 10, '#fff', '#3388ff', i === 0 ? 12 : i, '#3388ff', 10);

                const tx = cx + (R_MONTHS + 25) * Math.cos(angleRad), ty = cy + (R_MONTHS + 25) * Math.sin(angleRad);
                let rot = 180 + i * 30;
                if (rot > 90 && rot < 270) rot += 180;
                const g = el('g', { transform: `translate(${tx},${ty}) rotate(${rot})` });
                const d1 = el('text', { x: 0, y: -5, 'text-anchor': 'middle', 'font-size': 7, fill: '#3388ff', 'font-weight': 'bold' });
                d1.textContent = m.dateStart.slice(0, 5);
                const d2 = el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 7, fill: '#3388ff', 'font-weight': 'bold' });
                d2.textContent = m.dateEnd.slice(0, 5);
                g.append(d1, d2);
                textLayer.append(g);
            });
        }

        // Inner Layers
        const iAngles = [Math.PI, Math.PI * 1.5, 0, Math.PI * 0.5];
        iAngles.forEach((a, i) => {
            const ix = cx + R_INNER1 * Math.cos(a), iy = cy + R_INNER1 * Math.sin(a);
            const val = i === 0 ? data.U[0] : (i === 1 ? data.U[2] : (i === 2 ? data.U[4] : data.U[6]));
            drawNode(ix, iy, 16, i < 2 ? '#3388ff' : '#ff9933', '#000', val, '#fff', 12);

            const tx = cx + R_INNER2 * Math.cos(a), ty = cy + R_INNER2 * Math.sin(a);
            const valT = this.reduce(val + data.points.centerValue);
            drawNode(tx, ty, 12, '#4CC9F0', '#fff', valT, '#fff', 10);
        });

        // Main Nodes
        outerPts.forEach((p, i) => {
            drawNode(p.x, p.y, i % 2 === 0 ? 28 : 24, colors[i], '#000', data.values[i], colors[i] === '#fff' ? '#000' : '#fff', 16);
            if (letters[i]) {
                const lx = p.x + 40 * Math.cos(angles[i]), ly = p.y + 40 * Math.sin(angles[i]);
                nodeLayer.append(el('circle', { cx: lx, cy: ly, r: 10, fill: colors[i] }));
                const t = el('text', { x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-size': 10, 'font-weight': 'bold' });
                t.textContent = letters[i];
                textLayer.append(t);
            }
        });

        // Center
        drawNode(cx, cy, 32, '#ffcc00', '#000', data.points.centerValue, '#000', 20);

        // Icons
        const dx = cx + 180 * Math.cos(Math.PI / 3), dy = cy + 180 * Math.sin(Math.PI / 3);
        const txtDol = el('text', { x: dx, y: dy, fill: '#04dd00', 'font-size': 24, 'font-weight': 'bold', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
        txtDol.textContent = '$';
        textLayer.append(txtDol);

        const hx = cx + 160 * Math.cos(1.3), hy = cy + 160 * Math.sin(1.3);
        const heart = el('path', { d: `M ${hx} ${hy} m -5,-5 c -3,-3 -8,-3 -11,0 c -3,3 -3,8 0,11 l 11,11 l 11,-11 c 3,-3 3,-8 0,-11 c -3,-3 -8,-3 -11,0 z`, fill: '#e84e42' });
        nodeLayer.append(heart);

        container.innerHTML = '';
        container.appendChild(svg);
    }
};

window.YearMatrixLogic = YearMatrixLogic;
