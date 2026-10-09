/* ==========================================================================
   Lights slider: blends the page background between dark (0%) and light (100%).
   Load this synchronously as the first thing inside <body> on every page so
   the saved level is applied before the first paint (no flash).
   ========================================================================== */
(function () {
    // --- Settings (edit these to tune the slider site-wide) ---
    var DARK_BG = '#1E1E1E';   // background at 0%
    var LIGHT_BG = '#ffffff';  // background at 100%
    var TEXT_SWITCH_AT = 60;   // below this %, text uses the dark-mode (light) colors
    var DEFAULT_LEVEL = 100;   // level for first-time visitors

    var STORAGE_KEY = 'themeLevel';
    var root = document.documentElement;

    function hexToRgb(hex) {
        var h = hex.replace('#', '');
        if (h.length === 3) h = h.replace(/./g, '$&$&');
        var n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    var dark = hexToRgb(DARK_BG);
    var light = hexToRgb(LIGHT_BG);

    function mix(t) {
        return 'rgb(' + dark.map(function (c, i) {
            return Math.round(c + (light[i] - c) * t);
        }).join(', ') + ')';
    }

    function clamp(level) {
        return Math.min(100, Math.max(0, Math.round(level)));
    }

    function readLevel() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw !== null && raw !== '' && !isNaN(raw)) return clamp(Number(raw));
            // Migrate visitors who used the old on/off toggle.
            var legacy = localStorage.getItem('theme');
            if (legacy === 'dark') return 0;
            if (legacy === 'light') return 100;
        } catch (e) {}
        return DEFAULT_LEVEL;
    }

    function saveLevel(level) {
        try { localStorage.setItem(STORAGE_KEY, String(level)); } catch (e) {}
    }

    function apply(level) {
        root.style.setProperty('--page-bg', mix(level / 100));
        document.body.classList.toggle('dark-mode', level < TEXT_SWITCH_AT);
    }

    var level = readLevel();
    apply(level);

    function initSlider() {
        var slider = document.getElementById('theme-slider');
        if (!slider) return;
        var label = document.getElementById('theme-slider-value');

        function render() {
            slider.value = level;
            slider.setAttribute('aria-valuetext', level + '%');
            if (label) label.textContent = level + '%';
        }

        slider.addEventListener('input', function () {
            level = clamp(Number(slider.value));
            apply(level);
            render();
            saveLevel(level);
        });

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSlider);
    } else {
        initSlider();
    }
})();
