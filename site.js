(function () {
    const FONT_FLIP = 60;
    const DARK_RGB = 30;
    const LIGHT_RGB = 255;
    const DARK_BORDER = 51;
    const LIGHT_BORDER = 234;

    function lerp(start, end, t) {
        return Math.round(start + (end - start) * t);
    }

    function rgb(value) {
        return 'rgb(' + value + ', ' + value + ', ' + value + ')';
    }

    function readBrightness() {
        const stored = parseFloat(localStorage.getItem('brightness'));
        if (!isNaN(stored)) return Math.max(0, Math.min(100, stored));
        return localStorage.getItem('theme') === 'light' ? 100 : 20;
    }

    function applyBrightness(percent) {
        const value = Math.max(0, Math.min(100, Number(percent)));
        const t = value / 100;
        const bg = lerp(DARK_RGB, LIGHT_RGB, t);
        const border = lerp(DARK_BORDER, LIGHT_BORDER, t);

        document.documentElement.style.setProperty('--page-bg', rgb(bg));
        document.documentElement.style.setProperty('--page-border', rgb(border));
        document.documentElement.style.setProperty('--brightness', String(value));
        document.body.classList.toggle('dark-mode', value < FONT_FLIP);
        localStorage.setItem('brightness', String(Math.round(value)));
    }

    const slider = document.getElementById('brightness-scale');
    const brightness = readBrightness();
    if (slider) {
        slider.value = String(brightness);
        slider.addEventListener('input', () => applyBrightness(slider.value));
    }
    applyBrightness(brightness);

    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const filterValueLower = filterValue.toLowerCase();

            projectCards.forEach(card => {
                const categories = (card.getAttribute('data-category') || '').toLowerCase();
                const categoryList = categories.split(',').map(c => c.trim());
                card.style.display = (filterValue === 'all' || categoryList.includes(filterValueLower))
                    ? 'block'
                    : 'none';
            });
        });
    });
})();
