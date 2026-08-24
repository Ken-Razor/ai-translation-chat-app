import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { startAudioStream, stopAudioStream, unlockAudioContext, onAudioLevel, onCallLog } from '../services/audioStreamService';
import { webrtcService } from '../services/webrtcService';

/**
 * Isolated call timer — updates itself without re-rendering the parent
 */
const CallTimerDisplay = memo(function CallTimerDisplay({ visible }) {
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
    <Text style={styles.callStatus}>
      🟢 Live HD Audio • {formatted}
    </Text>
  );
});

/**
 * Real-Time Audio Level Driven Visualizer
 * Stays completely flat (height 3) when silent / user is not talking to mic.
 * Animates wave bars based on actual microphone input volume when user speaks!
 */
const WaveformVisualizer = memo(function WaveformVisualizer({ isActive, isMuted }) {
  const [bars, setBars] = useState(() => Array(20).fill(3));

  useEffect(() => {
    if (!isActive || isMuted) {
      setBars(Array(20).fill(3));
      return;
    }

    // Subscribe to live hardware mic volume level (0.0 to 1.0)
    const unsubscribe = onAudioLevel((level) => {
      if (level <= 0.02) {
        // Absolute silence / user not talking -> flat line
        setBars(Array(20).fill(3));
      } else {
        // User speaking into mic -> animate bars proportionally to voice loudness!
        setBars(Array(20).fill(0).map(() => {
          const barVol = level * (0.6 + Math.random() * 0.8);
          return Math.max(3, Math.min(32, Math.floor(4 + barVol * 28)));
        }));
      }
    });

    return () => unsubscribe();
  }, [isActive, isMuted]);

  return (
    <View style={styles.waveformRow}>
      {bars.map((height, i) => (
        <View
          key={i}
          style={[
            styles.waveBar,
            {
              height,
              backgroundColor: isMuted ? '#475569' : '#38BDF8',
            }
          ]}
        />
      ))}
    </View>
  );
});

export default function VoiceCallModal({ visible, onClose, partnerName, userEmail, userName, partnerEmail, isConnected: externalConnected }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false); // Default: earpiece like a real phone call
  const [isConnected, setIsConnected] = useState(false);
  const [callLogs, setCallLogs] = useState([]);

  // Subscribe to live call diagnostics logs
  useEffect(() => {
    if (!visible) {
      setCallLogs([]);
      return;
    }
    const unsub = onCallLog((logMsg) => {
      setCallLogs(prev => [logMsg, ...prev.slice(0, 30)]);
    });
    return unsub;
  }, [visible]);

  // Sync external connection state if passed
  useEffect(() => {
    if (externalConnected) {
      setIsConnected(true);
    }
  }, [externalConnected]);

  useEffect(() => {
    if (!visible) {
      setIsConnected(false);
      stopAudioStream();
      webrtcService.close();
      return;
    }

    // Unlock browser / native audio policy
    unlockAudioContext();

    // Configure audio mode - DEFAULT TO EARPIECE (not loudspeaker)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: true, // earpiece by default
    }).catch(err => console.log('Audio mode error:', err));

    // Pure WebRTC P2P Voice Engine with WebSocket Signaling
    webrtcService.startLocalMedia(false).then(() => {
      if (userEmail && partnerEmail) {
        webrtcService.initPeerConnection(userEmail, partnerEmail);
        if (webrtcService.pendingOffer) {
          webrtcService.processPendingOffer();
        } else if (!webrtcService.isCalleeMode) {
          webrtcService.createOffer(userEmail, partnerEmail);
        }
      }
    }).catch((err) => {
      console.log('[VoiceCall] WebRTC initializing fallback audio stream:', err.message);
    });

    return () => {
      stopAudioStream();
      webrtcService.close();
    };
  }, [visible, userEmail, userName, partnerEmail]);

  // Audio Stream lifecycle — ONLY start streaming when call is CONNECTED and NOT muted
  useEffect(() => {
    if (visible && isConnected && userEmail && partnerEmail && !isMuted) {
      startAudioStream(userEmail, userName || userEmail, partnerEmail);
    } else {
      stopAudioStream();
    }
  }, [visible, isConnected, isMuted, userEmail, userName, partnerEmail]);

  const handleEndCall = useCallback(() => {
    stopAudioStream();
    onClose();
  }, [onClose]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleToggleSpeaker = useCallback(async () => {
    const newSpeakerState = !isSpeaker;
    setIsSpeaker(newSpeakerState);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: !newSpeakerState,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !newSpeakerState,
        overrideOutputAudioPortIOS: newSpeakerState
          ? Audio.OVERRIDE_SPEAKER_SPEAKER
          : Audio.OVERRIDE_SPEAKER_NONE,
      });
      console.log(`[VoiceCall] Audio route: ${newSpeakerState ? 'LOUDSPEAKER' : 'EARPIECE'}`);
    } catch (err) {
      console.log('[VoiceCall] Audio route switch error:', err.message);
    }
  }, [isSpeaker]);

  if (!visible) return null;

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
          {visible && <CallTimerDisplay visible={visible} />}
          {isConnected && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Audio Connected</Text>
            </View>
          )}
        </View>

        {/* Audio Visualizer — isolated component, won't cause parent re-renders */}
        <View style={styles.visualizerCard}>
          <View style={styles.subHeader}>
            <FontAwesome name="microphone" size={14} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.subTitleText}>LIVE AUDIO STREAM</Text>
          </View>
          <WaveformVisualizer isActive={isConnected} isMuted={isMuted} />
          <Text style={styles.streamInfo}>
            {isMuted ? '🔇 Microphone Muted' : isConnected ? '🎙️ Speaking... Audio is being streamed' : '⏳ Setting up audio channel...'}
          </Text>
        </View>

        {/* Live Call Diagnostic Log Console */}
        <View style={styles.logCard}>
          <Text style={styles.logHeaderTitle}>📋 Live Call Execution Logs</Text>
          <ScrollView style={styles.logScrollView} nestedScrollEnabled={true}>
            {callLogs.length === 0 ? (
              <Text style={styles.emptyLogText}>Call logs will appear here during active stream...</Text>
            ) : (
              callLogs.map((logMsg, i) => (
                <Text key={i} style={styles.logText}>{logMsg}</Text>
              ))
            )}
          </ScrollView>
        </View>

        {/* Control Buttons Bar */}
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
            <Text style={styles.controlLabel}>{isMuted ? "Muted" : "Mute"}</Text>
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <FontAwesome name="phone" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          {/* Speaker Button */}
          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.activeControlBtn]}
            onPress={handleToggleSpeaker}
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
    paddingVertical: 35,
    paddingHorizontal: 16,
  },
  topBar: {
    alignItems: 'center',
  },
  encryptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  encryptedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  peerSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  peerName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  callStatus: {
    color: '#94A3B8',
    fontSize: 13,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  liveText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  visualizerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subTitleText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 3,
    marginVertical: 6,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  streamInfo: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  logCard: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    height: 140,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeaderTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  logScrollView: {
    flex: 1,
  },
  logText: {
    color: '#34D399',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    marginBottom: 3,
  },
  emptyLogText: {
    color: '#64748B',
    fontStyle: 'italic',
    fontSize: 11,
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
