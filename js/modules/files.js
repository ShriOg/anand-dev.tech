let filesData = [];

async function initFilesModule(container) {
  container.innerHTML = `
    <div class="module-header">
      <h2>Files</h2>
      <label class="btn-primary" for="fileInput">+ Upload File</label>
      <input type="file" id="fileInput" style="display: none;" onchange="uploadFile(event)">
    </div>
    <div id="uploadProgress" class="upload-progress" style="display: none;">
      <div class="progress-bar"></div>
    </div>
    <div id="filesList" class="files-grid"></div>
  `;
  
  await loadFiles();
}

async function loadFiles() {
  try {
    const response = await api.get('/api/files');
    filesData = response.files || [];
    renderFiles();
  } catch (error) {
    console.error('Failed to load files:', error);
  }
}

function renderFiles() {
  const filesList = document.getElementById('filesList');
  
  if (filesData.length === 0) {
    filesList.innerHTML = '<p class="empty-state">No files yet. Upload your first file!</p>';
    return;
  }
  
  filesList.innerHTML = filesData.map(file => `
    <div class="file-card">
      <div class="file-icon">${getFileIcon(file.mimetype)}</div>
      <div class="file-info">
        <h4>${escapeHtml(file.originalname)}</h4>
        <span class="file-size">${formatFileSize(file.size)}</span>
        <span class="file-date">${formatDate(file.uploadedAt)}</span>
      </div>
      <div class="file-actions">
        <a href="${file.url}" target="_blank" class="btn-icon" title="View">👁</a>
        <button class="btn-icon btn-danger" onclick="deleteFile('${file._id}')" title="Delete">×</button>
      </div>
    </div>
  `).join('');
}

async function uploadFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  
  const progress = document.getElementById('uploadProgress');
  progress.style.display = 'block';
  
  try {
    await api.post('/api/files', formData);
    progress.style.display = 'none';
    event.target.value = '';
    await loadFiles();
  } catch (error) {
    progress.style.display = 'none';
    alert('Failed to upload file: ' + error.message);
  }
}

async function deleteFile(fileId) {
  if (!confirm('Are you sure you want to delete this file?')) return;
  
  try {
    await api.delete(`/api/files/${fileId}`);
    await loadFiles();
  } catch (error) {
    alert('Failed to delete file: ' + error.message);
  }
}

function getFileIcon(mimetype) {
  if (mimetype.startsWith('image/')) return '🖼️';
  if (mimetype.startsWith('video/')) return '🎥';
  if (mimetype.startsWith('audio/')) return '🎵';
  if (mimetype.includes('pdf')) return '📄';
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return '📦';
  if (mimetype.includes('text')) return '📝';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
