var Auth = (function () {
  'use strict';

  var API_URL = 'https://anand-os-backend.onrender.com';
  var WEBOS_BASE = '/webos';

  function init() {
    var loginForm = document.getElementById('loginForm');
    var registerForm = document.getElementById('registerForm');

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
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
      var response = await fetch(API_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      var text = await response.text();
      var data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (pe) { data = { message: text }; }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      localStorage.setItem('authToken', 'true');
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      window.location.replace(WEBOS_BASE + '/os/');
    } catch (err) {
      showError(errEl, err.message);
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }, 3000);
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
      var response = await fetch(API_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, email: email, password: password })
      });

      var text = await response.text();
      var data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (pe) { data = { message: text }; }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      localStorage.setItem('authToken', 'true');
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      window.location.replace(WEBOS_BASE + '/os/');
    } catch (err) {
      showError(errEl, err.message);
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }, 3000);
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

  function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    window.location.replace(WEBOS_BASE + '/login/');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    logout: logout
  };
})();
