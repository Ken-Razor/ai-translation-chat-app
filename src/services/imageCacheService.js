/**
 * ViveTalk Lightweight Image Cache Helper
 */

import { Platform } from 'react-native';

const memoryImageCache = new Map();

class ImageCacheService {
  getSyncLocalUri(remoteUrl) {
    if (!remoteUrl || typeof remoteUrl !== 'string') return null;
    return remoteUrl;
  }

  async getCachedImageUri(remoteUrl) {
    if (!remoteUrl || typeof remoteUrl !== 'string') return remoteUrl;
    return remoteUrl;
  }

  preloadUserAvatars(users = []) {
    // No-op safe stub: React Native Image preloads natively
  }

  async clearImageCache() {
    memoryImageCache.clear();
  }
}

export const imageCacheService = new ImageCacheService();
