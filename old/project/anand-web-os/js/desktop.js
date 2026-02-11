var Desktop = (function () {
  'use strict';

  var windows = {};
  var zIndex = 10;
  var dragState = null;
  var clockInterval = null;

  var appConfig = {
    notes:  { title: 'Notes',        emoji: '📝', width: 620, height: 480 },
    files:  { title: 'Files',        emoji: '📁', width: 600, height: 460 },
    ai:     { title: 'AI Assistant', emoji: '🤖', width: 520, height: 500 },
    admin:  { title: 'Admin Panel',  emoji: '⚙️', width: 540, height: 380 }
  };

  function init() {
    if (!Auth.requireAuth()) return;

    setupUser();
    startClock();
    setupUserMenu();
    setupDrag();

    document.addEventListener('click', function (e) {
      var menu = document.getElementById('userMenu');
      var trigger = document.getElementById('taskbarUser');
      if (menu.classList.contains('visible') && !menu.contains(e.target) && !trigger.contains(e.target)) {
        menu.classList.remove('visible');
      }
    });
  }

  async function setupUser() {
    var user = await Auth.loadProfile();
    if (!user) return;

    var name = user.username || user.name || user.email || '';
    var avatarEl = document.getElementById('userAvatar');
    var nameEl = document.getElementById('userName');

    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = name;

    if (user.role === 'admin') {
      var adminIcon = document.getElementById('adminIcon');
      var menuAdmin = document.getElementById('menuAdmin');
      if (adminIcon) adminIcon.classList.remove('hidden');
      if (menuAdmin) menuAdmin.style.display = '';
    }
  }

  function startClock() {
    function tick() {
      var el = document.getElementById('taskbarClock');
      if (!el) return;
      var now = new Date();
      var h = now.getHours();
      var m = String(now.getMinutes()).padStart(2, '0');
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      el.querySelector('.time').textContent = h + ':' + m + ' ' + ampm;
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      el.querySelector('.date').textContent = months[now.getMonth()] + ' ' + now.getDate();
    }
    tick();
    clockInterval = setInterval(tick, 10000);
  }

  function setupUserMenu() {
    var trigger = document.getElementById('taskbarUser');
    var menu = document.getElementById('userMenu');
    if (trigger && menu) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        menu.classList.toggle('visible');
      });
    }
  }

  function openApp(name) {
    var menu = document.getElementById('userMenu');
    if (menu) menu.classList.remove('visible');

    if (name === 'admin') {
      var user = API.getUser();
      if (!user || user.role !== 'admin') return;
    }

    if (windows[name]) {
      var win = windows[name];
      if (win.el.classList.contains('minimized')) {
        win.el.classList.remove('minimized');
      }
      focusWindow(name);
      return;
    }

    createWindow(name);
  }

  function createWindow(name) {
    var cfg = appConfig[name];
    if (!cfg) return;

    var tmpl = document.getElementById('tmpl' + name.charAt(0).toUpperCase() + name.slice(1));
    if (!tmpl) return;

    var container = document.getElementById('windowsContainer');
    var el = document.createElement('div');
    el.className = 'os-window';
    el.id = 'win-' + name;
    el.style.width = cfg.width + 'px';
    el.style.height = cfg.height + 'px';

    var left = Math.max(80, Math.min(window.innerWidth - cfg.width - 40, 120 + Object.keys(windows).length * 30));
    var top = Math.max(20, Math.min(window.innerHeight - cfg.height - 80, 40 + Object.keys(windows).length * 30));
    el.style.left = left + 'px';
    el.style.top = top + 'px';

    el.innerHTML =
      '<div class="window-header" data-win="' + name + '">' +
        '<div class="window-title"><span class="emoji">' + cfg.emoji + '</span>' + cfg.title + '</div>' +
        '<div class="window-controls">' +
          '<div class="window-control minimize" onclick="Desktop.minimize(\'' + name + '\')" title="Minimize">─</div>' +
          '<div class="window-control close" onclick="Desktop.closeApp(\'' + name + '\')" title="Close">✕</div>' +
        '</div>' +
      '</div>' +
      '<div class="window-body"></div>';

    var body = el.querySelector('.window-body');
    body.appendChild(tmpl.content.cloneNode(true));

    container.appendChild(el);

    windows[name] = { el: el, minimized: false };
    focusWindow(name);
    updateTaskbar();

    el.addEventListener('mousedown', function () {
      focusWindow(name);
    });

    if (name === 'notes') Notes.init();
    if (name === 'files') Files.init();
    if (name === 'ai') AI.init();
    if (name === 'admin') Admin.init();
  }

  function focusWindow(name) {
    Object.keys(windows).forEach(function (k) {
      windows[k].el.classList.remove('focused');
    });
    if (windows[name]) {
      zIndex++;
      windows[name].el.style.zIndex = zIndex;
      windows[name].el.classList.add('focused');
    }
    updateTaskbar();
  }

  function closeApp(name) {
    if (!windows[name]) return;
    windows[name].el.remove();
    delete windows[name];
    updateTaskbar();
  }

  function minimize(name) {
    if (!windows[name]) return;
    windows[name].el.classList.add('minimized');
    updateTaskbar();
  }

  function updateTaskbar() {
    var bar = document.getElementById('taskbarApps');
    bar.innerHTML = '';
    Object.keys(windows).forEach(function (name) {
      var cfg = appConfig[name];
      var win = windows[name];
      var btn = document.createElement('div');
      btn.className = 'taskbar-app' + (win.el.classList.contains('focused') && !win.el.classList.contains('minimized') ? ' active' : '');
      btn.innerHTML = '<span class="app-emoji">' + cfg.emoji + '</span><span>' + cfg.title + '</span>';
      btn.addEventListener('click', function () {
        if (win.el.classList.contains('minimized')) {
          win.el.classList.remove('minimized');
          focusWindow(name);
        } else if (win.el.classList.contains('focused')) {
          minimize(name);
        } else {
          focusWindow(name);
        }
      });
      bar.appendChild(btn);
    });
  }

  function setupDrag() {
    document.addEventListener('mousedown', function (e) {
      var header = e.target.closest('.window-header');
      if (!header || e.target.closest('.window-controls')) return;

      var winName = header.getAttribute('data-win');
      if (!winName || !windows[winName]) return;

      var el = windows[winName].el;
      var rect = el.getBoundingClientRect();

      dragState = {
        el: el,
        name: winName,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      };

      focusWindow(winName);
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragState) return;

      var x = e.clientX - dragState.offsetX;
      var y = e.clientY - dragState.offsetY;

      x = Math.max(0, Math.min(window.innerWidth - 100, x));
      y = Math.max(0, Math.min(window.innerHeight - 60, y));

      dragState.el.style.left = x + 'px';
      dragState.el.style.top = y + 'px';
    });

    document.addEventListener('mouseup', function () {
      dragState = null;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    openApp: openApp,
    closeApp: closeApp,
    minimize: minimize
  };
})();

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;

  var icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span><span>' + message + '</span>';
  container.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all .3s ease';
    setTimeout(function () { toast.remove(); }, 300);
  }, 3500);
}
