/**
 * BridgeTalk AI - Cross-Platform Real-Time Audio Streaming Service
 * Dual Web (MediaRecorder) and Mobile (expo-av) audio streaming engine.
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { sendRawSignal } from './translationService';

const CHUNK_DURATION_MS = 400; // Low-latency 400ms audio chunks for faster voice delivery
let isStreaming = false;
let recordingRef = null;
let streamTimerRef = null;
let playbackQueue = [];
let isPlaying = false;
let webMediaStream = null;
let webMediaRecorder = null;

/**
 * Native recording options (iOS / Android)
 */
const RECORDING_OPTIONS = {
  isMeteringEnabled: false,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.LOW,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
  },
};

/**
 * Convert base64 to Blob for Web HTML5 Audio playback
 */
function base64ToBlob(base64, mimeType = 'audio/webm') {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (e) {
    return null;
  }
}

/**
 * Universal base64 converter for native URI
 */
async function uriToBase64(uri) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result || '';
        const commaIdx = dataUrl.indexOf(',');
        resolve(commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : '');
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.log('uriToBase64 error:', err);
    return null;
  }
}

/**
 * Unlock Web Browser Audio Autoplay Policy on user gesture
 */
export function unlockAudioContext() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__globalAudioCtx) {
          window.__globalAudioCtx = new AudioCtx();
        }
        if (window.__globalAudioCtx.state === 'suspended') {
          window.__globalAudioCtx.resume();
        }
      }
      const silentAudio = new window.Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      silentAudio.play().catch(() => {});
    } catch (e) {}
  }
}

/**
 * Start streaming audio from microphone to partner
 */
export async function startAudioStream(userEmail, userName, partnerEmail) {
  if (isStreaming) return;
  isStreaming = true;
  unlockAudioContext();

  console.log('[AudioStream] Started live audio stream on platform:', Platform.OS);

  if (Platform.OS === 'web') {
    startWebAudioStream(userEmail, userName, partnerEmail);
  } else {
    startMobileAudioStream(userEmail, userName, partnerEmail);
  }
}

/**
 * WEB BROWSER MICROPHONE STREAMER (MediaRecorder API)
 */
async function startWebAudioStream(userEmail, userName, partnerEmail) {
  try {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      console.log('Web mediaDevices not supported');
      isStreaming = false;
      return;
    }

    webMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sendWebChunk = () => {
      if (!isStreaming || !webMediaStream) return;

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      webMediaRecorder = new MediaRecorder(webMediaStream, { mimeType });
      const chunks = [];

      webMediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      webMediaRecorder.onstop = async () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result || '';
            const commaIdx = dataUrl.indexOf(',');
            const base64Data = commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : '';
            if (base64Data && base64Data.length > 30) {
              console.log(`[AudioStream Web] Sent 1s chunk (${base64Data.length} chars)`);
              sendRawSignal(userEmail, userName, partnerEmail, `[AUDIO_CHUNK:${base64Data}]`);
            }
          };
          reader.readAsDataURL(blob);
        }

        if (isStreaming) {
          setTimeout(sendWebChunk, 50);
        }
      };

      webMediaRecorder.start();
      setTimeout(() => {
        if (webMediaRecorder && webMediaRecorder.state === 'recording') {
          webMediaRecorder.stop();
        }
      }, CHUNK_DURATION_MS);
    };

    sendWebChunk();
  } catch (err) {
    console.log('Web microphone stream error:', err);
    isStreaming = false;
  }
}

/**
 * NATIVE MOBILE MICROPHONE STREAMER (expo-av)
 */
async function startMobileAudioStream(userEmail, userName, partnerEmail) {
  try {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      console.log('Mobile microphone permission not granted');
      isStreaming = false;
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    recordMobileLoop(userEmail, userName, partnerEmail);
  } catch (err) {
    console.log('Mobile startAudioStream error:', err);
    isStreaming = false;
  }
}

async function recordMobileLoop(userEmail, userName, partnerEmail) {
  if (!isStreaming) return;

  try {
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    recordingRef = recording;

    streamTimerRef = setTimeout(async () => {
      if (!isStreaming) return;

      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef = null;

        if (uri) {
          const base64Data = await uriToBase64(uri);
          if (base64Data && base64Data.length > 30) {
            console.log(`[AudioStream Mobile] Sent chunk (${base64Data.length} chars)`);
            await sendRawSignal(
              userEmail,
              userName,
              partnerEmail,
              `[AUDIO_CHUNK:${base64Data}]`
            );
          }
        }
      } catch (err) {
        console.log('Mobile chunk send error:', err);
      }

      if (isStreaming) {
        recordMobileLoop(userEmail, userName, partnerEmail);
      }
    }, CHUNK_DURATION_MS);
  } catch (err) {
    console.log('Mobile recording loop error:', err);
    if (isStreaming) {
      streamTimerRef = setTimeout(() => {
        recordMobileLoop(userEmail, userName, partnerEmail);
      }, 500);
    }
  }
}

/**
 * Stop audio streaming on Web and Mobile
 */
export async function stopAudioStream() {
  isStreaming = false;
  console.log('[AudioStream] Stopped');

  if (streamTimerRef) {
    clearTimeout(streamTimerRef);
    streamTimerRef = null;
  }

  if (webMediaRecorder && webMediaRecorder.state !== 'inactive') {
    try {
      webMediaRecorder.stop();
    } catch (e) {}
    webMediaRecorder = null;
  }

  if (webMediaStream) {
    try {
      webMediaStream.getTracks().forEach(track => track.stop());
    } catch (e) {}
    webMediaStream = null;
  }

  if (recordingRef) {
    try {
      await recordingRef.stopAndUnloadAsync();
    } catch (e) {}
    recordingRef = null;
  }

  playbackQueue = [];
  isPlaying = false;
}

/**
 * Queue and play received audio chunk
 */
export async function playAudioChunk(base64Data) {
  if (!base64Data) return;
  playbackQueue.push(base64Data);
  processPlaybackQueue();
}

/**
 * Sequential playback processor for Web and Mobile
 */
async function processPlaybackQueue() {
  if (isPlaying || playbackQueue.length === 0) return;
  isPlaying = true;

  while (playbackQueue.length > 0) {
    const chunk = playbackQueue.shift();
    try {
      if (Platform.OS === 'web') {
        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/wav'];
        let played = false;

        for (const mime of mimeTypes) {
          if (played) break;
          try {
            const blob = base64ToBlob(chunk, mime);
            if (!blob) continue;
            const blobUrl = URL.createObjectURL(blob);
            const audio = new window.Audio(blobUrl);

            await audio.play();
            played = true;

            await new Promise((resolve) => {
              audio.onended = () => {
                URL.revokeObjectURL(blobUrl);
                resolve();
              };
              audio.onerror = () => {
                URL.revokeObjectURL(blobUrl);
                resolve();
              };
              setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
                resolve();
              }, 1500);
            });
          } catch (e) {
            // Try next MIME
          }
        }
      } else {
        const dataUrl = `data:audio/mp4;base64,${chunk}`;
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: dataUrl },
            { shouldPlay: true, volume: 1.0 }
          );
          await sound.playAsync();

          await new Promise((resolve) => {
            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.didJustFinish) resolve();
            });
            setTimeout(resolve, 1500);
          });

          await sound.unloadAsync();
        } catch (e) {
          console.log('Native audio chunk playback error:', e);
        }
      }
    } catch (err) {
      console.log('Audio chunk playback error:', err);
    }
  }

  isPlaying = false;
}

export function isAudioStreaming() {
  return isStreaming;
}
