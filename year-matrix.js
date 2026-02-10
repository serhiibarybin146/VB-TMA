/**
 * Year Forecast Matrix — Exact Visual Replication
 * Based on user screenshot: 12-month ring starting at 10h, specific colors/nodes layout.
 */

const YearMatrixLogic = {

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
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);

        // 1. External Cross (Large Circles)
        const valDay = r(dayNum);          // Left (Purple)
        const valMonth = r(monthNum);      // Top (Purple)
        const valYear = r(String(targetYear).split('').reduce((a, b) => a + +b, 0)); // Right (Red)
        const valBottom = r(valDay + valMonth + valYear); // Bottom (Red)

        // 2. Center
        const valCenter = r(valDay + valMonth + valYear + valBottom);

        // 3. Diagonals (White Circles)
        const valTL = r(valDay + valMonth);
        const valTR = r(valMonth + valYear);
        const valBR = r(valYear + valBottom);
        const valBL = r(valBottom + valDay);

        // 4. Inner Cross 1 (Medium Circles - Blue/Orange)
        const valInnerLeft = r(valDay + valCenter);
        const valInnerTop = r(valMonth + valCenter);
        const valInnerRight = r(valYear + valCenter);
        const valInnerBottom = r(valBottom + valCenter);

        // 5. Inner Cross 2 (Small Cyan Circles)
        const valTinyLeft = r(valInnerLeft + valCenter);
        const valTinyTop = r(valInnerTop + valCenter);
        const valTinyRight = r(valInnerRight + valCenter);
        const valTinyBottom = r(valInnerBottom + valCenter);

        // 6. Months (12 items)
        const months = [];
        let cur = new Date(targetYear, monthNum - 1, dayNum);

        for (let i = 0; i < 12; i++) {
            let start = new Date(cur);
            let end = new Date(cur);
            end.setMonth(end.getMonth() + 1);
            end.setDate(end.getDate() - 1);

            const fmt = d => ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();

            // Placeholder Value
            const val = r(valYear + i);

            months.push({
                seq: i,
                label: i === 0 ? 12 : i,
                dateStart: fmt(start),
                dateEnd: fmt(end),
                value: val
            });

            cur = new Date(end);
            cur.setDate(cur.getDate() + 1);
        }

        return {
            date: { day, month: monthNum, year: targetYear },
            nodes: {
                day: valDay, month: valMonth, year: valYear, bottom: valBottom,
                center: valCenter,
                tl: valTL, tr: valTR, br: valBR, bl: valBL,
                iLeft: valInnerLeft, iTop: valInnerTop, iRight: valInnerRight, iBottom: valInnerBottom,
                tLeft: valTinyLeft, tTop: valTinyTop, tRight: valTinyRight, tBottom: valTinyBottom
            },
            months
        };
    },

    drawSVG(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const W = 700, H = 700;
        const cx = 350, cy = 350;
        const R_OUTER = 270;
        const R_INNER1 = 180;
        const R_INNER2 = 110;
        const R_MONTHS = 225;

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

        // Layers
        const bgLayer = el('g', {});
        const lineLayer = el('g', { stroke: '#ccc', 'stroke-width': 1.5 });
        const textLayer = el('g', { 'font-family': 'Manrope, sans-serif' });
        const nodeLayer = el('g', {});
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

        const angRight = 0, angBottom = Math.PI / 2, angLeft = Math.PI, angTop = 3 * Math.PI / 2;
        const angTL = 5 * Math.PI / 4;
        const angTR = 7 * Math.PI / 4;
        const angBR = Math.PI / 4;
        const angBL = 3 * Math.PI / 4;

        const axes = [
            { a: angLeft, val: data.nodes.day, c: '#8e52c8', t: '#fff', r: 28, type: 'main' },
            { a: angTL, val: data.nodes.tl, c: '#fff', t: '#000', r: 24, type: 'diag' },
            { a: angTop, val: data.nodes.month, c: '#8e52c8', t: '#fff', r: 28, type: 'main' },
            { a: angTR, val: data.nodes.tr, c: '#fff', t: '#000', r: 24, type: 'diag' },
            { a: angRight, val: data.nodes.year, c: '#ff4d4d', t: '#fff', r: 28, type: 'main' },
            { a: angBR, val: data.nodes.br, c: '#fff', t: '#000', r: 24, type: 'diag' },
            { a: angBottom, val: data.nodes.bottom, c: '#ff4d4d', t: '#fff', r: 28, type: 'main' },
            { a: angBL, val: data.nodes.bl, c: '#fff', t: '#000', r: 24, type: 'diag' }
        ];

        // 1. Draw Lines
        const outerPts = axes.map(o => ({ x: cx + R_OUTER * Math.cos(o.a), y: cy + R_OUTER * Math.sin(o.a) }));

        for (let i = 0; i < 8; i++) {
            const p1 = outerPts[i], p2 = outerPts[(i + 1) % 8];
            lineLayer.append(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }));
        }
        lineLayer.append(el('line', { x1: outerPts[0].x, y1: outerPts[0].y, x2: outerPts[4].x, y2: outerPts[4].y }));
        lineLayer.append(el('line', { x1: outerPts[2].x, y1: outerPts[2].y, x2: outerPts[6].x, y2: outerPts[6].y }));
        lineLayer.append(el('line', { x1: outerPts[1].x, y1: outerPts[1].y, x2: outerPts[5].x, y2: outerPts[5].y }));
        lineLayer.append(el('line', { x1: outerPts[3].x, y1: outerPts[3].y, x2: outerPts[7].x, y2: outerPts[7].y }));

        // 2. Draw 12 Months Ring
        data.months.forEach((m, i) => {
            const angleDeg = 180 + (i * 30);
            const angleRad = angleDeg * Math.PI / 180;

            const mx = cx + R_MONTHS * Math.cos(angleRad);
            const my = cy + R_MONTHS * Math.sin(angleRad);

            drawNode(mx, my, 10, '#fff', '#3388ff', m.value || m.label, '#3388ff', 10);

            const tx = cx + (R_MONTHS + 25) * Math.cos(angleRad);
            const ty = cy + (R_MONTHS + 25) * Math.sin(angleRad);

            let rot = angleDeg;
            if (angleDeg > 90 && angleDeg < 270) rot += 180;

            const g = el('g', { transform: `translate(${tx},${ty}) rotate(${rot})` });
            const d1 = el('text', { x: 0, y: -5, 'text-anchor': 'middle', 'font-size': 7, fill: '#3388ff', 'font-weight': 'bold' });
            d1.textContent = m.dateStart.slice(0, 5);
            const d2 = el('text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 7, fill: '#3388ff', 'font-weight': 'bold' });
            d2.textContent = m.dateEnd.slice(0, 5);
            g.append(d1, d2);
            textLayer.append(g);
        });

        // 3. Draw Inner Nodes
        const iLeft = { x: cx + R_INNER1 * Math.cos(angLeft), y: cy + R_INNER1 * Math.sin(angLeft) };
        const iTop = { x: cx + R_INNER1 * Math.cos(angTop), y: cy + R_INNER1 * Math.sin(angTop) };
        const iRight = { x: cx + R_INNER1 * Math.cos(angRight), y: cy + R_INNER1 * Math.sin(angRight) };
        const iBottom = { x: cx + R_INNER1 * Math.cos(angBottom), y: cy + R_INNER1 * Math.sin(angBottom) };

        drawNode(iLeft.x, iLeft.y, 16, '#3388ff', '#000', data.nodes.iLeft, '#fff', 12);
        drawNode(iTop.x, iTop.y, 16, '#3388ff', '#000', data.nodes.iTop, '#fff', 12);
        drawNode(iRight.x, iRight.y, 16, '#ff9933', '#000', data.nodes.iRight, '#fff', 12);
        drawNode(iBottom.x, iBottom.y, 16, '#ff9933', '#000', data.nodes.iBottom, '#fff', 12);

        // 4. Draw Tiny Nodes
        const tLeft = { x: cx + R_INNER2 * Math.cos(angLeft), y: cy + R_INNER2 * Math.sin(angLeft) };
        const tTop = { x: cx + R_INNER2 * Math.cos(angTop), y: cy + R_INNER2 * Math.sin(angTop) };
        const tRight = { x: cx + R_INNER2 * Math.cos(angRight), y: cy + R_INNER2 * Math.sin(angRight) };
        const tBottom = { x: cx + R_INNER2 * Math.cos(angBottom), y: cy + R_INNER2 * Math.sin(angBottom) };

        drawNode(tLeft.x, tLeft.y, 12, '#4CC9F0', '#fff', data.nodes.tLeft, '#fff', 10);
        drawNode(tTop.x, tTop.y, 12, '#4CC9F0', '#fff', data.nodes.tTop, '#fff', 10);
        drawNode(tRight.x, tRight.y, 12, '#4CC9F0', '#fff', data.nodes.tRight, '#fff', 10);
        drawNode(tBottom.x, tBottom.y, 12, '#4CC9F0', '#fff', data.nodes.tBottom, '#fff', 10);

        // 5. Draw Main Outer Nodes
        axes.forEach((ax, i) => {
            const p = outerPts[i];
            drawNode(p.x, p.y, ax.r, ax.c, '#000', ax.val, ax.t, 16);

            const letters = ['А', '?', 'Б', '?', 'В', '?', 'Г', '?'];
            if (i % 2 === 0) {
                const lDist = 40;
                const lx = p.x + lDist * Math.cos(ax.a);
                const ly = p.y + lDist * Math.sin(ax.a);
                const lt = el('circle', { cx: lx, cy: ly, r: 10, fill: ax.c });
                const ltxt = el('text', { x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-size': 10, 'font-weight': 'bold' });
                ltxt.textContent = letters[i];
                nodeLayer.append(lt);
                textLayer.append(ltxt);
            }
        });

        // 6. Center
        drawNode(cx, cy, 32, '#ffcc00', '#000', data.nodes.center, '#000', 20);

        // Icons
        // $ near Bottom-Right
        const angDollar = Math.PI / 3;
        const rDollar = 180;
        const dx = cx + rDollar * Math.cos(angDollar);
        const dy = cy + rDollar * Math.sin(angDollar);
        const txtDol = el('text', { x: dx, y: dy, fill: '#04dd00', 'font-size': 24, 'font-weight': 'bold', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
        txtDol.textContent = '$';
        textLayer.append(txtDol);

        // Heart near Bottom
        const angHeart = Math.PI / 2 - 0.25;
        const rHeart = 160;
        const hx = cx + rHeart * Math.cos(angHeart);
        const hy = cy + rHeart * Math.sin(angHeart);
        const heartPath = el('path', {
            d: `M ${hx} ${hy} m -5,-5 c -3,-3 -8,-3 -11,0 c -3,3 -3,8 0,11 l 11,11 l 11,-11 c 3,-3 3,-8 0,-11 c -3,-3 -8,-3 -11,0 z`,
            fill: '#e84e42'
        });
        nodeLayer.append(heartPath);

        // Inject SVG
        container.innerHTML = '';
        container.appendChild(svg);
    }
};

window.YearMatrixLogic = YearMatrixLogic;
