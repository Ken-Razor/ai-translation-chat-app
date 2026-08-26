import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { voiceService } from '../services/voiceService';
import CachedImage from '../components/CachedImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LANGUAGE_META = [
  { id: 'zh', name: 'Chinese', flag: '🇨🇳', aliases: ['zh', 'chinese', 'mandarin', 'zhongwen', '中文', 'cmn'] },
  { id: 'id', name: 'Indonesian', flag: '🇮🇩', aliases: ['id', 'indonesian', 'indonesia', 'bahasa', 'bahasaindonesia'] },
  { id: 'en', name: 'English', flag: '🇺🇸', aliases: ['en', 'english', 'eng', 'us', 'uk'] },
  { id: 'ja', name: 'Japanese', flag: '🇯🇵', aliases: ['ja', 'jp', 'japanese', 'nihongo', '日本語'] },
  { id: 'ko', name: 'Korean', flag: '🇰🇷', aliases: ['ko', 'korean', 'hangul', '한국어'] },
  { id: 'es', name: 'Spanish', flag: '🇪🇸', aliases: ['es', 'spanish', 'espanol', 'español'] },
  { id: 'fr', name: 'French', flag: '🇫🇷', aliases: ['fr', 'french', 'francais', 'français'] },
  { id: 'de', name: 'German', flag: '🇩🇪', aliases: ['de', 'german', 'deutsch'] },
  { id: 'ar', name: 'Arabic', flag: '🇸🇦', aliases: ['ar', 'arabic', 'alarabiya', 'العربية'] },
  { id: 'it', name: 'Italian', flag: '🇮🇹', aliases: ['it', 'italian', 'italiano'] },
  { id: 'pt', name: 'Portuguese', flag: '🇵🇹', aliases: ['pt', 'portuguese', 'portugues', 'português'] },
  { id: 'ru', name: 'Russian', flag: '🇷🇺', aliases: ['ru', 'russian', 'russkiy', 'русский'] },
];

const getLangDetails = (raw) => {
  if (!raw) return { name: 'English', flag: '🇺🇸' };
  const clean = String(raw).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\uac00-\ud7af\u3040-\u30ff]/gi, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);

  for (const item of LANGUAGE_META) {
    if (item.aliases.includes(clean)) return item;
    for (const w of words) {
      if (item.aliases.includes(w)) return item;
    }
  }

  for (const item of LANGUAGE_META) {
    for (const w of words) {
      if (w.length >= 3 && (item.name.toLowerCase().startsWith(w) || w.startsWith(item.name.toLowerCase()))) {
        return item;
      }
    }
  }

  return { name: raw, flag: '🌐' };
};

export default function FriendProfileScreen({
  partnerEmail,
  partnerUser,
  messages = [],
  targetLang,
  onOpenLangPicker,
  onStartVoiceCall,
  onStartVideoCall,
  onClearHistory,
  onClose,
  onViewImage,
  theme
}) {
  const insets = useSafeAreaInsets();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = partnerUser?.displayName || (partnerEmail ? partnerEmail.split('@')[0] : 'Partner');
  const username = partnerUser?.username
    ? (partnerUser.username.startsWith('@') ? partnerUser.username : `@${partnerUser.username}`)
    : `@${displayName.toLowerCase().replace(/\s+/g, '_')}`;

  const avatar = partnerUser?.avatar || partnerUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4B1A56&color=ffffff&size=256`;

  const nativeDetails = getLangDetails(partnerUser?.nativeLanguage || 'en');
  const learningDetails = getLangDetails(partnerUser?.learningLanguage || 'zh');
  const learningLevel = (partnerUser?.learningLevel || 'Intermediate').toUpperCase();

  const bio = partnerUser?.bio || 'Language exchange partner practicing conversational skills.';
  const interests = Array.isArray(partnerUser?.interests) && partnerUser.interests.length > 0
    ? partnerUser.interests
    : ['☕ Coffee Shops', '✈️ Travel & Culture', '💻 Tech & Coding'];

  const sharedMedia = messages.filter(m => m.imageUri);
  const sharedVoiceNotes = messages.filter(m => m.isVoiceNote || m.audioUri);

  const handlePlayVoiceIntro = async () => {
    if (isPlayingAudio) {
      voiceService.stopPlayback();
      try { Speech.stop(); } catch (e) {}
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    const voiceUri = partnerUser?.voiceAudioUri;
    const isRemoteHttp = voiceUri && (voiceUri.startsWith('http://') || voiceUri.startsWith('https://') || voiceUri.startsWith('data:'));

    if (isRemoteHttp) {
      const soundObj = await voiceService.playAudio(voiceUri, () => {
        setIsPlayingAudio(false);
      });
      if (!soundObj) {
        playSpeechFallback();
      }
    } else {
      playSpeechFallback();
    }
  };

  const playSpeechFallback = () => {
    const textToSpeak = partnerUser?.voiceIntroText || `Hello! I am ${displayName}. Let's practice languages together!`;
    const lang = partnerUser?.nativeLanguage || 'en';

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const codeMap = { 'zh': 'zh-CN', 'id': 'id-ID', 'ja': 'ja-JP', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE', 'ko': 'ko-KR', 'en': 'en-US' };
      utterance.lang = codeMap[lang.toLowerCase()] || 'en-US';
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      Speech.speak(textToSpeak, {
        language: lang,
        rate: 0.95,
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
        onStopped: () => setIsPlayingAudio(false),
      });
    }
  };

  const handleConfirmClear = () => {
    Alert.alert(
      "Clear Conversation History",
      "Are you sure you want to delete all messages in this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            if (onClearHistory) onClearHistory();
            if (onClose) onClose();
          }
        }
      ]
    );
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 6;

  return (
    <View style={styles.container}>
      {/* Symmetrical Top Navigation Bar */}
      <View style={[styles.headerBar, { paddingTop: topPadding }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
          <FontAwesome name="arrow-left" size={17} color="#320034" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Profile</Text>
        <TouchableOpacity style={styles.headerActionBtn} onPress={onOpenLangPicker} activeOpacity={0.7}>
          <FontAwesome name="globe" size={17} color="#4B1A56" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Showcase Card with Avatar, Badge, and Quick Action Rings */}
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.avatarShowcaseWrapper}
            onPress={() => onViewImage && onViewImage(avatar)}
            activeOpacity={0.85}
          >
            <CachedImage
              source={{ uri: avatar }}
              style={styles.heroAvatarImg}
              fallbackUri={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4B1A56&color=ffffff&size=256`}
            />
            <View style={styles.previewBadgeCircle}>
              <FontAwesome name="search-plus" size={12} color="#FFFFFF" />
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Active Now</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.heroNameText}>{displayName}</Text>
          <Text style={styles.heroHandleText}>{username}</Text>
          <Text style={styles.heroEmailText}>{partnerEmail}</Text>

          {/* Quick Action Button Dock: Voice Call, Video Call, Translate */}
          <View style={styles.quickActionDock}>
            <TouchableOpacity style={styles.dockActionBtn} onPress={onStartVoiceCall} activeOpacity={0.8}>
              <View style={[styles.dockIconCircle, { backgroundColor: '#FFF0FA' }]}>
                <FontAwesome name="phone" size={18} color="#4B1A56" />
              </View>
              <Text style={styles.dockLabel}>Voice Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dockActionBtn} onPress={onStartVideoCall} activeOpacity={0.8}>
              <View style={[styles.dockIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <FontAwesome name="video-camera" size={17} color="#7C3AED" />
              </View>
              <Text style={styles.dockLabel}>Video Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dockActionBtn} onPress={onOpenLangPicker} activeOpacity={0.8}>
              <View style={[styles.dockIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <FontAwesome name="language" size={18} color="#2563EB" />
              </View>
              <Text style={styles.dockLabel}>Languages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Real Voice Greeting Intro Player */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <FontAwesome name="microphone" size={14} color="#EC4899" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>VOICE GREETING</Text>
          </View>

          <TouchableOpacity
            style={[styles.voicePlayerBar, isPlayingAudio && styles.voicePlayerBarActive]}
            onPress={handlePlayVoiceIntro}
            activeOpacity={0.85}
          >
            <View style={styles.voicePlayBtn}>
              <FontAwesome name={isPlayingAudio ? 'pause' : 'play'} size={14} color="#FFFFFF" />
            </View>

            <View style={styles.voiceWaveformArea}>
              <Text style={styles.voiceTitleText}>
                {isPlayingAudio ? 'Playing Greeting...' : `Voice Note (${partnerUser?.voiceDuration || '0:05'})`}
              </Text>
              <View style={styles.waveformBarsRow}>
                {[14, 22, 10, 26, 18, 28, 12, 24, 16, 20, 12, 18, 24, 14, 8].map((h, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.waveBar,
                      {
                        height: isPlayingAudio ? (h * (0.6 + Math.random() * 0.7)) : (h * 0.6),
                        backgroundColor: isPlayingAudio ? '#C026D3' : '#E5E7EB',
                      }
                    ]}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>

          {!!partnerUser?.voiceIntroText && (
            <Text style={styles.voiceIntroQuote}>"{partnerUser.voiceIntroText}"</Text>
          )}
        </View>

        {/* 3. Language DNA Exchange Box */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <FontAwesome name="globe" size={14} color="#7C3AED" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>LANGUAGE DNA</Text>
          </View>

          <View style={styles.langExchangeBox}>
            <View style={styles.langRow}>
              <View style={styles.langLeft}>
                <Text style={styles.langFlag}>{nativeDetails.flag}</Text>
                <View>
                  <Text style={styles.langLabel}>NATIVE LANGUAGE</Text>
                  <Text style={styles.langValue}>{nativeDetails.name}</Text>
                </View>
              </View>
              <View style={styles.nativePill}>
                <Text style={styles.nativePillText}>NATIVE</Text>
              </View>
            </View>

            <View style={styles.langDivider} />

            <View style={styles.langRow}>
              <View style={styles.langLeft}>
                <Text style={styles.langFlag}>{learningDetails.flag}</Text>
                <View>
                  <Text style={styles.langLabel}>CURRENTLY LEARNING</Text>
                  <Text style={styles.langValue}>{learningDetails.name}</Text>
                </View>
              </View>
              <View style={styles.learningPill}>
                <Text style={styles.learningPillText}>{learningLevel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. About & Learning Goal */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <FontAwesome name="user" size={14} color="#4B1A56" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>ABOUT & LEARNING GOAL</Text>
          </View>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* 5. Conversation Topics / Interests */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <FontAwesome name="tags" size={14} color="#D97706" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>CONVERSATION TOPICS</Text>
          </View>
          <View style={styles.interestWrap}>
            {interests.map((tag, idx) => (
              <View key={idx} style={styles.interestPill}>
                <Text style={styles.interestText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Shared Media Gallery in this chat */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <FontAwesome name="photo" size={14} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>SHARED MEDIA ({sharedMedia.length})</Text>
          </View>

          {sharedMedia.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaRow}>
              {sharedMedia.map((m, idx) => (
                <TouchableOpacity key={idx} onPress={() => onViewImage && onViewImage(m.imageUri)} activeOpacity={0.8}>
                  <CachedImage source={{ uri: m.imageUri }} style={styles.sharedImgThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noMediaText}>No shared photos yet in this conversation.</Text>
          )}
        </View>

        {/* 7. Danger Zone / Clear History */}
        <View style={styles.dangerCard}>
          <TouchableOpacity style={styles.clearHistoryBtn} onPress={handleConfirmClear} activeOpacity={0.8}>
            <FontAwesome name="trash" size={16} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.clearHistoryText}>Clear Conversation History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FA',
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF5FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#320034',
    letterSpacing: -0.3,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF5FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },

  // 1. Hero Showcase Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#4B1A56',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarShowcaseWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  heroAvatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3.5,
    borderColor: '#4B1A56',
  },
  previewBadgeCircle: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4B1A56',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  heroNameText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#320034',
    letterSpacing: -0.4,
  },
  heroHandleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#EC4899',
    marginTop: 2,
  },
  heroEmailText: {
    fontSize: 12,
    color: '#80737d',
    marginTop: 2,
  },
  quickActionDock: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
    width: '100%',
  },
  dockActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  dockIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  dockLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B1A56',
  },

  // Generic Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#80737d',
    letterSpacing: 0.8,
  },

  // 2. Voice Player
  voicePlayerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FA',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    gap: 12,
  },
  voicePlayerBarActive: {
    borderColor: '#EC4899',
    backgroundColor: '#FFF0FA',
  },
  voicePlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4B1A56',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWaveformArea: {
    flex: 1,
    gap: 4,
  },
  voiceTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B1A56',
  },
  waveformBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
  },
  voiceIntroQuote: {
    fontSize: 12.5,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 18,
  },

  // 3. Language DNA
  langExchangeBox: {
    backgroundColor: '#FAF5FA',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langFlag: {
    fontSize: 22,
  },
  langLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#80737d',
    letterSpacing: 0.6,
  },
  langValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1b1f',
  },
  nativePill: {
    backgroundColor: '#FFF0FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  nativePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B1A56',
  },
  learningPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  learningPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  langDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  // 4. Bio & Interests
  bioText: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 19,
  },
  interestWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestPill: {
    backgroundColor: '#FFF0FA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B1A56',
  },

  // Shared Media
  mediaRow: {
    gap: 8,
    paddingVertical: 4,
  },
  sharedImgThumb: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  noMediaText: {
    fontSize: 12.5,
    color: '#80737d',
    fontStyle: 'italic',
  },

  // Danger Zone
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    overflow: 'hidden',
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  clearHistoryText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
