/**
 * Matrix of Destiny - Core Calculation Logic
 * This file contains ONLY the mathematical formulas.
 * No UI or SVG logic here.
 */

const MatrixLogic = {
    /**
     * Reduces a number by summing its digits until it's <= 22
     * @param {number|string} n 
     * @returns {number}
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

        // Add emotion (reduced sum of body + energy)
        chakras.forEach(c => {
            c.emotion = this.reduce(c.body + c.energy);
        });

        // Totals
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
    }
};

// If using in browser directly without modules
window.MatrixLogic = MatrixLogic;
