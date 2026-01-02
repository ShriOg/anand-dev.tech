/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - DATABASE (IndexedDB)
 * Persistent Storage for All Admin Data
 * ═══════════════════════════════════════════════════════════
 */

const DB_NAME = 'PrivateSpaceDB';
const DB_VERSION = 1;

const STORES = {
  PROJECTS: 'projects',
  NAVIGATION: 'navigation',
  PAGES: 'pages',
  SETTINGS: 'settings',
  HER_CHATS: 'her_mode_chats',
  PRO_CHATS: 'professional_mode_chats',
  HER_TRAINING: 'her_training_data',
  MEMORIES: 'memories'
};

let db = null;

/**
 * Initialize IndexedDB
 */
async function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Projects store
      if (!database.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = database.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('status', 'status', { unique: false });
        projectStore.createIndex('order', 'order', { unique: false });
        projectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      // Navigation store
      if (!database.objectStoreNames.contains(STORES.NAVIGATION)) {
        const navStore = database.createObjectStore(STORES.NAVIGATION, { keyPath: 'id' });
        navStore.createIndex('order', 'order', { unique: false });
        navStore.createIndex('visible', 'visible', { unique: false });
      }
      
      // Pages store
      if (!database.objectStoreNames.contains(STORES.PAGES)) {
        const pagesStore = database.createObjectStore(STORES.PAGES, { keyPath: 'id' });
        pagesStore.createIndex('route', 'route', { unique: true });
        pagesStore.createIndex('hidden', 'hidden', { unique: false });
      }
      
      // Settings store
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
      
      // Her mode chats
      if (!database.objectStoreNames.contains(STORES.HER_CHATS)) {
        const herStore = database.createObjectStore(STORES.HER_CHATS, { keyPath: 'id' });
        herStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Professional mode chats
      if (!database.objectStoreNames.contains(STORES.PRO_CHATS)) {
        const proStore = database.createObjectStore(STORES.PRO_CHATS, { keyPath: 'id' });
        proStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Her training data
      if (!database.objectStoreNames.contains(STORES.HER_TRAINING)) {
        const trainStore = database.createObjectStore(STORES.HER_TRAINING, { keyPath: 'id' });
        trainStore.createIndex('addedAt', 'addedAt', { unique: false });
      }
      
      // Memories
      if (!database.objectStoreNames.contains(STORES.MEMORIES)) {
        const memStore = database.createObjectStore(STORES.MEMORIES, { keyPath: 'id' });
        memStore.createIndex('category', 'category', { unique: false });
        memStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Generic CRUD Operations
 */
const Database = {
  async init() {
    if (!db) {
      await initDatabase();
    }
    return db;
  },
  
  async add(storeName, data) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add({
        ...data,
        id: data.id || crypto.randomUUID(),
        createdAt: data.createdAt || Date.now(),
        updatedAt: Date.now()
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async put(storeName, data) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put({
        ...data,
        updatedAt: Date.now()
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async get(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async getAll(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  async delete(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async clear(storeName) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async getByIndex(storeName, indexName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
};

// Export for modules - use PSDatabase for consistency
const PSDatabase = {
  ...Database,
  STORES
};

window.Database = Database;
window.PSDatabase = PSDatabase;
window.DB_STORES = STORES;
