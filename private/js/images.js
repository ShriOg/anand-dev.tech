/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - IMAGES MODULE
 * Local image vault with tags and notes
 * ═══════════════════════════════════════════════════════════
 */

const PSImages = (function() {
  'use strict';

  let _images = [];
  let _viewMode = 'grid';
  let _searchQuery = '';
  let _selectedImage = null;

  /**
   * Load images view
   */
  async function load() {
    await loadImages();
    render();
  }

  /**
   * Load all images from storage
   */
  async function loadImages() {
    try {
      _images = await PSStorage.getAll(PSStorage.STORES.IMAGES);
      _images.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch {
      _images = [];
    }
  }

  /**
   * Render images interface
   */
  function render() {
    const container = document.querySelector('#section-images .ps-workspace');
    if (!container) return;

    const filteredImages = filterImages();

    container.innerHTML = `
      <div class="ps-images">
        <div class="ps-images-header">
          <input type="text" class="ps-input ps-input-search ps-images-search" 
                 placeholder="Search images..." 
                 value="${escapeHtml(_searchQuery)}"
                 oninput="PSImages.search(this.value)">
          <div class="ps-images-filters">
            <div class="ps-images-view-toggle">
              <button class="ps-view-btn ${_viewMode === 'grid' ? 'active' : ''}" onclick="PSImages.setView('grid')" title="Grid view">
                <svg class="icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
              <button class="ps-view-btn ${_viewMode === 'list' ? 'active' : ''}" onclick="PSImages.setView('list')" title="List view">
                <svg class="icon-sm" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
            <button class="ps-btn ps-btn-primary ps-btn-sm" onclick="PSImages.triggerUpload()">
              <svg class="icon-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload
            </button>
          </div>
        </div>

        ${filteredImages.length === 0 ? renderUploadArea() : `
          <div class="ps-images-grid ${_viewMode === 'list' ? 'list-view' : ''}">
            ${filteredImages.map(img => renderImageCard(img)).join('')}
          </div>
        `}

        <input type="file" id="imageUpload" accept="image/*" multiple style="display: none;" onchange="PSImages.handleUpload(event)">
      </div>
    `;
  }

  /**
   * Render upload area (empty state)
   */
  function renderUploadArea() {
    return `
      <div class="ps-upload-area" onclick="PSImages.triggerUpload()" ondragover="PSImages.handleDragOver(event)" ondrop="PSImages.handleDrop(event)" ondragleave="this.classList.remove('dragover')">
        <svg class="ps-upload-icon icon" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <div class="ps-upload-title">Drop images here or click to upload</div>
        <div class="ps-upload-subtitle">PNG, JPG, GIF up to 10MB</div>
      </div>
    `;
  }

  /**
   * Render image card
   */
  function renderImageCard(image) {
    return `
      <div class="ps-image-card" onclick="PSImages.openImage('${image.id}')">
        <div class="ps-image-preview">
          <img src="${image.data}" alt="${escapeHtml(image.name)}" loading="lazy">
          <div class="ps-image-overlay">
            <div class="ps-image-quick-actions">
              <button class="ps-image-quick-btn" onclick="event.stopPropagation(); PSImages.downloadImage('${image.id}')" title="Download">
                <svg class="icon-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              <button class="ps-image-quick-btn" onclick="event.stopPropagation(); PSImages.deleteImage('${image.id}')" title="Delete">
                <svg class="icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="ps-image-info">
          <div class="ps-image-name">${escapeHtml(image.name)}</div>
          <div class="ps-image-meta">
            <span>${formatDate(image.createdAt)}</span>
            <span>•</span>
            <span>${formatSize(image.size)}</span>
          </div>
          ${(image.tags && image.tags.length > 0) ? `
            <div class="ps-image-tags">
              ${image.tags.slice(0, 3).map(tag => `
                <span class="ps-tag">${escapeHtml(tag)}</span>
              `).join('')}
              ${image.tags.length > 3 ? `<span class="ps-tag">+${image.tags.length - 3}</span>` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Filter images based on search
   */
  function filterImages() {
    if (!_searchQuery) return _images;
    
    const query = _searchQuery.toLowerCase();
    return _images.filter(img => 
      (img.name || '').toLowerCase().includes(query) ||
      (img.notes || '').toLowerCase().includes(query) ||
      (img.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  }

  /**
   * Trigger file upload
   */
  function triggerUpload() {
    document.getElementById('imageUpload')?.click();
  }

  /**
   * Handle file upload
   */
  async function handleUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        PSUI.toast(`${file.name} is too large (max 10MB)`, 'warning');
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        
        const image = {
          id: PSCrypto.generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: dataUrl,
          tags: [],
          notes: '',
          createdAt: Date.now()
        };

        await PSStorage.save(PSStorage.STORES.IMAGES, image);
        _images.unshift(image);
      } catch (err) {
        console.error('Upload error:', err);
        PSUI.toast(`Failed to upload ${file.name}`, 'error');
      }
    }

    render();
    PSUI.toast(`Uploaded ${files.length} image(s)`, 'success');
    
    // Reset input
    event.target.value = '';
  }

  /**
   * Read file as data URL
   */
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle drag over
   */
  function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  }

  /**
   * Handle drop
   */
  async function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleUpload({ target: { files } });
    }
  }

  /**
   * Open image detail
   */
  function openImage(imageId) {
    const image = _images.find(img => img.id === imageId);
    if (!image) return;

    _selectedImage = image;

    PSUI.modal({
      title: image.name,
      content: `
        <div class="ps-image-modal">
          <div class="ps-image-modal-preview">
            <img src="${image.data}" alt="${escapeHtml(image.name)}">
          </div>
          <div class="ps-image-modal-sidebar">
            <div class="ps-image-modal-section">
              <div class="ps-image-modal-label">Details</div>
              <p style="font-size: 13px; color: var(--ps-text-secondary);">
                Size: ${formatSize(image.size)}<br>
                Type: ${image.type}<br>
                Added: ${new Date(image.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div class="ps-image-modal-section">
              <div class="ps-image-modal-label">Tags</div>
              <div class="ps-editor-tags-list" style="margin-bottom: 8px;">
                ${(image.tags || []).map(tag => `
                  <span class="ps-tag ps-tag-accent">
                    ${escapeHtml(tag)}
                    <button class="ps-tag-remove" onclick="PSImages.removeTag('${image.id}', '${escapeHtml(tag)}')">×</button>
                  </span>
                `).join('')}
              </div>
              <input type="text" class="ps-input ps-input-sm" 
                     placeholder="Add tag..." 
                     onkeydown="PSImages.handleTagInput(event, '${image.id}')">
            </div>
            
            <div class="ps-image-modal-section">
              <div class="ps-image-modal-label">Notes</div>
              <textarea class="ps-textarea ps-image-notes" 
                        placeholder="Add notes about this image..."
                        onchange="PSImages.updateNotes('${image.id}', this.value)">${escapeHtml(image.notes || '')}</textarea>
            </div>
          </div>
        </div>
      `,
      onClose: () => {
        _selectedImage = null;
        render();
      }
    });
  }

  /**
   * Handle tag input
   */
  async function handleTagInput(event, imageId) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const tag = event.target.value.trim().replace(',', '');
      
      if (tag) {
        const image = _images.find(img => img.id === imageId);
        if (image) {
          if (!image.tags) image.tags = [];
          if (!image.tags.includes(tag)) {
            image.tags.push(tag);
            await PSStorage.save(PSStorage.STORES.IMAGES, image);
            openImage(imageId); // Refresh modal
          }
        }
      }
      event.target.value = '';
    }
  }

  /**
   * Remove tag
   */
  async function removeTag(imageId, tag) {
    const image = _images.find(img => img.id === imageId);
    if (image && image.tags) {
      image.tags = image.tags.filter(t => t !== tag);
      await PSStorage.save(PSStorage.STORES.IMAGES, image);
      openImage(imageId); // Refresh modal
    }
  }

  /**
   * Update notes
   */
  async function updateNotes(imageId, notes) {
    const image = _images.find(img => img.id === imageId);
    if (image) {
      image.notes = notes;
      await PSStorage.save(PSStorage.STORES.IMAGES, image);
    }
  }

  /**
   * Download image
   */
  function downloadImage(imageId) {
    const image = _images.find(img => img.id === imageId);
    if (!image) return;

    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.name;
    link.click();
  }

  /**
   * Delete image
   */
  function deleteImage(imageId) {
    PSUI.confirm('Are you sure you want to delete this image?', async () => {
      await PSStorage.remove(PSStorage.STORES.IMAGES, imageId);
      _images = _images.filter(img => img.id !== imageId);
      
      // Close modal if open
      document.querySelector('.ps-modal-overlay')?.remove();
      
      PSUI.toast('Image deleted', 'success');
      render();
    });
  }

  /**
   * Set view mode
   */
  function setView(mode) {
    _viewMode = mode;
    render();
  }

  /**
   * Search images
   */
  function search(query) {
    _searchQuery = query;
    render();
  }

  /**
   * Format date
   */
  function formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format file size
   */
  function formatSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    load,
    triggerUpload,
    handleUpload,
    handleDragOver,
    handleDrop,
    openImage,
    handleTagInput,
    removeTag,
    updateNotes,
    downloadImage,
    deleteImage,
    setView,
    search
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSImages;
}
