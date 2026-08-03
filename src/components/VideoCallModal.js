import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { startAudioStream, stopAudioStream, unlockAudioContext } from '../services/audioStreamService';
import { sendRawSignal } from '../services/translationService';
import { webrtcService } from '../services/webrtcService';

export default function VideoCallModal({
  visible,
  onClose,
  partnerName,
  userEmail,
  userName,
  partnerEmail,
  remoteVideoFrameUri = null,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [liveSubtitles, setLiveSubtitles] = useState('AI Live Subtitles Active • Speak naturally');
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      setCallDuration(0);
      setIsConnected(false);
      stopAudioStream();
      webrtcService.close();
      return;
    }

    if (!permission || !permission.granted) {
      requestPermission();
    }

    // Unlock browser / native audio policy
    unlockAudioContext();

    // Configure audio mode for high volume playback & recording
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    }).catch(err => console.log('Audio mode error:', err));

    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Start HTTP audio chunk streaming (reliable, works everywhere)
    if (userEmail && partnerEmail) {
      startAudioStream(userEmail, userName || userEmail, partnerEmail);
      setIsConnected(true);
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
    }).catch(() => {});

    return () => {
      clearInterval(timer);
      stopAudioStream();
      webrtcService.close();
    };
  }, [visible, permission, userEmail, userName, partnerEmail]);

  useEffect(() => {
    if (isMuted) {
      stopAudioStream();
    } else if (visible && isConnected && userEmail && partnerEmail) {
      startAudioStream(userEmail, userName || userEmail, partnerEmail);
    }
  }, [isMuted]);

  if (!visible) return null;

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const formatCallTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

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
              <Text style={styles.callStatus}>HD Video Call • {formatCallTime(callDuration)}</Text>
            </View>
          </View>

          {/* PIP INSET WINDOW: LOCAL SELF CAMERA FEED */}
          <View style={styles.pipContainer}>
            {permission && permission.granted ? (
              <CameraView
                ref={cameraRef}
                style={styles.pipCamera}
                facing={facing}
              />
            ) : (
              <View style={styles.pipFallback}>
                <FontAwesome name="user" size={24} color="#38BDF8" />
              </View>
            )}
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
              onPress={() => setIsMuted(prev => !prev)}
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
              onPress={() => {
                webrtcService.close();
                stopAudioStream();
                onClose();
              }}
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
