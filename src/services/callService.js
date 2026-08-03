/**
 * BridgeTalk AI - Network Cross-Device Voice & Video Call Signaling Engine
 * Uses the HTTP server message hub to sync calls between devices.
 * Uses expo-av Audio for proper beep/ringtone sounds.
 */

import { Audio } from 'expo-av';
import { sendRawSignal } from './translationService';

// Sound assets
const BEEP_SOUND = require('../../assets/sounds/beep.wav');
const RINGTONE_SOUND = require('../../assets/sounds/ringtone.wav');

let soundObject = null;
let ringtoneTimer = null;

/**
 * Play a sound asset in a loop pattern
 */
async function playSoundLoop(soundAsset, intervalMs) {
  stopRingtoneLoop();

  try {
    // Set audio mode for playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    const { sound } = await Audio.Sound.createAsync(soundAsset);
    soundObject = sound;
    await sound.playAsync();

    // Loop the sound at intervals
    ringtoneTimer = setInterval(async () => {
      try {
        if (soundObject) {
          await soundObject.setPositionAsync(0);
          await soundObject.playAsync();
        }
      } catch (err) {
        // Sound may have been unloaded
      }
    }, intervalMs);
  } catch (err) {
    console.log('Sound play error:', err);
  }
}

/**
 * Start an outgoing Voice or Video call to recipient Email over the network
 */
export async function initiateCall(callerEmail, callerName, recipientEmail, callType = 'voice') {
  const callId = `call_${Date.now()}`;

  // Broadcast call signal message over network server to recipient device
  const signalText = `📞 [CALL_SIGNAL:${callType}:${callId}]`;
  await sendRawSignal(
    callerEmail,
    callerName || callerEmail,
    recipientEmail,
    signalText
  );

  // Play outgoing beep tone (beep every 3.5 seconds)
  playSoundLoop(BEEP_SOUND, 3500);

  return {
    callId,
    callerEmail: callerEmail.toLowerCase(),
    callerName: callerName || callerEmail,
    recipientEmail: recipientEmail.toLowerCase(),
    callType,
    status: 'ringing',
    timestamp: Date.now(),
  };
}

/**
 * Accept an incoming call and notify caller over the network
 */
export async function acceptCall(callId, userEmail, userName, partnerEmail) {
  stopRingtoneLoop();
  if (partnerEmail) {
    await sendRawSignal(
      userEmail,
      userName || userEmail,
      partnerEmail,
      `📞 [CALL_ACCEPT:${callId}]`
    );
  }
}

/**
 * Decline an incoming call and notify caller over network
 */
export async function declineCall(callId, userEmail, userName, partnerEmail) {
  stopRingtoneLoop();
  if (partnerEmail) {
    await sendRawSignal(
      userEmail,
      userName || userEmail,
      partnerEmail,
      `📞 [CALL_DECLINE:${callId}]`
    );
  }
}

/**
 * End an ongoing call and notify recipient over network
 */
export async function endCall(callId, userEmail, userName, partnerEmail) {
  stopRingtoneLoop();
  if (partnerEmail && callId) {
    await sendRawSignal(
      userEmail,
      userName || userEmail,
      partnerEmail,
      `📞 [CALL_END:${callId}]`
    );
  }
}

/**
 * Start ringtone loop (incoming = ringtone, outgoing = beep)
 */
export function startRingtoneLoop(mode = 'incoming') {
  if (mode === 'incoming') {
    // Play ringtone sound, repeat every 3.5 seconds
    playSoundLoop(RINGTONE_SOUND, 3500);
  } else {
    // Play beep sound, repeat every 3.5 seconds
    playSoundLoop(BEEP_SOUND, 3500);
  }
}

/**
 * Stop all ringtone/beep sounds
 */
export function stopRingtoneLoop() {
  if (ringtoneTimer) {
    clearInterval(ringtoneTimer);
    ringtoneTimer = null;
  }
  if (soundObject) {
    try {
      soundObject.stopAsync().then(() => soundObject.unloadAsync()).catch(() => {});
    } catch (err) {
      // Ignore
    }
    soundObject = null;
  }
}
