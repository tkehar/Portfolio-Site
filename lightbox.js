/* Shared image lightbox: dimmed page, centered artwork, Cancel close. */
(function () {
    var lightbox;
    var lightboxImg;

    function ensureOverlay() {
        var existing = document.getElementById('lightbox');
        if (existing) return existing;

        var overlay = document.createElement('div');
        overlay.className = 'lightbox';
        overlay.id = 'lightbox';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="lightbox-backdrop" data-close></div>' +
            '<img class="lightbox-img" id="lightboxImg" src="" alt="">' +
            '<button class="lightbox-close" type="button" aria-label="Close" data-close>' +
                '<img src="Assets/Icons/Cancel-light.svg" alt="">' +
            '</button>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function openLightbox(src, alt) {
        if (!src || !lightbox) return;
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
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

    function init() {
        lightbox = ensureOverlay();
        lightboxImg = document.getElementById('lightboxImg');

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
                openLightbox(img.src, img.alt);
            });
        });

        document.querySelectorAll('.lightbox-image:not(img)').forEach(function (host) {
            host.style.cursor = 'zoom-in';
            host.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var img = host.querySelector('img');
                if (img) openLightbox(img.src, img.alt);
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
