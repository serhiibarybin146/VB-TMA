// Logic for Month Forecast Matrix (Based on YearMatrixLogic, but without date texts)
const MonthMatrixLogic = {

    /* ─── MATHEMATICAL BASE ─── */
    // Helper to reduce numbers > 22
    reduce(n) {
        let val = parseInt(n) || 0;
        if (val === 0) return 0;
        while (val > 22) {
            val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return val;
    },

    // Reusing YearMatrixLogic calculations for now
    calculateBase(dateStr) {
        return YearMatrixLogic.calculateBase(dateStr);
    },

    calculate(birthDay, eventMonth, energyAgeRight, range = null) {
        const reduce = (n) => {
            let val = parseInt(n) || 0;
            if (val === 0) return 0;
            while (val > 22) val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
            return val;
        };

        // 1. Calculate Custom Month Matrix Pillars
        const rDay = reduce(birthDay);             // Left pillar (Birth Day)
        const rMonth = reduce(eventMonth);         // Top pillar (Event Month)
        const rYear = reduce(energyAgeRight);      // Right pillar (Age)
        const sumBottom = reduce(rDay + rMonth + rYear);
        const centerValue = reduce(rDay + rMonth + rYear + sumBottom);

        const tl = reduce(rDay + rMonth);
        const tr = reduce(rMonth + rYear);
        const br = reduce(rYear + sumBottom);
        const bl = reduce(sumBottom + rDay);

        const values = [rDay, tl, rMonth, tr, rYear, br, sumBottom, bl];
        const U = values.map(v => reduce(v + centerValue));
        const Y = values.map((v, idx) => reduce(v + U[idx]));

        const innerA = reduce(U[4] + U[6]);
        const innerB = reduce(U[4] + innerA);
        const innerC = reduce(U[6] + innerA);

        const base = {
            points: { rDay, rMonth, rYear, sumBottom, centerValue, tl, tr, br, bl },
            values, U, Y,
            innerA, innerB, innerC,
            moneyChannel: [innerB, innerA, innerC],
            relChannel: [centerValue, reduce(centerValue + br), br],
            destiny: {
                sky: reduce(rMonth + sumBottom),
                earth: reduce(rDay + rYear),
                maleLine: reduce(tl + br),
                femaleLine: reduce(tr + bl)
            }
        };

        // 2. Dates Ring logic
        let startDate, endDate;
        if (range && range.start && range.end) {
            startDate = new Date(range.start);
            endDate = new Date(range.end);
            // endDate from YearMatrixLogic is the start of the next month, which is perfect for '<' loop
        } else {
            // Fallback
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }

        const days = [];
        const iterDate = new Date(startDate);
        while (iterDate < endDate) {
            const d = iterDate.getDate();
            const m = iterDate.getMonth() + 1;
            const fmt = n => String(n).padStart(2, '0');
            days.push({
                dateFormatted: `${fmt(d)}.${fmt(m)}`,
                fullDate: new Date(iterDate),
                value: 0
            });
            iterDate.setDate(iterDate.getDate() + 1);
        }

        base.days = days;
        return base;
    },


    /* ─── VISUALIZATION ─── */
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
        // Adjusted radius for days ring
        const R_DAYS_INNER = 40;
        const R_DAYS_OUTER = 270; // Extend to almost edge

        // Helper functions
        function createSVGElement(tag, attrs = {}) {
            const el = document.createElementNS(svgNS, tag);
            for (let key in attrs) el.setAttribute(key, attrs[key]);
            return el;
        }

        const angles = [
            Math.PI, Math.PI * 5 / 4, Math.PI * 3 / 2, Math.PI * 7 / 4,
            0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4
        ];
        // Linear interpolation helper
        const lerp = (p1, p2, t) => ({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });

        const outerPoints = angles.map(a => ({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }));
        const uPoints = angles.map(a => ({ x: cx + innerRadius2 * Math.cos(a), y: cy + innerRadius2 * Math.sin(a) }));

        // Layers
        const lineLayer = createSVGElement('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 2 });
        const daysLayer = createSVGElement('g', { id: 'days' });
        const nodeLayer = createSVGElement('g');
        const textLayer = createSVGElement('g', { id: 'text' });
        svg.append(lineLayer, daysLayer, nodeLayer, textLayer);

        function drawNode(x, y, r, fill, stroke, val, txtCol, fontSize = 25) {
            nodeLayer.append(createSVGElement('circle', { cx: x, cy: y, r: r * rScale, fill: fill, stroke: stroke, 'stroke-width': 2 }));
            const t = createSVGElement('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: txtCol, 'font-weight': 'bold', 'font-size': fontSize * tScale });
            t.textContent = val;
            textLayer.append(t);
        }

        // --- DRAW DAYS RING ---
        if (data.days && data.days.length > 0) {
            const totalDays = data.days.length;
            const angleStep = 360 / totalDays;

            // Adjust start angle so the first day is at roughly top-left or top (user preference logic)
            // Screenshot starts "19.12" at approx 9 o'clock (180 deg? 270 deg?)
            // Start at 180 degrees to align with Point A (left corner)
            const startAngleDeg = 180;

            data.days.forEach((dayObj, i) => {
                const currentAngleDeg = startAngleDeg + (i * angleStep);
                const angleRad = currentAngleDeg * Math.PI / 180;

                // Draw Ray Line (Separator)
                // Start at 35 (edge of center circle r=28*1.25), End at 280 (matrix boundary)
                const x1 = cx + 35 * Math.cos(angleRad);
                const y1 = cy + 35 * Math.sin(angleRad);
                const x2 = cx + 280 * Math.cos(angleRad);
                const y2 = cy + 280 * Math.sin(angleRad);

                daysLayer.append(createSVGElement('line', {
                    x1, y1, x2, y2,
                    stroke: '#ccc', 'stroke-width': 1, opacity: 0.8
                }));

                // Draw Date Text in the middle of the sector
                const textAngleDeg = currentAngleDeg + (angleStep / 2);
                const textAngleRad = textAngleDeg * Math.PI / 180;

                // Position text at R=65 (closer to center, replacing month circles)
                const rText = 65;
                const tx = cx + rText * Math.cos(textAngleRad);
                const ty = cy + rText * Math.sin(textAngleRad);

                let normAngle = (textAngleDeg % 360 + 360) % 360;
                let rotation = normAngle;
                if (normAngle > 90 && normAngle < 270) {
                    rotation += 180;
                }

                const dateText = createSVGElement('text', {
                    x: tx, y: ty,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'central',
                    fill: '#3388ff',
                    'font-size': '10',
                    'font-weight': 'bold',
                    transform: `rotate(${rotation}, ${tx}, ${ty})`
                });
                dateText.textContent = dayObj.dateFormatted;

                textLayer.append(dateText);
            });
        }

        // --- DRAW MAIN MATRIX STRUCTURE ---
        const connect = (i1, i2, pts, off = 22) => {
            const p1 = pts[i1], p2 = pts[i2], ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            lineLayer.append(createSVGElement('line', { x1: p1.x + off * Math.cos(ang), y1: p1.y + off * Math.sin(ang), x2: p2.x - off * Math.cos(ang), y2: p2.y - off * Math.sin(ang), stroke: '#ccc', 'stroke-width': 2 }));
        }
        // connect(0, 4, outerPoints); connect(2, 6, outerPoints);

        const outerColors = ["#9A71C9", "#ffffff", "#9A71C9", "#ffffff", "#F34B47", "#ffffff", "#F34B47", "#ffffff"];
        outerPoints.forEach((p, i) => drawNode(p.x, p.y, 22, outerColors[i], "#000", data.values[i], (i % 2 === 0 ? "#fff" : "#000")));
        drawNode(cx, cy, 28, "#F4F866", "#000", data.points.centerValue, "#000", 18);

        const uColors = ["#3EB4F0", "#fff", "#3EB4F0", "#fff", "#D88A4B", "#fff", "#D88A4B", "#fff"];
        const uNodePoints = angles.map(a => ({ x: cx + innerRadius2 * Math.cos(a), y: cy + innerRadius2 * Math.sin(a) }));
        for (let i = 0; i < 8; i++) {
            const fillY = (i === 0 || i === 2) ? "#3366CC" : "#fff";
            drawNode(cx + innerRadius * Math.cos(angles[i]), cy + innerRadius * Math.sin(angles[i]), 18, fillY, "#000", data.Y[i], (fillY === "#3366CC" ? "#fff" : "#000"), 20);
            drawNode(uNodePoints[i].x, uNodePoints[i].y, 15, uColors[i], "#000", data.U[i], (i % 2 === 0 ? "#fff" : "#000"), 16);
        }

        // --- EXTRA CHANNELS (Money/Rel) & FINAL MARKERS ---
        // (Previously omitted, now restored to match standard matrix completeness)

        const drawExtra = (x, y, val, letter, lOffX, lOffY, col, dol, hrt) => {
            drawNode(x, y, 12, col, "#000", val, "#000", 14);
            // Letter Circle
            nodeLayer.append(createSVGElement('circle', { cx: x + lOffX, cy: y + lOffY, r: 7 * rScale, fill: "#000" }));
            textLayer.append(createSVGElement('text', { x: x + lOffX, y: y + lOffY, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#fff", 'font-weight': 'bold', 'font-size': 9 * tScale }));
            const txt = textLayer.lastChild;
            txt.textContent = letter;

            if (dol) {
                const d = createSVGElement('text', { x: x - 15, y: y - 30, fill: "#04dd00", 'font-weight': 'bold', 'font-size': 18 * tScale });
                d.textContent = "$"; textLayer.append(d);
            }
            if (hrt) {
                const hx = x - 35, hy = y - 32;
                const p = createSVGElement('path', {
                    d: `M ${hx} ${hy}
                        c ${-1.5 * rScale} ${-3 * rScale}, ${-8 * rScale} ${-3 * rScale}, ${-8 * rScale} ${1.5 * rScale}
                        c 0 ${4.5 * rScale}, ${5.5 * rScale} ${8 * rScale}, ${8 * rScale} ${11 * rScale}
                        c ${2.5 * rScale} ${-3 * rScale}, ${8 * rScale} ${-6.5 * rScale}, ${8 * rScale} ${-11 * rScale}
                        c 0 ${-4.5 * rScale}, ${-6.5 * rScale} ${-4.5 * rScale}, ${-8 * rScale} ${-1.5 * rScale} Z`,
                    fill: "#e84e42", stroke: "#000", 'stroke-width': 0.7
                });
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

        // Perimeter Dots & Labels
        for (let i = 0; i < 8; i++) {
            const p1 = outerPoints[i], p2 = outerPoints[(i + 1) % 8], dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy);
            let nx = -dy / len, ny = dx / len; if (nx * ((p1.x + p2.x) / 2 - cx) + ny * ((p1.y + p2.y) / 2 - cy) < 0) { nx = -nx; ny = -ny; }
            const ux = dx / len, uy = dy / len;
            lineLayer.append(createSVGElement('line', { x1: p1.x + nx * 30 - ux * 15, y1: p1.y + ny * 30 - uy * 15, x2: p2.x + nx * 30 + ux * 15, y2: p2.y + ny * 30 + uy * 15, stroke: "#000", opacity: 0.3 }));
            const v1 = data.values[i], v2 = data.values[(i + 1) % 8], p4 = this.reduce(v1 + v2), p2_ = this.reduce(p4 + v1), p1_ = this.reduce(p2_ + v1), p6 = this.reduce(p4 + v2), p7 = this.reduce(p6 + v2);
            const pStart = { x: p1.x + nx * 30 - ux * 15, y: p1.y + ny * 30 - uy * 15 };
            const pEnd = { x: p2.x + nx * 30 + ux * 15, y: p2.y + ny * 30 + uy * 15 };

            [null, p1_, p2_, this.reduce(p2_ + p4), p4, this.reduce(p4 + p6), p6, p7].forEach((v, j) => {
                if (j === 0) return;
                const t = j / 8;
                const px = pStart.x + (pEnd.x - pStart.x) * t;
                const py = pStart.y + (pEnd.y - pStart.y) * t;

                nodeLayer.append(createSVGElement('circle', { cx: px, cy: py, r: (j === 4 ? 4 : 2) * rScale, fill: "#cc3366" }));

                const tx = px + nx * 18;
                const ty = py + ny * 18;
                const l = createSVGElement('text', { x: tx, y: ty, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': (j === 4 ? 13 : 11) * tScale, 'font-weight': j === 4 ? 'bold' : 'normal' });
                l.textContent = v; textLayer.append(l);
            });
        }

        // Final Markers (A, B, C...)
        const mLetters = ["A", "Д", "Б", "Е", "В", "Ж", "Г", "З"], mOffsets = [[-42.5, 0], [-30, -30], [0, -42.5], [30, -30], [42.5, 0], [30, 30], [0, 42.5], [-30, 30]];
        outerPoints.forEach((p, i) => {
            const mx = p.x + mOffsets[i][0], my = p.y + mOffsets[i][1];
            nodeLayer.append(createSVGElement('circle', { cx: mx, cy: my, r: 12 * rScale, fill: (["В", "Г"].includes(mLetters[i]) ? "#e84e42" : (i % 2 !== 0 ? "#000" : "#a185c8")) }));
            const txt = createSVGElement('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: "#fff", 'font-weight': 'bold', 'font-size': 15 * tScale });
            txt.textContent = mLetters[i]; textLayer.append(txt);
        });

        // Consistent font rendering
        svg.querySelectorAll('text').forEach(t => { if (t.getAttribute('content')) { t.textContent = t.getAttribute('content'); t.removeAttribute('content'); } });
    }
};

window.MonthMatrixLogic = MonthMatrixLogic;
