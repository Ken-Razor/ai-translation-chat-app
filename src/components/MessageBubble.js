import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Speech from 'expo-speech';
import { FontAwesome } from '@expo/vector-icons';
import { voiceService } from '../services/voiceService';
import { DARK_THEME } from '../theme/colors';

// Global cache to lock each message's timestamp once formatted so it NEVER updates on polling
const localTimestampCache = new Map();

export const formatTimestamp = (ts, msgId) => {
  if (msgId && localTimestampCache.has(msgId)) {
    return localTimestampCache.get(msgId);
  }

  let formatted = '';
  if (!ts) {
    formatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (typeof ts === 'number') {
    const d = new Date(ts > 1e11 ? ts : ts * 1000);
    formatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (typeof ts === 'string') {
    const num = Number(ts);
    if (!isNaN(num) && num > 0) {
      const d = new Date(num > 1e11 ? num : num * 1000);
      formatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        formatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        formatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  } else {
    formatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (msgId && formatted) {
    localTimestampCache.set(msgId, formatted);
  }
  return formatted;
};

export default function MessageBubble({
  message,
  currentUser,
  partnerUser,
  onSaveVocab,
  onTranscribeVoiceNote,
  onViewImage,
  theme = DARK_THEME
}) {
  const isUser = message.sender === 'user';
  const isVoiceNote = message.isVoiceNote || (message.originalText && message.originalText.includes('Voice Note'));
  const hasImage = !!message.imageUri;
  const isDark = theme.mode === 'dark';

  const senderDisplayName = isUser ? 'You' : (partnerUser?.displayName || message.senderName || 'Friend');

  // Chinese detection rule: check if original text contains Chinese characters (\u4e00-\u9fa5)
  const isOriginalChinese = /[\u4e00-\u9fa5]/.test(message.originalText || '');
  const showFriendChineseGuides = !isUser && isOriginalChinese;

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranscribed, setIsTranscribed] = useState(message.isTranscribed || false);
  const [showHoldMenu, setShowHoldMenu] = useState(false);
  const [soundObject, setSoundObject] = useState(null);

  // WhatsApp-style Message Status Ticks (Pending 🕒, Sent ✓, Delivered ✓✓ gray, Read ✓✓ blue)
  const renderStatusTicks = (status = 'read') => {
    if (!isUser) return null;

    if (status === 'pending') {
      return <FontAwesome name="clock-o" size={11} color={theme.subtext} style={{ marginLeft: 4 }} />;
    }
    if (status === 'sent') {
      return <FontAwesome name="check" size={11} color={theme.subtext} style={{ marginLeft: 4 }} />;
    }
    if (status === 'delivered') {
      return (
        <View style={styles.ticksRow}>
          <FontAwesome name="check" size={11} color={theme.subtext} style={{ marginRight: -4 }} />
          <FontAwesome name="check" size={11} color={theme.subtext} />
        </View>
      );
    }
    // 'read' (Blue Double Ticks)
    return (
      <View style={styles.ticksRow}>
        <FontAwesome name="check" size={11} color="#38BDF8" style={{ marginRight: -4 }} />
        <FontAwesome name="check" size={11} color="#38BDF8" />
      </View>
    );
  };

  const handlePlayVoiceNote = async () => {
    if (!message.audioUri) return;
    try {
      if (isPlayingAudio) {
        await voiceService.stopAudio();
        setIsPlayingAudio(false);
      } else {
        setIsPlayingAudio(true);
        await voiceService.playAudio(message.audioUri, () => {
          setIsPlayingAudio(false);
        });
      }
    } catch (e) {
      console.warn("Audio playback error:", e);
      setIsPlayingAudio(false);
    }
  };

  const handleSpeakText = (textToSpeak) => {
    if (isPlayingAudio) {
      Speech.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    Speech.speak(textToSpeak, {
      language: isUser ? 'en-US' : 'zh-CN',
      onDone: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handleLongPress = () => {
    if (isVoiceNote) {
      setShowHoldMenu(true);
    }
  };

  const handlePerformTranscribe = () => {
    setShowHoldMenu(false);
    setIsTranscribed(true);
    if (onTranscribeVoiceNote) {
      onTranscribeVoiceNote(message.id);
    }
  };

  const durationSecs = message.durationSecs || 3;
  const formattedDuration = `0:${durationSecs < 10 ? '0' : ''}${durationSecs}`;

  const bubbleCardStyle = isUser
    ? { backgroundColor: isDark ? '#1E293B' : '#E2E8F0', borderColor: isDark ? '#334155' : '#CBD5E1' }
    : { backgroundColor: isDark ? '#131C2E' : '#FFFFFF', borderColor: isDark ? '#233048' : '#E2E8F0' };

  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.friendWrapper]}>
      <TouchableOpacity
        style={[styles.bubbleCard, bubbleCardStyle, isUser ? styles.userCard : styles.friendCard]}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
      >
        {/* Top Header: Sender Name Only (NO profile picture) */}
        <View style={styles.headerLine}>
          <Text style={[styles.senderName, isUser ? styles.userText : styles.friendText]}>
            {senderDisplayName}
          </Text>
        </View>

        {/* IMAGE / PHOTO MESSAGE BUBBLE */}
        {hasImage ? (
          <TouchableOpacity
            style={styles.imageCardContainer}
            onPress={() => {
              if (onViewImage) onViewImage(message.imageUri);
            }}
            activeOpacity={0.85}
          >
            <Image source={{ uri: message.imageUri }} style={styles.chatImage} resizeMode="cover" />
            <View style={styles.tapToViewBadge}>
              <FontAwesome name="search-plus" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.tapToViewText}>Tap to View & Save</Text>
            </View>
          </TouchableOpacity>
        ) : isVoiceNote ? (
          /* VOICE NOTE UI BUBBLE */
          <View style={styles.voiceNoteContainer}>
            <View style={styles.voicePlayerRow}>
              <TouchableOpacity
                style={styles.playBtnCircle}
                onPress={handlePlayVoiceNote}
              >
                <FontAwesome
                  name={isPlayingAudio ? "pause" : "play"}
                  size={14}
                  color="#FFFFFF"
                  style={!isPlayingAudio ? { marginLeft: 2 } : {}}
                />
              </TouchableOpacity>

              {/* Animated Waveform Simulation */}
              <View style={styles.waveformContainer}>
                <View style={[styles.waveBar, { height: isPlayingAudio ? 22 : 12 }]} />
                <View style={[styles.waveBar, { height: isPlayingAudio ? 14 : 22 }]} />
                <View style={[styles.waveBar, { height: isPlayingAudio ? 26 : 16 }]} />
                <View style={[styles.waveBar, { height: isPlayingAudio ? 12 : 26 }]} />
                <View style={[styles.waveBar, { height: isPlayingAudio ? 20 : 14 }]} />
                <View style={[styles.waveBar, { height: isPlayingAudio ? 10 : 20 }]} />
                <View style={[styles.waveBar, { height: isPlayingAudio ? 18 : 10 }]} />
              </View>

              {/* Real Dynamic Voice Note Duration */}
              <Text style={[styles.durationText, { color: theme.subtext }]}>{formattedDuration}</Text>
            </View>

            {/* If Transcribed or Requested */}
            {isTranscribed ? (
              <View style={[styles.transcribedBox, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#F1F5F9' }]}>
                <Text style={styles.transcribedLabel}>📝 TRANSCRIBED SPEECH-TO-TEXT:</Text>
                <Text style={[styles.transcribedText, { color: theme.text }]}>"Hello my friend, how are you doing today?"</Text>
                <Text style={styles.translatedSubText}>"你好，我的朋友，你今天过得怎么样？"</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.holdHintBtn} onPress={handlePerformTranscribe}>
                <Text style={styles.holdHintText}>💡 Tap or Hold to Convert Voice to Text 📝</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* STANDARD TEXT MESSAGE BUBBLE */
          <View>
            <Text style={[styles.originalText, { color: theme.text }]}>{message.originalText}</Text>

            {/* Gold Pinyin Box - ONLY SHOWN IF FRIEND TYPED IN CHINESE */}
            {showFriendChineseGuides && message.pinyin && (
              <View style={styles.pinyinContainer}>
                <Text style={styles.pinyinLabel}>PINYIN:</Text>
                <Text style={styles.pinyinText}>{message.pinyin}</Text>
              </View>
            )}

            {/* Cyan AI Translation Card */}
            {message.translatedText && (
              <View style={styles.translationContainer}>
                <View style={styles.translationHeader}>
                  <Text style={styles.translationLabel}>AI TRANSLATION:</Text>
                  <TouchableOpacity
                    style={styles.speakButton}
                    onPress={() => handleSpeakText(message.translatedText)}
                  >
                    <FontAwesome name="volume-up" size={12} color="#0284C7" style={{ marginRight: 4 }} />
                    <Text style={styles.speakButtonText}>
                      {isPlayingAudio ? 'Stop' : 'Hear'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.translatedText, { color: isDark ? '#E0F2FE' : '#0369A1' }]}>{message.translatedText}</Text>
              </View>
            )}

            {/* Purple Cultural Context Card - ONLY SHOWN IF FRIEND TYPED IN CHINESE */}
            {showFriendChineseGuides && message.culturalNote && (
              <View style={styles.culturalContainer}>
                <Text style={styles.culturalLabel}>💡 Cultural Context:</Text>
                <Text style={[styles.culturalText, { color: isDark ? '#DDD6FE' : '#5B21B6' }]}>{message.culturalNote}</Text>
              </View>
            )}
          </View>
        )}

        {/* Save Vocab Action */}
        {!isVoiceNote && !hasImage && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.saveVocabBtn}
              onPress={() =>
                onSaveVocab({
                  original: message.originalText,
                  pinyin: message.pinyin || '',
                  translation: message.translatedText || '',
                })
              }
            >
              <FontAwesome name="bookmark" size={11} color="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={styles.saveVocabText}>Save Phrase</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* BOTTOM FOOTER: Timestamp + Status Ticks */}
        <View style={styles.footerRow}>
          <Text style={[styles.timestamp, { color: theme.subtext }]}>{formatTimestamp(message.timestamp, message.id)}</Text>
          {renderStatusTicks(message.status)}
        </View>
      </TouchableOpacity>

      {/* Long Press Action Popup Menu for Voice Note */}
      {showHoldMenu && (
        <View style={[styles.popupMenuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.popupTitle, { color: theme.subtext }]}>Voice Note Options</Text>
          <TouchableOpacity style={styles.popupItem} onPress={handlePerformTranscribe}>
            <FontAwesome name="file-text-o" size={14} color="#38BDF8" style={{ marginRight: 8 }} />
            <Text style={[styles.popupItemText, { color: theme.text }]}>Convert Voice to Text (Transcribe)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupItem} onPress={() => setShowHoldMenu(false)}>
            <Text style={styles.popupCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    marginVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'column',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  friendWrapper: {
    alignItems: 'flex-start',
  },
  bubbleCard: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    elevation: 3,
  },
  userCard: {
    borderBottomRightRadius: 4,
  },
  friendCard: {
    borderBottomLeftRadius: 4,
  },
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  bubbleAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bubbleAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  bubbleAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
  },
  userText: {
    color: '#2563EB',
  },
  friendText: {
    color: '#DB2777',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  ticksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 10,
  },
  imageCardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    position: 'relative',
  },
  chatImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
  },
  tapToViewBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapToViewText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  originalText: {
    fontSize: 15,
    lineHeight: 20,
  },
  pinyinContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  pinyinLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  pinyinText: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
  },
  translationContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  translationLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  speakButtonText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '700',
  },
  translatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  culturalContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  culturalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 2,
  },
  culturalText: {
    fontSize: 12,
    lineHeight: 16,
  },
  voiceNoteContainer: {
    paddingVertical: 4,
    minWidth: 200,
  },
  voicePlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playBtnCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    height: 30,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 1.5,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transcribedBox: {
    marginTop: 10,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  transcribedLabel: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  transcribedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  translatedSubText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  holdHintBtn: {
    marginTop: 8,
    paddingVertical: 4,
  },
  holdHintText: {
    color: '#2563EB',
    fontSize: 11,
    fontStyle: 'italic',
  },
  actionRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveVocabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveVocabText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
  },
  popupMenuCard: {
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    elevation: 5,
  },
  popupTitle: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
  },
  popupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  popupItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  popupCancelText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
