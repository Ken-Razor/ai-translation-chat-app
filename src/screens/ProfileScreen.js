import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  TextInput,
  Keyboard,
  Platform,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { voiceService } from '../services/voiceService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// ─── Theme System ───
// ═══════════════════════════════════════════════════════════════
const lightTheme = {
  bg: '#f8f9fa',
  card: '#ffffff',
  cardBorder: '#e1e3e4',
  text: '#191c1d',
  textSecondary: '#4f434c',
  textMuted: '#80737d',
  accent: '#4B1A56',
  accentLight: '#ffd7f3',
  accentSoft: '#f9f5fb',
  accentBorder: '#ecdff0',
  inputBg: '#f3f4f5',
  inputBorder: '#e1e3e4',
  divider: '#e1e3e4',
  danger: '#BA1A1A',
  dangerBg: '#ffdad6',
  headerBorder: '#e1e3e4',
  orb1: 'rgba(253, 168, 237, 0.25)',
  orb2: 'rgba(255, 215, 243, 0.35)',
  switchTrack: '#e1e3e4',
  modalBg: 'rgba(0, 0, 0, 0.65)',
  pillBg: '#f3f4f5',
  avatarBorder: '#ffd7f3',
};

const darkTheme = {
  bg: '#111111',
  card: '#1d1d1d',
  cardBorder: '#2e2e2e',
  text: '#f0f0f0',
  textSecondary: '#a8a8a8',
  textMuted: '#5e5e5e',
  accent: '#c084fc',
  accentLight: '#23103a',
  accentSoft: '#1a0d28',
  accentBorder: '#3a1f5e',
  inputBg: '#232323',
  inputBorder: '#333333',
  divider: '#2a2a2a',
  danger: '#ff6b6b',
  dangerBg: '#3a1111',
  headerBorder: '#2a2a2a',
  orb1: 'rgba(192, 132, 252, 0.06)',
  orb2: 'rgba(160, 100, 220, 0.06)',
  switchTrack: '#3a3a3a',
  modalBg: 'rgba(0, 0, 0, 0.82)',
  pillBg: '#1d1d1d',
  avatarBorder: '#3a1f5e',
};

const AVAILABLE_INTERESTS = [
  '☕ Coffee Shops', '💻 Tech & Coding', '🎌 Anime & Manga',
  '✈️ Travel & Culture', '🎨 Art & Design', '🎮 Gaming',
  '🎵 Music', '🍕 Food & Cooking', '📚 Books', '🏃 Fitness'
];

const LANGUAGES = [
  '🇺🇸 English', '🇪🇸 Spanish', '🇫🇷 French', '🇩🇪 German',
  '🇯🇵 Japanese', '🇨🇳 Chinese', '🇰🇷 Korean', '🇮🇩 Indonesian',
  '🇮🇹 Italian', '🇵🇹 Portuguese', '🇷🇺 Russian', '🇸🇦 Arabic'
];

const getLanguageWithFlag = (lang) => {
  if (!lang) return '🇺🇸 English';
  const lower = String(lang).toLowerCase();
  const langMap = {
    'japanese': '🇯🇵 Japanese', 'chinese': '🇨🇳 Chinese', 'spanish': '🇪🇸 Spanish',
    'indonesian': '🇮🇩 Indonesian', 'korean': '🇰🇷 Korean', 'french': '🇫🇷 French',
    'german': '🇩🇪 German', 'italian': '🇮🇹 Italian', 'portuguese': '🇵🇹 Portuguese',
    'russian': '🇷🇺 Russian', 'arabic': '🇸🇦 Arabic', 'english': '🇺🇸 English',
  };
  if (LANGUAGES.some(l => l.toLowerCase() === lower)) return lang;
  for (const [name, flagged] of Object.entries(langMap)) {
    if (lower.includes(name)) return flagged;
  }
  const codeMap = { 'ja': '🇯🇵 Japanese', 'zh': '🇨🇳 Chinese', 'es': '🇪🇸 Spanish', 'id': '🇮🇩 Indonesian', 'ko': '🇰🇷 Korean', 'fr': '🇫🇷 French', 'de': '🇩🇪 German', 'it': '🇮🇹 Italian', 'pt': '🇵🇹 Portuguese', 'ru': '🇷🇺 Russian', 'ar': '🇸🇦 Arabic', 'en': '🇺🇸 English' };
  if (codeMap[lower]) return codeMap[lower];
  return lang;
};

// ═══════════════════════════════════════════════════════════════
// ─── Sub-Page: Edit Single Field (Name / Username) ───
// ═══════════════════════════════════════════════════════════════
function EditFieldPage({ title, value, onSave, onBack, placeholder, locked, lockMessage, helperText, autoCapitalize, theme }) {
  const t = theme;
  const insets = useSafeAreaInsets();
  const [fieldValue, setFieldValue] = useState(value || '');
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateOut = (cb) => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  const handleSave = () => {
    if (!fieldValue.trim()) {
      Alert.alert('Required', `${title} cannot be empty.`);
      return;
    }
    animateOut(() => onSave(fieldValue.trim()));
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <Animated.View style={[styles.subPageLevel2, { backgroundColor: t.bg, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.subPageHeader, { borderBottomColor: t.headerBorder, paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => animateOut(onBack)} style={{ padding: 8, marginLeft: -8 }}>
          <FontAwesome name="arrow-left" size={20} color={t.accent} />
        </TouchableOpacity>
        <Text style={[styles.subPageTitle, { color: t.accent }]}>{title}</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={[styles.subPageBody, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>{title.toUpperCase()}</Text>
        <TextInput
          style={[styles.sheetInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }, locked && { backgroundColor: t.divider, color: t.textMuted }]}
          value={fieldValue}
          onChangeText={setFieldValue}
          placeholder={placeholder || title}
          placeholderTextColor={t.textMuted}
          editable={!locked}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoFocus={!locked}
        />
        {lockMessage ? (
          <Text style={[styles.inputHelper, { color: t.danger }]}>{lockMessage}</Text>
        ) : helperText ? (
          <Text style={[styles.inputHelper, { color: t.textMuted }]}>{helperText}</Text>
        ) : null}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.accent }]} onPress={handleSave} disabled={locked}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Sub-Page: Real Microphone Voice Intro Editor ───
// ═══════════════════════════════════════════════════════════════
function VoiceIntroPage({ voiceAudioUri, voiceText, voiceDuration, onSave, onBack, theme }) {
  const t = theme;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(voiceText || 'Hello! Let us practice languages together!');
  const [currentAudioUri, setCurrentAudioUri] = useState(voiceAudioUri || null);
  const [duration, setDuration] = useState(voiceDuration || '0:05');
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const recordTimerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
    return () => {
      voiceService.stopPlayback();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const animateOut = (cb) => {
    voiceService.stopPlayback();
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  const handleStartRecord = async () => {
    voiceService.stopPlayback();
    setIsPlaying(false);

    const started = await voiceService.startRecording();
    if (!started) {
      Alert.alert('Permission Required', 'Please enable microphone permission in Settings to record your voice.');
      return;
    }

    setIsRecording(true);
    setRecordSeconds(0);

    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds(prev => {
        if (prev >= 15) {
          handleStopRecord();
          return 15;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecord = async () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);

    const uri = await voiceService.stopRecording();
    if (uri) {
      setCurrentAudioUri(uri);
      const durStr = `0:${recordSeconds.toString().padStart(2, '0')}`;
      setDuration(durStr);
    } else {
      Alert.alert('Error', 'Unable to capture voice audio.');
    }
  };

  const handlePlayVoice = async () => {
    if (!currentAudioUri) {
      Alert.alert('No Voice Recording', 'Please record your voice note first using the microphone button.');
      return;
    }

    if (isPlaying) {
      await voiceService.stopPlayback();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    await voiceService.playAudio(currentAudioUri, () => {
      setIsPlaying(false);
    });
  };

  const handleResetAudio = () => {
    voiceService.stopPlayback();
    setIsPlaying(false);
    setCurrentAudioUri(null);
    setRecordSeconds(0);
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <Animated.View style={[styles.subPage, { backgroundColor: t.bg, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.subPageHeader, { borderBottomColor: t.headerBorder, paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => animateOut(onBack)} style={{ padding: 8, marginLeft: -8 }}>
          <FontAwesome name="arrow-left" size={20} color={t.accent} />
        </TouchableOpacity>
        <Text style={[styles.subPageTitle, { color: t.accent }]}>Record Voice Intro</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.subPageBody, { paddingBottom: Math.max(insets.bottom, 20) + 30 }]}>
        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>RECORD YOUR OWN REAL VOICE NOTE</Text>
        
        {/* Real Microphone Studio Box */}
        <View style={[styles.voiceStudioBox, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }]}>
          <View style={styles.micButtonContainer}>
            <Animated.View
              style={[
                styles.micPulseRing,
                isRecording && { transform: [{ scale: pulseAnim }], borderColor: '#EF4444' }
              ]}
            />
            <TouchableOpacity
              style={[
                styles.studioMicBtn,
                { backgroundColor: t.accent },
                isRecording && { backgroundColor: '#EF4444' },
                currentAudioUri && !isRecording && { backgroundColor: '#059669' }
              ]}
              onPress={isRecording ? handleStopRecord : handleStartRecord}
              activeOpacity={0.85}
            >
              <FontAwesome
                name={isRecording ? 'stop' : currentAudioUri ? 'microphone' : 'microphone'}
                size={26}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.studioStatusText, { color: isRecording ? '#EF4444' : t.accent }]}>
            {isRecording
              ? `Recording your voice... 0:${recordSeconds.toString().padStart(2, '0')} / 0:15`
              : currentAudioUri
              ? `Voice Greeting Ready (${duration})`
              : 'Tap mic to record 3–15 seconds of your real voice'}
          </Text>

          {/* Action Buttons if recorded */}
          {currentAudioUri && !isRecording && (
            <View style={styles.studioActionRow}>
              <TouchableOpacity
                style={[styles.studioPlayBtn, { backgroundColor: t.accent }, isPlaying && { backgroundColor: '#7C3AED' }]}
                onPress={handlePlayVoice}
                activeOpacity={0.8}
              >
                <FontAwesome name={isPlaying ? 'pause' : 'play'} size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.studioPlayText}>{isPlaying ? 'Pause Voice' : 'Play My Voice'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.studioResetBtn, { backgroundColor: t.dangerBg }]}
                onPress={handleResetAudio}
                activeOpacity={0.8}
              >
                <FontAwesome name="repeat" size={13} color={t.danger} style={{ marginRight: 6 }} />
                <Text style={[styles.studioResetText, { color: t.danger }]}>Re-record</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.inputLabel, { color: t.textSecondary, marginTop: 18 }]}>GREETING TRANSCRIPTION / NOTE</Text>
        <TextInput
          style={[styles.sheetInput, { height: 100, textAlignVertical: 'top', backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Type what you said in your voice recording..."
          placeholderTextColor={t.textMuted}
          multiline
          maxLength={200}
        />
        <Text style={[styles.inputHelper, { color: t.textMuted }]}>{text.length}/200 characters</Text>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: t.accent, marginTop: 18 }]}
          onPress={() => animateOut(() => onSave(currentAudioUri, text.trim(), duration))}
        >
          <Text style={styles.saveBtnText}>Save Voice Greeting</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Sub-Page: Interests & Topics Editor ───
// ═══════════════════════════════════════════════════════════════
function InterestsPage({ interests, onSave, onBack, theme }) {
  const t = theme;
  const insets = useSafeAreaInsets();
  const [selectedList, setSelectedList] = useState(interests || ['☕ Coffee Shops', '💻 Tech & Coding', '✈️ Travel & Culture']);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateOut = (cb) => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  const toggleInterest = (item) => {
    if (selectedList.includes(item)) {
      if (selectedList.length > 1) {
        setSelectedList(selectedList.filter(i => i !== item));
      }
    } else {
      setSelectedList([...selectedList, item]);
    }
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <Animated.View style={[styles.subPage, { backgroundColor: t.bg, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.subPageHeader, { borderBottomColor: t.headerBorder, paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => animateOut(onBack)} style={{ padding: 8, marginLeft: -8 }}>
          <FontAwesome name="arrow-left" size={20} color={t.accent} />
        </TouchableOpacity>
        <Text style={[styles.subPageTitle, { color: t.accent }]}>Conversation Interests</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={[styles.subPageBody, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>SELECT YOUR FAVORITE TOPICS</Text>
        <View style={styles.interestsGrid}>
          {AVAILABLE_INTERESTS.map(item => {
            const isSelected = selectedList.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.interestChip,
                  { backgroundColor: t.inputBg },
                  isSelected && { backgroundColor: t.accentLight, borderColor: t.accent, borderWidth: 1.5 }
                ]}
                onPress={() => toggleInterest(item)}
                activeOpacity={0.8}
              >
                <Text style={[{ fontSize: 12.5, color: t.text, fontWeight: '600' }, isSelected && { color: t.accent, fontWeight: '700' }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: t.accent, marginTop: 24 }]}
          onPress={() => animateOut(() => onSave(selectedList))}
        >
          <Text style={styles.saveBtnText}>Save Interests ({selectedList.length})</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Sub-Page: Language Settings (Level 2) ───
// ═══════════════════════════════════════════════════════════════
function LanguagePage({ nativeLang, learningLang, onSave, onBack, theme }) {
  const t = theme;
  const insets = useSafeAreaInsets();
  const [editNative, setEditNative] = useState(nativeLang || '🇺🇸 English');
  const [editLearning, setEditLearning] = useState(learningLang || '🇯🇵 Japanese');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState('native');
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateOut = (cb) => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <Animated.View style={[styles.subPageLevel2, { backgroundColor: t.bg, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.subPageHeader, { borderBottomColor: t.headerBorder, paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => animateOut(onBack)} style={{ padding: 8, marginLeft: -8 }}>
          <FontAwesome name="arrow-left" size={20} color={t.accent} />
        </TouchableOpacity>
        <Text style={[styles.subPageTitle, { color: t.accent }]}>Language DNA</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={[styles.subPageBody, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>NATIVE LANGUAGE (YOU SPEAK)</Text>
        <TouchableOpacity style={[styles.pickerInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]} onPress={() => { setPickerType('native'); setShowPicker(true); }}>
          <Text style={[styles.pickerInputText, { color: t.text }]}>{editNative}</Text>
          <FontAwesome name="chevron-down" size={12} color={t.textMuted} />
        </TouchableOpacity>
        
        <Text style={[styles.inputLabel, { color: t.textSecondary, marginTop: 14 }]}>LEARNING LANGUAGE (YOU WANT TO LEARN)</Text>
        <TouchableOpacity style={[styles.pickerInput, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]} onPress={() => { setPickerType('learning'); setShowPicker(true); }}>
          <Text style={[styles.pickerInputText, { color: t.text }]}>{editLearning}</Text>
          <FontAwesome name="chevron-down" size={12} color={t.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.accent, marginTop: 24 }]} onPress={() => animateOut(() => onSave(editNative, editLearning))}>
          <Text style={styles.saveBtnText}>Save Languages</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showPicker} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: t.modalBg }]}>
          <View style={[styles.langPickerCard, { backgroundColor: t.card }]}>
            <Text style={[styles.langPickerTitle, { color: t.accent }]}>Select {pickerType === 'native' ? 'Native' : 'Learning'} Language</Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity key={lang} style={[styles.langPickerItem, { borderBottomColor: t.divider }]} onPress={() => {
                  if (pickerType === 'native') setEditNative(lang); else setEditLearning(lang);
                  setShowPicker(false);
                }}>
                  <Text style={[styles.langPickerItemText, { color: t.text }]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.langPickerCloseBtn} onPress={() => setShowPicker(false)}>
              <Text style={[styles.langPickerCloseText, { color: t.danger }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Sub-Page: About Me (Bio Editor) ───
// ═══════════════════════════════════════════════════════════════
function AboutMePage({ bio, onSave, onBack, theme }) {
  const t = theme;
  const insets = useSafeAreaInsets();
  const [editBio, setEditBio] = useState(bio || '');
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
    const s1 = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const s2 = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKbHeight(0));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  const animateOut = (cb) => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <Animated.View style={[styles.subPage, { backgroundColor: t.bg, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.subPageHeader, { borderBottomColor: t.headerBorder, paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => animateOut(onBack)} style={{ padding: 8, marginLeft: -8 }}>
          <FontAwesome name="arrow-left" size={20} color={t.accent} />
        </TouchableOpacity>
        <Text style={[styles.subPageTitle, { color: t.accent }]}>Bio & Learning Goal</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={[styles.subPageBody, { paddingBottom: kbHeight > 0 ? kbHeight + 20 : (Math.max(insets.bottom, 20) + 20) }]}>
        <Text style={[styles.inputLabel, { color: t.textSecondary }]}>YOUR BIO QUOTE</Text>
        <TextInput
          style={[styles.sheetInput, { height: 140, textAlignVertical: 'top', backgroundColor: t.inputBg, borderColor: t.inputBorder, color: t.text }]}
          value={editBio}
          onChangeText={setEditBio}
          placeholder="Tell others what you want to practice and your goals..."
          placeholderTextColor={t.textMuted}
          multiline
          autoFocus
          maxLength={300}
        />
        <Text style={[styles.inputHelper, { color: t.textMuted, marginTop: -8 }]}>{editBio.length}/300 characters</Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: t.accent, marginTop: 20 }]} onPress={() => animateOut(() => onSave(editBio.trim()))}>
          <Text style={styles.saveBtnText}>Save Bio</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Sub-Page: My Profile (List View - Level 1) ───
// ═══════════════════════════════════════════════════════════════
function MyProfilePage({ user, onBack, onNavigate, theme }) {
  const t = theme;
  const insets = useSafeAreaInsets();
  const [editAvatar, setEditAvatar] = useState(user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400');
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateOut = (cb) => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => cb && cb());
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        setEditAvatar(newUri);

        let serverUrl = newUri;
        if (base64) {
          try {
            const upRes = await fetch('https://vivetalk.sayflash.id/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: base64, type: 'avatar', ext: '.jpg' })
            });
            const upData = await upRes.json();
            if (upData && upData.url) {
              serverUrl = upData.url;
              setEditAvatar(serverUrl);
            }
          } catch (upErr) {}
        }
        authService.updateUserSession({ ...user, avatar: serverUrl, photoURL: serverUrl });
      }
    } catch (err) { console.warn('Image picker error:', err); }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const username = user?.username ? `@${user.username.replace('@', '')}` : `@${displayName.toLowerCase().replace(/\s+/g, '_')}`;
  const nativeLang = getLanguageWithFlag(user?.nativeLanguage);
  const learningLang = getLanguageWithFlag(user?.learningLanguage || 'Japanese');
  const voiceSnippetStatus = user?.voiceAudioUri ? `🎤 Voice recorded (${user.voiceDuration || '0:05'})` : (user?.voiceIntroText || 'Tap to record voice...');
  const interests = user?.interests && Array.isArray(user.interests) ? user.interests.join(', ') : 'Coffee, Tech, Travel';

  const profileRows = [
    { label: 'Display Name', value: displayName, page: 'editName' },
    { label: 'Username', value: username, page: 'editUsername' },
    { label: '🎙️ Voice Intro (Real Recording)', value: voiceSnippetStatus, page: 'voiceIntro' },
    { label: '🗣️ Language DNA', value: `${nativeLang} ⇄ ${learningLang}`, page: 'language' },
    { label: '🏷️ Conversation Interests', value: interests, page: 'interests' },
    { label: '✍️ Bio & Goal', value: user?.bio || 'Looking to practice conversational skills!', page: 'aboutMe' },
  ];

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <Animated.View style={[styles.subPage, { backgroundColor: t.bg, transform: [{ translateX: slideAnim }] }]}>
      <View style={[styles.subPageHeader, { borderBottomColor: t.headerBorder, paddingTop: topPadding }]}>
        <TouchableOpacity onPress={() => animateOut(onBack)} style={{ padding: 8, marginLeft: -8 }}>
          <FontAwesome name="arrow-left" size={20} color={t.accent} />
        </TouchableOpacity>
        <Text style={[styles.subPageTitle, { color: t.accent }]}>My Profile & Language DNA</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ position: 'relative' }}>
            <Image source={{ uri: editAvatar }} style={[styles.avatarImg, { width: 96, height: 96, borderRadius: 48, borderColor: t.avatarBorder, borderWidth: 3 }]} />
            <TouchableOpacity style={[styles.largeEditBadge, { backgroundColor: t.accent, borderColor: t.bg }]} activeOpacity={0.8} onPress={pickImage}>
              <FontAwesome name="camera" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: t.accent, fontWeight: '700', marginTop: 8 }}>Tap camera to change photo</Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          <Text style={[styles.sectionCardTitle, { color: t.accent }]}>PROFILE & MATCHING SETTINGS</Text>
          {profileRows.map((row, index) => (
            <React.Fragment key={row.page}>
              <TouchableOpacity style={styles.profileRow} onPress={() => onNavigate(row.page)} activeOpacity={0.7}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.profileRowLabel, { color: t.textMuted }]}>{row.label}</Text>
                  <Text style={[styles.profileRowValue, { color: t.text }]} numberOfLines={1}>
                    {row.value}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color={t.textMuted} />
              </TouchableOpacity>
              {index < profileRows.length - 1 && <View style={[styles.settingDivider, { backgroundColor: t.divider }]} />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN: Settings Screen ───
// ═══════════════════════════════════════════════════════════════
export default function ProfileScreen({ user, onLogout }) {
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(user?.darkMode || false);
  const [currentPage, setCurrentPage] = useState('settings');

  const t = isDarkMode ? darkTheme : lightTheme;

  const toggleDarkMode = (val) => {
    setIsDarkMode(val);
    authService.updateUserSession({ ...user, darkMode: val });
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const username = user?.username ? `@${user.username.replace('@', '')}` : `@${displayName.toLowerCase().replace(/\s+/g, '_')}`;
  const nativeLang = getLanguageWithFlag(user?.nativeLanguage);
  const learningLang = getLanguageWithFlag(user?.learningLanguage || 'Japanese');
  const bio = user?.bio || '';

  const confirmLogout = () => { setShowLogoutModal(false); if (onLogout) onLogout(); };

  // Save handlers
  const saveDisplayName = (v) => { authService.updateUserSession({ ...user, displayName: v }); setCurrentPage('myProfile'); };
  const saveUsername = (v) => {
    authService.updateUserSession({ ...user, username: v.replace('@', '') });
    setCurrentPage('myProfile');
  };
  const saveLanguages = (n, l) => { authService.updateUserSession({ ...user, nativeLanguage: n, learningLanguage: l }); setCurrentPage('myProfile'); };
  const saveVoiceIntro = (audioUri, txt, dur) => {
    authService.updateUserSession({
      ...user,
      voiceAudioUri: audioUri,
      voiceIntroText: txt,
      voiceDuration: dur,
    });
    setCurrentPage('myProfile');
  };
  const saveInterests = (v) => { authService.updateUserSession({ ...user, interests: v }); setCurrentPage('myProfile'); };
  const saveBio = (v) => { authService.updateUserSession({ ...user, bio: v }); setCurrentPage('myProfile'); };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.glowOrbTop, { backgroundColor: t.orb1 }]} />
      <View style={[styles.glowOrbBottom, { backgroundColor: t.orb2 }]} />

      <View style={[styles.topHeader, { paddingTop: topPadding, borderBottomColor: t.headerBorder }]}>
        <Text style={[styles.headerTitle, { color: t.accent }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]} showsVerticalScrollIndicator={false}>
        {/* User Hero Card */}
        <TouchableOpacity style={[styles.userCard, { backgroundColor: t.card, borderColor: t.cardBorder }]} activeOpacity={0.8} onPress={() => setCurrentPage('myProfile')}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' }} style={[styles.avatarImg, { borderColor: t.avatarBorder }]} />
          </View>
          <Text style={[styles.userName, { color: t.text }]}>{displayName}</Text>
          <Text style={[styles.userHandle, { color: t.accent }]}>{username}</Text>

          {/* Bio Container */}
          <TouchableOpacity
            style={[styles.bioContainer, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }]}
            activeOpacity={0.7}
            onPress={(e) => { e.stopPropagation(); setCurrentPage('aboutMe'); }}
          >
            <View style={styles.bioHeader}>
              <Text style={[styles.bioHeaderText, { color: t.accent }]}>About Me & Goal</Text>
              <FontAwesome name="pencil" size={12} color={t.accent} />
            </View>
            <Text style={[styles.bioText, { color: t.textSecondary }]} numberOfLines={2}>{bio || 'Tap to add your learning goal...'}</Text>
          </TouchableOpacity>

          <View style={styles.languageBadgeRow}>
            <View style={[styles.langPill, { backgroundColor: t.pillBg, borderColor: t.inputBorder }]}>
              <Text style={[styles.langPillLabel, { color: t.textMuted }]}>NATIVE</Text>
              <Text style={[styles.langPillVal, { color: t.accent }]}>{nativeLang}</Text>
            </View>
            <View style={[styles.langPill, { backgroundColor: t.pillBg, borderColor: t.inputBorder }]}>
              <Text style={[styles.langPillLabel, { color: t.textMuted }]}>LEARNING</Text>
              <Text style={[styles.langPillVal, { color: t.accent }]}>{learningLang}</Text>
            </View>
          </View>

          <View style={[styles.editProfileHint, { borderTopColor: t.divider }]}>
            <Text style={[styles.editProfileHintText, { color: t.accent, fontWeight: '700' }]}>Edit Profile, Voice & DNA</Text>
            <FontAwesome name="chevron-right" size={11} color={t.accent} />
          </View>
        </TouchableOpacity>

        {/* Preferences Section */}
        <View style={[styles.sectionCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          <Text style={[styles.sectionCardTitle, { color: t.accent }]}>PREFERENCES</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <FontAwesome name="moon-o" size={16} color={t.textSecondary} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: t.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: t.switchTrack, true: t.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account & Security Section */}
        <View style={[styles.sectionCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          <Text style={[styles.sectionCardTitle, { color: t.accent }]}>ACCOUNT</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <FontAwesome name="sign-out" size={16} color={t.danger} style={styles.menuIcon} />
              <Text style={[styles.menuItemText, { color: t.danger }]}>Sign Out</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color={t.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sub-Pages Modal Flow */}
      {currentPage === 'myProfile' && (
        <MyProfilePage user={user} onBack={() => setCurrentPage('settings')} onNavigate={setCurrentPage} theme={t} />
      )}
      {currentPage === 'editName' && (
        <EditFieldPage title="Display Name" value={displayName} onSave={saveDisplayName} onBack={() => setCurrentPage('myProfile')} theme={t} />
      )}
      {currentPage === 'editUsername' && (
        <EditFieldPage title="Username" value={username.replace('@', '')} onSave={saveUsername} onBack={() => setCurrentPage('myProfile')} theme={t} autoCapitalize="none" />
      )}
      {currentPage === 'language' && (
        <LanguagePage nativeLang={nativeLang} learningLang={learningLang} onSave={saveLanguages} onBack={() => setCurrentPage('myProfile')} theme={t} />
      )}
      {currentPage === 'voiceIntro' && (
        <VoiceIntroPage
          voiceAudioUri={user?.voiceAudioUri}
          voiceText={user?.voiceIntroText}
          voiceDuration={user?.voiceDuration}
          onSave={saveVoiceIntro}
          onBack={() => setCurrentPage('myProfile')}
          theme={t}
        />
      )}
      {currentPage === 'interests' && (
        <InterestsPage interests={user?.interests} onSave={saveInterests} onBack={() => setCurrentPage('myProfile')} theme={t} />
      )}
      {currentPage === 'aboutMe' && (
        <AboutMePage bio={user?.bio} onSave={saveBio} onBack={() => setCurrentPage('myProfile')} theme={t} />
      )}

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: t.modalBg }]}>
          <View style={[styles.confirmCard, { backgroundColor: t.card }]}>
            <Text style={[styles.confirmTitle, { color: t.accent }]}>Sign Out</Text>
            <Text style={[styles.confirmSub, { color: t.textSecondary }]}>Are you sure you want to sign out of ViveTalk?</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity style={[styles.confirmCancelBtn, { backgroundColor: t.inputBg }]} onPress={() => setShowLogoutModal(false)}>
                <Text style={[styles.confirmCancelText, { color: t.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmLogoutBtn, { backgroundColor: t.danger }]} onPress={confirmLogout}>
                <Text style={styles.confirmLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -80,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  userCard: {
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
  },
  largeEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userHandle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  bioContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bioHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  languageBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  langPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  langPillLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  langPillVal: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
  editProfileHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  editProfileHintText: {
    fontSize: 12.5,
  },
  sectionCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  sectionCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 20,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  profileRowLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  profileRowValue: {
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    width: '100%',
  },

  // Sub-Pages Styles
  subPage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  subPageLevel2: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  subPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  subPageTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  subPageBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sheetInput: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  inputHelper: {
    fontSize: 11.5,
    marginTop: 6,
  },
  saveBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  // Real Voice Studio Box
  voiceStudioBox: {
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    marginVertical: 4,
  },
  micButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 86,
    height: 86,
    marginBottom: 8,
  },
  micPulseRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: '#C026D3',
    backgroundColor: 'rgba(192, 38, 211, 0.1)',
  },
  studioMicBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  studioStatusText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  studioActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  studioPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
  },
  studioPlayText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  studioResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  studioResetText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Interests Grid
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },

  // Picker Input
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pickerInputText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Picker
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  langPickerCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
  },
  langPickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
  langPickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  langPickerItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  langPickerCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  langPickerCloseText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Confirm Modal
  confirmCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  confirmSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmLogoutBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmLogoutText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
