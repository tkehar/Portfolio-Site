/* ==========================================================================
   Site-wide config. Single source of truth for shared links.
   Edit RESUME_URL here and it updates the "Resume" nav tab on every page.
   ========================================================================== */
(function () {
    var RESUME_URL = "https://drive.google.com/file/d/1CWLHV35JuPkYnu6m-MDJmqtJCgySnnU7/view";

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyResumeLink);
    } else {
        applyResumeLink();
    }
})();
