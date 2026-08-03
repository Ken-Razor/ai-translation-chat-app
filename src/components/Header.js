import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DARK_THEME } from '../theme/colors';

export default function Header({
  partnerName = "devicea@test.com",
  partnerUser,
  status = "Active now",
  currentUser,
  targetLang = "en",
  onOpenLangPicker,
  onStartVoiceCall,
  onStartVideoCall,
  onOpenFriendProfile,
  onBackToChatList,
  theme = DARK_THEME
}) {
  const displayTitle = partnerUser?.displayName || (partnerName.includes('@') ? partnerName.split('@')[0] : partnerName);
  const initial = displayTitle ? displayTitle.charAt(0).toUpperCase() : 'D';
  const avatarBg = partnerUser?.avatarColor || theme.primary;

  const getLangLabel = (code) => {
    switch (code) {
      case 'id': return 'Indonesian';
      case 'zh': return 'Chinese';
      case 'es': return 'Spanish';
      case 'jp': return 'Japanese';
      case 'fr': return 'French';
      case 'de': return 'German';
      default: return 'English';
    }
  };

  const isDark = theme.mode === 'dark';

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
      {/* Left Section: Back Chevron + Clickable Avatar + Name -> Opens Friend Details */}
      <View style={styles.leftSection}>
        {onBackToChatList && (
          <TouchableOpacity style={styles.backBtn} onPress={onBackToChatList} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome name="chevron-left" size={18} color={theme.subtext} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.profileClickArea} onPress={onOpenFriendProfile} activeOpacity={0.7}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            {partnerUser?.avatarUrl ? (
              <Image source={{ uri: partnerUser.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
            <View style={[styles.onlineDot, { borderColor: theme.headerBg }]} />
          </View>

          <View style={styles.partnerInfo}>
            <Text style={[styles.partnerName, { color: theme.text }]} numberOfLines={1}>
              {displayTitle}
            </Text>
            <Text style={styles.statusText} numberOfLines={1}>
              Active now
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right Section: Language Pill + Call Icons Only */}
      <View style={styles.rightSection}>
        {/* Target Language Selector Pill */}
        <TouchableOpacity style={styles.langPill} onPress={onOpenLangPicker}>
          <FontAwesome name="language" size={13} color="#2DD4BF" style={{ marginRight: 5 }} />
          <Text style={styles.langPillText}>→ {getLangLabel(targetLang)}</Text>
        </TouchableOpacity>

        {/* WhatsApp Phone Call Icon */}
        <TouchableOpacity style={styles.iconBtn} onPress={onStartVoiceCall} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FontAwesome name="phone" size={18} color="#38BDF8" />
        </TouchableOpacity>

        {/* WhatsApp Video Camera Icon */}
        <TouchableOpacity style={styles.iconBtn} onPress={onStartVideoCall} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FontAwesome name="video-camera" size={18} color="#38BDF8" />
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    height: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 6,
  },
  profileClickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    paddingRight: 10,
    paddingLeft: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  partnerInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusText: {
    color: '#10B981',
    fontSize: 11,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
  },
  langPillText: {
    color: '#2DD4BF',
    fontSize: 11,
    fontWeight: '700',
  },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
