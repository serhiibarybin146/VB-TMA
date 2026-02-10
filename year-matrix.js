/**
 * Year Forecast Matrix — Базируется на логике matrix-logic.js
 */

const YearMatrixLogic = {

    /* ─── Математика (Копия из MatrixLogic) ─── */

    reduce(n) {
        let val = parseInt(n) || 0;
        if (val === 0) return 0;
        while (val > 22) {
            val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return val;
    },

    calculate(day, month, targetYear) {
        const r = this.reduce.bind(this);

        // Формируем строку даты для совместимости (или считаем напрямую)
        const yearStr = String(targetYear);
        const rDay = r(day);
        const rMonth = r(month);
        const rYear = r(yearStr.split("").reduce((a, b) => a + parseInt(b), 0));
        const sumBottom = r(rDay + rMonth + rYear);

        const centerValue = r(rDay + rMonth + rYear + sumBottom);

        const tl = r(rDay + rMonth);
        const tr = r(rMonth + rYear);
        const br = r(rYear + sumBottom);
        const bl = r(sumBottom + rDay);

        const values = [rDay, tl, rMonth, tr, rYear, br, sumBottom, bl];
        const U = values.map(v => r(v + centerValue));
        const Y = values.map((v, idx) => r(v + U[idx]));

        // Остальные точки (Sky, Earth и т.д.) — пока оставляем всё как в основной
        const sky = r(rMonth + sumBottom);
        const earth = r(rDay + rYear);
        const personal = r(sky + earth);
        const maleLine = r(tl + br);
        const femaleLine = r(tr + bl);
        const social = r(maleLine + femaleLine);
        const spiritual = r(personal + social);
        const planetary = r(social + spiritual);
        const ancestralPower = r(tl + tr + br + bl);
        const maleCode = [tl, br, r(tl + br)];
        const femaleCode = [tr, bl, r(tr + bl)];
        const internalCode = [centerValue, ancestralPower, r(centerValue + ancestralPower)];

        return {
            date: { day, month, year: targetYear },
            points: {
                rDay, rMonth, rYear, sumBottom,
                centerValue,
                tl, tr, br, bl
            },
            values,
            U,
            Y,
            destiny: {
                sky, earth, personal,
                maleLine, femaleLine, social,
                spiritual, planetary,
                ancestralPower, maleCode, femaleCode, internalCode
            }
        };
    },

    /* ─── Рендеринг (Стандартный SVG) ─── */

    drawSVG(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const svgNS = 'http://www.w3.org/2000/svg';
        const W = 700, H = 700;
        const cx = 350, cy = 350, radius = 270;
        const rScale = 1.25;
        const tScale = 1.20;

        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

        const lineLayer = el('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 2 });
        const nodeLayer = el('g');
        const textLayer = el('g');
        svg.append(lineLayer, nodeLayer, textLayer);

        function el(tag, attrs = {}) {
            const e = document.createElementNS(svgNS, tag);
            for (let k in attrs) e.setAttribute(k, attrs[k]);
            return e;
        }

        const angles = [Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75, 0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75];
        const outerPts = angles.map(a => ({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }));

        // Отрисовка линий (квадраты)
        [[0, 2, 4, 6], [1, 3, 5, 7]].forEach(q => {
            for (let i = 0; i < 4; i++) {
                const p1 = outerPts[q[i]], p2 = outerPts[q[(i + 1) % 4]];
                lineLayer.append(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#ccc' }));
            }
        });
        // Оси
        lineLayer.append(el('line', { x1: outerPts[0].x, y1: outerPts[0].y, x2: outerPts[4].x, y2: outerPts[4].y, stroke: '#ccc' }));
        lineLayer.append(el('line', { x1: outerPts[2].x, y1: outerPts[2].y, x2: outerPts[6].x, y2: outerPts[6].y, stroke: '#ccc' }));

        // Узлы (Упрощенно для начала)
        function drawNode(x, y, r, fill, val) {
            nodeLayer.append(el('circle', { cx: x, cy: y, r: r * rScale, fill: fill, stroke: '#000' }));
            const t = el('text', { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 15 * tScale, 'font-weight': 'bold' });
            t.textContent = val;
            textLayer.append(t);
        }

        // Внешние
        const colors = ['#9A71C9', '#fff', '#9A71C9', '#fff', '#F34B47', '#fff', '#F34B47', '#fff'];
        outerPts.forEach((p, i) => drawNode(p.x, p.y, 18, colors[i], data.values[i]));

        // Центр
        drawNode(cx, cy, 24, '#F4F866', data.points.centerValue);

        container.innerHTML = '';
        container.appendChild(svg);
    }
};

window.YearMatrixLogic = YearMatrixLogic;
