var Files = (function () {
  'use strict';

  var files = [];

  function init() {
    setupDropZone();
    load();
  }

  function setupDropZone() {
    var zone = document.getElementById('fileUploadZone');
    if (!zone) return;

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', function () {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        upload(e.dataTransfer.files);
      }
    });
  }

  function toggleUpload() {
    var zone = document.getElementById('fileUploadZone');
    if (zone) zone.classList.toggle('visible');
  }

  async function load() {
    var list = document.getElementById('filesList');
    var countEl = document.getElementById('filesCount');
    if (!list) return;
    list.innerHTML = '<div class="loader-center"><div class="loader"></div></div>';

    try {
      var data = await API.get('/files');
      files = Array.isArray(data) ? data : (data.files || []);
      if (countEl) countEl.textContent = files.length + ' file' + (files.length !== 1 ? 's' : '');
      render();
    } catch (err) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>' + err.message + '</p></div>';
    }
  }

  function render() {
    var list = document.getElementById('filesList');
    if (!list) return;

    if (files.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📁</div><h3>No files yet</h3><p>Upload your first file</p></div>';
      return;
    }

    list.innerHTML = files.map(function (f) {
      var icon = getFileIcon(f.filename || f.name || '');
      var size = formatBytes(f.size || 0);
      var name = f.filename || f.originalName || f.name || 'Unknown';
      var date = f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '';

      return '<div class="file-item">' +
        '<div class="file-icon">' + icon + '</div>' +
        '<div class="file-info">' +
          '<div class="file-name">' + escHtml(name) + '</div>' +
          '<div class="file-meta">' + size + (date ? ' · ' + date : '') + '</div>' +
        '</div>' +
        '<div class="file-actions">' +
          (f.url ? '<a href="' + f.url + '" target="_blank" class="btn-icon" title="Download">↓</a>' : '') +
          '<button class="btn-icon" onclick="Files.remove(\'' + f._id + '\')" title="Delete">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  async function upload(fileList) {
    if (!fileList || !fileList.length) return;

    var file = fileList[0];
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)', 'warning');
      return;
    }

    var formData = new FormData();
    formData.append('file', file);

    try {
      showToast('Uploading...', 'info');
      await API.upload('/files', formData);
      showToast('File uploaded', 'success');
      var input = document.getElementById('fileInput');
      if (input) input.value = '';
      toggleUpload();
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this file?')) return;

    try {
      await API.del('/files/' + id);
      showToast('File deleted', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function getFileIcon(name) {
    var ext = name.split('.').pop().toLowerCase();
    var icons = {
      pdf: '📄', doc: '📄', docx: '📄', txt: '📄',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
      mp3: '🎵', wav: '🎵', ogg: '🎵',
      mp4: '🎬', mov: '🎬', avi: '🎬', webm: '🎬',
      zip: '📦', rar: '📦', tar: '📦', gz: '📦',
      js: '💻', ts: '💻', py: '💻', html: '💻', css: '💻', json: '💻',
      xls: '📊', xlsx: '📊', csv: '📊',
      ppt: '📊', pptx: '📊'
    };
    return icons[ext] || '📄';
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    init: init,
    load: load,
    upload: upload,
    remove: remove,
    toggleUpload: toggleUpload
  };
})();
