/* Sticky project section nav: visible while scrolling or when the pointer is near the left edge. */
(function () {
    var HIDE_DELAY = 900;
    var LEFT_ZONE = 96;
    var nav;
    var links = [];
    var sections = [];
    var hideTimer = null;
    var scrolling = false;
    var nearSide = false;
    var overNav = false;

    function setVisible(on) {
        if (!nav) return;
        nav.classList.toggle('is-visible', on);
        nav.setAttribute('aria-hidden', on ? 'false' : 'true');
    }

    function updateVisibility() {
        setVisible(scrolling || nearSide || overNav);
    }

    function markScrolling() {
        scrolling = true;
        updateVisibility();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
            scrolling = false;
            updateVisibility();
        }, HIDE_DELAY);
    }

    function updateActive() {
        if (!sections.length) return;
        var line = window.innerHeight * 0.28;
        var current = sections[0];
        sections.forEach(function (section) {
            if (section.getBoundingClientRect().top <= line) current = section;
        });
        links.forEach(function (link) {
            var active = link.getAttribute('href') === '#' + current.id;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    }

    function buildFromSections() {
        var targets = Array.prototype.slice.call(document.querySelectorAll('[data-side-section]'));
        if (!targets.length) return false;
        nav.innerHTML = '';
        targets.forEach(function (section) {
            if (!section.id) return;
            var a = document.createElement('a');
            a.href = '#' + section.id;
            a.textContent = section.getAttribute('data-side-section');
            nav.appendChild(a);
        });
        return !!nav.children.length;
    }

    function init() {
        nav = document.querySelector('.side-scroll');
        if (!nav) return;

        if (!nav.children.length) buildFromSections();

        links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
        sections = links
            .map(function (a) { return document.querySelector(a.getAttribute('href')); })
            .filter(Boolean);

        if (!sections.length) {
            nav.hidden = true;
            return;
        }

        nav.addEventListener('mouseenter', function () {
            overNav = true;
            updateVisibility();
        });
        nav.addEventListener('mouseleave', function () {
            overNav = false;
            updateVisibility();
        });

        window.addEventListener('mousemove', function (e) {
            nearSide = e.clientX <= LEFT_ZONE;
            updateVisibility();
        }, { passive: true });

        window.addEventListener('scroll', function () {
            markScrolling();
            updateActive();
        }, { passive: true });

        links.forEach(function (link) {
            link.addEventListener('click', function () {
                markScrolling();
            });
        });

        updateActive();
        setVisible(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
