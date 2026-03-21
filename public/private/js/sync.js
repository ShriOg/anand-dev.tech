const PSSync = (function() {
  'use strict';

  let _syncStatus = 'idle';
  let _lastSyncAt = null;
  let _syncConfig = null;

  async function init() {
    const settings = PSSettings.getSettings();
    _lastSyncAt = settings.syncLastAt || null;
  }

  function getStatus() {
    return {
      status: _syncStatus,
      lastSyncAt: _lastSyncAt,
      enabled: PSSettings.get('syncEnabled')
    };
  }

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

      const data = await collectData();

      const encryptedBlob = await PSCrypto.encrypt(JSON.stringify(data));

      const checksum = await PSCrypto.hash(encryptedBlob);

      const syncPackage = {
        version: '1.0.0',
        timestamp: Date.now(),
        checksum,
        data: encryptedBlob
      };

      await uploadToCloud(syncPackage);

      _lastSyncAt = Date.now();
      _syncStatus = 'success';

      await PSSettings.update('syncLastAt', _lastSyncAt);

      updateStatusUI();
      return { success: true, timestamp: _lastSyncAt };
    } catch (error) {
      _syncStatus = 'error';
      updateStatusUI();
      throw error;
    }
  }

  async function restore() {
    if (!PSSettings.get('syncEnabled')) {
      throw new Error('Sync is not enabled');
    }

    _syncStatus = 'syncing';
    updateStatusUI();

    try {

      const syncPackage = await downloadFromCloud();

      if (!syncPackage) {
        throw new Error('No backup found');
      }

      const checksum = await PSCrypto.hash(syncPackage.data);
      if (checksum !== syncPackage.checksum) {
        throw new Error('Data integrity check failed');
      }

      const decrypted = await PSCrypto.decrypt(syncPackage.data);
      const data = JSON.parse(decrypted);

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

  async function collectImagesForSync() {
    const images = await PSStorage.getAll(PSStorage.STORES.IMAGES);

    return images.map(img => ({
      ...img,
      data: img.data ? img.data.substring(0, 1000) + '...' : null
    }));
  }

  async function restoreData(data) {

    await PSStorage.clear(PSStorage.STORES.NOTES);
    await PSStorage.clear(PSStorage.STORES.IMAGES);
    await PSStorage.clear(PSStorage.STORES.LOGS);
    await PSStorage.clear(PSStorage.STORES.MEMORY);
    await PSStorage.clear(PSStorage.STORES.PROJECTS);
    await PSStorage.clear(PSStorage.STORES.CHAT);

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

  async function uploadToCloud(syncPackage) {

    try {
      const syncData = JSON.stringify(syncPackage);

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

  async function downloadFromCloud() {

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

  function configure(config) {
    _syncConfig = {
      endpoint: config.endpoint || null,
      apiKey: config.apiKey || null,
      provider: config.provider || 'local'
    };
  }

  function isAvailable() {
    return PSSettings.get('syncEnabled') && (_syncConfig?.endpoint || true);
  }

  async function getHistory() {

    return [];
  }

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
