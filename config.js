/* ==========================================================================
   Site-wide config. Single source of truth for shared links.
   Edit RESUME_URL here and it updates the "Resume" nav tab on every page.
   ========================================================================== */
(function () {
    var RESUME_URL = "https://drive.google.com/file/d/1CWLHV35JuPkYnu6m-MDJmqtJCgySnnU7/view";

    /* ----------------------------------------------------------------------
       PASSWORD-PROTECTED PROJECTS
       - PROJECT_PASSWORD: the password viewers must type (edit it here).
       - PROTECTED_PAGES: page slugs (filename without .html, lower-case)
         that require the password. Add/remove entries to protect more pages.
       Note: this is a client-side gate only (the password lives in this file),
       so it deters casual viewing but is not real security.
       ---------------------------------------------------------------------- */
    var PROJECT_PASSWORD = "3TrusTE";
    var PROTECTED_PAGES = ["man", "oms", "ss"];

    function currentSlug() {
        var path = (location.pathname || "").toLowerCase();
        var file = path.substring(path.lastIndexOf("/") + 1);
        var slug = file.replace(/\.html?$/, "");
        return slug === "" ? "index" : slug;
    }

    function reveal() {
        document.documentElement.classList.remove("gate-wait");
    }

    function applyProjectGate() {
        var slug = currentSlug();
        if (PROTECTED_PAGES.indexOf(slug) === -1) { reveal(); return; }

        // Unlocked earlier this session? Don't prompt again until the tab closes.
        try {
            if (sessionStorage.getItem("unlocked:" + slug) === "1") { reveal(); return; }
        } catch (e) {}

        var gate = document.createElement("div");
        gate.className = "pw-gate";
        gate.innerHTML =
            '<div class="pw-card">' +
                '<p class="pw-helper">This project is password protected. Please enter to proceed</p>' +
                '<form class="pw-form" novalidate>' +
                    '<input type="password" class="pw-input" placeholder="Enter password" autocomplete="off" aria-label="Password">' +
                    '<button type="submit" class="pw-submit">Enter</button>' +
                '</form>' +
                '<p class="pw-error" role="alert" hidden>Incorrect password. Please try again.</p>' +
                '<a class="pw-home" href="index">&#8592; Back to home</a>' +
            '</div>';

        document.body.appendChild(gate);
        document.body.style.overflow = "hidden";

        var form = gate.querySelector(".pw-form");
        var input = gate.querySelector(".pw-input");
        var error = gate.querySelector(".pw-error");

        input.focus();

        // Clear the error state as soon as the viewer edits the field again.
        input.addEventListener("input", function () {
            input.classList.remove("error");
            error.hidden = true;
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (input.value === PROJECT_PASSWORD) {
                try { sessionStorage.setItem("unlocked:" + slug, "1"); } catch (err) {}
                gate.remove();
                document.body.style.overflow = "";
                reveal();
            } else {
                input.classList.add("error");
                error.hidden = false;
                input.focus();
                input.select();
            }
        });
    }

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
        applyProjectGate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
