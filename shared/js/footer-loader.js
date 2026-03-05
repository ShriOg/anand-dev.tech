// ============================================
// MenuNova Footer Component Loader
// Dynamically inject footer into any page
// ============================================

(function() {
    'use strict';

    /**
     * Load MenuNova footer from shared/footer.html
     * Usage: Add <div id="menunova-footer-mount"></div> in HTML
     * Then include this script
     */
    function loadMenuNovaFooter() {
        const mountPoint = document.getElementById('menunova-footer-mount');
        
        if (!mountPoint) {
            console.warn('MenuNova Footer: Mount point not found. Add <div id="menunova-footer-mount"></div> to your page.');
            return;
        }

        // Determine base path based on current location
        const currentPath = window.location.pathname;
        let basePath = '/shared/footer.html';
        
        // If on subdomain, use absolute URL
        const hostname = window.location.hostname;
        if (hostname !== 'menunova.me' && hostname.endsWith('.menunova.me')) {
            basePath = 'https://menunova.me/shared/footer.html';
        }

        // Fetch and inject footer
        fetch(basePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Footer not found');
                }
                return response.text();
            })
            .then(html => {
                mountPoint.innerHTML = html;
                
                // Add reveal animation
                const footer = mountPoint.querySelector('.menunova-footer');
                if (footer) {
                    footer.classList.add('footer-reveal');
                }

                // Dispatch custom event for scripts that need to know footer loaded
                document.dispatchEvent(new CustomEvent('menunovaFooterLoaded'));
            })
            .catch(error => {
                console.error('MenuNova Footer: Failed to load', error);
            });
    }

    /**
     * Initialize footer when DOM is ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMenuNovaFooter);
    } else {
        loadMenuNovaFooter();
    }

    /**
     * Optional: Expose manual loader for dynamic pages
     */
    window.MenuNovaFooter = {
        load: loadMenuNovaFooter
    };

})();
