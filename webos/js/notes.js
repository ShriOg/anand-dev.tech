var Notes = (function () {
  'use strict';

  var notes = [];
  var currentId = null;
  var page = 1;
  var perPage = 12;
  var searchTerm = '';

  function init() {
    var searchEl = document.getElementById('notesSearch');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        searchTerm = this.value.toLowerCase();
        page = 1;
        render();
      });
    }
    load();
  }

  async function load() {
    var grid = document.getElementById('notesGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loader-center"><div class="loader"></div></div>';

    try {
      var data = await API.get('/notes');
      notes = Array.isArray(data) ? data : (data.notes || []);
      render();
    } catch (err) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3><p>' + err.message + '</p></div>';
    }
  }

  function render() {
    var grid = document.getElementById('notesGrid');
    if (!grid) return;

    var filtered = notes;
    if (searchTerm) {
      filtered = notes.filter(function (n) {
        return (n.title || '').toLowerCase().includes(searchTerm) ||
               (n.content || '').toLowerCase().includes(searchTerm);
      });
    }

    var totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (page > totalPages) page = totalPages;

    var start = (page - 1) * perPage;
    var pageNotes = filtered.slice(start, start + perPage);

    if (pageNotes.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><h3>No notes yet</h3><p>Create your first note to get started</p></div>';
    } else {
      grid.innerHTML = pageNotes.map(function (n) {
        var date = n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '';
        return '<div class="note-card" onclick="Notes.edit(\'' + n._id + '\')">' +
          '<div class="note-actions">' +
            '<button class="btn-icon" onclick="event.stopPropagation();Notes.remove(\'' + n._id + '\')" title="Delete">✕</button>' +
          '</div>' +
          '<h3>' + escHtml(n.title || 'Untitled') + '</h3>' +
          '<p>' + escHtml(n.content || '') + '</p>' +
          '<div class="note-date">' + date + '</div>' +
        '</div>';
      }).join('');
    }

    renderPagination(filtered.length, totalPages);
  }

  function renderPagination(total, totalPages) {
    var el = document.getElementById('notesPagination');
    if (!el) return;

    if (totalPages <= 1) {
      el.innerHTML = '<span>' + total + ' note' + (total !== 1 ? 's' : '') + '</span>';
      return;
    }

    var html = '<button class="btn btn-ghost btn-sm" onclick="Notes.goPage(' + (page - 1) + ')"' +
      (page <= 1 ? ' disabled' : '') + '>‹</button>';
    html += '<span>Page ' + page + ' of ' + totalPages + '</span>';
    html += '<button class="btn btn-ghost btn-sm" onclick="Notes.goPage(' + (page + 1) + ')"' +
      (page >= totalPages ? ' disabled' : '') + '>›</button>';
    el.innerHTML = html;
  }

  function goPage(p) {
    page = p;
    render();
  }

  function showEditor(id) {
    currentId = id || null;
    var listView = document.getElementById('notesListView');
    var editor = document.getElementById('noteEditor');
    var titleEl = document.getElementById('noteTitle');
    var contentEl = document.getElementById('noteContent');
    var delBtn = document.getElementById('noteDeleteBtn');

    if (!listView || !editor) return;

    if (currentId) {
      var note = notes.find(function (n) { return n._id === currentId; });
      if (note) {
        titleEl.value = note.title || '';
        contentEl.value = note.content || '';
      }
      delBtn.classList.remove('hidden');
    } else {
      titleEl.value = '';
      contentEl.value = '';
      delBtn.classList.add('hidden');
    }

    listView.style.display = 'none';
    editor.classList.add('active');
    titleEl.focus();
  }

  function hideEditor() {
    var listView = document.getElementById('notesListView');
    var editor = document.getElementById('noteEditor');
    if (listView) listView.style.display = '';
    if (editor) editor.classList.remove('active');
    currentId = null;
  }

  function edit(id) {
    showEditor(id);
  }

  async function save() {
    var title = document.getElementById('noteTitle').value.trim();
    var content = document.getElementById('noteContent').value.trim();

    if (!title && !content) {
      showToast('Note cannot be empty', 'warning');
      return;
    }

    try {
      if (currentId) {
        await API.put('/notes/' + currentId, { title: title, content: content });
        showToast('Note updated', 'success');
      } else {
        await API.post('/notes', { title: title, content: content });
        showToast('Note created', 'success');
      }
      hideEditor();
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function remove(id) {
    if (!confirm('Delete this note?')) return;

    try {
      await API.del('/notes/' + id);
      showToast('Note deleted', 'success');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function deleteCurrent() {
    if (currentId) {
      remove(currentId);
      hideEditor();
    }
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    init: init,
    load: load,
    showEditor: showEditor,
    hideEditor: hideEditor,
    edit: edit,
    save: save,
    remove: remove,
    deleteCurrent: deleteCurrent,
    goPage: goPage
  };
})();
