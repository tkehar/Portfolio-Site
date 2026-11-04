/* Shared image lightbox: dimmed page, artwork with title/subtitle column, Cancel close. */
(function () {
    var lightbox;
    var lightboxImg;
    var lightboxTitle;
    var lightboxSubtitle;

    function ensureOverlay() {
        var existing = document.getElementById('lightbox');
        if (existing) return existing;

        var overlay = document.createElement('div');
        overlay.className = 'lightbox';
        overlay.id = 'lightbox';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'lightboxTitle');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="lightbox-backdrop" data-close></div>' +
            '<div class="lightbox-panel">' +
                '<img class="lightbox-img" id="lightboxImg" src="" alt="">' +
                '<div class="lightbox-meta">' +
                    '<h2 class="lightbox-title" id="lightboxTitle"></h2>' +
                    '<p class="lightbox-subtitle" id="lightboxSubtitle"></p>' +
                '</div>' +
                '<button class="lightbox-close" type="button" aria-label="Close" data-close>' +
                    '<img src="Assets/Icons/Cancel-light.svg" alt="">' +
                '</button>' +
            '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function openLightbox(src, title, subtitle) {
        if (!src || !lightbox) return;
        lightboxImg.src = src;
        lightboxImg.alt = title || '';
        lightboxTitle.textContent = title || '';
        lightboxTitle.hidden = !title;
        lightboxSubtitle.textContent = subtitle || '';
        lightboxSubtitle.hidden = !subtitle;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function openFromImage(img, host) {
        var source = host || img;
        openLightbox(
            img.src,
            source.getAttribute('data-title') || img.alt,
            source.getAttribute('data-subtitle') || ''
        );
    }

    function init() {
        lightbox = ensureOverlay();
        lightboxImg = document.getElementById('lightboxImg');
        lightboxTitle = document.getElementById('lightboxTitle');
        lightboxSubtitle = document.getElementById('lightboxSubtitle');

        lightbox.querySelectorAll('[data-close]').forEach(function (el) {
            el.addEventListener('click', closeLightbox);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
        });

        document.querySelectorAll('img.lightbox-image').forEach(function (img) {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openFromImage(img);
            });
        });

        document.querySelectorAll('.lightbox-image:not(img)').forEach(function (host) {
            host.style.cursor = 'zoom-in';
            host.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var img = host.querySelector('img');
                if (img) openFromImage(img, host);
            });
        });

        window.portfolioLightbox = {
            open: openLightbox,
            close: closeLightbox
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
