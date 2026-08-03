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

const CHUNK_DURATION_MS = 650; // Optimized 650ms chunk interval for fast, stable mobile I/O
let isStreaming = false;
let playbackQueue = [];
let isPlaying = false;

// Web-specific refs
let webMediaStream = null;
let webMediaRecorder = null;

// Mobile-specific refs (double-buffer)
let activeRecording = null;
let pendingSendPromise = null;
let mobileLoopTimer = null;

let audioLevelListeners = new Set();
let callLogListeners = new Set();

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

// ============================================================
// WEB BROWSER MICROPHONE STREAMER (Continuous MediaRecorder)
// ============================================================

async function startWebAudioStream(userEmail, userName, partnerEmail) {
  try {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      console.log('Web mediaDevices not supported');
      isStreaming = false;
      return;
    }

    webMediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 22050,
      }
    });

    let mimeType = 'audio/webm';
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
    }

    // Use a SINGLE continuous MediaRecorder with timeslice for gapless chunks
    webMediaRecorder = new MediaRecorder(webMediaStream, { mimeType });

    webMediaRecorder.ondataavailable = (e) => {
      if (!isStreaming) return;
      if (e.data && e.data.size > 0) {
        // Fire-and-forget: convert and send without blocking next chunk
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result || '';
          const commaIdx = dataUrl.indexOf(',');
          const base64Data = commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : '';
          if (base64Data && base64Data.length > 30) {
            // Fire-and-forget send — don't await
            sendRawSignal(userEmail, userName, partnerEmail, `[AUDIO_CHUNK:${base64Data}]`).catch(() => {});
          }
        };
        reader.readAsDataURL(e.data);
      }
    };

    // Start recording with timeslice — produces continuous ondataavailable events
    // every CHUNK_DURATION_MS without gaps
    webMediaRecorder.start(CHUNK_DURATION_MS);
    console.log('[AudioStream Web] Continuous recording started with', CHUNK_DURATION_MS, 'ms timeslice');
  } catch (err) {
    console.log('Web microphone stream error:', err);
    isStreaming = false;
  }
}

// ============================================================
// NATIVE MOBILE MICROPHONE STREAMER (Double-Buffered expo-av)
// ============================================================

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
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    // Start the double-buffered recording loop
    recordMobileLoop(userEmail, userName, partnerEmail);
  } catch (err) {
    console.log('Mobile startAudioStream error:', err);
    isStreaming = false;
  }
}

/**
 * Double-buffered recording loop:
 * 1. Start recording chunk N
 * 2. After CHUNK_DURATION_MS, stop chunk N and IMMEDIATELY start chunk N+1
 * 3. Send chunk N data in the background (fire-and-forget)
 * 4. No gap between chunks because the next recording starts before the send completes
 */
async function recordMobileLoop(userEmail, userName, partnerEmail) {
  if (!isStreaming) return;

  try {
    // Create and start a new recording
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    activeRecording = recording;

    // Continuously sample microphone metering status every 100ms during recording
    const meterInterval = setInterval(async () => {
      if (activeRecording === recording) {
        try {
          const status = await recording.getStatusAsync();
          if (status && status.isRecording && typeof status.metering === 'number') {
            const db = status.metering;
            // Background noise is typically below -55dB. Speech is -50dB to 0dB.
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
        // Stop current recording
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        activeRecording = null;

        // IMMEDIATELY start next recording before processing the current one
        if (isStreaming) {
          recordMobileLoop(userEmail, userName, partnerEmail);
        }

        // Now process and send the completed chunk in background (fire-and-forget)
        if (uri) {
          const rawBase64 = await uriToBase64(uri);
          const cleanBase64 = rawBase64 ? rawBase64.replace(/[\r\n\s]/g, '') : '';
          if (cleanBase64 && cleanBase64.length > 30) {
            // Don't await — fire and forget
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
  console.log('[AudioStream] Stopped');

  // Clear mobile timer
  if (mobileLoopTimer) {
    clearTimeout(mobileLoopTimer);
    mobileLoopTimer = null;
  }

  // Stop web MediaRecorder (single continuous instance)
  if (webMediaRecorder && webMediaRecorder.state !== 'inactive') {
    try {
      webMediaRecorder.stop();
    } catch (e) {}
    webMediaRecorder = null;
  }

  // Release web media stream tracks
  if (webMediaStream) {
    try {
      webMediaStream.getTracks().forEach(track => track.stop());
    } catch (e) {}
    webMediaStream = null;
  }

  // Stop active mobile recording
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
// PLAYBACK ENGINE (Received Audio Chunks)
// ============================================================

/**
 * Queue and play received audio chunk
 */
export async function playAudioChunk(base64Data) {
  if (!base64Data) return;
  logCallEvent(`📥 Received audio chunk packet (${base64Data.length} base64 chars)`);
  playbackQueue.push(base64Data);
  processPlaybackQueue();
}

/**
 * Sequential playback processor — plays chunks back-to-back without overlap
 */
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
    } catch (err) {
      logCallEvent(`❌ Audio chunk playback exception: ${err.message}`);
    }
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
        // Safety timeout
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          resolve();
        }, 1000);
      });
      return; // Success — exit mime loop
    } catch (e) {
      // Try next MIME type
    }
  }
}

async function playMobileChunk(chunk) {
  if (!chunk || chunk.length < 30) return;

  // If queue has backed up, keep only the latest audio chunk to avoid native thread lag
  if (playbackQueue.length > 1) {
    playbackQueue = playbackQueue.slice(-1);
  }

  let tempFileUri = null;
  try {
    tempFileUri = `${FileSystem.cacheDirectory}audio_chunk_${Date.now()}.m4a`;
    logCallEvent(`💾 Writing temp audio file (${chunk.length} bytes) to disk...`);
    await FileSystem.writeAsStringAsync(tempFileUri, chunk, {
      encoding: 'base64',
    });

    logCallEvent('🔊 Configuring Audio Mode for Playback...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      overrideOutputAudioPortIOS: Audio.OVERRIDE_SPEAKER_SPEAKER,
    });

    logCallEvent('▶️ Loading Audio.Sound.createAsync...');
    const { sound } = await Audio.Sound.createAsync(
      { uri: tempFileUri },
      { shouldPlay: true, volume: 1.0 }
    );

    logCallEvent('✅ Audio sound playing! Waiting for finish...');
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
    logCallEvent('🎉 Audio chunk playback completed cleanly!');
  } catch (e) {
    logCallEvent(`❌ playMobileChunk Error: ${e.message || e}`);
  } finally {
    if (tempFileUri) {
      FileSystem.deleteAsync(tempFileUri, { idempotent: true }).catch(() => {});
    }
  }
}

export function isAudioStreaming() {
  return isStreaming;
}
