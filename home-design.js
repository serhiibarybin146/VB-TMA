/* Presentation only: calculation modules and their colour meanings stay intact. */
(() => {
    const home = document.getElementById('homeView');
    const variant = new URLSearchParams(location.search).get('design') === 'obsidian' ? 'obsidian' : 'cosmic';
    document.body.dataset.homeDesign = ['glass', 'cosmic', 'pearl', 'editorial', 'nova', 'orbits', 'space-atlas', 'nebula', 'folio', 'bloom', 'signal', 'obsidian', 'maison', 'prism', 'nocturne', 'almanac', 'mosaic', 'studio', 'panorama'].includes(variant) ? variant : 'atlas';
    const sync = () => document.body.classList.toggle('home-redesign', home.classList.contains('active'));
    new MutationObserver(sync).observe(home, { attributes: true, attributeFilter: ['class'] });
    sync();
    if (variant === 'atlas' || variant === 'cosmic' || !variant) {
        const heading = home.querySelector('.welcome-card h2');
        const emphasis = document.createElement('em');
        emphasis.textContent = 'Судьбы';
        heading.replaceChildren(document.createTextNode('Ваша Матрица '), emphasis);
    }

    const orbit = `<svg viewBox="0 0 200 200" fill="none" aria-hidden="true">
        <circle cx="100" cy="100" r="83"/><circle cx="100" cy="100" r="62"/>
        <path d="M100 17 183 100 100 183 17 100Z M41 41H159V159H41Z M100 17V183 M17 100H183 M41 41 159 159 M159 41 41 159"/>
        <circle class="orbit-core" cx="100" cy="100" r="16"/>
        <circle class="orbit-node" cx="100" cy="17" r="5"/><circle class="orbit-node" cx="183" cy="100" r="5"/>
        <circle class="orbit-node" cx="100" cy="183" r="5"/><circle class="orbit-node" cx="17" cy="100" r="5"/>
    </svg>`;
    const cards = [home.querySelector('.matrix-card:not([data-feature])'), ...['compatibility','year_forecast','money_code','month_forecast'].map(key=>home.querySelector(`[data-feature="${key}"]`))];
    const types = ['main', 'compatibility', 'year', 'money', 'month'];
    const icons = ['solar:magic-stick-3-linear', 'solar:heart-angle-linear', 'solar:calendar-linear', 'solar:wallet-linear', 'solar:moon-linear'];
    cards.forEach((card, i) => {
        card.dataset.card = types[i];
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', card.querySelector('h3').textContent);
        const art = document.createElement('div');
        art.className = 'home-card-art';
        art.setAttribute('aria-hidden', 'true');
        art.innerHTML = i === 0 ? orbit : `<iconify-icon icon="${icons[i]}"></iconify-icon>`;
        card.prepend(art);
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                card.click();
            }
        });
    });
    // Match keyboard and screen-reader order to the visual order.
    [0, 2, 4, 3, 1].forEach(index => home.querySelector('.matrix-grid').append(cards[index]));
    if (variant === 'cosmic') {
        let dates = [];
        try {
            const stored = JSON.parse(localStorage.getItem(recentDatesKey()) || '[]');
            if (Array.isArray(stored)) dates = stored.filter(value => {
                if (typeof value !== 'string' || !/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return false;
                const [d, m, y] = value.split('.').map(Number);
                const check = new Date(y, m - 1, d);
                return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
            });
        } catch (_) {}
        // A compact overview uses actual saved calculations, never placeholder scores.
        let data;
        if (dates[0]) {
            const [d, m, y] = dates[0].split('.');
            data = MatrixLogic.calculateBase(`${y}-${m}-${d}`);
        }
        const points = Array.from({length: 8}, (_, i) => {
            const angle = Math.PI + i * Math.PI / 4;
            return {x: 120 + 87 * Math.cos(angle), y: 120 + 87 * Math.sin(angle)};
        });
        const pointsText = points.map(p => `${p.x},${p.y}`).join(' ');
        const colours = ['#9A71C9', '#fff', '#9A71C9', '#fff', '#F34B47', '#fff', '#F34B47', '#fff'];
        const art = cards[0].querySelector('.home-card-art');
        art.innerHTML = `<svg viewBox="0 0 240 240" fill="none" aria-hidden="true">
            <circle cx="120" cy="120" r="113" stroke-dasharray="1 7"/>
            <circle cx="120" cy="120" r="102"/>
            <circle cx="120" cy="120" r="68" stroke-dasharray="2 5"/>
            <polygon points="${pointsText}"/>
            <path d="M33 120H207 M120 33V207 M58.5 58.5 181.5 181.5 M181.5 58.5 58.5 181.5 M33 120 120 33 207 120 120 207Z M58.5 58.5H181.5V181.5H58.5Z"/>
            ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${data ? 10 : 5}" fill="${colours[i]}" stroke="none"/>${data ? `<text x="${p.x}" y="${p.y + 3}" text-anchor="middle" fill="${i % 2 === 0 ? '#fff' : '#172334'}" stroke="none" font-size="8" font-family="Manrope,sans-serif">${data.values[i]}</text>` : ''}`).join('')}
            <circle cx="120" cy="120" r="17" fill="#F4F866" stroke="none"/>
            ${data ? `<text x="120" y="124" text-anchor="middle" fill="#172334" stroke="none" font-size="12" font-family="Manrope,sans-serif">${data.points.centerValue}</text>` : '<path d="m120 111 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" fill="#172334" stroke="none"/>'}
        </svg>`;
        const now = new Date();
        const yearArt = cards[2].querySelector('.home-card-art');
        yearArt.innerHTML += `<span class="cosmic-year">${now.getFullYear()}</span><span class="cosmic-year-orbit" aria-hidden="true"></span>`;
        yearArt.setAttribute('aria-hidden', 'true');
        cards[4].querySelector('.home-card-art').innerHTML = '<span class="cosmic-moon"></span>';
        cards[3].querySelector('.home-card-art').innerHTML = '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="29"/><path d="m50 18 19 58-49-36h60L31 76Z"/></svg>';

    }
    // The original navigation contains three screens which do not exist yet.
    // Keep users on the current screen instead of routing them to a blank page.
    document.querySelectorAll('.nav-item').forEach(button => {
        const tabId = button.getAttribute('onclick').match(/switchTab\('([^']+)'/)[1];
        if (!document.getElementById(tabId + 'View')) {
            button.disabled = true;
            button.title = 'Раздел пока не реализован';
        }
    });
    const notifications = document.getElementById('notificationsBtn');
    notifications.disabled = true;
    notifications.title = 'Уведомления пока не подключены';
    notifications.setAttribute('aria-label', 'Уведомления');
})();
