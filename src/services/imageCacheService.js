/**
 * ViveTalk Local Image Cache Service
 * Caches partner profile pictures, avatars, and shared media to local device storage
 * Prevents redundant HTTP network hits when browsing chats, matches, and profiles.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// In-Memory synchronous cache mapping remote URL -> local file URI
const memoryImageCache = new Map();

// Helper: Simple deterministic hash string for filenames
function hashUrl(url) {
  if (!url || typeof url !== 'string') return 'img_default';
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `cached_${Math.abs(hash)}`;
}

class ImageCacheService {
  constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory || FileSystem.documentDirectory || ''}vivetalk_img_cache/`;
    this.initDir();
  }

  async initDir() {
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;
    try {
      const info = await FileSystem.getInfoAsync(this.cacheDir);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
    } catch (e) {
      console.warn('⚠️ [ImageCacheService] Init directory warning:', e.message);
    }
  }

  /**
   * Synchronous quick check from RAM
   */
  getSyncLocalUri(remoteUrl) {
    if (!remoteUrl || typeof remoteUrl !== 'string') return null;
    if (Platform.OS === 'web' || remoteUrl.startsWith('data:') || remoteUrl.startsWith('file://')) {
      return remoteUrl;
    }
    return memoryImageCache.get(remoteUrl) || null;
  }

  /**
   * Get cached local image URI or download in background
   * Returns local file:// URI on Mobile, or remote URL on Web.
   */
  async getCachedImageUri(remoteUrl) {
    if (!remoteUrl || typeof remoteUrl !== 'string') return remoteUrl;
    if (Platform.OS === 'web' || remoteUrl.startsWith('data:') || remoteUrl.startsWith('file://')) {
      return remoteUrl;
    }

    if (memoryImageCache.has(remoteUrl)) {
      return memoryImageCache.get(remoteUrl);
    }

    try {
      const extMatch = remoteUrl.match(/\.(jpg|jpeg|png|webp|gif)/i);
      const ext = extMatch ? extMatch[0] : '.jpg';
      const filename = `${hashUrl(remoteUrl)}${ext}`;
      const localFilePath = `${this.cacheDir}${filename}`;

      const fileInfo = await FileSystem.getInfoAsync(localFilePath);
      if (fileInfo.exists && fileInfo.size > 0) {
        memoryImageCache.set(remoteUrl, localFilePath);
        return localFilePath;
      }

      // Download file to local storage in background
      const downloadRes = await FileSystem.downloadAsync(remoteUrl, localFilePath);
      if (downloadRes && downloadRes.status === 200) {
        memoryImageCache.set(remoteUrl, downloadRes.uri);
        return downloadRes.uri;
      }
    } catch (e) {
      // Fallback silently to remote URL if file system has permission/network issue
    }

    return remoteUrl;
  }

  /**
   * Background preloader for partner user list (Home, Matches, Chat list)
   * Pre-downloads all partner avatars so opening profiles is 0ms with 0 network calls!
   */
  preloadUserAvatars(users = []) {
    if (Platform.OS === 'web' || !Array.isArray(users)) return;
    users.forEach(u => {
      const avatarUrl = u.avatar || u.photo || u.photoURL;
      if (avatarUrl && avatarUrl.startsWith('http')) {
        this.getCachedImageUri(avatarUrl).catch(() => {});
      }
    });
  }

  /**
   * Clear cache if disk space needs to be freed
   */
  async clearImageCache() {
    memoryImageCache.clear();
    if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
      try {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
        await this.initDir();
      } catch (e) {}
    }
  }
}

export const imageCacheService = new ImageCacheService();
