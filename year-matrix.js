/**
 * Yearly Forecast Matrix Logic & Rendering
 * Separated to avoid conflicts with main matrix-logic.js
 */

const YearMatrixLogic = {
    /**
     * Reduces number to <= 22
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
     * Calculate Yearly Matrix Data
     * Based on: Birth Day, Birth Month, and Target Year
     */
    calculate(day, month, targetYear) {
        // 1. Initial values
        const rDay = this.reduce(day);       // Left (A)
        const rMonth = this.reduce(month);   // Top (B)
        const rYear = this.reduce(targetYear.toString().split('').reduce((a, b) => a + parseInt(b), 0)); // Right (C) - Target Year

        // 2. Bottom (D) = A + B + C
        const sumBottom = this.reduce(rDay + rMonth + rYear);

        // 3. Center (E) = A + B + C + D
        const center = this.reduce(rDay + rMonth + rYear + sumBottom);

        // 4. Diagonals (Generic matrix logic)
        // TL = A + B
        const tl = this.reduce(rDay + rMonth);
        // TR = B + C
        const tr = this.reduce(rMonth + rYear);
        // BR = C + D
        const br = this.reduce(rYear + sumBottom);
        // BL = D + A
        const bl = this.reduce(sumBottom + rDay);

        // 5. Inner points (closer to center) lines
        // Usually Center + Corner
        const innerLeft = this.reduce(rDay + center);
        const innerTop = this.reduce(rMonth + center);
        const innerRight = this.reduce(rYear + center);
        const innerBottom = this.reduce(sumBottom + center);

        return {
            points: {
                left: rDay,
                top: rMonth,
                right: rYear,
                bottom: sumBottom,
                center: center,
                tl, tr, br, bl,
                innerLeft, innerTop, innerRight, innerBottom
            },
            input: { day, month, targetYear }
        };
    },

    /**
     * Draw SVG for Yearly Matrix
     * @param {Object} data Calculated data
     * @param {string} containerId DOM ID to inject SVG into
     */
    drawSVG(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const p = data.points;
        const width = 360; // Internal SVG coordinate space
        const height = 360;
        const cx = 180;
        const cy = 180;

        // Colors from screenshot
        const colors = {
            purple: '#9059D2',
            blue: '#2F80ED',
            cyan: '#56CCF2',
            green: '#27AE60',
            yellow: '#F2C94C',
            orange: '#F2994A',
            red: '#EB5757',
            white: '#FFFFFF',
            text: '#000000',
            line: 'rgba(0, 0, 0, 0.15)'
        };

        // Radii
        const rOuter = 140;
        const rInner = 80;
        const rCenter = 30;

        // SVG Template
        let svgHtml = `
            <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <!-- Defs for gradients or filters if needed -->
                <defs>
                   <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
                   </filter>
                </defs>

                <!-- Background/Lines Layer -->
                <g stroke="${colors.line}" stroke-width="1.5">
                    <!-- Octagon/Circle outline -->
                    <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" />
                    <!-- Inner Circle -->
                    <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" />
                    
                    <!-- Axes -->
                    <line x1="${cx - rOuter}" y1="${cy}" x2="${cx + rOuter}" y2="${cy}" /> <!-- Horz -->
                    <line x1="${cx}" y1="${cy - rOuter}" x2="${cx}" y2="${cy + rOuter}" /> <!-- Vert -->
                    <line x1="${cx - rOuter * 0.707}" y1="${cy - rOuter * 0.707}" x2="${cx + rOuter * 0.707}" y2="${cy + rOuter * 0.707}" /> <!-- Diag 1 -->
                    <line x1="${cx - rOuter * 0.707}" y1="${cy + rOuter * 0.707}" x2="${cx + rOuter * 0.707}" y2="${cy - rOuter * 0.707}" /> <!-- Diag 2 -->
                </g>

                <!-- Period Labels (Months on spokes) - Placeholder visual -->
                <g font-family="Manrope, sans-serif" font-size="6" fill="#3E67EE" text-anchor="middle">
                   <!-- Logic to place dates would go here, omitting for simplicity/cleanliness first -->
                </g>

                <!-- Nodes -->
                <g>
                    <!-- CENTER (Yellow) -->
                    ${this.drawCircle(cx, cy, 26, colors.yellow, p.center, true)}

                    <!-- LEFT (Purple) -->
                    ${this.drawCircle(cx - rOuter, cy, 20, colors.purple, p.left, true)}
                    <!-- Inner Left (Blue) -->
                    ${this.drawCircle(cx - rInner, cy, 14, colors.blue, p.innerLeft, true)}

                    <!-- TOP (Purple) -->
                    ${this.drawCircle(cx, cy - rOuter, 20, colors.purple, p.top, true)}
                    <!-- Inner Top (Blue) -->
                    ${this.drawCircle(cx, cy - rInner, 14, colors.blue, p.innerTop, true)}

                    <!-- RIGHT (Red) -->
                    ${this.drawCircle(cx + rOuter, cy, 20, colors.red, p.right, true)}
                    <!-- Inner Right (Orange) -->
                    ${this.drawCircle(cx + rInner, cy, 14, colors.orange, p.innerRight, true)}

                    <!-- BOTTOM (Red) -->
                    ${this.drawCircle(cx, cy + rOuter, 20, colors.red, p.bottom, true)}
                    <!-- Inner Bottom (Orange) -->
                    ${this.drawCircle(cx, cy + rInner, 14, colors.orange, p.innerBottom, true)}

                    <!-- DIAGONALS (White with black text usually, or specific colors) -->
                     ${this.drawCircle(cx - rOuter * 0.7, cy - rOuter * 0.7, 16, colors.white, p.tl, false, true)}
                     ${this.drawCircle(cx + rOuter * 0.7, cy - rOuter * 0.7, 16, colors.white, p.tr, false, true)}
                     ${this.drawCircle(cx + rOuter * 0.7, cy + rOuter * 0.7, 16, colors.white, p.br, false, true)}
                     ${this.drawCircle(cx - rOuter * 0.7, cy + rOuter * 0.7, 16, colors.white, p.bl, false, true)}
                </g>
            </svg>
        `;

        container.innerHTML = svgHtml;
    },

    drawCircle(cx, cy, r, color, val, isColoredTextWhite = false, hasBorder = false) {
        const textColor = isColoredTextWhite ? '#FFFFFF' : '#000000';
        const borderAttr = hasBorder ? `stroke="#333" stroke-width="1"` : '';
        const textSize = r * 1.1;

        return `
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" ${borderAttr} filter="url(#shadow)" />
            <text x="${cx}" y="${cy}" dy=".35em" text-anchor="middle" 
                  fill="${textColor}" font-family="Manrope, sans-serif" font-weight="700" font-size="${textSize}">
                ${val}
            </text>
        `;
    }
};
