const PSStorage = (function() {
  'use strict';

  const DB_NAME = 'PrivateSpaceDB';
  const DB_VERSION = 1;

  const STORES = {
    NOTES: 'notes',
    IMAGES: 'images',
    LOGS: 'logs',
    MEMORY: 'memory',
    PROJECTS: 'projects',
    CHAT: 'chat',
    SETTINGS: 'settings'
  };

  let _db = null;

  function init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        _db = request.result;
        resolve(_db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
          notesStore.createIndex('folder', 'folder', { unique: false });
          notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          const imagesStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
          imagesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.LOGS)) {
          const logsStore = db.createObjectStore(STORES.LOGS, { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains(STORES.MEMORY)) {
          const memoryStore = db.createObjectStore(STORES.MEMORY, { keyPath: 'id' });
          memoryStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectsStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
          projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CHAT)) {
          const chatStore = db.createObjectStore(STORES.CHAT, { keyPath: 'id' });
          chatStore.createIndex('sessionId', 'sessionId', { unique: false });
          chatStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  async function getDB() {
    if (!_db) {
      await init();
    }
    return _db;
  }

  async function save(storeName, data) {
    const db = await getDB();
    const encrypted = await PSCrypto.encrypt(JSON.stringify(data));

    const item = {
      id: data.id || PSCrypto.generateId(),
      data: encrypted,
      updatedAt: Date.now()
    };

    if (data.folder !== undefined) item.folder = data.folder;
    if (data.type !== undefined) item.type = data.type;
    if (data.sessionId !== undefined) item.sessionId = data.sessionId;
    if (data.date !== undefined) item.date = data.date;
    if (data.createdAt !== undefined) item.createdAt = data.createdAt;
    if (data.key !== undefined) item.key = data.key;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item.id);
      request.onerror = () => reject(request.error);
    });
  }

  async function get(storeName, id) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null);
          return;
        }
        try {
          const decrypted = await PSCrypto.decrypt(request.result.data);
          resolve(JSON.parse(decrypted));
        } catch (e) {
          reject(e);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function getAll(storeName) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = async () => {
        try {
          const decrypted = await Promise.all(
            request.result.map(async (item) => {
              const data = await PSCrypto.decrypt(item.data);
              return JSON.parse(data);
            })
          );
          resolve(decrypted);
        } catch (e) {
          reject(e);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function getByIndex(storeName, indexName, value) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = async () => {
        try {
          const decrypted = await Promise.all(
            request.result.map(async (item) => {
              const data = await PSCrypto.decrypt(item.data);
              return JSON.parse(data);
            })
          );
          resolve(decrypted);
        } catch (e) {
          reject(e);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function remove(storeName, id) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function clearStore(storeName) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function count(storeName) {
    const db = await getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function exportAll() {
    const data = {};

    for (const storeName of Object.values(STORES)) {
      const db = await getDB();
      data[storeName] = await new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return data;
  }

  async function importAll(data) {
    const db = await getDB();

    for (const [storeName, items] of Object.entries(data)) {
      if (!STORES[storeName.toUpperCase()]) continue;

      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      for (const item of items) {
        store.put(item);
      }
    }

    return true;
  }

  function deleteDatabase() {
    return new Promise((resolve, reject) => {
      if (_db) {
        _db.close();
        _db = null;
      }

      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async function getSetting(key, defaultValue = null) {
    try {
      const result = await get(STORES.SETTINGS, key);
      return result ? result.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  async function setSetting(key, value) {
    return save(STORES.SETTINGS, { id: key, key, value });
  }

  return {
    STORES,
    init,
    save,
    get,
    getAll,
    getByIndex,
    remove,
    clearStore,
    count,
    exportAll,
    importAll,
    deleteDatabase,
    getSetting,
    setSetting
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSStorage;
}
