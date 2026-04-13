document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect for the background glow orb based on mouse movement
    const orb = document.querySelector('.glow-orb');
    
    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) - 0.5;
            const y = (e.clientY / window.innerHeight) - 0.5;
            
            requestAnimationFrame(() => {
                orb.style.transform = `translate(calc(-50% + ${x * 80}px), calc(${y * 80}px)) scale(1.05)`;
            });
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
