'use strict';

/**
 * RestaurantConfig — Dynamic backend URL resolver.
 *
 * Detection order:
 *   1. Scan URL path parts for a known restaurant slug
 *      (works with /projects/restaurant/{slug}/... AND /extrass/{slug}/...)
 *   2. Read <meta name="restaurant" content="slug"> if present
 *   3. Fall back to DEFAULT_SLUG
 *
 * Usage (all scripts loaded AFTER this one):
 *   RestaurantConfig.API_URL   → full REST base   e.g. https://pramod-backend.onrender.com/api
 *   RestaurantConfig.SOCKET_URL → WebSocket base   e.g. https://pramod-backend.onrender.com
 *   RestaurantConfig.slug       → resolved slug    e.g. "pramod"
 */
const RestaurantConfig = (() => {

    const BACKEND_MAP = {
        'pramod':           'https://pramod-backend.onrender.com',
        'pramod-fast-food': 'https://pramod-backend.onrender.com',
        'pizzaslice':       'https://pizzaslice-backend.onrender.com',
    };

    const SLUG_ALIASES = {
        'pramod-fast-food': 'pramod',
    };

    const DEFAULT_SLUG = 'pramod';

    // ── Strategy 1: detect slug from URL path ──
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let detectedSlug = null;

    for (const part of pathParts) {
        if (BACKEND_MAP[part]) {
            detectedSlug = SLUG_ALIASES[part] || part;
            break;
        }
    }

    // ── Strategy 2: <meta name="restaurant"> tag ──
    if (!detectedSlug) {
        const meta = document.querySelector('meta[name="restaurant"]');
        if (meta && meta.content) {
            const val = meta.content.trim().toLowerCase();
            if (BACKEND_MAP[val]) {
                detectedSlug = SLUG_ALIASES[val] || val;
            }
        }
    }

    // ── Strategy 3: fallback ──
    if (!detectedSlug) {
        console.warn('[RestaurantConfig] Could not detect restaurant from URL — using default:', DEFAULT_SLUG);
        detectedSlug = DEFAULT_SLUG;
    }

    const canonicalSlug = SLUG_ALIASES[detectedSlug] || detectedSlug;
    const BASE_URL      = BACKEND_MAP[detectedSlug] || BACKEND_MAP[canonicalSlug];

    console.log(`[RestaurantConfig] slug=${canonicalSlug}  base=${BASE_URL}`);

    return Object.freeze({
        slug:       canonicalSlug,
        BASE_URL:   BASE_URL,
        API_URL:    BASE_URL + '/api',
        SOCKET_URL: BASE_URL,
    });

})();
