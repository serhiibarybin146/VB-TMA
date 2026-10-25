/* Local Cosmic interactions. Pointer gestures never block scrolling or navigation. */
(() => {
    if (document.body.dataset.homeDesign !== 'cosmic') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    document.body.classList.add('cosmic-motion');
    const targets = document.querySelectorAll('#homeView .matrix-card, .tma-nav .nav-item, .cosmic-shortcut-list button');
    targets.forEach((target, index) => {
        target.style.setProperty('--arrival', `${Math.min(index, 5) * 65}ms`);
        let frame = 0;
        const reset = () => {
            cancelAnimationFrame(frame);
            target.classList.remove('cosmic-pressed');
            target.style.setProperty('--tilt-x', '0deg');
            target.style.setProperty('--tilt-y', '0deg');
        };
        const position = event => {
            if (reduced.matches) return;
            const rect = target.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                target.style.setProperty('--glow-x', `${x * 100}%`);
                target.style.setProperty('--glow-y', `${y * 100}%`);
                target.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
                target.style.setProperty('--tilt-y', `${(x - 0.5) * 6}deg`);
            });
        };
        target.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') position(event); });
        target.addEventListener('pointerdown', event => {
            if (event.button > 0 || reduced.matches) return;
            position(event);
            target.classList.add('cosmic-pressed');
        });
        ['pointerleave', 'pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(name => target.addEventListener(name, reset));
    });
    // A touch can finish outside the original card while the page is scrolling.
    window.addEventListener('pointerup', () => targets.forEach(target => target.classList.remove('cosmic-pressed')), { passive: true });
    window.addEventListener('blur', () => targets.forEach(target => target.classList.remove('cosmic-pressed')));
})();
