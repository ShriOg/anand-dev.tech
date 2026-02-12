/**
 * ═══════════════════════════════════════════════════════════
 * PRIVATE SPACE - ENCRYPTION MODULE
 * Web Crypto API with AES-GCM encryption
 * Browser-only SHA-256 hashing
 * ═══════════════════════════════════════════════════════════
 */

const PSCrypto = (function() {
  'use strict';

  const ALGORITHM = 'AES-GCM';
  const KEY_LENGTH = 256;
  const IV_LENGTH = 12;
  const SALT_LENGTH = 16;
  const ITERATIONS = 100000;
  const HASH_STORAGE_KEY = 'ps_auth_hash';

  // Default hash (SHA-256 of 'Abhilasha') - browser-generated
  const DEFAULT_HASH = '2e2c2c5e6de58479ac00c9ce456c25745fb949153b87c55718a73294497f1489';

  let _derivedKey = null;
  let _salt = null;
  let _passwordHash = null;
  let _initialized = false;

  /**
   * Get stored password hash (or default)
   */
  function getStoredHash() {
    return localStorage.getItem(HASH_STORAGE_KEY) || DEFAULT_HASH;
  }

  /**
   * Store new password hash
   */
  function setStoredHash(hash) {
    localStorage.setItem(HASH_STORAGE_KEY, hash);
  }

  /**
   * Compute SHA-256 hash using Web Crypto API ONLY
   */
  async function computeHash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Verify password against stored hash
   */
  async function verifyMasterPassword(password) {
    const inputNormalized = password.trim();
    const inputHash = await computeHash(inputNormalized);
    const storedHash = getStoredHash();
    return inputHash === storedHash;
  }

  /**
   * Change password - hash new password and store
   */
  async function changePassword(currentPassword, newPassword) {
    const currentNormalized = currentPassword.trim();
    const currentHash = await computeHash(currentNormalized);
    const storedHash = getStoredHash();
    
    if (currentHash !== storedHash) {
      return { success: false, error: 'current' };
    }
    
    const newNormalized = newPassword.trim();
    if (newNormalized.length < 2) {
      return { success: false, error: 'length' };
    }
    
    const newHash = await computeHash(newNormalized);
    setStoredHash(newHash);
    
    // Clear session and force relock
    sessionStorage.clear();
    _derivedKey = null;
    _passwordHash = null;
    _salt = null;
    
    return { success: true };
  }

  /**
   * Generate random bytes
   */
  function getRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Derive encryption key from password hash using PBKDF2
   */
  async function deriveKey(passwordHash, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(passwordHash);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Initialize encryption with password
   */
  async function init(password) {
    // Verify master password via hash comparison
    const isValid = await verifyMasterPassword(password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Store password hash for key derivation
    _passwordHash = await computeHash(password);

    // Check for existing salt in localStorage
    const storedSalt = localStorage.getItem('ps_salt');
    
    if (storedSalt) {
      _salt = new Uint8Array(base64ToArrayBuffer(storedSalt));
    } else {
      _salt = getRandomBytes(SALT_LENGTH);
      localStorage.setItem('ps_salt', arrayBufferToBase64(_salt));
    }

    _derivedKey = await deriveKey(_passwordHash, _salt);
    return true;
  }

  /**
   * Verify password via hash comparison
   */
  async function verify(password) {
    return await verifyMasterPassword(password);
  }

  /**
   * Encrypt data
   */
  async function encrypt(data) {
    if (!_derivedKey) {
      throw new Error('Encryption not initialized');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
    const iv = getRandomBytes(IV_LENGTH);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv: iv },
      _derivedKey,
      dataBuffer
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return arrayBufferToBase64(combined.buffer);
  }

  /**
   * Decrypt data
   */
  async function decrypt(encryptedData) {
    if (!_derivedKey) {
      throw new Error('Encryption not initialized');
    }

    const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));
    const iv = combined.slice(0, IV_LENGTH);
    const data = combined.slice(IV_LENGTH);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv },
      _derivedKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Encrypt object (convenience method)
   */
  async function encryptObject(obj) {
    return encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypt to object (convenience method)
   */
  async function decryptObject(encryptedData) {
    const decrypted = await decrypt(encryptedData);
    return JSON.parse(decrypted);
  }

  /**
   * Clear encryption state (on logout/lock)
   */
  function clear() {
    _derivedKey = null;
    _passwordHash = null;
  }

  /**
   * Check if encryption is initialized
   */
  function isInitialized() {
    return _derivedKey !== null && _passwordHash !== null;
  }

  /**
   * Hash data (for non-reversible operations)
   */
  async function hash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return arrayBufferToBase64(hashBuffer);
  }

  /**
   * Generate a unique ID
   */
  function generateId() {
    return arrayBufferToBase64(getRandomBytes(16)).replace(/[+/=]/g, '').substring(0, 16);
  }

  return {
    init,
    verify,
    encrypt,
    decrypt,
    encryptObject,
    decryptObject,
    clear,
    isInitialized,
    hash,
    generateId,
    changePassword,
    computeHash
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PSCrypto;
}
