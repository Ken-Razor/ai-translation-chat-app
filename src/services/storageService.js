// Official React Native & Expo Persistent Storage Engine
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_SESSION: 'vivetalk_user_session',
  ACCESS_TOKEN: 'vivetalk_access_token',
  REFRESH_TOKEN: 'vivetalk_refresh_token',
};

class StorageService {
  async setItem(key, value) {
    try {
      const stringVal = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringVal);
      console.log(`💾 [StorageService] Saved ${key} to persistent AsyncStorage`);
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error saving ${key} to AsyncStorage:`, e.message);
    }
  }

  async getItem(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) {
        return val;
      }
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error reading ${key} from AsyncStorage:`, e.message);
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
      console.log(`🗑️ [StorageService] Removed ${key} from AsyncStorage`);
    } catch (e) {
      console.warn(`⚠️ [StorageService] Error removing ${key} from AsyncStorage:`, e.message);
    }
  }

  async clearSession() {
    await this.removeItem(STORAGE_KEYS.USER_SESSION);
    await this.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await this.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    console.log('🧹 [StorageService] Cleared session from AsyncStorage');
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
    console.log('📂 [StorageService] Loaded session from AsyncStorage:', user ? user.email : 'NONE');
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
}

export const storageService = new StorageService();
export { STORAGE_KEYS };
