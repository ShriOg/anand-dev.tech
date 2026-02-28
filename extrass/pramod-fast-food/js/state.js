'use strict';

const State = (() => {
    const _state = {
        category: 'all',
        search: '',
        filter: 'all',
        cartOpen: false,
        loading: true,
    };

    const _listeners = {};

    const get = (key) => _state[key];

    const set = (key, value) => {
        if (_state[key] === value) return;
        debug('State Change', { key, value });
        _state[key] = value;
        (_listeners[key] || []).forEach(fn => fn(value));
        (_listeners['*'] || []).forEach(fn => fn(key, value));
    };

    const on = (key, fn) => {
        if (!_listeners[key]) _listeners[key] = new Set();
        _listeners[key].add(fn);
        return () => _listeners[key].delete(fn);
    };

    return Object.freeze({ get, set, on });
})();
