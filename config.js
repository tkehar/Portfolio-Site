/* ==========================================================================
   Site-wide config. Single source of truth for shared links.
   Edit RESUME_URL here and it updates the "Resume" nav tab on every page.
   ========================================================================== */
(function () {
    var RESUME_URL = "Assets/Talha_Kehar_Curriculum VItae.pdf";

    function applyResumeLink() {
        var tabs = document.querySelectorAll('a.nav-tab');
        for (var i = 0; i < tabs.length; i++) {
            var a = tabs[i];
            var href = (a.getAttribute('href') || '').toLowerCase();
            var isResume = a.textContent.trim().toLowerCase() === 'resume'
                || href === 'resume' || href === 'resume.html';
            if (isResume) {
                a.setAttribute('href', RESUME_URL);
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener');
            }
        }
    }

    function init() {
        applyResumeLink();
    }

    document.addEventListener('portfolio:header', applyResumeLink);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
