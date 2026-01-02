/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - SYNC MODULE
 * Optional cloud sync (manual, encrypt-first)
 * ═══════════════════════════════════════════════════════════
 */

const PSSync = (function() {
  'use strict';

  let _syncStatus = 'idle';
  let _lastSyncAt = null;
  let _syncConfig = null;

  /**
   * Initialize sync module
   */
  async function init() {
    const settings = PSSettings.getSettings();
    _lastSyncAt = settings.syncLastAt || null;
  }

  /**
   * Get sync status
   */
  function getStatus() {
    return {
      status: _syncStatus,
      lastSyncAt: _lastSyncAt,
      enabled: PSSettings.get('syncEnabled')
    };
  }

  /**
   * Sync all data to cloud
   */
  async function sync() {
    if (!PSSettings.get('syncEnabled')) {
      throw new Error('Sync is not enabled');
    }

    if (_syncStatus === 'syncing') {
      throw new Error('Sync already in progress');
    }

    _syncStatus = 'syncing';
    updateStatusUI();

    try {
      // Collect all data
      const data = await collectData();
      
      // Encrypt the data blob
      const encryptedBlob = await PSCrypto.encrypt(JSON.stringify(data));
      
      // Generate checksum
      const checksum = await PSCrypto.hash(encryptedBlob);
      
      // Prepare sync package
      const syncPackage = {
        version: '1.0.0',
        timestamp: Date.now(),
        checksum,
        data: encryptedBlob
      };

      // Upload to configured endpoint
      await uploadToCloud(syncPackage);
      
      // Update last sync time
      _lastSyncAt = Date.now();
      _syncStatus = 'success';
      
      // Save sync time to settings
      await PSSettings.update('syncLastAt', _lastSyncAt);
      
      updateStatusUI();
      return { success: true, timestamp: _lastSyncAt };
    } catch (error) {
      _syncStatus = 'error';
      updateStatusUI();
      throw error;
    }
  }

  /**
   * Restore data from cloud
   */
  async function restore() {
    if (!PSSettings.get('syncEnabled')) {
      throw new Error('Sync is not enabled');
    }

    _syncStatus = 'syncing';
    updateStatusUI();

    try {
      // Download from cloud
      const syncPackage = await downloadFromCloud();
      
      if (!syncPackage) {
        throw new Error('No backup found');
      }

      // Verify checksum
      const checksum = await PSCrypto.hash(syncPackage.data);
      if (checksum !== syncPackage.checksum) {
        throw new Error('Data integrity check failed');
      }

      // Decrypt data
      const decrypted = await PSCrypto.decrypt(syncPackage.data);
      const data = JSON.parse(decrypted);

      // Restore to local storage
      await restoreData(data);
      
      _syncStatus = 'success';
      updateStatusUI();
      
      return { success: true, timestamp: syncPackage.timestamp };
    } catch (error) {
      _syncStatus = 'error';
      updateStatusUI();
      throw error;
    }
  }

  /**
   * Collect all data for sync
   */
  async function collectData() {
    return {
      notes: await PSStorage.getAll(PSStorage.STORES.NOTES),
      images: await collectImagesForSync(),
      logs: await PSStorage.getAll(PSStorage.STORES.LOGS),
      memory: await PSStorage.getAll(PSStorage.STORES.MEMORY),
      projects: await PSStorage.getAll(PSStorage.STORES.PROJECTS),
      chat: await PSStorage.getAll(PSStorage.STORES.CHAT),
      settings: await PSStorage.getAll(PSStorage.STORES.SETTINGS)
    };
  }

  /**
   * Collect images with data for sync
   */
  async function collectImagesForSync() {
    const images = await PSStorage.getAll(PSStorage.STORES.IMAGES);
    
    // For sync, we might want to limit image data or use references
    // This is a placeholder for actual implementation
    return images.map(img => ({
      ...img,
      data: img.data ? img.data.substring(0, 1000) + '...' : null // Truncate for now
    }));
  }

  /**
   * Restore data from sync
   */
  async function restoreData(data) {
    // Clear existing data first
    await PSStorage.clear(PSStorage.STORES.NOTES);
    await PSStorage.clear(PSStorage.STORES.IMAGES);
    await PSStorage.clear(PSStorage.STORES.LOGS);
    await PSStorage.clear(PSStorage.STORES.MEMORY);
    await PSStorage.clear(PSStorage.STORES.PROJECTS);
    await PSStorage.clear(PSStorage.STORES.CHAT);

    // Restore each store
    for (const note of data.notes || []) {
      await PSStorage.save(PSStorage.STORES.NOTES, note);
    }
    for (const image of data.images || []) {
      await PSStorage.save(PSStorage.STORES.IMAGES, image);
    }
    for (const log of data.logs || []) {
      await PSStorage.save(PSStorage.STORES.LOGS, log);
    }
    for (const memory of data.memory || []) {
      await PSStorage.save(PSStorage.STORES.MEMORY, memory);
    }
    for (const project of data.projects || []) {
      await PSStorage.save(PSStorage.STORES.PROJECTS, project);
    }
    for (const chat of data.chat || []) {
      await PSStorage.save(PSStorage.STORES.CHAT, chat);
    }
  }

  /**
   * Upload to cloud endpoint
   * This is a placeholder - implement with your preferred storage
   */
  async function uploadToCloud(syncPackage) {
    // Option 1: GitHub Gist (private)
    // Option 2: Firebase/Supabase
    // Option 3: Custom endpoint
    // Option 4: Local file system (for now)
    
    // For now, we'll use localStorage as a demo
    // In production, replace with actual cloud upload
    
    try {
      const syncData = JSON.stringify(syncPackage);
      
      // Check size (localStorage limit ~5MB)
      if (syncData.length > 4 * 1024 * 1024) {
        throw new Error('Data too large for sync');
      }
      
      localStorage.setItem('ps_cloud_backup', syncData);
      
      return true;
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Failed to upload to cloud');
    }
  }

  /**
   * Download from cloud endpoint
   */
  async function downloadFromCloud() {
    // For now, we'll use localStorage as a demo
    // In production, replace with actual cloud download
    
    try {
      const syncData = localStorage.getItem('ps_cloud_backup');
      
      if (!syncData) {
        return null;
      }
      
      return JSON.parse(syncData);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download from cloud');
    }
  }

  /**
   * Update status UI
   */
  function updateStatusUI() {
    const statusEl = document.querySelector('.ps-sync-status-indicator');
    const textEl = document.querySelector('.ps-sync-status-text');
    
    if (statusEl) {
      statusEl.className = 'ps-sync-status-indicator ' + _syncStatus;
    }
    
    if (textEl) {
      switch (_syncStatus) {
        case 'syncing':
          textEl.textContent = 'Syncing...';
          break;
        case 'success':
          textEl.textContent = `Last synced: ${new Date(_lastSyncAt).toLocaleString()}`;
          break;
        case 'error':
          textEl.textContent = 'Sync failed';
          break;
        default:
          textEl.textContent = _lastSyncAt 
            ? `Last synced: ${new Date(_lastSyncAt).toLocaleString()}`
            : 'Not synced yet';
      }
    }
  }

  /**
   * Configure sync endpoint
   */
  function configure(config) {
    _syncConfig = {
      endpoint: config.endpoint || null,
      apiKey: config.apiKey || null,
      provider: config.provider || 'local'
    };
  }

  /**
   * Check if sync is available
   */
  function isAvailable() {
    return PSSettings.get('syncEnabled') && (_syncConfig?.endpoint || true);
  }

  /**
   * Get sync history
   */
  async function getHistory() {
    // Placeholder for sync history tracking
    return [];
  }

  /**
   * Resolve sync conflicts
   */
  async function resolveConflict(localData, remoteData, strategy = 'newest') {
    switch (strategy) {
      case 'local':
        return localData;
      case 'remote':
        return remoteData;
      case 'newest':
        return localData.updatedAt > remoteData.updatedAt ? localData : remoteData;
      case 'merge':
        return { ...remoteData, ...localData };
      default:
        return localData;
    }
  }

  return {
    init,
    getStatus,
    sync,
    restore,
    configure,
    isAvailable,
    getHistory,
    resolveConflict
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSSync;
}
