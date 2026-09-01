(function () {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const filterValueLower = filterValue.toLowerCase();

            projectCards.forEach(card => {
                const categories = (card.getAttribute('data-category') || '').toLowerCase();
                const categoryList = categories.split(',').map(c => c.trim());
                card.style.display = (filterValue === 'all' || categoryList.includes(filterValueLower))
                    ? 'block'
                    : 'none';
            });
        });
    });
})();
