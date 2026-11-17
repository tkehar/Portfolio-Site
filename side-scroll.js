/* Sticky project heading nav: progress bar always on; labels only on left-side hover. */
(function () {
    var LEFT_ZONE = 88;
    var root;
    var trackFill;
    var list;
    var links = [];
    var sections = [];
    var nearSide = false;
    var overNav = false;

    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 64) || 'section';
    }

    function uniqueId(base) {
        var id = base;
        var n = 2;
        while (document.getElementById(id)) {
            id = base + '-' + n;
            n += 1;
        }
        return id;
    }

    function collectHeadings() {
        var nodes = Array.prototype.slice.call(
            document.querySelectorAll(
                '.project-content h3.project-block-label, .project-content [data-side-section], .project-content h3.project-section-title'
            )
        );
        var seen = {};
        return nodes.filter(function (el) {
            var label = (el.getAttribute('data-side-section') || el.textContent || '').trim();
            if (!label) return false;
            if (!el.id) {
                var base = slugify(label);
                if (seen[base]) {
                    seen[base] += 1;
                    el.id = uniqueId(base + '-' + seen[base]);
                } else {
                    seen[base] = 1;
                    el.id = uniqueId(base);
                }
            }
            el.setAttribute('data-side-section', label);
            return true;
        });
    }

    function ensureRoot() {
        var existing = document.querySelector('.side-scroll');
        if (existing) return existing;

        var el = document.createElement('nav');
        el.className = 'side-scroll';
        el.setAttribute('aria-label', 'On this page');
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML =
            '<div class="side-scroll__rail" aria-hidden="true">' +
                '<div class="side-scroll__track">' +
                    '<div class="side-scroll__progress"></div>' +
                '</div>' +
            '</div>' +
            '<div class="side-scroll__labels"></div>';
        document.body.appendChild(el);
        return el;
    }

    function setExpanded(on) {
        if (!root) return;
        root.classList.toggle('is-expanded', on);
        root.setAttribute('aria-hidden', on ? 'false' : 'true');
    }

    function updateExpanded() {
        setExpanded(nearSide || overNav);
    }

    function updateProgress() {
        if (!trackFill) return;
        var doc = document.documentElement;
        var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
        var ratio = Math.min(Math.max(window.scrollY / max, 0), 1);
        trackFill.style.height = (ratio * 100).toFixed(2) + '%';
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

    function build() {
        var headings = collectHeadings();
        if (!headings.length) return false;

        list.innerHTML = '';
        headings.forEach(function (heading) {
            var a = document.createElement('a');
            a.className = 'side-scroll__link';
            a.href = '#' + heading.id;
            a.textContent = heading.getAttribute('data-side-section');
            list.appendChild(a);
        });

        links = Array.prototype.slice.call(list.querySelectorAll('a[href^="#"]'));
        sections = links
            .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
            .filter(Boolean);

        return sections.length > 0;
    }

    function init() {
        if (!document.body.classList.contains('project-page')) return;

        root = ensureRoot();
        trackFill = root.querySelector('.side-scroll__progress');
        list = root.querySelector('.side-scroll__labels');

        if (!build()) {
            root.hidden = true;
            return;
        }

        root.addEventListener('mouseenter', function () {
            overNav = true;
            updateExpanded();
        });
        root.addEventListener('mouseleave', function () {
            overNav = false;
            updateExpanded();
        });

        window.addEventListener('mousemove', function (e) {
            nearSide = e.clientX <= LEFT_ZONE;
            updateExpanded();
        }, { passive: true });

        window.addEventListener('scroll', function () {
            updateProgress();
            updateActive();
        }, { passive: true });

        window.addEventListener('resize', updateProgress, { passive: true });

        links.forEach(function (link) {
            link.addEventListener('click', function () {
                nearSide = true;
                updateExpanded();
            });
        });

        updateProgress();
        updateActive();
        setExpanded(false);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
