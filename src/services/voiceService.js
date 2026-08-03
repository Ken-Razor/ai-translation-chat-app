import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let recordingInstance = null;

export const voiceService = {
  async startRecording() {
    try {
      if (recordingInstance) {
        try {
          await recordingInstance.stopAndUnloadAsync();
        } catch (e) {}
        recordingInstance = null;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        console.log('Microphone permission not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingInstance = recording;
      console.log('Recording started successfully!');
      return true;
    } catch (err) {
      console.log('Failed to start audio recording:', err);
      recordingInstance = null;
      return false;
    }
  },

  async cancelRecording() {
    try {
      if (recordingInstance) {
        await recordingInstance.stopAndUnloadAsync();
        recordingInstance = null;
        console.log('Accidental short recording canceled');
      }
    } catch (e) {
      recordingInstance = null;
    }
  },

  async stopRecording() {
    try {
      if (!recordingInstance) {
        console.log('No active recording instance found');
        return null;
      }

      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      recordingInstance = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      console.log('Recorded Audio URI successfully captured:', uri);
      return uri;
    } catch (err) {
      console.log('Failed to stop audio recording:', err);
      recordingInstance = null;
      return null;
    }
  },

  async playAudio(uri, onFinish) {
    try {
      if (!uri) {
        console.log('Cannot play audio: URI is empty');
        return null;
      }

      console.log('Attempting to play audio from URI:', uri);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
        const webAudio = new window.Audio(uri);
        webAudio.onended = () => {
          if (onFinish) onFinish();
        };
        await webAudio.play();
        return {
          stopAsync: async () => {
            webAudio.pause();
            webAudio.currentTime = 0;
          }
        };
      }

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri }, { shouldPlay: true });

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          if (onFinish) onFinish();
        }
      });

      await sound.playAsync();
      return sound;
    } catch (err) {
      console.log('Failed to play recorded audio:', err);
      return null;
    }
  }
};
