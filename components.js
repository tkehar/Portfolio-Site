/* Shared Header + Footer (Figma Design System).
   Header: 207:261 / 207:263. Footer: 728:5296 Page=Project.
   Footer “More case studies” shows up to 3 other projects in the same category. */
(function () {
    var HEADER_SELECTOR = '[data-component="header"]';
    var FOOTER_SELECTOR = '[data-component="footer"]';

    var PROJECTS = {
        MAN: { id: 'MAN', title: 'AI Notetaker for Field Service Technicians', href: 'MAN', image: 'Assets/MAN/MAN_Banner.png', category: 'product' },
        OMS: { id: 'OMS', title: 'Sastaticket Order Management System', href: 'OMS', image: 'Assets/OMS/OMS_Banner.png', category: 'product' },
        SS: { id: 'SS', title: 'Sellorate B2B Retailer App', href: 'SS', image: 'Assets/SS/SS_Banner.png', category: 'product' },
        STMS: { id: 'STMS', title: 'Market Segments Research', href: 'STMS', image: 'Assets/STMS/STMS_Banner.png', category: 'product' },
        Vissibl: { id: 'Vissibl', title: 'AI ISO Compliance Tool MVP', href: 'Vissibl', image: 'Assets/VIS/VIS_Banner.png', category: 'product' },
        EH: { id: 'EH', title: "The Earth's Heartbeat", href: 'EH', image: 'Assets/EH/EH_Banner.png', category: 'xr' },
        SG: { id: 'SG', title: 'Scales', href: 'SG', image: 'Assets/Scales/Scales_Banner.png', category: 'xr' },
        DK: { id: 'DK', title: 'Dastaan-e-Karachi', href: 'DK', image: 'Assets/DK/DK_Banner.png', category: 'xr' },
        SMA: { id: 'SMA', title: 'Sabeen Mahmud Archive', href: 'SMA', image: 'Assets/SMA/SMA_Banner.png', category: 'xr' },
        ADA: { id: 'ADA', title: 'ADA Magazine', href: 'ADA', image: 'Assets/ADA/ADA_Banner.png', category: 'graphic' },
        TW: { id: 'TW', title: 'Ticket Wala Identity Design', href: 'TW', image: 'Assets/TW/TW_Banner.png', category: 'graphic' },
        WGTW: { id: 'WGTW', title: 'Who Gets To Talk About Whom', href: 'WGTW', image: 'Assets/WGTW/WGTW_Banner.png', category: 'curation' },
        TSW: { id: 'TSW', title: 'Look at the City from here', href: 'TSW', image: 'Assets/TSW/TSW_Banner.png', category: 'curation' }
    };

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

    function relatedProjects(currentId) {
        var current = PROJECTS[currentId];
        if (!current) return [];
        return Object.keys(PROJECTS)
            .map(function (key) { return PROJECTS[key]; })
            .filter(function (p) { return p.category === current.category && p.id !== current.id; })
            .slice(0, 3);
    }

    function relatedCardMarkup(project) {
        return (
            '<a class="ds-card ds-card--related" href="' + project.href + '">' +
                '<span class="ds-card__media"><img src="' + project.image + '" alt=""></span>' +
                '<span class="ds-card__content">' +
                    '<span class="ds-card__title">' + project.title + '</span>' +
                '</span>' +
            '</a>'
        );
    }

    function footerMarkup(currentId) {
        var related = relatedProjects(currentId);
        var cards = related.map(relatedCardMarkup).join('');
        return (
            '<div class="project-footer__touch">' +
                '<p class="project-footer__label">Get in touch</p>' +
                '<div class="project-footer__social">' +
                    '<a href="https://www.linkedin.com/in/talha-kehar-8a89ba120/" target="_blank" rel="noopener" aria-label="LinkedIn">' +
                        '<img src="Assets/Icons/Linkedin.png" alt="">' +
                    '</a>' +
                    '<a href="#" aria-label="Instagram">' +
                        '<img src="Assets/Icons/Instagram.svg" alt="">' +
                    '</a>' +
                    '<a href="mailto:talha.a.kehar@gmail.com" aria-label="Email">' +
                        '<img src="Assets/Icons/Mail.png" alt="">' +
                    '</a>' +
                '</div>' +
            '</div>' +
            '<div class="project-footer__more">' +
                '<p class="project-footer__more-label">More case studies</p>' +
                '<div class="project-footer__cards">' + cards + '</div>' +
            '</div>'
        );
    }

    function mountHeader() {
        document.querySelectorAll(HEADER_SELECTOR).forEach(function (el) {
            el.classList.add('navbar');
            el.innerHTML = headerMarkup(el.getAttribute('data-active') || 'work');
        });
        document.dispatchEvent(new Event('portfolio:header'));
    }

    function mountFooter() {
        document.querySelectorAll(FOOTER_SELECTOR).forEach(function (el) {
            el.classList.add('project-footer');
            el.innerHTML = footerMarkup(el.getAttribute('data-project') || '');
        });
    }

    function ensureSideScroll() {
        if (!document.body.classList.contains('project-page')) return;
        if (document.querySelector('script[data-side-scroll]')) return;
        var script = document.createElement('script');
        script.src = 'side-scroll.js?v=3';
        script.defer = true;
        script.setAttribute('data-side-scroll', '1');
        document.head.appendChild(script);
    }

    function mount() {
        mountHeader();
        mountFooter();
        ensureSideScroll();
    }

    window.portfolioProjects = PROJECTS;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
