var Auth = (function () {
  'use strict';

  function init() {
    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');

    if (loginForm) {
      if (API.getToken()) {
        window.location.href = '/os/';
        return;
      }
      loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
      if (API.getToken()) {
        window.location.href = '/os/';
        return;
      }
      registerForm.addEventListener('submit', handleRegister);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    var btn = document.getElementById('loginBtn');
    var errEl = document.getElementById('authError');
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    if (!email || !password) {
      showError(errEl, 'Please fill in all fields.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    hideError(errEl);

    try {
      var data = await API.post('/api/auth/login', { email: email, password: password });
      API.setToken(data.accessToken);
      if (data.user) API.setUser(data.user);
      window.location.href = '/os/';
    } catch (err) {
      showError(errEl, err.message);
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    var btn = document.getElementById('registerBtn');
    var errEl = document.getElementById('authError');
    var username = document.getElementById('username').value.trim();
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    if (!username || !email || !password) {
      showError(errEl, 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      showError(errEl, 'Password must be at least 6 characters.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account...';
    hideError(errEl);

    try {
      var data = await API.post('/api/auth/register', {
        username: username,
        email: email,
        password: password
      });
      API.setToken(data.accessToken);
      if (data.user) API.setUser(data.user);
      window.location.href = '/os/';
    } catch (err) {
      showError(errEl, err.message);
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
  }

  function hideError(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.remove('visible');
  }

  function requireAuth() {
    if (!API.getToken()) {
      window.location.href = '/login/';
      return false;
    }
    return true;
  }

  function logout() {
    API.removeToken();
    window.location.href = '/login/';
  }

  async function loadProfile() {
    try {
      var data = await API.get('/auth/me');
      if (data.user) API.setUser(data.user);
      return data.user || data;
    } catch (e) {
      return API.getUser();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    requireAuth: requireAuth,
    logout: logout,
    loadProfile: loadProfile
  };
})();
