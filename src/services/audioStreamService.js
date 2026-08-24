/**
 * BridgeTalk AI - Cross-Platform Real-Time Audio Streaming Service
 * Double-buffered recording engine for gapless audio streaming.
 * Web: MediaRecorder API with continuous stream
 * Mobile: expo-av with overlapping record/send pipeline
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { sendRawSignal } from './translationService';

const CHUNK_DURATION_MS = 650;
let isStreaming = false;
let playbackQueue = [];
let isPlaying = false;
let isAudioModeConfigured = false;

// Web-specific refs
let webMediaStream = null;
let webMediaRecorder = null;

// Mobile-specific refs (double-buffer)
let activeRecording = null;
let pendingSendPromise = null;
let mobileLoopTimer = null;

let audioLevelListeners = new Set();
let callLogListeners = new Set();

export function unlockAudioContext() {
  try {
    if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    }
  } catch (e) {}
}

export function onAudioLevel(callback) {
  audioLevelListeners.add(callback);
  return () => audioLevelListeners.delete(callback);
}

function notifyAudioLevel(level) {
  audioLevelListeners.forEach(cb => {
    try { cb(level); } catch (e) {}
  });
}

export function onCallLog(callback) {
  callLogListeners.add(callback);
  return () => callLogListeners.delete(callback);
}

export function logCallEvent(msg) {
  const time = new Date().toLocaleTimeString();
  const formatted = `[${time}] ${msg}`;
  console.log(`[CallLog] ${msg}`);
  callLogListeners.forEach(cb => {
    try { cb(formatted); } catch (e) {}
  });
}

/**
 * Native recording options (iOS / Android) - optimized for voice calls with metering
 */
const RECORDING_OPTIONS = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio?.AndroidOutputFormat?.MPEG_4 || 2,
    audioEncoder: Audio?.AndroidAudioEncoder?.AAC || 3,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio?.IOSOutputFormat?.MPEG4AAC || 'mpeg',
    audioQuality: Audio?.IOSAudioQuality?.MEDIUM || 64,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 64000,
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

export async function unlockWebAudio() {
  if (Platform.OS !== 'web') return;
  try {
    const dummy = new window.Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
    await dummy.play().catch(() => {});
  } catch (e) {}
}

// ============================================================
// START AUDIO STREAMING
// ============================================================

export async function startAudioStream(userEmail, userName, partnerEmail) {
  if (isStreaming) return;
  isStreaming = true;
  playbackQueue = [];
  isPlaying = false;
  console.log('[AudioStream] Starting stream to', partnerEmail);

  if (Platform.OS === 'web') {
    startWebStream(userEmail, userName, partnerEmail);
  } else {
    startMobileStream(userEmail, userName, partnerEmail);
  }
}

async function startWebStream(userEmail, userName, partnerEmail) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    webMediaStream = stream;

    const mimeType = 'audio/webm;codecs=opus';
    const recorder = new MediaRecorder(stream, { mimeType });
    webMediaRecorder = recorder;

    recorder.ondataavailable = async (event) => {
      if (event.data && event.data.size > 0 && isStreaming) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result || '';
          const commaIdx = dataUrl.indexOf(',');
          const base64 = commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : '';
          if (base64 && base64.length > 30) {
            sendRawSignal(
              userEmail,
              userName,
              partnerEmail,
              `[AUDIO_CHUNK:${base64}]`
            ).catch(() => {});
          }
        };
        reader.readAsDataURL(event.data);
      }
    };

    recorder.start(CHUNK_DURATION_MS);
  } catch (err) {
    console.log('Web startAudioStream error:', err);
    isStreaming = false;
  }
}

async function startMobileStream(userEmail, userName, partnerEmail) {
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
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
    isAudioModeConfigured = true;

    // Start the double-buffered recording loop
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
    activeRecording = recording;

    const meterInterval = setInterval(async () => {
      if (activeRecording === recording) {
        try {
          const status = await recording.getStatusAsync();
          if (status && status.isRecording && typeof status.metering === 'number') {
            const db = status.metering;
            if (db > -55) {
              const normLevel = Math.min(1.0, Math.max(0.15, (db + 55) / 45));
              notifyAudioLevel(normLevel);
            } else {
              notifyAudioLevel(0);
            }
          }
        } catch (e) {}
      }
    }, 100);

    mobileLoopTimer = setTimeout(async () => {
      clearInterval(meterInterval);
      if (!isStreaming) return;

      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        activeRecording = null;

        if (isStreaming) {
          recordMobileLoop(userEmail, userName, partnerEmail);
        }

        if (uri) {
          const rawBase64 = await uriToBase64(uri);
          const cleanBase64 = rawBase64 ? rawBase64.replace(/[\r\n\s]/g, '') : '';
          if (cleanBase64 && cleanBase64.length > 30) {
            sendRawSignal(
              userEmail,
              userName,
              partnerEmail,
              `[AUDIO_CHUNK:${cleanBase64}]`
            ).catch(() => {});
          }
        }
      } catch (err) {
        console.log('Mobile chunk cycle error:', err);
        if (isStreaming) {
          setTimeout(() => recordMobileLoop(userEmail, userName, partnerEmail), 100);
        }
      }
    }, CHUNK_DURATION_MS);
  } catch (err) {
    console.log('Mobile recording init error:', err);
    if (isStreaming) {
      mobileLoopTimer = setTimeout(() => {
        recordMobileLoop(userEmail, userName, partnerEmail);
      }, 200);
    }
  }
}

// ============================================================
// STOP & CLEANUP
// ============================================================

export async function stopAudioStream() {
  isStreaming = false;
  isAudioModeConfigured = false;
  console.log('[AudioStream] Stopped');

  if (mobileLoopTimer) {
    clearTimeout(mobileLoopTimer);
    mobileLoopTimer = null;
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

  if (activeRecording) {
    try {
      await activeRecording.stopAndUnloadAsync();
    } catch (e) {}
    activeRecording = null;
  }

  playbackQueue = [];
  isPlaying = false;
}

// ============================================================
// PLAYBACK ENGINE
// ============================================================

export async function playAudioChunk(base64Data) {
  if (!base64Data) return;
  playbackQueue.push(base64Data);
  processPlaybackQueue();
}

async function processPlaybackQueue() {
  if (isPlaying || playbackQueue.length === 0) return;
  isPlaying = true;

  while (playbackQueue.length > 0) {
    const chunk = playbackQueue.shift();
    try {
      if (Platform.OS === 'web') {
        await playWebChunk(chunk);
      } else {
        await playMobileChunk(chunk);
      }
    } catch (err) {}
  }

  isPlaying = false;
}

async function playWebChunk(chunk) {
  const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/wav'];

  for (const mime of mimeTypes) {
    try {
      const blob = base64ToBlob(chunk, mime);
      if (!blob) continue;
      const blobUrl = URL.createObjectURL(blob);
      const audio = new window.Audio(blobUrl);

      await audio.play();

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
        }, 1000);
      });
      return;
    } catch (e) {}
  }
}

async function playMobileChunk(chunk) {
  if (!chunk || chunk.length < 30) return;

  if (playbackQueue.length > 1) {
    playbackQueue = playbackQueue.slice(-1);
  }

  let tempFileUri = null;
  try {
    tempFileUri = `${FileSystem.cacheDirectory}audio_chunk_${Date.now()}.m4a`;
    await FileSystem.writeAsStringAsync(tempFileUri, chunk, {
      encoding: 'base64',
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: tempFileUri },
      { shouldPlay: true, volume: 1.0 }
    );

    await new Promise((resolve) => {
      let timeout = setTimeout(resolve, 750);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    sound.unloadAsync().catch(() => {});
  } catch (e) {
  } finally {
    if (tempFileUri) {
      FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(() => {});
    }
  }
}

export function isAudioStreaming() {
  return isStreaming;
}
