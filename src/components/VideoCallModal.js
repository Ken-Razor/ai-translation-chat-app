import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { startAudioStream, stopAudioStream, unlockAudioContext } from '../services/audioStreamService';
import { sendRawSignal } from '../services/translationService';
import { webrtcService } from '../services/webrtcService';
import { trtcService } from '../services/trtcService';

/**
 * Isolated Camera PIP component — memoized to prevent re-renders from timer state changes.
 * This is the key fix for the shutter sound and 1fps issue:
 * Without memo, every callDuration state update (every 1s) re-renders the entire modal,
 * which destroys and recreates the CameraView, causing the iOS shutter sound and frame drops.
 */
const CameraPIP = memo(function CameraPIP({ facing, permission }) {
  const cameraRef = useRef(null);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.pipFallback}>
        <FontAwesome name="user" size={24} color="#38BDF8" />
      </View>
    );
  }

  return (
    <CameraView
      ref={cameraRef}
      style={styles.pipCamera}
      facing={facing}
    />
  );
});

/**
 * Isolated call timer display — updates every second without triggering parent re-render
 */
function CallTimer({ visible }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!visible) {
      setDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const formatted = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <Text style={styles.callStatus}>TRTC HD Video • {formatted}</Text>
  );
}

export default function VideoCallModal({
  visible,
  onClose,
  partnerName,
  userEmail,
  userName,
  partnerEmail,
  remoteVideoFrameUri = null,
  isConnected: externalConnected,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [liveSubtitles, setLiveSubtitles] = useState('AI Live Subtitles Active • Speak naturally');

  // Sync external connection state if passed
  useEffect(() => {
    if (externalConnected) {
      setIsConnected(true);
    }
  }, [externalConnected]);

  // Audio & WebRTC lifecycle — no timer state here to avoid camera re-renders
  useEffect(() => {
    if (!visible) {
      setIsConnected(false);
      stopAudioStream();
      webrtcService.close();
      trtcService.exitRoom();
      return;
    }

    if (!permission || !permission.granted) {
      requestPermission();
    }

    // Unlock browser / native audio policy
    unlockAudioContext();

    // Configure audio mode for simultaneous recording & playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    }).catch(err => console.log('Audio mode error:', err));

    // Initialize Tencent TRTC Video Room (SDKAppID: 20045905)
    if (userEmail) {
      const roomNum = (userEmail + partnerEmail).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 1000);
      trtcService.enterRoom({
        roomId: roomNum,
        userId: userEmail,
        isVideo: true,
      }).catch(err => console.log('[VideoCall] TRTC room enter error:', err));
    }

    // Also attempt WebRTC P2P upgrade for video + instant audio
    webrtcService.startLocalMedia(true).then(() => {
      if (userEmail && partnerEmail) {
        webrtcService.initPeerConnection(userEmail, partnerEmail);
        if (webrtcService.pendingOffer) {
          webrtcService.processPendingOffer();
        } else if (!webrtcService.isCalleeMode) {
          webrtcService.createOffer(userEmail, partnerEmail);
        }
      }
    }).catch((err) => {
      console.log('[VideoCall] WebRTC not available, using HTTP streaming:', err.message);
    });

    return () => {
      stopAudioStream();
      webrtcService.close();
      trtcService.exitRoom();
    };
  }, [visible, userEmail, userName, partnerEmail]);

  // Handle permission changes separately to avoid re-triggering audio setup
  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Audio Stream lifecycle — ONLY start streaming when call is CONNECTED and NOT muted
  useEffect(() => {
    if (visible && isConnected && userEmail && partnerEmail && !isMuted) {
      startAudioStream(userEmail, userName || userEmail, partnerEmail);
    } else {
      stopAudioStream();
    }
  }, [visible, isConnected, isMuted, userEmail, userName, partnerEmail]);

  if (!visible) return null;

  const toggleCameraFacing = useCallback(() => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  const handleEndCall = useCallback(() => {
    webrtcService.close();
    stopAudioStream();
    onClose();
  }, [onClose]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const peerInitial = partnerName ? partnerName.charAt(0).toUpperCase() : 'P';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* MAIN VIEWPORT: REMOTE CALLER'S FACE */}
        {remoteVideoFrameUri ? (
          <Image
            source={{ uri: remoteVideoFrameUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.remotePlaceholder]}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{peerInitial}</Text>
            </View>
            <Text style={styles.remoteNameText}>{partnerName || 'Peer Contact'}</Text>
            <Text style={styles.connectingText}>
              {isConnected ? 'Connecting video stream...' : 'Calling...'}
            </Text>
          </View>
        )}

        {/* OVERLAY UI */}
        <View style={styles.overlayContainer}>
          {/* Top Bar with Peer Info */}
          <View style={styles.topBar}>
            <View style={styles.peerCard}>
              <Text style={styles.peerName}>{partnerName || 'Peer Contact'}</Text>
              <CallTimer visible={visible} />
            </View>
          </View>

          {/* PIP INSET WINDOW: LOCAL SELF CAMERA FEED — memoized to prevent re-renders */}
          <View style={styles.pipContainer}>
            <CameraPIP facing={facing} permission={permission} />
            <View style={styles.pipBadge}>
              <Text style={styles.pipBadgeText}>You</Text>
            </View>
          </View>

          {/* Subtitle Card for AI Live Speech Translation */}
          <View style={styles.subtitleCard}>
            <View style={styles.subHeader}>
              <FontAwesome name="cc" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.subTitleText}>LIVE AI TRANSLATION SUBTITLES</Text>
            </View>
            <Text style={styles.subBodyText}>{liveSubtitles}</Text>
          </View>

          {/* Controls Bar */}
          <View style={styles.controlsRow}>
            {/* Mute Button */}
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.activeControlBtn]}
              onPress={handleToggleMute}
            >
              <FontAwesome
                name={isMuted ? "microphone-slash" : "microphone"}
                size={20}
                color={isMuted ? "#EF4444" : "#FFFFFF"}
              />
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={handleEndCall}
            >
              <FontAwesome name="phone" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>

            {/* Flip Camera Button */}
            <TouchableOpacity style={styles.controlBtn} onPress={toggleCameraFacing}>
              <FontAwesome name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remotePlaceholder: {
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
  },
  avatarTextLarge: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  remoteNameText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  connectingText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  peerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  callStatus: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  pipContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    width: 110,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#38BDF8',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    backgroundColor: '#1E293B',
  },
  pipCamera: {
    width: '100%',
    height: '100%',
  },
  pipFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  pipBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pipBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  subtitleCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 20,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subTitleText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subBodyText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  controlBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  activeControlBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
