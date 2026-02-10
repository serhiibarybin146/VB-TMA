/**
 * Year Forecast Matrix — отдельный модуль
 * Расчёт + рендеринг SVG в стиле основной матрицы
 * НЕ зависит от MatrixLogic / app.js
 */

const YearMatrixLogic = {

    /* ─── Математика ─── */

    /**
     * Свёртка числа до ≤ 22
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
     * Расчёт годовой матрицы
     * @param {number} day   — день рождения
     * @param {number} month — месяц рождения
     * @param {number} targetYear — искомый год (напр. 2026)
     */
    calculate(day, month, targetYear) {
        const r = this.reduce.bind(this);

        // 1. Основные точки (квадрат)
        const rDay = r(day);                                                      // Left  (A)
        const rMonth = r(month);                                                    // Top   (B)
        const rYear = r(String(targetYear).split('').reduce((a, b) => a + +b, 0)); // Right (C)
        const sumBot = r(rDay + rMonth + rYear);                                    // Bottom(D)

        // 2. Центр
        const center = r(rDay + rMonth + rYear + sumBot);

        // 3. Диагональные углы (родовой квадрат)
        const tl = r(rDay + rMonth);
        const tr = r(rMonth + rYear);
        const br = r(rYear + sumBot);
        const bl = r(sumBot + rDay);

        // 4. Inner-точки (на осях ближе к центру)
        const innerLeft = r(rDay + center);
        const innerTop = r(rMonth + center);
        const innerRight = r(rYear + center);
        const innerBottom = r(sumBot + center);

        return {
            points: {
                left: rDay, top: rMonth, right: rYear, bottom: sumBot,
                center,
                tl, tr, br, bl,
                innerLeft, innerTop, innerRight, innerBottom
            },
            input: { day, month, targetYear }
        };
    },

    /* ─── SVG-рендеринг (стиль основной матрицы) ─── */

    /**
     * Рисует годовую матрицу в указанный контейнер
     * @param {Object} data — результат calculate()
     * @param {string} containerId — id контейнера (div)
     */
    drawSVG(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const p = data.points;

        // --- SVG canvas ---
        const svgNS = 'http://www.w3.org/2000/svg';
        const W = 700, H = 700;
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('xmlns', svgNS);
        svg.id = 'yearMatrixSvg';

        const cx = W / 2, cy = H / 2;
        const radius = 270;
        const rScale = 1.25;
        const tScale = 1.20;

        // Layers (same pattern as main matrix)
        const lineLayer = el('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 2 });
        const nodeLayer = el('g');
        const textLayer = el('g');
        svg.append(lineLayer, nodeLayer, textLayer);

        // 8 углов на окружности
        const angles = [
            Math.PI,           // 0: Left
            Math.PI * 5 / 4,   // 1: TL
            Math.PI * 3 / 2,   // 2: Top
            Math.PI * 7 / 4,   // 3: TR
            0,                 // 4: Right
            Math.PI / 4,       // 5: BR
            Math.PI / 2,       // 6: Bottom
            Math.PI * 3 / 4    // 7: BL
        ];

        const pt = (angle, r) => ({
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        });

        // Outer points (8)
        const outer = angles.map(a => pt(a, radius));

        // Inner points (mid-radius)
        const innerRadius = 140;
        const inner = angles.map(a => pt(a, innerRadius));

        // ─── Линии ───

        // Personal square: 0-2-4-6
        connectLine(outer[0], outer[2]);
        connectLine(outer[2], outer[4]);
        connectLine(outer[4], outer[6]);
        connectLine(outer[6], outer[0]);

        // Ancestral square: 1-3-5-7
        connectLine(outer[1], outer[3]);
        connectLine(outer[3], outer[5]);
        connectLine(outer[5], outer[7]);
        connectLine(outer[7], outer[1]);

        // Main axes
        connectLine(outer[0], outer[4]);
        connectLine(outer[2], outer[6]);

        // Inner axes to center
        const cPt = { x: cx, y: cy };
        [0, 2, 4, 6].forEach(i => connectLine(inner[i], cPt));

        // ─── Ноды ───

        // Основной квадрат (Left / Top / Right / Bottom)
        const mainVals = [p.left, null, p.top, null, p.right, null, p.bottom, null];
        const mainFills = ['#9A71C9', '#fff', '#9A71C9', '#fff', '#F34B47', '#fff', '#F34B47', '#fff'];
        const mainTxt = ['#fff', '#000', '#fff', '#000', '#fff', '#000', '#fff', '#000'];

        // Diagonal values
        const diagVals = [null, p.tl, null, p.tr, null, p.br, null, p.bl];

        outer.forEach((op, i) => {
            const v = mainVals[i] ?? diagVals[i];
            if (v == null) return; // skip if no value at this index (shouldn't happen, but safety)
            drawNode(op.x, op.y, 22, mainFills[i], '#000', v, mainTxt[i], 25);
        });

        // Draw diagonal nodes separately (they always exist)
        [1, 3, 5, 7].forEach(i => {
            drawNode(outer[i].x, outer[i].y, 18, '#fff', '#000', diagVals[i], '#000', 20);
        });

        // Inner points (on axes — Blue / Orange pattern)
        const innerVals = [p.innerLeft, null, p.innerTop, null, p.innerRight, null, p.innerBottom, null];
        const innerFills = ['#3EB4F0', '#fff', '#3EB4F0', '#fff', '#D88A4B', '#fff', '#D88A4B', '#fff'];
        const innerTxt = ['#fff', '#000', '#fff', '#000', '#fff', '#000', '#fff', '#000'];

        [0, 2, 4, 6].forEach(i => {
            drawNode(inner[i].x, inner[i].y, 16, innerFills[i], '#000', innerVals[i], innerTxt[i], 18);
        });

        // Center (Yellow — like main matrix)
        drawNode(cx, cy, 28, '#F4F866', '#000', p.center, '#000', 22);

        // ─── Подписи к основным точкам ───
        const labels = {
            0: 'День рожд.',
            2: 'Месяц рожд.',
            4: 'Год прогноза',
            6: 'Сумма'
        };

        const labelOffsets = {
            0: [-50, 0],   // Left — сдвиг влево
            2: [0, -45],   // Top  — сдвиг вверх
            4: [50, 0],    // Right — сдвиг вправо
            6: [0, 45]     // Bottom — сдвиг вниз
        };

        Object.entries(labels).forEach(([idx, label]) => {
            const i = parseInt(idx);
            const op = outer[i];
            const [ox, oy] = labelOffsets[i];
            const lx = op.x + ox;
            const ly = op.y + oy;
            const anchor = i === 0 ? 'end' : i === 4 ? 'start' : 'middle';
            const t = el('text', {
                x: lx, y: ly,
                'text-anchor': anchor,
                'dominant-baseline': 'central',
                fill: '#555',
                'font-size': 11 * tScale,
                'font-weight': '600',
                'font-family': 'Manrope, sans-serif'
            });
            t.textContent = label;
            textLayer.append(t);
        });

        // ─── Year indicator ───
        const yearLabel = el('text', {
            x: cx, y: 45,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            fill: '#333',
            'font-size': 18 * tScale,
            'font-weight': '800',
            'font-family': 'Manrope, sans-serif'
        });
        yearLabel.textContent = `Прогноз на ${data.input.targetYear} год`;
        textLayer.append(yearLabel);

        // ─── Inject SVG into container ───
        container.innerHTML = '';
        container.appendChild(svg);

        // Fix textContent for nodes that used 'content' attribute
        svg.querySelectorAll('text').forEach(t => {
            if (t.getAttribute('content')) {
                t.textContent = t.getAttribute('content');
                t.removeAttribute('content');
            }
        });

        /* ── Local helpers ── */

        function el(tag, attrs = {}) {
            const e = document.createElementNS(svgNS, tag);
            for (const k in attrs) e.setAttribute(k, attrs[k]);
            return e;
        }

        function connectLine(a, b, col = '#888', width = 2, opacity = 0.5) {
            const offsetR = 24;
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const start = { x: a.x + offsetR * Math.cos(angle), y: a.y + offsetR * Math.sin(angle) };
            const end = { x: b.x - offsetR * Math.cos(angle), y: b.y - offsetR * Math.sin(angle) };
            lineLayer.append(el('line', {
                x1: start.x, y1: start.y,
                x2: end.x, y2: end.y,
                stroke: col, 'stroke-width': width, opacity
            }));
        }

        function drawNode(x, y, r, fill, stroke, val, txtCol, fontSize) {
            const scaledR = r * rScale;
            const scaledFS = fontSize * tScale;
            nodeLayer.append(el('circle', {
                cx: x, cy: y, r: scaledR,
                fill, stroke, 'stroke-width': 2
            }));
            const t = el('text', {
                x, y,
                'text-anchor': 'middle',
                'dominant-baseline': 'central',
                fill: txtCol,
                'font-weight': 'bold',
                'font-size': scaledFS,
                'font-family': 'Manrope, sans-serif'
            });
            t.textContent = val;
            textLayer.append(t);
        }
    }
};

window.YearMatrixLogic = YearMatrixLogic;
