/* Home / collage lightbox: dimmed overlay, scrollable image stack + meta column (Figma Lightbox Image frames). */
(function () {
    var ENTRIES = {
        mando: {
            title: 'The Mandalorian',
            subtitle: 'Illustration, 2021',
            details: [
                { label: 'Role:', value: 'Illustrator' },
                { label: 'Year:', value: '2021' }
            ],
            skills: 'Illustration · Visual Storytelling',
            images: ['Assets/The Mandalorian.png']
        },
        calligraphy: {
            title: 'Karachi Calligraphy',
            subtitle: 'Calligraphy design for a tattoo',
            details: [
                { label: 'Year:', value: '2019' }
            ],
            skills: 'Calligraphy · Typography',
            images: ['Assets/Karachi Sword-01.png']
        },
        qor: {
            title: 'Queen of Roses',
            subtitle: 'Animated illustration',
            details: [
                { label: 'Year:', value: '2017' }
            ],
            skills: 'Motion Design · Illustration · Visual Storytelling',
            images: ['Assets/Queen_of_Roses.gif']
        },
        se: {
            title: 'Snake Eyes',
            subtitle: 'Illustration based on the 2018 election rigging in Pakistan',
            details: [
                { label: 'Year:', value: '2023' }
            ],
            skills: 'Illustration · Visual Storytelling',
            images: ['Assets/SE/SE_Banner.png']
        },
        su: {
            title: 'Speak Up',
            subtitle: 'Brand Identity and Motion Design for a Youth Public-Speaking Program',
            details: [
                { label: 'Company:', value: 'Speak Up' },
                { label: 'Role:', value: 'Graphic Designer' },
                { label: 'Year:', value: '2018' },
                { label: 'Team:', value: 'Mahnoor Mahar (Videographer)' }
            ],
            summaryTitle: 'Project Summary',
            summary: 'A public speaking program mentoring children 8 to 12 needed a brand identity that would work on social media. The logo was inspired by what a confident child looks like.\n\nHaving butterflies is often used to refer to a fear of public speaking. We instead used butterflies as a symbol for empowerment. This motif was featured in animated posts for social media.\n\nIn addition to this we produced a promotional video that generated awareness about the program and began enrollment',
            skillsTitle: 'Skills',
            skills: 'Brand Identity · Logo Design · Motion Design · Logo Animation · Video Production · Social Media Content · Design for Children',
            images: [
                'Assets/SU/Speakup Logo_Color.png',
                'Assets/SU/Speak Up - branding and style guide-15 1.png',
                'Assets/SU/Butterfly.png'
            ]
        },
        stg: {
            title: 'The Stained Glass Window',
            subtitle: 'Book Cover for a Short-Story Anthology on the Covid-19 pandemic',
            details: [
                { label: 'Company:', value: 'Liberty Publishing' },
                { label: 'Role:', value: 'Graphic Designer' },
                { label: 'Year:', value: '2020' }
            ],
            skills: 'Book Cover Design · Illustration · Concept Development · Visual Storytelling · Typography · Publishing',
            summaryTitle: 'Project Summary',
            summary: 'Liberty Publishing needed a cover for a collection of short stories about the Covid-19 pandemic in Pakistan. On the front cover a woman in a face mask gazes out as the background shows different times of day. Three arched windows show the same building across one day, seen from outside looking in, a reversal of life in lockdown.',
            images: [
                'Assets/STG/Landing Image.png',
                'Assets/STG/TSGW_Book Cover-01 1.png'
            ]
        },
        nfn: {
            title: 'No Funeral For Nazia',
            subtitle: 'Book Cover Design for a Pakistani Mystery Novel',
            details: [
                { label: 'Company:', value: 'Liberty Publishing' },
                { label: 'Role:', value: 'Graphic Designer' },
                { label: 'Year:', value: '2023' }
            ],
            skills: 'Book Cover Design · Illustration · Concept Development · Visual Storytelling · Typography · Publishing',
            summaryTitle: 'Project Summary',
            summary: 'Liberty Publishing needed a cover for a mystery novel set in Karachi. An initial conversation with the author narrowed elements of the story. Stopwatch and spiral pattern to represent hypnosis. Bougainvillea petals are reference to the setting of Karachi.',
            images: [
                'Assets/NFN/Landing Image.png',
                'Assets/NFN/NFN -Book Cover.png'
            ]
        }
    };

    var lightbox;
    var galleryEl;
    var metaEl;

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
                '<div class="lightbox-gallery" id="lightboxGallery"></div>' +
                '<div class="lightbox-meta" id="lightboxMeta"></div>' +
                '<button class="lightbox-close" type="button" aria-label="Close" data-close>' +
                    '<img src="Assets/Icons/Cancel-light.svg" alt="">' +
                '</button>' +
            '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function detailMarkup(details) {
        if (!details || !details.length) return '';
        return details.map(function (item) {
            return (
                '<div class="lightbox-detail">' +
                    '<p class="lightbox-detail__label">' + item.label + '</p>' +
                    '<p class="lightbox-detail__value">' + item.value + '</p>' +
                '</div>'
            );
        }).join('');
    }

    function paragraphMarkup(text) {
        return String(text || '')
            .split(/\n\n+/)
            .map(function (chunk) { return chunk.trim(); })
            .filter(Boolean)
            .map(function (chunk) {
                return '<p class="lightbox-summary">' + chunk.replace(/\n/g, '<br>') + '</p>';
            })
            .join('');
    }

    function renderEntry(entry) {
        galleryEl.innerHTML = (entry.images || []).map(function (src) {
            return '<img class="lightbox-img" src="' + src + '" alt="">';
        }).join('');

        var html = '';
        html += '<h2 class="lightbox-title" id="lightboxTitle">' + (entry.title || '') + '</h2>';
        if (entry.subtitle) html += '<p class="lightbox-subtitle">' + entry.subtitle + '</p>';
        html += detailMarkup(entry.details);

        if (entry.skillsTitle) {
            if (entry.summaryTitle && entry.summary) {
                html += '<p class="lightbox-section-label">' + entry.summaryTitle + '</p>';
                html += paragraphMarkup(entry.summary);
            }
            if (entry.skills) {
                html += '<p class="lightbox-section-label">' + entry.skillsTitle + '</p>';
                html += '<p class="lightbox-skills">' + entry.skills + '</p>';
            }
        } else {
            if (entry.skills) html += '<p class="lightbox-skills">' + entry.skills + '</p>';
            if (entry.summaryTitle && entry.summary) {
                html += '<p class="lightbox-section-label">' + entry.summaryTitle + '</p>';
                html += paragraphMarkup(entry.summary);
            }
        }

        metaEl.innerHTML = html;
    }

    function openEntry(entryOrId) {
        var entry = typeof entryOrId === 'string' ? ENTRIES[entryOrId] : entryOrId;
        if (!entry || !lightbox) return;
        renderEntry(entry);
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        lightbox.scrollTop = 0;
        document.body.style.overflow = 'hidden';
    }

    function openSimple(src, title, subtitle) {
        openEntry({
            title: title || '',
            subtitle: subtitle || '',
            images: src ? [src] : []
        });
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function openFromImage(img, host) {
        var source = host || img;
        var id = source.getAttribute('data-lightbox-id');
        if (id && ENTRIES[id]) {
            openEntry(id);
            return;
        }
        openSimple(
            img.src,
            source.getAttribute('data-title') || img.alt,
            source.getAttribute('data-subtitle') || ''
        );
    }

    function init() {
        lightbox = ensureOverlay();
        galleryEl = document.getElementById('lightboxGallery');
        metaEl = document.getElementById('lightboxMeta');

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

        document.querySelectorAll('[data-lightbox-id]').forEach(function (el) {
            el.addEventListener('click', function (e) {
                var id = el.getAttribute('data-lightbox-id');
                if (!ENTRIES[id]) return;
                e.preventDefault();
                openEntry(id);
            });
        });

        window.portfolioLightbox = {
            open: openSimple,
            openEntry: openEntry,
            close: closeLightbox,
            entries: ENTRIES
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
