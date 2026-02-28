/**
 * api.js — DISABLED (frontend-only mode).
 *
 * Backend integration is temporarily removed.
 * This stub keeps the global `Api` symbol so other modules
 * that guard with `typeof Api !== 'undefined'` won't throw.
 * All methods return failure so callers fall back gracefully.
 */
'use strict';

const Api = Object.freeze({
    fetchMenu:       async () => ({ ok: false, data: null, error: 'Backend disabled' }),
    placeOrder:      async () => ({ ok: false, data: null, error: 'Backend disabled' }),
    fetchProfile:    async () => ({ ok: false, data: null, error: 'Backend disabled' }),
    isAuthenticated: ()    => false,
    isServerAwake:   ()    => false,
    setToken:        ()    => {},
    getToken:        ()    => null,
    request:         async () => ({ ok: false, data: null, error: 'Backend disabled' }),
    ENDPOINTS:       Object.freeze({ menu: '', orders: '', profile: '' }),
});

