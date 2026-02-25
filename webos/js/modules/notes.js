let notesData = [];
let currentPage = 1;
const notesPerPage = 10;

async function initNotesModule(container) {
  container.innerHTML = `
    <div class="module-header">
      <h2>Notes</h2>
      <button class="btn-primary" onclick="showNoteForm()">+ New Note</button>
    </div>
    <div id="noteForm" class="note-form" style="display: none;">
      <input type="text" id="noteTitle" placeholder="Title" class="input-field">
      <textarea id="noteContent" placeholder="Content" class="textarea-field"></textarea>
      <div class="form-actions">
        <button class="btn-primary" onclick="saveNote()">Save</button>
        <button class="btn-secondary" onclick="cancelNoteForm()">Cancel</button>
      </div>
    </div>
    <div id="notesList" class="notes-list"></div>
    <div id="notesPagination" class="pagination"></div>
  `;
  
  await loadNotes();
}

async function loadNotes() {
  try {
    const response = await api.get(`/api/notes?page=${currentPage}&limit=${notesPerPage}`);
    notesData = response.notes || [];
    renderNotes();
    renderPagination(response.totalPages || 1);
  } catch (error) {
    console.error('Failed to load notes:', error);
  }
}

function renderNotes() {
  const notesList = document.getElementById('notesList');
  
  if (notesData.length === 0) {
    notesList.innerHTML = '<p class="empty-state">No notes yet. Create your first note!</p>';
    return;
  }
  
  notesList.innerHTML = notesData.map(note => `
    <div class="note-card">
      <div class="note-header">
        <h3>${escapeHtml(note.title)}</h3>
        <div class="note-actions">
          <button class="btn-icon" onclick="editNote('${note._id}')">✎</button>
          <button class="btn-icon btn-danger" onclick="deleteNote('${note._id}')">×</button>
        </div>
      </div>
      <p class="note-content">${escapeHtml(note.content)}</p>
      <span class="note-date">${formatDate(note.createdAt)}</span>
    </div>
  `).join('');
}

function renderPagination(totalPages) {
  const pagination = document.getElementById('notesPagination');
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  pagination.innerHTML = html;
}

function showNoteForm() {
  document.getElementById('noteForm').style.display = 'block';
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteTitle').dataset.noteId = '';
}

function cancelNoteForm() {
  document.getElementById('noteForm').style.display = 'none';
}

async function saveNote() {
  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  const noteId = document.getElementById('noteTitle').dataset.noteId;
  
  if (!title || !content) {
    alert('Please fill in both title and content');
    return;
  }
  
  try {
    if (noteId) {
      await api.put(`/api/notes/${noteId}`, { title, content });
    } else {
      await api.post('/api/notes', { title, content });
    }
    
    cancelNoteForm();
    await loadNotes();
  } catch (error) {
    alert('Failed to save note: ' + error.message);
  }
}

function editNote(noteId) {
  const note = notesData.find(n => n._id === noteId);
  if (!note) return;
  
  document.getElementById('noteTitle').value = note.title;
  document.getElementById('noteContent').value = note.content;
  document.getElementById('noteTitle').dataset.noteId = noteId;
  document.getElementById('noteForm').style.display = 'block';
}

async function deleteNote(noteId) {
  if (!confirm('Are you sure you want to delete this note?')) return;
  
  try {
    await api.delete(`/api/notes/${noteId}`);
    await loadNotes();
  } catch (error) {
    alert('Failed to delete note: ' + error.message);
  }
}

function goToPage(page) {
  currentPage = page;
  loadNotes();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
