// Official React Native & Expo Persistent Storage Engine
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_SESSION: 'vivetalk_user_session',
  ACCESS_TOKEN: 'vivetalk_access_token',
  REFRESH_TOKEN: 'vivetalk_refresh_token',
  HOME_USERS: 'vivetalk_home_users',
  CHAT_LIST: 'vivetalk_chat_list',
  INTERACTED_USERS: 'vivetalk_interacted_users',
};

class StorageService {
  async setItem(key, value) {
    try {
      const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringVal);
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error saving ${key}:`, e.message);
    }
  }

  async getItem(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) {
        return val;
      }
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error reading ${key}:`, e.message);
    }
    return null;
  }

  async getObject(key) {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error removing ${key}:`, e.message);
    }
  }

  async clearSession() {
    await this.removeItem(STORAGE_KEYS.USER_SESSION);
    await this.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await this.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async saveSession(user, token, refreshToken = '') {
    if (user) await this.setItem(STORAGE_KEYS.USER_SESSION, user);
    if (token) await this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    if (refreshToken) await this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  async loadSession() {
    const user = await this.getObject(STORAGE_KEYS.USER_SESSION);
    const token = await this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    return { user, token, refreshToken };
  }

  // Local Chat History Storage (WhatsApp-style local device persistence)
  async saveLocalChatMessages(userEmail, partnerEmail, messages) {
    if (!userEmail || !partnerEmail || !Array.isArray(messages)) return;
    const key = `vivetalk_chat_${userEmail.toLowerCase()}_${partnerEmail.toLowerCase()}`;
    await this.setItem(key, messages);
  }

  async getLocalChatMessages(userEmail, partnerEmail) {
    if (!userEmail || !partnerEmail) return [];
    const key = `vivetalk_chat_${userEmail.toLowerCase()}_${partnerEmail.toLowerCase()}`;
    const msgs = await this.getObject(key);
    return Array.isArray(msgs) ? msgs : [];
  }

  // Local Chat List Cache
  async saveLocalChatList(userEmail, list) {
    if (!userEmail || !Array.isArray(list)) return;
    const key = `vivetalk_chatlist_${userEmail.toLowerCase()}`;
    await this.setItem(key, list);
  }

  async getLocalChatList(userEmail) {
    if (!userEmail) return [];
    const key = `vivetalk_chatlist_${userEmail.toLowerCase()}`;
    const list = await this.getObject(key);
    return Array.isArray(list) ? list : [];
  }

  // Local Home Users Cache
  async saveHomeUsers(userEmail, users) {
    if (!userEmail || !Array.isArray(users)) return;
    const key = `vivetalk_home_${userEmail.toLowerCase()}`;
    await this.setItem(key, users);
  }

  async getHomeUsers(userEmail) {
    if (!userEmail) return [];
    const key = `vivetalk_home_${userEmail.toLowerCase()}`;
    const users = await this.getObject(key);
    return Array.isArray(users) ? users : [];
  }

  // Interacted / Liked / Matched User IDs in Matches
  async saveInteractedUser(userEmail, partnerId, action = 'liked') {
    if (!userEmail || !partnerId) return;
    const key = `vivetalk_interacted_${userEmail.toLowerCase()}`;
    const existing = (await this.getObject(key)) || {};
    existing[partnerId.toLowerCase()] = { action, timestamp: Date.now() };
    await this.setItem(key, existing);
  }

  async getInteractedUsers(userEmail) {
    if (!userEmail) return {};
    const key = `vivetalk_interacted_${userEmail.toLowerCase()}`;
    const data = await this.getObject(key);
    return data && typeof data === 'object' ? data : {};
  }

  async clearInteractedUsers(userEmail) {
    if (!userEmail) return;
    const key = `vivetalk_interacted_${userEmail.toLowerCase()}`;
    await this.removeItem(key);
  }
}

export const storageService = new StorageService();
export { STORAGE_KEYS };
