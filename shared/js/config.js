'use strict';

const AppConfig = (() => {
    const ROOT_DOMAIN = 'menunova.me';
    const API_ORIGIN = 'https://api.menunova.me';
    const host = window.location.hostname.toLowerCase();
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    const getSlugFromHostname = () => {
        if (isLocalHost) return 'demo';
        if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return null;
        if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null;
        const label = host.slice(0, -(`.${ROOT_DOMAIN}`).length);
        if (!label || label === 'www' || label === 'api') return null;
        return label;
    };

    const sanitizeSlug = (raw) => String(raw || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    const SLUG = sanitizeSlug(getSlugFromHostname());
    const initialized = Boolean(SLUG);
    const API_BASE = initialized ? `${API_ORIGIN}/api/restaurant/${SLUG}` : null;
    const storageKey = (key) => initialized ? `${SLUG}_${key}` : key;

    const _titleCase = (s) => String(s || '').split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const DISPLAY_NAME = initialized ? _titleCase(SLUG) : 'Menu';

    return Object.freeze({
        SLUG,
        API_BASE,
        BASE_URL: API_BASE,
        initialized,
        slug: SLUG,
        name: DISPLAY_NAME,
        displayName: DISPLAY_NAME,
        isDemo: SLUG === 'demo',
        demoSignupUrl: 'https://menunova.me/signup',
        API_ORIGIN,
        API_URL: API_BASE,
        SOCKET_URL: API_ORIGIN,
        storageKey,
        isRestaurantHost: initialized,
    });
})();

const RestaurantConfig = AppConfig;
window.AppConfig = AppConfig;
window.RestaurantConfig = RestaurantConfig;
