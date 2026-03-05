'use strict';

const AppConfig = (() => {
    const ROOT_DOMAIN = 'menunova.me';
    const API_ORIGIN = 'https://api.menunova.me';
    const host = window.location.hostname.toLowerCase();
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    const readMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || '';

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

    const FIREBASE_CONFIG = {
        apiKey: readMeta('mn-firebase-api-key'),
        authDomain: readMeta('mn-firebase-auth-domain'),
        projectId: readMeta('mn-firebase-project-id'),
        storageBucket: readMeta('mn-firebase-storage-bucket'),
        messagingSenderId: readMeta('mn-firebase-messaging-sender-id'),
        appId: readMeta('mn-firebase-app-id'),
    };
    const FIREBASE_VAPID_KEY = readMeta('mn-firebase-vapid-key');

    if (initialized) console.log(`[Config] slug=${SLUG} apiBase=${API_BASE}`);
    else console.info('[Config] No restaurant slug detected from hostname.');

    return Object.freeze({
        SLUG,
        API_BASE,
        initialized,
        slug: SLUG,
        isDemo: SLUG === 'demo',
        demoSignupUrl: 'https://menunova.me/signup',
        API_ORIGIN,
        API_URL: API_BASE,
        SOCKET_URL: API_ORIGIN,
        FIREBASE_CONFIG,
        FIREBASE_VAPID_KEY,
        storageKey,
        isRestaurantHost: initialized,
    });
})();

const RestaurantConfig = AppConfig;
window.AppConfig = AppConfig;
window.RestaurantConfig = RestaurantConfig;

/* ── Global debug helper ── */
window.__DEBUG__ = true;
function debug(label, data = null) {
    if (!window.__DEBUG__) return;
    console.log(`[DEBUG] ${label}`, data ?? '');
}
