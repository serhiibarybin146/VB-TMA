/**
 * Year Forecast Matrix — Базируется на ПОЛНОМ файле matrix-logic.js
 */

const YearMatrixLogic = {
    /**
     * Reduces a number by summing its digits until it's <= 22
     */
    reduce(n) {
        let val = parseInt(n) || 0;
        if (val === 0) return 0;
        while (val > 22) {
            val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return val;
    },

    /**
     * Reduces a number by summing its digits until it's 1-9
     */
    reduce9(n) {
        let val = parseInt(n) || 0;
        if (val === 0) return 0;
        while (val > 9) {
            val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return val;
    },

    /**
     * Calculates the Money Code based on birth date (Duplicate from MatrixLogic)
     */
    calculateMoneyCode(day, month, year) {
        const c1 = this.reduce9(day);
        const c2 = this.reduce9(month);
        const c3 = this.reduce9(year);
        const c4 = this.reduce9(c1 + c2 + c3);
        const c5 = this.reduce9(c1 + c2 + c3 + c4);

        return {
            corners: [c1, c2, c3, c4, c5],
            code: `${c1}${c2}${c3}${c4}${c5}`
        };
    },

    /**
     * Calculates all base points for the Matrix of Destiny
     * @param {string} dateStr Format YYYY-MM-DD
     */
    calculateBase(dateStr) {
        const [yearStr, monthStr, dayStr] = dateStr.split("-");
        const day = parseInt(dayStr);
        const month = parseInt(monthStr);
        const year = parseInt(yearStr);

        // 1. Base Points (Personal Square)
        const rDay = this.reduce(day);
        const rMonth = this.reduce(month);
        const rYear = this.reduce(yearStr.split("").reduce((a, b) => a + parseInt(b), 0));
        const sumBottom = this.reduce(rDay + rMonth + rYear);

        // 2. Center Value
        const centerValue = this.reduce(rDay + rMonth + rYear + sumBottom);

        // 3. Diagonal Points (Ancestral Square)
        const tl = this.reduce(rDay + rMonth);
        const tr = this.reduce(rMonth + rYear);
        const br = this.reduce(rYear + sumBottom);
        const bl = this.reduce(sumBottom + rDay);

        const values = [rDay, tl, rMonth, tr, rYear, br, sumBottom, bl];
        // Indices: 0:Left, 1:TL, 2:Top, 3:TR, 4:Right, 5:BR, 6:Bottom, 7:BL

        // 4. Middle Layer (U)
        const U = values.map(v => this.reduce(v + centerValue));

        // 5. Outer Layer (Y)
        const Y = values.map((v, idx) => this.reduce(v + U[idx]));

        // 6. Destiny Totals
        const sky = this.reduce(rMonth + sumBottom);
        const earth = this.reduce(rDay + rYear);
        const personal = this.reduce(sky + earth);

        const maleLine = this.reduce(tl + br);
        const femaleLine = this.reduce(tr + bl);
        const social = this.reduce(maleLine + femaleLine);

        const spiritual = this.reduce(personal + social);
        const planetary = this.reduce(social + spiritual);

        // Codes for additional section
        const ancestralPower = this.reduce(tl + tr + br + bl);
        const maleCode = [tl, br, this.reduce(tl + br)];
        const femaleCode = [tr, bl, this.reduce(tr + bl)];
        const internalCode = [centerValue, ancestralPower, this.reduce(centerValue + ancestralPower)];

        return {
            date: { day, month, year },
            points: {
                rDay, rMonth, rYear, sumBottom,
                centerValue,
                tl, tr, br, bl
            },
            values, // 8 main points
            U,      // 8 middle points
            Y,      // 8 outer points
            destiny: {
                sky, earth, personal,
                maleLine, femaleLine, social,
                spiritual, planetary,
                ancestralPower, maleCode, femaleCode, internalCode
            }
        };
    },

    /**
     * Формат для app.js (совместимость)
     */
    calculate(day, month, year) {
        // app.js передает (day, month, year) отдельно.
        // Переиспользуем calculateBase
        const pad = n => String(n).padStart(2, '0');
        const dateStr = `${year}-${pad(month)}-${pad(day)}`;
        return this.calculateBase(dateStr);
    },

    /**
     * Calculates the Health (Chakra) Table
     */
    calculateHealth(baseData) {
        const { points, U, Y, destiny } = baseData;
        const center = points.centerValue;

        // Anahata (Green) midU helper
        const midU1 = this.reduce(U[0] + center);
        const midU2 = this.reduce(U[2] + center);

        const chakras = [
            { name: 'Сахасрара', color: 'purple', body: points.rDay, energy: points.rMonth },
            { name: 'Аджна', color: 'blue', body: Y[0], energy: Y[2] },
            { name: 'Вишудха', color: 'cyan', body: U[0], energy: U[2] },
            { name: 'Анахата', color: 'green', body: midU1, energy: midU2 },
            { name: 'Манипура', color: 'yellow', body: center, energy: center },
            { name: 'Свадхистана', color: 'orange', body: U[4], energy: U[6] },
            { name: 'Муладхара', color: 'red', body: points.rYear, energy: points.sumBottom }
        ];

        chakras.forEach(c => {
            c.emotion = this.reduce(c.body + c.energy);
        });

        const totalBody = chakras.reduce((s, c) => s + c.body, 0);
        const totalEnergy = chakras.reduce((s, c) => s + c.energy, 0);
        const totalEmotion = chakras.reduce((s, c) => s + c.emotion, 0);

        return {
            chakras,
            totals: {
                body: totalBody,
                energy: totalEnergy,
                emotion: totalEmotion,
                reducedBody: this.reduce(totalBody),
                reducedEnergy: this.reduce(totalEnergy),
                reducedEmotion: this.reduce(totalEmotion)
            }
        };
    },

    /* ─── Рендеринг (Базовая заглушка, чтобы не ломался app.js) ─── */

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

        // Узлы (Просто показать, что логика работает)
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

        container.innerHTML = '<h3>Годовая Матрица (база logic)</h3>';
        container.appendChild(svg);
    }
};

window.YearMatrixLogic = YearMatrixLogic;
