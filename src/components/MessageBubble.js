import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { voiceService } from '../services/voiceService';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '10:24 AM';
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    }
  } catch (e) {}
  return '10:24 AM';
};

const LANG_NAME_DICT = {
  'zh': 'CHINESE', 'zh-cn': 'CHINESE', 'zh-tw': 'CHINESE', 'chinese': 'CHINESE', 'mandarin': 'CHINESE', 'zhongwen': 'CHINESE',
  'id': 'INDONESIAN', 'indonesian': 'INDONESIAN', 'indonesia': 'INDONESIAN', 'bahasa': 'INDONESIAN',
  'ja': 'JAPANESE', 'jp': 'JAPANESE', 'japanese': 'JAPANESE', 'nihongo': 'JAPANESE',
  'en': 'ENGLISH', 'english': 'ENGLISH',
  'es': 'SPANISH', 'spanish': 'SPANISH', 'espanol': 'SPANISH', 'español': 'SPANISH',
  'fr': 'FRENCH', 'french': 'FRENCH', 'francais': 'FRENCH',
  'de': 'GERMAN', 'german': 'GERMAN', 'deutsch': 'GERMAN',
  'ko': 'KOREAN', 'korean': 'KOREAN', 'hangul': 'KOREAN',
  'ar': 'ARABIC', 'arabic': 'ARABIC',
  'it': 'ITALIAN', 'italian': 'ITALIAN',
  'pt': 'PORTUGUESE', 'portuguese': 'PORTUGUESE',
  'ru': 'RUSSIAN', 'russian': 'RUSSIAN',
};

const getLangName = (raw) => {
  if (!raw) return 'TRANSLATION';
  const clean = String(raw).toLowerCase().replace(/[^a-z0-9]/gi, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (LANG_NAME_DICT[w]) return LANG_NAME_DICT[w];
  }
  return clean.toUpperCase() || 'TRANSLATION';
};

export default function MessageBubble({
  message,
  currentUser,
  partnerUser,
  targetLang = 'ja',
  onSaveVocab,
  onViewImage,
  theme
}) {
  const isUser = message.sender === 'user' || (currentUser && (message.sender === currentUser.email || message.senderEmail === currentUser.email));
  const isVoiceNote = message.isVoiceNote || !!message.audioUri;
  const hasImage = !!message.imageUri;

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayVoice = async () => {
    if (isPlayingAudio) {
      await voiceService.stopAudio();
      setIsPlayingAudio(false);
      return;
    }

    if (message.audioUri) {
      setIsPlayingAudio(true);
      await voiceService.playAudio(message.audioUri, () => {
        setIsPlayingAudio(false);
      });
    } else if (message.translatedText || message.originalText) {
      setIsPlayingAudio(true);
      Speech.speak(message.translatedText || message.originalText, {
        language: message.targetLang || targetLang || 'en',
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const handleSpeakTranslation = (textToSpeak, lang) => {
    if (!textToSpeak) return;
    Speech.speak(textToSpeak, {
      language: lang || message.targetLang || targetLang || 'en',
    });
  };

  const hasTranslation = !!message.translatedText && message.translatedText !== message.originalText;
  const formattedTime = formatTimestamp(message.timestamp);

  // Labels for the translation boxes
  const incomingTranslationLabel = `${getLangName(currentUser?.nativeLanguage || 'en')} TRANSLATION`;
  const outgoingTranslationLabel = `${getLangName(message.targetLang || targetLang || 'ja')} TRANSLATION`;
  const cleanOriginalText = (message.originalText || '')
    .replace(/\[VOICE_DATA:[^\]]*\]?/gi, '')
    .replace(/\[IMAGE_DATA:[^\]]*\]?/gi, '')
    .replace(/\[CALL_[^\]]*\]?/gi, '')
    .replace(/\[WEBRTC_[^\]]*\]?/gi, '')
    .replace(/\[AUDIO_CHUNK:[^\]]*\]?/gi, '')
    .replace(/\[VIDEO_FRAME:[^\]]*\]?/gi, '')
    .replace(/\[Golang AI[^\]]*\]:\s*/gi, '')
    .replace(/\(收到！\)/gi, '')
    .trim();

  const isDefaultMediaPlaceholder = cleanOriginalText === '🎵 [Voice Note]' ||
                                   cleanOriginalText === '[Voice Note]' ||
                                   cleanOriginalText === '🎵 Voice Note' ||
                                   cleanOriginalText === '📷 Photo Message' ||
                                   cleanOriginalText === '🖼️ Gallery Photo' ||
                                   cleanOriginalText === 'Photo Message' ||
                                   cleanOriginalText === 'Gallery Photo';

  const shouldShowText = !!cleanOriginalText && (!isVoiceNote && !hasImage ? true : !isDefaultMediaPlaceholder);

  return (
    <View style={[styles.clusterContainer, isUser ? styles.clusterUser : styles.clusterPartner]}>
      {/* 1. Original Message Bubble */}
      <View
        style={[
          styles.bubbleBase,
          isUser ? styles.originalBubbleUser : styles.originalBubblePartner,
          hasTranslation ? (isUser ? styles.originalUserAttached : styles.originalPartnerAttached) : null
        ]}
      >
        {/* Attached Photo/Media */}
        {hasImage && (
          <TouchableOpacity onPress={() => onViewImage && onViewImage(message.imageUri)} style={styles.imageWrapper} activeOpacity={0.9}>
            <Image source={{ uri: message.imageUri }} style={styles.attachedImage} resizeMode="cover" />
          </TouchableOpacity>
        )}

        {/* Voice Note Player */}
        {isVoiceNote && (
          <View style={styles.voiceNoteRow}>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: isUser ? '#FFFFFF' : '#4B1A56' }]}
              onPress={handlePlayVoice}
              activeOpacity={0.8}
            >
              <FontAwesome name={isPlayingAudio ? 'pause' : 'play'} size={12} color={isUser ? '#4B1A56' : '#FFFFFF'} />
            </TouchableOpacity>
            <View style={styles.voiceWave}>
              <View style={[styles.waveBar, { height: 8, backgroundColor: isUser ? '#E9D5FF' : '#4B1A56' }]} />
              <View style={[styles.waveBar, { height: 16, backgroundColor: isUser ? '#E9D5FF' : '#4B1A56' }]} />
              <View style={[styles.waveBar, { height: 22, backgroundColor: isUser ? '#E9D5FF' : '#4B1A56' }]} />
              <View style={[styles.waveBar, { height: 14, backgroundColor: isUser ? '#E9D5FF' : '#4B1A56' }]} />
              <View style={[styles.waveBar, { height: 18, backgroundColor: isUser ? '#E9D5FF' : '#4B1A56' }]} />
              <View style={[styles.waveBar, { height: 10, backgroundColor: isUser ? '#E9D5FF' : '#4B1A56' }]} />
            </View>
            <Text style={[styles.voiceDuration, { color: isUser ? '#E9D5FF' : '#6B7280' }]}>
              {message.audioDuration || '0:03'}
            </Text>
          </View>
        )}

        {/* Message Text */}
        {shouldShowText && (
          <Text style={[styles.messageText, isUser ? styles.textUser : styles.textPartner]}>
            {cleanOriginalText}
          </Text>
        )}

        {/* Optional Chinese Pinyin guide */}
        {!!message.pinyin && (
          <View style={styles.pinyinBox}>
            <Text style={styles.pinyinText}>🗣️ {message.pinyin}</Text>
          </View>
        )}
      </View>

      {/* 2. Embedded Real-Time Neural Translation Bubble */}
      {hasTranslation && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleSpeakTranslation(message.translatedText, isUser ? (message.targetLang || targetLang) : 'en')}
          style={[
            styles.bubbleBase,
            isUser ? styles.transBubbleUser : styles.transBubblePartner
          ]}
        >
          {isUser ? (
            /* Outgoing Translation (Right-Aligned style with icon on the right) */
            <>
              <View style={styles.transHeaderOutgoing}>
                <Text style={styles.transLabelOutgoing}>{outgoingTranslationLabel}</Text>
                <View style={styles.translateIconCircleOut}>
                  <FontAwesome name="language" size={15} color="#4B1A56" />
                </View>
              </View>
              <Text style={styles.transTextOutgoing}>{message.translatedText}</Text>
            </>
          ) : (
            /* Incoming Translation (Left-Aligned style with icon on the left & pink border) */
            <>
              <View style={styles.transHeaderIncoming}>
                <View style={styles.translateIconCircleIn}>
                  <FontAwesome name="language" size={15} color="#A21CAF" />
                </View>
                <Text style={styles.transLabelIncoming}>{incomingTranslationLabel}</Text>
              </View>
              <Text style={styles.transTextIncoming}>{message.translatedText}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* 3. Timestamp & Delivery Indicators Below Cluster */}
      <View style={[styles.metaRow, isUser ? styles.metaRowUser : styles.metaRowPartner]}>
        <Text style={styles.timestampText}>{formattedTime}</Text>
        {isUser && (
          <View style={styles.statusTicks}>
            <FontAwesome name="check" size={11} color="#4B1A56" style={{ marginRight: -4 }} />
            <FontAwesome name="check" size={11} color="#4B1A56" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clusterContainer: {
    marginVertical: 6,
    paddingHorizontal: 16,
    maxWidth: '86%',
  },
  clusterUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  clusterPartner: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubbleBase: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
  },

  // --- 1. Original Bubbles ---
  originalBubbleUser: {
    backgroundColor: '#4B1A56', // Deep purple
    borderBottomRightRadius: 6,
  },
  originalBubblePartner: {
    backgroundColor: '#F1F1F1', // Light grey
    borderBottomLeftRadius: 6,
  },
  originalUserAttached: {
    marginBottom: 5,
  },
  originalPartnerAttached: {
    marginBottom: 5,
  },

  // --- 2. Translation Bubbles ---
  transBubbleUser: {
    backgroundColor: '#F1F1F1', // Light grey fill
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  transBubblePartner: {
    backgroundColor: '#FFF9FE', // Soft pink/white tint
    borderTopLeftRadius: 6,
    borderWidth: 1.2,
    borderColor: '#F9A8D4', // Magenta / Pink border
  },

  // --- Text Typography ---
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  textPartner: {
    color: '#111827',
    fontWeight: '400',
  },

  // --- Translation Headers & Labels ---
  transHeaderIncoming: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  translateIconCircleIn: {
    marginRight: 2,
  },
  transLabelIncoming: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A21CAF', // Plum / Magenta
    letterSpacing: 0.6,
  },
  transTextIncoming: {
    fontSize: 14,
    lineHeight: 21,
    color: '#111827',
    fontWeight: '600',
  },

  transHeaderOutgoing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 6,
    gap: 6,
  },
  translateIconCircleOut: {
    marginLeft: 2,
  },
  transLabelOutgoing: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280', // Slate / Muted gray
    letterSpacing: 0.6,
  },
  transTextOutgoing: {
    fontSize: 14,
    lineHeight: 21,
    color: '#111827',
    fontWeight: '700',
    textAlign: 'left',
  },

  // --- Metadata (Timestamp & Status) ---
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaRowUser: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  metaRowPartner: {
    justifyContent: 'flex-start',
    marginLeft: 4,
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  statusTicks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },

  // --- Media & Voice Notes ---
  imageWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  attachedImage: {
    width: 220,
    height: 150,
    borderRadius: 14,
  },
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 11,
    fontWeight: '600',
  },
  pinyinBox: {
    backgroundColor: 'rgba(255, 215, 243, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },
  pinyinText: {
    color: '#4B1A56',
    fontSize: 11,
    fontWeight: '700',
  },
});
