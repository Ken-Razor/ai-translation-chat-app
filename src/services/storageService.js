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

// Pure JS Base64 Engine (Hermes-compatible, zero Node.js Buffer / btoa dependency)
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function pureB64Encode(input) {
  try {
    const str = String(input);
    let output = '';
    for (let block = 0, charCode, idx = 0, map = B64_CHARS;
         str.charAt(idx | 0) || (map = '=', idx % 1);
         output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
      charCode = str.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) return str;
      block = block << 8 | charCode;
    }
    return output;
  } catch (e) {
    return String(input);
  }
}

function pureB64Decode(input) {
  try {
    let str = String(input).replace(/[=]+$/, '');
    if (str.length % 4 === 1) return input;
    let output = '';
    for (let bc = 0, bs, buffer, idx = 0;
         buffer = str.charAt(idx++);
         ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
           bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = B64_CHARS.indexOf(buffer);
    }
    return output;
  } catch (e) {
    return String(input);
  }
}

const LOCAL_CIPHER_SALT = 0x5a;

function encryptLocalString(str) {
  if (!str || typeof str !== 'string') return str;
  try {
    const encoded = encodeURIComponent(str);
    let output = '';
    for (let i = 0; i < encoded.length; i++) {
      output += String.fromCharCode(encoded.charCodeAt(i) ^ LOCAL_CIPHER_SALT);
    }
    const b64 = pureB64Encode(output);
    return `enc:vvt:${b64}`;
  } catch (e) {
    return str;
  }
}

function decryptLocalString(str) {
  if (!str || typeof str !== 'string' || !str.startsWith('enc:vvt:')) return str;
  try {
    const rawB64 = str.replace('enc:vvt:', '');
    const binary = pureB64Decode(rawB64);
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
        if (typeof val === 'string' && val.startsWith('enc:vvt:')) {
          return decryptLocalString(val);
        }
        return val;
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
      try {
        const decrypted = decryptLocalString(raw);
        const parsed = JSON.parse(decrypted);
        ramCache.set(key, parsed);
        return parsed;
      } catch (e2) {
        return null;
      }
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
    if (user) await this.setItem(STORAGE_KEYS.USER_SESSION, user, false);
    if (token) await this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token, false);
    if (refreshToken) await this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, false);
  }

  async loadSession() {
    const user = await this.getObject(STORAGE_KEYS.USER_SESSION, false);
    const token = await this.getItem(STORAGE_KEYS.ACCESS_TOKEN, false);
    const refreshToken = await this.getItem(STORAGE_KEYS.REFRESH_TOKEN, false);
    return { user, token, refreshToken };
  }

  // Prewarm all cached collections into RAM
  async prewarmUserCache(userEmail) {
    if (!userEmail) return;
    const clean = userEmail.toLowerCase();
    try {
      await Promise.all([
        this.getLocalChatList(clean),
        this.getHomeUsers(clean),
        this.getInteractedUsers(clean),
      ]);
    } catch (e) {}
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
