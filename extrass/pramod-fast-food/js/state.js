/**
 * state.js — Centralised, observable application state.
 *
 * Any module can subscribe to state changes via State.on(key, callback).
 * Mutations go through State.set() which auto-notifies listeners.
 */
'use strict';

const State = (() => {
    const _state = {
        category: 'all',
        search: '',
        filter: 'all',       // 'all' | 'special' | 'under50' | 'under100'
        cartOpen: false,
        loading: true,
    };

    /** key → Set<callback> */
    const _listeners = {};

    /** Read a value */
    const get = (key) => _state[key];

    /** Write a value and notify subscribers */
    const set = (key, value) => {
        if (_state[key] === value) return;
        _state[key] = value;
        (_listeners[key] || []).forEach(fn => fn(value));
        (_listeners['*'] || []).forEach(fn => fn(key, value));
    };

    /**
     * Subscribe to state changes.
     * @param {string} key  — state key, or '*' for all changes
     * @param {Function} fn — callback(newValue) or callback(key, newValue)
     * @returns {Function}  — unsubscribe function
     */
    const on = (key, fn) => {
        if (!_listeners[key]) _listeners[key] = new Set();
        _listeners[key].add(fn);
        return () => _listeners[key].delete(fn);
    };

    return Object.freeze({ get, set, on });
})();
