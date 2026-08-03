import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { startAudioStream, stopAudioStream, unlockAudioContext } from '../services/audioStreamService';
import { webrtcService } from '../services/webrtcService';

export default function VoiceCallModal({ visible, onClose, partnerName, userEmail, userName, partnerEmail }) {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCallDuration(0);
      setIsConnected(false);
      stopAudioStream();
      webrtcService.close();
      return;
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

    // Live call timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Start HTTP audio chunk streaming (reliable, works everywhere)
    if (userEmail && partnerEmail) {
      startAudioStream(userEmail, userName || userEmail, partnerEmail);
      setIsConnected(true);
    }

    // Also attempt WebRTC P2P upgrade (instant latency if connection establishes)
    webrtcService.startLocalMedia(false).then(() => {
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
  }, [visible, userEmail, userName, partnerEmail]);

  // Handle mute toggle
  useEffect(() => {
    if (isMuted) {
      stopAudioStream();
    } else if (visible && isConnected && userEmail && partnerEmail) {
      startAudioStream(userEmail, userName || userEmail, partnerEmail);
    }
  }, [isMuted]);

  if (!visible) return null;

  const formatCallTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleEndCall = () => {
    stopAudioStream();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.encryptedBadge}>
            <FontAwesome name="lock" size={12} color="#10B981" style={{ marginRight: 4 }} />
            <Text style={styles.encryptedText}>End-to-End AI Translated Call</Text>
          </View>
        </View>

        {/* Peer Info */}
        <View style={styles.peerSection}>
          <View style={styles.avatarCircle}>
            <FontAwesome name="user" size={48} color="#38BDF8" />
          </View>
          <Text style={styles.peerName}>{partnerName || 'Peer Contact'}</Text>
          <Text style={styles.callStatus}>
            {isConnected ? '🔴 Live' : '⏳ Connecting...'} • {formatCallTime(callDuration)}
          </Text>
          {isConnected && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Audio Connected</Text>
            </View>
          )}
        </View>

        {/* Audio Visualizer Placeholder */}
        <View style={styles.visualizerCard}>
          <View style={styles.subHeader}>
            <FontAwesome name="microphone" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.subTitleText}>LIVE AUDIO STREAM</Text>
          </View>
          <View style={styles.waveformRow}>
            {[...Array(20)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: isConnected && !isMuted
                      ? 8 + Math.random() * 24
                      : 4,
                    backgroundColor: isMuted ? '#475569' : '#38BDF8',
                  }
                ]}
              />
            ))}
          </View>
          <Text style={styles.streamInfo}>
            {isMuted ? '🔇 Microphone Muted' : isConnected ? '🎙️ Speaking... Audio is being streamed' : '⏳ Setting up audio channel...'}
          </Text>
        </View>

        {/* Control Buttons Bar */}
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
            <Text style={styles.controlLabel}>{isMuted ? "Muted" : "Mute"}</Text>
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <FontAwesome name="phone" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          {/* Speaker Button */}
          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.activeControlBtn]}
            onPress={() => setIsSpeaker(prev => !prev)}
          >
            <FontAwesome
              name="volume-up"
              size={20}
              color={isSpeaker ? "#38BDF8" : "#FFFFFF"}
            />
            <Text style={styles.controlLabel}>{isSpeaker ? "Speaker On" : "Speaker"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  topBar: {
    alignItems: 'center',
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  encryptedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  peerSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  peerName: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  callStatus: {
    color: '#94A3B8',
    fontSize: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  visualizerCard: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#233048',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subTitleText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    marginBottom: 8,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
  streamInfo: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
  },
  activeControlBtn: {
    backgroundColor: '#334155',
  },
  controlLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
