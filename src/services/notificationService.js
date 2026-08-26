import { Platform, AppState } from 'react-native';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

// Configure foreground notification behavior for expo-notifications
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {}

let messageSoundObject = null;

/**
 * Initialize audio playback & request notification permissions
 */
export async function initNotificationService() {
  try {
    // 1. Preload audio sound for 0ms instant playback
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/beep.wav'),
        { shouldPlay: false, volume: 0.8 }
      );
      messageSoundObject = sound;
    } catch (e) {
      console.log('Sound preload warning:', e);
    }

    // 2. Request OS notification permissions
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }
      }
    } else {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    }
  } catch (err) {
    console.log('Notification init error:', err);
  }
}

/**
 * Play message audio chime
 */
export async function playMessageSound() {
  try {
    if (messageSoundObject) {
      await messageSoundObject.replayAsync();
    } else {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/beep.wav'),
        { shouldPlay: true, volume: 0.8 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    }
  } catch (err) {
    // Fallback: create fresh sound
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/beep.wav'),
        { shouldPlay: true, volume: 0.8 }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (e) {}
  }
}

/**
 * Trigger background / OS-level push notification when user is outside the app
 */
export async function triggerBackgroundNotification(title, body, data = {}) {
  try {
    const isAppActive = AppState.currentState === 'active';

    // 1. Mobile (Expo Go / Standalone)
    if (Platform.OS !== 'web') {
      if (!isAppActive) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title || 'ViveTalk',
            body: body || 'New message received',
            sound: true,
            data: data,
          },
          trigger: null, // Send immediately
        });
      }
    } else {
      // 2. Web browser background tab / minimized
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted' && (document.hidden || !isAppActive)) {
          new Notification(title || 'ViveTalk', {
            body: body || 'New message received',
            icon: 'https://vivetalk.sayflash.id/favicon.ico',
          });
        }
      }
    }
  } catch (err) {
    console.log('Background notification error:', err);
  }
}
