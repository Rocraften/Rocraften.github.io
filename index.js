document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();

    const cursor = document.getElementById('custom-cursor');
    let mouseX = -100, mouseY = -100;
    
    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.opacity = '1';
    }
    document.addEventListener('mousemove', onMouseMove);
    
    function animateCursor() {
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });

    const interactiveElements = document.querySelectorAll('a, button, input, label, select, textarea');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor-grow'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-grow'));
    });
    
    const snowContainer = document.getElementById('snow-container');
    const flakesCount = 30; 
    for (let i = 0; i < flakesCount; i++) {
        let flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.style.left = (Math.random() < 0.5 ? Math.random() * 33 : 67 + Math.random() * 33) + '%';
        flake.style.animationDuration = (Math.random() * 5 + 7) + 's';
        flake.style.animationDelay = (Math.random() * 10) + 's';
        flake.style.width = flake.style.height = (Math.random() * 5 + 5) + 'px';
        snowContainer.appendChild(flake);
    }

    const headerElement = document.querySelector('header');
    const navLinks = document.querySelectorAll('header nav a');
    const sections = document.querySelectorAll('section');

    function changeNavOnScroll() {
        let currentSectionId = '';
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - headerElement.offsetHeight - 100) {
                currentSectionId = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSectionId) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', changeNavOnScroll);
    
    const viewAllBtn = document.getElementById('viewAllProjectsBtn');
    viewAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.project-item.hidden').forEach(p => p.classList.remove('hidden'));
        viewAllBtn.parentElement.style.display = 'none';
    });

    document.getElementById('clearCacheBtn').addEventListener('click', () => window.location.reload(true));
    document.getElementById('clearCookiesBtn').addEventListener('click', () => {
        const cookies = document.cookie.split(";");
        if (!cookies[0]) { alert("No cookies to clear."); return; }
        cookies.forEach(c => {
            const eqPos = c.indexOf("=");
            const name = eqPos > -1 ? c.substr(0, eqPos) : c;
            document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
        alert("Site cookies cleared. Reloading page.");
        window.location.reload();
    });

    changeNavOnScroll();
});
