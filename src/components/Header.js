import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import CachedImage from './CachedImage';

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

export default function Header({
  targetLang = 'ja',
  onOpenLangPicker,
  onOpenProfile,
  onOpenFriendProfile,
  currentUser,
  partnerUser,
  isPartnerTyping = false,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenTestCall,
  onBackToChatList,
  onOpenChatOptions,
  theme
}) {
  const insets = useSafeAreaInsets();
  const displayTitle = partnerUser?.displayName || partnerUser?.username || (partnerUser?.email ? partnerUser.email.split('@')[0] : 'Language Partner');
  const rawAvatar = partnerUser?.avatar || partnerUser?.photoURL;
  const avatarUrl = (rawAvatar && rawAvatar.startsWith('http'))
    ? rawAvatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayTitle)}&background=4B1A56&color=ffffff&size=256`;

  const getLangLabel = (code) => {
    if (!code) return 'English 🇺🇸';
    const clean = String(code).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\uac00-\ud7af\u3040-\u30ff]/gi, ' ').trim();
    const words = clean.split(/\s+/).filter(Boolean);

    for (const item of LANGUAGE_META) {
      if (item.aliases.includes(clean)) return `${item.name} ${item.flag}`;
      for (const w of words) {
        if (item.aliases.includes(w)) return `${item.name} ${item.flag}`;
      }
    }
    return `${code} 🌐`;
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 6;

  return (
    <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
      {/* Left Section: Back Button + Avatar + Name & Subtitle */}
      <View style={styles.leftSection}>
        {onBackToChatList && (
          <TouchableOpacity style={styles.backBtn} onPress={onBackToChatList} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome name="arrow-left" size={19} color="#111827" />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.profileClickArea} onPress={onOpenFriendProfile} activeOpacity={0.75}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <CachedImage
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                fallbackUri={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayTitle)}&background=4B1A56&color=ffffff&size=256`}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {displayTitle}
            </Text>
            {isPartnerTyping ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 11.5, color: '#10B981', fontWeight: '700' }}>
                  ✍️ typing...
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={onOpenLangPicker} activeOpacity={0.7} style={styles.langSubRow}>
                <Text style={styles.subtitleText} numberOfLines={1}>
                  Translating to: {getLangLabel(targetLang)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Right Section: Phone & Video Call Action Icons */}
      <View style={styles.rightSection}>
        {/* Audio Call Icon */}
        <TouchableOpacity style={styles.iconBtn} onPress={onStartVoiceCall} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <FontAwesome name="phone" size={20} color="#111827" />
        </TouchableOpacity>

        {/* Video Call Icon */}
        <TouchableOpacity style={styles.iconBtn} onPress={onStartVideoCall} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <FontAwesome name="video-camera" size={19} color="#111827" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  profileClickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    paddingRight: 14,
    paddingLeft: 2,
    paddingVertical: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4B1A56',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981', // Bright vibrant green dot from reference
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  partnerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  langSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 12.5,
    color: '#6B7280',
    fontWeight: '400',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
