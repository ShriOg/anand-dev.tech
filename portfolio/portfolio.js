const portfolioData = [
    {
        id: 1,
        title: "Web OS v2.0",
        category: "systems",
        desc: "A fully functional operating system inside the browser, featuring draggable windows, a taskbar, dynamic clock, and a functional Notes application that persists across reloads.",
        tech: ["HTML5", "CSS3", "Vanilla JS", "localStorage"],
        icon: "💻",
        link: "../webos/"
    },
    {
        id: 2,
        title: "Domain Battle Engine",
        category: "systems",
        desc: "A DOM-based territory conquest game. Players battle against an AI bot to claim adjacent nodes and dominate the territory map using pure JavaScript logic and grid layouts.",
        tech: ["JavaScript", "CSS Grid", "Game Loop"],
        icon: "⚔️",
        link: "../domainbattle/"
    },
    {
        id: 3,
        title: "Glassmorphism UI Kit",
        category: "design",
        desc: "An experimental UI kit using intense back-drop filters, custom CSS properties, and modern layout techniques to create an immersive transparent spatial experience.",
        tech: ["CSS Variables", "Backdrop Filter", "Flexbox"],
        icon: "✨",
        link: "#"
    },
    {
        id: 4,
        title: "React Web Scraper",
        category: "web",
        desc: "A conceptual frontend integrated with Cheerio on the backend to parse and extract structured data from unstructured web domains efficiently.",
        tech: ["React", "Next.js", "Cheerio", "Node.js"],
        icon: "🕷️",
        link: "#"
    }
];

const portfolio = {
    init() {
        this.renderCards('all');
        
        // Filter logic
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderCards(e.target.dataset.filter);
            });
        });

        // Close modal on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    },

    renderCards(filter) {
        const grid = document.getElementById('projects-grid');
        grid.innerHTML = '';

        const filtered = filter === 'all' 
            ? portfolioData 
            : portfolioData.filter(p => p.category === filter);

        filtered.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.animationDelay = `${i * 0.1}s`;
            card.onclick = () => this.openModal(p.id);

            card.innerHTML = `
                <div class="card-img-placeholder">${p.icon}</div>
                <div class="card-content">
                    <span class="card-tag">${p.category}</span>
                    <h3 class="card-title">${p.title}</h3>
                    <p class="card-desc">${p.desc}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    openModal(id) {
        const p = portfolioData.find(x => x.id === id);
        if(!p) return;

        document.getElementById('modal-title').innerText = p.title;
        document.getElementById('modal-desc').innerText = p.desc;
        document.getElementById('modal-tag').innerText = p.category;
        
        // Render tech pills
        const techContainer = document.getElementById('modal-tech');
        techContainer.innerHTML = '';
        p.tech.forEach(t => {
            const pill = document.createElement('span');
            pill.className = 'tech-pill';
            pill.innerText = t;
            techContainer.appendChild(pill);
        });

        const link = document.querySelector('.modal-link');
        if(p.link === '#') {
            link.style.display = 'none';
        } else {
            link.style.display = 'inline-block';
            link.href = p.link;
        }

        document.getElementById('project-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    },

    closeModal() {
        document.getElementById('project-modal').classList.add('hidden');
        document.body.style.overflow = '';
    }
};

window.onload = () => portfolio.init();
