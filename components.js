/* Figma Header component (207:261 Default / 207:263 Variant2).
   Mounts into [data-component="header"]. Dark mode uses Variant2. */
(function () {
    var HEADER_SELECTOR = '[data-component="header"]';

    function headerMarkup(active) {
        var workActive = active !== 'resume';
        var resumeActive = active === 'resume';
        return (
            '<div class="logo"><a href="index">TALHA AHMED KEHAR</a></div>' +
            '<nav class="nav-links">' +
                '<a href="index" class="nav-tab' + (workActive ? ' active' : '') + '">Work</a>' +
                '<a href="resume" class="nav-tab' + (resumeActive ? ' active' : '') + '">Resume</a>' +
                '<button type="button" class="theme-toggle" id="theme-toggle" aria-pressed="false" aria-label="Lights On">' +
                    '<img class="theme-icon-on" src="Assets/Icons/Lights On.svg" alt="" width="24" height="24">' +
                    '<img class="theme-icon-off" src="Assets/Icons/Lights Off.svg" alt="" width="24" height="24">' +
                    '<span class="theme-toggle-label">Lights On</span>' +
                '</button>' +
            '</nav>'
        );
    }

    function mount() {
        document.querySelectorAll(HEADER_SELECTOR).forEach(function (el) {
            el.classList.add('navbar');
            el.innerHTML = headerMarkup(el.getAttribute('data-active') || 'work');
        });
        document.dispatchEvent(new Event('portfolio:header'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
