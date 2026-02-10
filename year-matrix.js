/**
 * Year Forecast Matrix — отдельный модуль
 * Визуальная форма ИДЕНТИЧНА основной матрице (drawFullMatrixSVG)
 * Логика расчёта будет доработана на следующем шаге
 */

const YearMatrixLogic = {

    /* ─── Математика ─── */

    reduce(n) {
        let val = parseInt(n) || 0;
        if (val === 0) return 0;
        while (val > 22) {
            val = String(val).split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return val;
    },

    /**
     * Расчёт годовой матрицы (формат совместим с drawSVG)
     * Пока используется та же базовая логика — будет заменена
     */
    calculate(day, month, targetYear) {
        const r = this.reduce.bind(this);

        // 1. Base points (Personal Square)
        const rDay = r(day);
        const rMonth = r(month);
        const rYear = r(String(targetYear).split('').reduce((a, b) => a + +b, 0));
        const sumBot = r(rDay + rMonth + rYear);

        // 2. Center
        const centerValue = r(rDay + rMonth + rYear + sumBot);

        // 3. Diagonal points (Ancestral Square)
        const tl = r(rDay + rMonth);
        const tr = r(rMonth + rYear);
        const br = r(rYear + sumBot);
        const bl = r(sumBot + rDay);

        // values[]: 0:Left, 1:TL, 2:Top, 3:TR, 4:Right, 5:BR, 6:Bottom, 7:BL
        const values = [rDay, tl, rMonth, tr, rYear, br, sumBot, bl];

        // 4. Middle Layer (U)
        const U = values.map(v => r(v + centerValue));

        // 5. Outer Layer (Y)
        const Y = values.map((v, idx) => r(v + U[idx]));

        // 6. Destiny Totals
        const sky = r(rMonth + sumBot);
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
                rDay, rMonth, rYear, sumBottom: sumBot,
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
            },
            input: { day, month, targetYear }
        };
    },

    /* ─── SVG-рендеринг (точная копия drawFullMatrixSVG) ─── */

    drawSVG(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const svgNS = 'http://www.w3.org/2000/svg';
        const W = 700, H = 700;
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.id = 'yearMatrixSvg';

        const reduce = this.reduce;
        const cx = 350, cy = 350, radius = 270;
        const rScale = 1.25;
        const tScale = 1.20;
        const innerRadius = 220;
        const innerRadius2 = 178.75;

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

        // Layers
        const lineLayer = el('g', { stroke: 'rgba(0,0,0,0.15)', 'stroke-width': 2 });
        const nodeLayer = el('g');
        const textLayer = el('g');
        const ageLayer = el('g', { class: 'age-labels' });
        svg.append(lineLayer, ageLayer, nodeLayer, textLayer);

        function drawGenericLine(p1, p2, col, width, opacity) {
            width = width || 2; opacity = opacity || 0.5;
            lineLayer.append(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: col, 'stroke-width': width, opacity: opacity }));
        }

        // ─── Age Labels 1-79 ───
        (function drawAgeLabels() {
            for (let i = 0; i < 8; i++) {
                const p1 = outerPoints[i];
                const p2 = outerPoints[(i + 1) % 8];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2;
                const vcx = cx - mx;
                const vcy = cy - my;
                const distC = Math.hypot(vcx, vcy);
                const nx = vcx / distC;
                const ny = vcy / distC;
                const labelOffset = -14;

                for (let j = 1; j <= 7; j++) {
                    const t = 0.5 + (j - 4) / 9;
                    const x = p1.x + dx * t;
                    const y = p1.y + dy * t;
                    let currentOffset = labelOffset;
                    if (j === 4 && [0, 3, 4, 7].includes(i)) {
                        currentOffset = -4;
                    }
                    const lx = x + nx * currentOffset;
                    const ly = y + ny * currentOffset;
                    const startAge = i * 10;
                    let labelText = '';
                    if (j === 4) {
                        labelText = `${startAge + 5} лет`;
                    } else if (j < 4) {
                        labelText = `${startAge + j}-${startAge + j + 1}`;
                    } else {
                        labelText = `${startAge + j + 1}-${startAge + j + 2}`;
                    }
                    const isMid = (j === 4);
                    const ageText = el('text', {
                        x: lx, y: ly,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'central',
                        fill: isMid ? '#000' : '#999',
                        'font-size': (isMid ? 10 : 8) * tScale,
                        'font-weight': isMid ? '700' : 'normal',
                        'font-family': 'Manrope, sans-serif'
                    });
                    ageText.textContent = labelText;
                    ageLayer.append(ageText);
                }
            }
        })();

        function connectNodes(idx1, idx2, pts, offsetR, col, width, opacity) {
            offsetR = offsetR || 22; col = col || '#888'; width = width || 2; opacity = opacity || 0.5;
            const p1 = pts[idx1], p2 = pts[idx2];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const start = { x: p1.x + offsetR * Math.cos(angle), y: p1.y + offsetR * Math.sin(angle) };
            const end = { x: p2.x - offsetR * Math.cos(angle), y: p2.y - offsetR * Math.sin(angle) };
            drawGenericLine(start, end, col, width, opacity);
        }

        function drawNode(x, y, r, fill, stroke, val, txtCol, fontSize) {
            fontSize = fontSize || 25;
            const scaledR = r * rScale;
            const scaledFS = fontSize * tScale;
            nodeLayer.append(el('circle', { cx: x, cy: y, r: scaledR, fill: fill, stroke: stroke, 'stroke-width': 2 }));
            const t = el('text', { x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: txtCol, 'font-weight': 'bold', 'font-size': scaledFS });
            t.textContent = val;
            textLayer.append(t);
        }

        // ─── Lines ───

        // Personal Square: 0-2-4-6
        connectNodes(0, 2, outerPoints); connectNodes(2, 4, outerPoints);
        connectNodes(4, 6, outerPoints); connectNodes(6, 0, outerPoints);

        // Ancestral Square: 1-3-5-7
        connectNodes(1, 3, outerPoints); connectNodes(3, 5, outerPoints);
        connectNodes(5, 7, outerPoints); connectNodes(7, 1, outerPoints);

        // Main Axes
        connectNodes(0, 4, outerPoints);
        connectNodes(2, 6, outerPoints);

        // ─── Outer Nodes ───
        const values = data.values;
        const outerColors = ['#9A71C9', '#ffffff', '#9A71C9', '#ffffff', '#F34B47', '#ffffff', '#F34B47', '#ffffff'];
        const outerTxtCols = ['#fff', '#000', '#FFF', '#000', '#FFF', '#000', '#FFF', '#000'];
        outerPoints.forEach((p, i) => drawNode(p.x, p.y, 22, outerColors[i], '#000', values[i], outerTxtCols[i]));

        // ─── Center ───
        drawNode(cx, cy, 28, '#F4F866', '#000', data.points.centerValue, '#000', 18);

        // ZK dot
        const zkDotY = cy + 50;
        nodeLayer.append(el('circle', { cx: cx, cy: zkDotY, r: 10 * rScale, fill: '#F4F866', stroke: '#000', 'stroke-width': 1 }));
        const zkText = el('text', { x: cx, y: zkDotY, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#000', 'font-weight': 'bold', 'font-size': 10 * tScale });
        zkText.textContent = 'ЗК';
        textLayer.append(zkText);

        // ─── Inner Nodes (Y and U) ───
        const Y = data.Y;
        const U = data.U;
        const uColors = ['#3EB4F0', '#fff', '#3EB4F0', '#fff', '#D88A4B', '#fff', '#D88A4B', '#fff'];
        const uTxtColors = ['#fff', '#000', '#fff', '#000', '#fff', '#000', '#fff', '#000'];

        for (let i = 0; i < 8; i++) {
            const px = cx + innerRadius * Math.cos(angles[i]);
            const py = cy + innerRadius * Math.sin(angles[i]);
            let fill = '#fff';
            if (i === 0 || i === 2) fill = '#3366CC';
            drawNode(px, py, 18, fill, '#000', Y[i], (fill === '#3366CC') ? '#fff' : '#000', 20);

            drawNode(uPoints[i].x, uPoints[i].y, 15, uColors[i], '#000', U[i], uTxtColors[i], 16);
        }

        // ─── Mids (Green) ───
        const midU1 = reduce(U[0] + data.points.centerValue);
        const midU2 = reduce(U[2] + data.points.centerValue);
        const radMid = innerRadius2 / 2;
        drawNode(cx + radMid * Math.cos(angles[0]), cy + radMid * Math.sin(angles[0]), 15, '#73b55f', '#000', midU1, '#fff', 14);
        drawNode(cx + radMid * Math.cos(angles[2]), cy + radMid * Math.sin(angles[2]), 15, '#73b55f', '#000', midU2, '#fff', 14);

        // ─── Extra Icons (К, О, Н) ───
        const innerA = reduce(U[4] + U[6]);
        const innerB = reduce(U[4] + innerA);
        const innerC = reduce(U[6] + innerA);

        function drawExtra(angleIdx, offX, offY, val, letter, lOffX, lOffY, col, dol, hrt) {
            const rad = innerRadius2 * 0.5;
            const x = cx + rad * Math.cos(angles[angleIdx]) + offX;
            const y = cy + rad * Math.sin(angles[angleIdx]) + offY;
            drawNode(x, y, 12, col, '#000', val, '#000', 14);
            // Letter Circle
            nodeLayer.append(el('circle', { cx: x + lOffX, cy: y + lOffY, r: 7 * rScale, fill: '#000' }));
            const lt = el('text', { x: x + lOffX, y: y + lOffY, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-weight': 'bold', 'font-size': 9 * tScale });
            lt.textContent = letter;
            textLayer.append(lt);
            if (dol) {
                const d = el('text', { x: x - 15, y: y - 37, fill: '#04dd00', 'font-weight': 'bold', 'font-size': 26 * tScale });
                d.textContent = '$'; textLayer.append(d);
            }
            if (hrt) {
                const hx = x - 45, hy = y - 40;
                const p = el('path', { d: `M ${hx} ${hy} c ${-5 * rScale} ${-5 * rScale}, ${-15 * rScale} 0, ${-10 * rScale} ${10 * rScale} c ${5 * rScale} ${10 * rScale}, ${15 * rScale} ${10 * rScale}, ${20 * rScale} 0 c ${5 * rScale} ${-10 * rScale}, ${-5 * rScale} ${-15 * rScale}, ${-10 * rScale} ${-10 * rScale} Z`, fill: '#e84e42', stroke: '#000' });
                nodeLayer.append(p);
            }
        }
        drawExtra(5, 25, 25, innerA, 'К', -17, -17, '#fff', false, false);
        drawExtra(5, 95, 25, innerB, 'О', -17, -17, '#fff', true, false);
        drawExtra(5, 25, 95, innerC, 'Н', -17, -17, '#fff', false, true);

        // ─── Arrow markers ───
        const defs = el('defs');
        svg.appendChild(defs);

        function createArrowMarker(id, color) {
            const marker = document.createElementNS(svgNS, 'marker');
            marker.setAttribute('id', id);
            marker.setAttribute('viewBox', '0 0 10 10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '5');
            marker.setAttribute('markerWidth', '6');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('orient', 'auto-start-reverse');
            const path = document.createElementNS(svgNS, 'path');
            path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
            path.setAttribute('fill', color);
            marker.appendChild(path);
            return marker;
        }

        defs.appendChild(createArrowMarker('ymArrowMale', '#3E67EE'));
        defs.appendChild(createArrowMarker('ymArrowFemale', '#F7494C'));

        // ─── Diagonal Rays ───
        function drawRay(idx, col, txt, isFlip, markerId) {
            const pInner = uPoints[idx];
            let x2 = pInner.x;
            let y2 = pInner.y;
            if (markerId) {
                const dx = pInner.x - cx;
                const dy = pInner.y - cy;
                const len = Math.hypot(dx, dy);
                const reduceLen = 17 * rScale;
                const t = (len - reduceLen) / len;
                x2 = cx + dx * t;
                y2 = cy + dy * t;
            }
            const line = el('line', { x1: cx, y1: cy, x2: x2, y2: y2, stroke: col, 'stroke-width': 2 });
            if (markerId) {
                line.setAttribute('marker-end', `url(#${markerId})`);
            }
            lineLayer.append(line);
            if (txt) {
                const mx = (cx + pInner.x) / 2, my = (cy + pInner.y) / 2;
                let deg = (angles[idx] * 180 / Math.PI) + (isFlip ? 180 : 0);
                const t = el('text', { x: mx, y: my, 'text-anchor': 'middle', 'font-size': 9 * tScale, transform: `rotate(${deg} ${mx} ${my}) translate(0, -5)` });
                t.textContent = txt; textLayer.append(t);
            }
        }
        drawRay(1, '#3E67EE', 'линия мужского рода', true, 'ymArrowMale');
        drawRay(3, '#F7494C', 'линия женского рода', false, 'ymArrowFemale');
        drawRay(5, '#3E67EE', '', false, 'ymArrowMale');
        drawRay(7, '#F7494C', '', true, 'ymArrowFemale');

        // ─── Perimeter Details ───
        function drawPerimeter(i1, i2, v1, v2) {
            const p1 = outerPoints[i1], p2 = outerPoints[i2];
            const dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.sqrt(dx * dx + dy * dy);
            let nx = -dy / len, ny = dx / len;
            const mxG = (p1.x + p2.x) / 2, myG = (p1.y + p2.y) / 2;
            if (nx * (mxG - cx) + ny * (myG - cy) < 0) { nx = -nx; ny = -ny; }

            const offsetLine = 30;
            const offsetText = 48;
            const ux = dx / len, uy = dy / len;

            drawGenericLine(
                { x: p1.x + nx * offsetLine - ux * 15, y: p1.y + ny * offsetLine - uy * 15 },
                { x: p2.x + nx * offsetLine + ux * 15, y: p2.y + ny * offsetLine + uy * 15 },
                '#000', 1.5, 0.6
            );

            const p4 = reduce(v1 + v2), p2_ = reduce(p4 + v1), p1_ = reduce(p2_ + v1), p3 = reduce(p2_ + p4), p6 = reduce(p4 + v2), p5 = reduce(p4 + p6), p7 = reduce(p6 + v2);
            const vals = [null, p1_, p2_, p3, p4, p5, p6, p7];

            for (let j = 1; j <= 7; j++) {
                const t = 0.5 + (j - 4) / 9;
                const tx = p1.x + ux * len * t + nx * offsetLine;
                const ty = p1.y + uy * len * t + ny * offsetLine;
                const tax = p1.x + ux * len * t + nx * offsetText;
                const tay = p1.y + uy * len * t + ny * offsetText;

                nodeLayer.append(el('circle', { cx: tx, cy: ty, r: (j === 4 ? 4 : 2) * rScale, fill: '#cc3366' }));

                const l = el('text', {
                    x: tax, y: tay,
                    'text-anchor': 'middle', 'dominant-baseline': 'central',
                    'font-size': (j === 4 ? 13 : 11) * tScale,
                    'font-weight': j === 4 ? 'bold' : 'normal'
                });
                l.textContent = vals[j];
                textLayer.append(l);
            }
        }
        for (let i = 0; i < 8; i++) drawPerimeter(i, (i + 1) % 8, values[i], values[(i + 1) % 8]);

        // ─── Age Markers (Letter circles + ages) ───
        const mLetters = ['A', 'Д', 'Б', 'Е', 'В', 'Ж', 'Г', 'З'];
        const mAges = ['0 лет', '10 лет', '20 лет', '30 лет', '40 лет', '50 лет', '60 лет', '70 лет'];
        const mOffsets = [[-42.5, 0], [-30, -30], [0, -42.5], [30, -30], [42.5, 0], [30, 30], [0, 42.5], [-30, 30]];
        const mAligns = ['end', 'end', 'start', 'start', 'start', 'start', 'start', 'end'];

        outerPoints.forEach((p, i) => {
            const mx = p.x + mOffsets[i][0], my = p.y + mOffsets[i][1];
            nodeLayer.append(el('circle', {
                cx: mx, cy: my, r: 12 * rScale,
                fill: (['В', 'Г'].includes(mLetters[i]) ? '#e84e42' : (i % 2 !== 0 ? '#000' : '#a185c8'))
            }));
            const lt = el('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-weight': 'bold', 'font-size': 15 * tScale });
            lt.textContent = mLetters[i];
            textLayer.append(lt);

            if (i === 0) {
                const at = el('text', { x: mx, y: my + 22 * tScale, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#000', 'font-weight': 'bold', 'font-size': 13 * tScale });
                at.textContent = mAges[i]; textLayer.append(at);
            } else if (i === 4) {
                const at = el('text', { x: mx + 8 * tScale, y: my + 22 * tScale, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#000', 'font-weight': 'bold', 'font-size': 13 * tScale });
                at.textContent = mAges[i]; textLayer.append(at);
            } else {
                const at = el('text', {
                    x: mx + (mAligns[i] === 'start' ? 15 : -15) * tScale, y: my,
                    'text-anchor': mAligns[i], 'dominant-baseline': 'central',
                    fill: '#000', 'font-weight': 'bold', 'font-size': 14 * tScale
                });
                at.textContent = mAges[i]; textLayer.append(at);
            }
        });

        // ─── Inject ───
        container.innerHTML = '';
        container.appendChild(svg);

        // Helper
        function el(tag, attrs) {
            attrs = attrs || {};
            const e = document.createElementNS(svgNS, tag);
            for (const k in attrs) e.setAttribute(k, attrs[k]);
            return e;
        }
    }
};

window.YearMatrixLogic = YearMatrixLogic;
