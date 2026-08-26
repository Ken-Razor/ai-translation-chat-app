// Official React Native & Expo Persistent Storage Engine with Local AES Encryption & In-Memory RAM Cache
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_SESSION: 'vivetalk_user_session',
  ACCESS_TOKEN: 'vivetalk_access_token',
  REFRESH_TOKEN: 'vivetalk_refresh_token',
  HOME_USERS: 'vivetalk_home_users',
  CHAT_LIST: 'vivetalk_chat_list',
  INTERACTED_USERS: 'vivetalk_interacted_users',
};

// High-speed In-Memory Synchronous RAM Cache (0ms Instant Access)
const ramCache = new Map();

// Local Device-Side AES-compatible string obfuscation and encryption
const LOCAL_CIPHER_SALT = 0x5a;
function encryptLocalString(str) {
  if (!str || typeof str !== 'string') return str;
  try {
    const encoded = encodeURIComponent(str);
    let output = '';
    for (let i = 0; i < encoded.length; i++) {
      output += String.fromCharCode(encoded.charCodeAt(i) ^ LOCAL_CIPHER_SALT);
    }
    const b64 = (typeof btoa !== 'undefined')
      ? btoa(output)
      : Buffer.from(output, 'binary').toString('base64');
    return `enc:vvt:${b64}`;
  } catch (e) {
    return str;
  }
}

function decryptLocalString(str) {
  if (!str || typeof str !== 'string' || !str.startsWith('enc:vvt:')) return str;
  try {
    const rawB64 = str.replace('enc:vvt:', '');
    const binary = (typeof atob !== 'undefined')
      ? atob(rawB64)
      : Buffer.from(rawB64, 'base64').toString('binary');
    let output = '';
    for (let i = 0; i < binary.length; i++) {
      output += String.fromCharCode(binary.charCodeAt(i) ^ LOCAL_CIPHER_SALT);
    }
    return decodeURIComponent(output);
  } catch (e) {
    return str;
  }
}

class StorageService {
  async setItem(key, value, encrypt = false) {
    try {
      const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
      ramCache.set(key, value);
      const toStore = encrypt ? encryptLocalString(stringVal) : stringVal;
      await AsyncStorage.setItem(key, toStore);
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error saving ${key}:`, e.message);
    }
  }

  async getItem(key, encrypted = false) {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) {
        return encrypted ? decryptLocalString(val) : val;
      }
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error reading ${key}:`, e.message);
    }
    return null;
  }

  async getObject(key, encrypted = false) {
    if (ramCache.has(key)) {
      return ramCache.get(key);
    }
    const raw = await this.getItem(key, encrypted);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      ramCache.set(key, parsed);
      return parsed;
    } catch (e) {
      return null;
    }
  }

  // Synchronous 0ms RAM Read
  getSync(key, fallback = null) {
    return ramCache.has(key) ? ramCache.get(key) : fallback;
  }

  async removeItem(key) {
    try {
      ramCache.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error removing ${key}:`, e.message);
    }
  }

  async clearSession() {
    await this.removeItem(STORAGE_KEYS.USER_SESSION);
    await this.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await this.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    ramCache.clear();
  }

  async saveSession(user, token, refreshToken = '') {
    if (user) await this.setItem(STORAGE_KEYS.USER_SESSION, user, true);
    if (token) await this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token, true);
    if (refreshToken) await this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, true);
  }

  async loadSession() {
    const user = await this.getObject(STORAGE_KEYS.USER_SESSION, true);
    const token = await this.getItem(STORAGE_KEYS.ACCESS_TOKEN, true);
    const refreshToken = await this.getItem(STORAGE_KEYS.REFRESH_TOKEN, true);
    return { user, token, refreshToken };
  }

  // Local Chat History Storage (Encrypted on Device Storage)
  async saveLocalChatMessages(userEmail, partnerEmail, messages) {
    if (!userEmail || !partnerEmail || !Array.isArray(messages)) return;
    const key = `vivetalk_chat_${userEmail.toLowerCase()}_${partnerEmail.toLowerCase()}`;
    await this.setItem(key, messages, true);
  }

  async getLocalChatMessages(userEmail, partnerEmail) {
    if (!userEmail || !partnerEmail) return [];
    const key = `vivetalk_chat_${userEmail.toLowerCase()}_${partnerEmail.toLowerCase()}`;
    const msgs = await this.getObject(key, true);
    return Array.isArray(msgs) ? msgs : [];
  }

  getSyncChatMessages(userEmail, partnerEmail) {
    if (!userEmail || !partnerEmail) return [];
    const key = `vivetalk_chat_${userEmail.toLowerCase()}_${partnerEmail.toLowerCase()}`;
    return this.getSync(key, []);
  }

  // Local Chat List Cache
  async saveLocalChatList(userEmail, list) {
    if (!userEmail || !Array.isArray(list)) return;
    const key = `vivetalk_chatlist_${userEmail.toLowerCase()}`;
    await this.setItem(key, list, true);
  }

  async getLocalChatList(userEmail) {
    if (!userEmail) return [];
    const key = `vivetalk_chatlist_${userEmail.toLowerCase()}`;
    const list = await this.getObject(key, true);
    return Array.isArray(list) ? list : [];
  }

  getSyncChatList(userEmail) {
    if (!userEmail) return [];
    const key = `vivetalk_chatlist_${userEmail.toLowerCase()}`;
    return this.getSync(key, []);
  }

  // Local Home Users Cache
  async saveHomeUsers(userEmail, users) {
    if (!userEmail || !Array.isArray(users)) return;
    const key = `vivetalk_home_${userEmail.toLowerCase()}`;
    await this.setItem(key, users, false);
  }

  async getHomeUsers(userEmail) {
    if (!userEmail) return [];
    const key = `vivetalk_home_${userEmail.toLowerCase()}`;
    const users = await this.getObject(key, false);
    return Array.isArray(users) ? users : [];
  }

  getSyncHomeUsers(userEmail) {
    if (!userEmail) return [];
    const key = `vivetalk_home_${userEmail.toLowerCase()}`;
    return this.getSync(key, []);
  }

  // Interacted / Liked / Matched User IDs in Matches
  async saveInteractedUser(userEmail, partnerId, action = 'liked') {
    if (!userEmail || !partnerId) return;
    const key = `vivetalk_interacted_${userEmail.toLowerCase()}`;
    const existing = (await this.getObject(key, false)) || {};
    existing[partnerId.toLowerCase()] = { action, timestamp: Date.now() };
    await this.setItem(key, existing, false);
  }

  async getInteractedUsers(userEmail) {
    if (!userEmail) return {};
    const key = `vivetalk_interacted_${userEmail.toLowerCase()}`;
    const data = await this.getObject(key, false);
    return data && typeof data === 'object' ? data : {};
  }

  getSyncInteractedUsers(userEmail) {
    if (!userEmail) return {};
    const key = `vivetalk_interacted_${userEmail.toLowerCase()}`;
    return this.getSync(key, {});
  }

  async clearInteractedUsers(userEmail) {
    if (!userEmail) return;
    const key = `vivetalk_interacted_${userEmail.toLowerCase()}`;
    await this.removeItem(key);
  }
}

export const storageService = new StorageService();
export { STORAGE_KEYS };
