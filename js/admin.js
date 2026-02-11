var Admin = (function () {
  'use strict';

  function init() {
    load();
  }

  async function load() {
    var grid = document.getElementById('adminGrid');
    if (!grid) return;

    setValues('—', '—', '—', '—');

    try {
      var data = await API.get('/admin/stats');
      var users = data.totalUsers || data.users || 0;
      var notes = data.totalNotes || data.notes || 0;
      var files = data.totalFiles || data.files || 0;
      var storage = data.storageUsed || data.storage || 0;

      setValues(users, notes, files, formatStorage(storage));
    } catch (err) {
      showToast('Admin: ' + err.message, 'error');
    }
  }

  function setValues(users, notes, files, storage) {
    var el;
    el = document.getElementById('statUsers');
    if (el) el.textContent = users;
    el = document.getElementById('statNotes');
    if (el) el.textContent = notes;
    el = document.getElementById('statFiles');
    if (el) el.textContent = files;
    el = document.getElementById('statStorage');
    if (el) el.textContent = storage;
  }

  function formatStorage(bytes) {
    if (typeof bytes === 'string') return bytes;
    if (!bytes || bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  return {
    init: init,
    load: load
  };
})();
