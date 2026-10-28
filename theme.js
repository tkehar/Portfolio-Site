/* ==========================================================================
   Lights toggle: two states (On = light, Off = dark) with smooth transitions.
   Load synchronously as the first thing inside <body> so the saved theme
   applies before the first paint.
   ========================================================================== */
(function () {
    var DARK_BG = '#1E1E1E';
    var LIGHT_BG = '#ffffff';
    var STORAGE_KEY = 'theme';
    var LEGACY_LEVEL_KEY = 'themeLevel';
    var root = document.documentElement;

    function readDark() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'dark') return true;
            if (stored === 'light') return false;
            var level = localStorage.getItem(LEGACY_LEVEL_KEY);
            if (level !== null && level !== '' && !isNaN(level)) return Number(level) < 60;
            var legacy = localStorage.getItem('theme');
            if (legacy === 'dark') return true;
        } catch (e) {}
        return false;
    }

    function save(isDark) {
        try { localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light'); } catch (e) {}
    }

    function apply(isDark) {
        root.style.setProperty('--page-bg', isDark ? DARK_BG : LIGHT_BG);
        document.body.classList.toggle('dark-mode', isDark);

        var btn = document.getElementById('theme-toggle');
        if (!btn) return;
        var label = btn.querySelector('.theme-toggle-label');
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        btn.setAttribute('aria-label', isDark ? 'Lights Off' : 'Lights On');
        if (label) label.textContent = isDark ? 'Lights Off' : 'Lights On';
    }

    var isDark = readDark();
    apply(isDark);

    function initToggle() {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;
        apply(isDark);
        btn.addEventListener('click', function () {
            isDark = !isDark;
            apply(isDark);
            save(isDark);
        });
    }

    window.portfolioTheme = { refresh: initToggle };

    function bootToggle() {
        if (document.querySelector('[data-component="header"]') && !document.getElementById('theme-toggle')) {
            document.addEventListener('portfolio:header', initToggle, { once: true });
            return;
        }
        initToggle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootToggle);
    } else {
        bootToggle();
    }
})();
