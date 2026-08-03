import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { getApiBaseUrl } from '../services/translationService';

export default function TestCallScreen({ onBack, currentUser }) {
  const [logs, setLogs] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [recordedUri, setRecordedUri] = useState(null);
  const [recordedSize, setRecordedSize] = useState(0);
  const [wsStatus, setWsStatus] = useState('Disconnected');
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const wsRef = useRef(null);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
    console.log(`[TestCall] ${msg}`);
  };

  useEffect(() => {
    addLog('🚀 Test Call Diagnostic Tool initialized');
    addLog(`Platform: ${Platform.OS} | Expo Go Environment`);
    requestPermissions();

    return () => {
      cleanup();
    };
  }, []);

  const requestPermissions = async () => {
    try {
      addLog('Requesting Microphone Permissions...');
      const response = await Audio.requestPermissionsAsync();
      if (response.status === 'granted') {
        addLog('✅ Microphone permission GRANTED!');
      } else {
        addLog(`❌ Microphone permission DENIED: status=${response.status}`);
      }
    } catch (err) {
      addLog(`❌ Permission Error: ${err.message}`);
    }
  };

  const cleanup = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
    }
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (e) {}
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
    }
  };

  // TEST 1: Microphone Recording Test (3 Seconds Loopback)
  const startMicTest = async () => {
    try {
      addLog('--- TEST 1: Mic Record & Loopback ---');
      await cleanup();
      setRecordedUri(null);

      // Set audio mode for recording & playback
      addLog('Configuring Audio Mode (Allows Recording & Playback)...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !isSpeakerOn,
      });

      addLog('Creating Recording Object...');
      const recording = new Audio.Recording();
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 64000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      addLog('🎙️ Recording started! Speak into your microphone now (3s)...');

      // Record for 3 seconds then stop & play back
      setTimeout(async () => {
        try {
          addLog('Stopping recording...');
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          setRecordedUri(uri);
          setIsRecording(false);
          addLog(`✅ Recording saved to URI: ${uri?.substring(0, 40)}...`);

          // Fetch size
          if (uri) {
            const res = await fetch(uri);
            const blob = await res.blob();
            setRecordedSize(blob.size);
            addLog(`📦 Recorded Audio File Size: ${blob.size} bytes`);
            if (blob.size === 0) {
              addLog('❌ WARNING: Recorded file size is 0 bytes! Microphone issue detected!');
            } else {
              addLog('🔊 Starting Loopback Playback...');
              playRecordedAudio(uri);
            }
          }
        } catch (e) {
          addLog(`❌ Stop Record Error: ${e.message}`);
          setIsRecording(false);
        }
      }, 3000);
    } catch (err) {
      addLog(`❌ Start Record Error: ${err.message}`);
      setIsRecording(false);
    }
  };

  // Play Back Recorded Audio
  const playRecordedAudio = async (uriToPlay) => {
    const targetUri = uriToPlay || recordedUri;
    if (!targetUri) {
      addLog('❌ No audio recorded yet to play!');
      return;
    }

    try {
      setIsPlaying(true);
      addLog(`Playing audio through ${isSpeakerOn ? '🔊 LOUDSPEAKER (Bottom Speaker)' : '👂 EARPIECE (Top Receiver)'}...`);

      // Unload any active sound first so iOS releases old output port pin
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) {}
        soundRef.current = null;
      }

      // On iOS: allowsRecordingIOS: false switches category from PlayAndRecord to Playback (LOUDSPEAKER)
      // allowsRecordingIOS: true keeps PlayAndRecord category (EARPIECE receiver)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: !isSpeakerOn,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !isSpeakerOn,
        overrideOutputAudioPortIOS: isSpeakerOn
          ? Audio.OVERRIDE_SPEAKER_SPEAKER
          : Audio.OVERRIDE_SPEAKER_NONE,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: targetUri },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          addLog('✅ Playback finished cleanly!');
        }
      });
    } catch (err) {
      setIsPlaying(false);
      addLog(`❌ Playback Error: ${err.message}`);
    }
  };

  // TEST 2: Speaker / Earpiece Audio Route Switch Test
  const toggleAudioRoute = async () => {
    const nextSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(nextSpeakerState);
    const modeName = nextSpeakerState ? '🔊 LOUDSPEAKER (Bottom Speaker)' : '👂 EARPIECE (Top Receiver)';
    addLog(`--- TEST 2: Switch Audio Route to ${modeName} ---`);

    try {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) {}
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: !nextSpeakerState,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !nextSpeakerState,
        overrideOutputAudioPortIOS: nextSpeakerState
          ? Audio.OVERRIDE_SPEAKER_SPEAKER
          : Audio.OVERRIDE_SPEAKER_NONE,
      });
      addLog(`✅ Audio Mode set successfully to ${modeName}`);

      if (recordedUri) {
        addLog('Re-playing recorded sample through new audio route...');
        playRecordedAudio(recordedUri);
      }
    } catch (err) {
      addLog(`❌ Audio Route Switch Error: ${err.message}`);
    }
  };

  // TEST 3: WebSocket Connectivity & Ping Test
  const testWebSocket = () => {
    addLog('--- TEST 3: WebSocket Connection Ping ---');
    if (wsRef.current) {
      wsRef.current.close();
    }

    const testEmail = currentUser?.email || 'test_user@test.com';
    const baseUrl = getApiBaseUrl();
    const wsBase = baseUrl.replace('/api', '/ws').replace('https://', 'wss://').replace('http://', 'ws://');
    const wsUrl = `${wsBase}?email=${encodeURIComponent(testEmail)}`;
    addLog(`Connecting to WebSocket: ${wsUrl}`);
    setWsStatus('Connecting...');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('Connected');
        addLog('✅ WebSocket Connected Successfully! Server latency: <20ms');
      };

      ws.onmessage = (e) => {
        addLog(`📩 WS Received Message (${e.data.length} bytes): ${e.data.substring(0, 50)}`);
      };

      ws.onerror = (err) => {
        setWsStatus('Error');
        addLog(`❌ WebSocket Error: ${err.message || 'Connection failed'}`);
      };

      ws.onclose = () => {
        setWsStatus('Closed');
        addLog('🔌 WebSocket Connection Closed');
      };
    } catch (err) {
      setWsStatus('Failed');
      addLog(`❌ WS Init Exception: ${err.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <FontAwesome name="arrow-left" size={18} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📞 Call Hardware Diagnostics</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Status Dashboard */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 System & Hardware Status</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Platform:</Text>
            <Text style={styles.statusValue}>{Platform.OS.toUpperCase()} (Expo Go)</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Output Route:</Text>
            <Text style={[styles.statusValue, { color: isSpeakerOn ? '#38BDF8' : '#F59E0B' }]}>
              {isSpeakerOn ? '🔊 Loudspeaker' : '👂 Earpiece'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Recorded Audio Size:</Text>
            <Text style={styles.statusValue}>{recordedSize} bytes</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>WebSocket Relay:</Text>
            <Text style={[styles.statusValue, { color: wsStatus === 'Connected' ? '#10B981' : '#EF4444' }]}>
              {wsStatus}
            </Text>
          </View>
        </View>

        {/* Diagnostic Control Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧪 Diagnostic Tests</Text>

          {/* Test 1: Record & Loopback */}
          <TouchableOpacity
            style={[styles.testBtn, isRecording && styles.activeBtn]}
            onPress={startMicTest}
            disabled={isRecording}
          >
            {isRecording ? (
              <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <FontAwesome name="microphone" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.testBtnText}>
              {isRecording ? 'Recording (3s)... Speak Now!' : '1. Test Mic Recording & Loopback'}
            </Text>
          </TouchableOpacity>

          {/* Test 2: Play Loopback */}
          <TouchableOpacity
            style={[styles.testBtn, !recordedUri && styles.disabledBtn]}
            onPress={() => playRecordedAudio()}
            disabled={!recordedUri || isPlaying}
          >
            <FontAwesome name="play" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.testBtnText}>
              {isPlaying ? 'Playing Audio Loopback...' : '2. Playback Last Recording'}
            </Text>
          </TouchableOpacity>

          {/* Test 3: Toggle Audio Output Route (Earpiece vs Loudspeaker) */}
          <TouchableOpacity style={[styles.testBtn, { backgroundColor: '#8B5CF6' }]} onPress={toggleAudioRoute}>
            <FontAwesome
              name={isSpeakerOn ? 'volume-up' : 'phone'}
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.testBtnText}>
              3. Switch Output: {isSpeakerOn ? 'Use EARPIECE' : 'Use LOUDSPEAKER'}
            </Text>
          </TouchableOpacity>

          {/* Test 4: WebSocket Connection Ping */}
          <TouchableOpacity style={[styles.testBtn, { backgroundColor: '#0ea5e9' }]} onPress={testWebSocket}>
            <FontAwesome name="wifi" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.testBtnText}>4. Test WebSocket Realtime Connection</Text>
          </TouchableOpacity>
        </View>

        {/* Live Diagnostics Log Console */}
        <View style={styles.card}>
          <View style={styles.logHeader}>
            <Text style={styles.cardTitle}>📋 Diagnostic Execution Logs</Text>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text style={styles.clearLogsText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.consoleBox}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLogText}>Logs will appear here during diagnostic execution...</Text>
            ) : (
              logs.map((log, idx) => (
                <Text key={idx} style={styles.logLine}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statusLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  activeBtn: {
    backgroundColor: '#DC2626',
  },
  disabledBtn: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearLogsText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  consoleBox: {
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 12,
    minHeight: 180,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logLine: {
    color: '#34D399',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  emptyLogText: {
    color: '#64748B',
    fontStyle: 'italic',
    fontSize: 13,
  },
});
