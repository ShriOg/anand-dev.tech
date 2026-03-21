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
