import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

const { width } = Dimensions.get('window');

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

const getFlagForLang = (raw) => {
  if (!raw) return '🌐';
  const clean = String(raw).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5\uac00-\ud7af\u3040-\u30ff]/gi, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);

  for (const item of LANGUAGE_META) {
    if (item.aliases.includes(clean)) return item.flag;
    for (const w of words) {
      if (item.aliases.includes(w)) return item.flag;
    }
  }

  for (const item of LANGUAGE_META) {
    for (const w of words) {
      if (w.length >= 3 && (item.name.toLowerCase().startsWith(w) || w.startsWith(item.name.toLowerCase()))) {
        return item.flag;
      }
    }
  }

  return '🌐';
};

export default function HomeScreen({ user, onNavigateToTab, onStartChatWithUser }) {
  const insets = useSafeAreaInsets();
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const myEmail = (user?.email || '').toLowerCase();

  // 1. Instant 0ms Load from Local Storage Cache on Mount
  useEffect(() => {
    if (!myEmail) return;
    storageService.getHomeUsers(myEmail).then(cached => {
      if (Array.isArray(cached) && cached.length > 0) {
        setRegisteredUsers(cached);
      }
    });
  }, [myEmail]);

  const loadRegisteredUsers = useCallback(async () => {
    try {
      const allUsers = await authService.getAllUsers();
      if (Array.isArray(allUsers)) {
        const others = allUsers.filter(u => u.email && u.email.toLowerCase() !== myEmail);
        setRegisteredUsers(others);
        if (myEmail) {
          storageService.saveHomeUsers(myEmail, others);
        }
      }
    } catch (err) {
      console.warn('Failed to load registered users for home:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [myEmail]);

  useEffect(() => {
    loadRegisteredUsers();
  }, [loadRegisteredUsers]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadRegisteredUsers();
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Soft Ambient Pastel Mesh */}
        <View style={styles.glowOrbTop} />
        <View style={styles.glowOrbBottom} />

        {/* Top App Bar */}
        <View style={[styles.topAppBar, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.iconCircleBtn} onPress={() => Alert.alert('ViveTalk', 'Over 50+ languages supported!')}>
            <FontAwesome name="globe" size={18} color="#320034" />
          </TouchableOpacity>

          <Text style={styles.brandTitle}>ViveTalk</Text>

          <TouchableOpacity style={styles.iconCircleBtn} onPress={onRefresh}>
            <FontAwesome name="refresh" size={17} color="#320034" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          {/* Active Now / Stories Row */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Partners</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}
          >
            {/* Add Story / You */}
            <TouchableOpacity style={styles.storyItem} onPress={() => onNavigateToTab('profile')}>
              <View style={styles.addStoryRing}>
                <Image
                  source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' }}
                  style={styles.storyAvatar}
                />
                <View style={styles.addIconMini}>
                  <FontAwesome name="plus" size={10} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.storyName}>You</Text>
            </TouchableOpacity>

            {registeredUsers.length > 0 ? (
              registeredUsers.map((s, idx) => {
                const sName = s.displayName || s.username || s.email.split('@')[0];
                const sAvatar = (s.avatar && s.avatar.startsWith('http'))
                  ? s.avatar
                  : (s.photoURL && s.photoURL.startsWith('http'))
                  ? s.photoURL
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(sName)}&background=4B1A56&color=ffffff&size=256`;

                return (
                  <TouchableOpacity
                    key={s.id || s.email || idx}
                    style={styles.storyItem}
                    onPress={() => onStartChatWithUser && onStartChatWithUser({
                      displayName: sName,
                      avatar: sAvatar,
                      email: s.email,
                    })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.storyAvatarRing}>
                      <Image
                        source={{ uri: sAvatar }}
                        style={styles.storyAvatar}
                      />
                      <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.storyName} numberOfLines={1}>
                      {s.displayName ? s.displayName.split(' ')[0] : s.email.split('@')[0]} {getFlagForLang(s.nativeLanguage)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.noStoriesNotice}>
                <Text style={styles.noStoriesText}>Register partners to see them here</Text>
              </View>
            )}
          </ScrollView>

          {/* Hero Discovery Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>⚡ AI TRANSLATION ENGINE</Text>
            </View>
            <Text style={styles.heroTitle}>Let's meet new language partners</Text>
            <Text style={styles.heroSub}>Connect and translate in real-time with dual-language chat.</Text>

            {/* Action Buttons in Hero */}
            <View style={styles.heroButtonRow}>
              <TouchableOpacity
                style={styles.heroSearchBtn}
                onPress={() => onNavigateToTab('matches')}
                activeOpacity={0.88}
              >
                <FontAwesome name="search" size={14} color="#320034" style={{ marginRight: 8 }} />
                <Text style={styles.heroSearchText}>Find Matches</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroVoiceBtn}
                onPress={() => onNavigateToTab('chats')}
                activeOpacity={0.85}
              >
                <FontAwesome name="comments" size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.heroVoiceText}>Chats Room</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Action Grid */}
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: '#fda8ed' }]}
              onPress={() => onNavigateToTab('chats')}
              activeOpacity={0.8}
            >
              <FontAwesome name="language" size={24} color="#7b3673" style={{ marginBottom: 8 }} />
              <Text style={styles.quickCardTitle}>Start Translation</Text>
              <Text style={styles.quickCardSub}>Dual-layer chat with AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickCard, { backgroundColor: '#ffd7f3' }]}
              onPress={() => onNavigateToTab('matches')}
              activeOpacity={0.8}
            >
              <FontAwesome name="users" size={22} color="#702c68" style={{ marginBottom: 8 }} />
              <Text style={[styles.quickCardTitle, { color: '#390036' }]}>Language DNA</Text>
              <Text style={[styles.quickCardSub, { color: '#88437f' }]}>Explore matches nearby</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Language Matches Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Registered Partners</Text>
            <TouchableOpacity onPress={() => onNavigateToTab('matches')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {registeredUsers.length > 0 ? (
            registeredUsers.slice(0, 3).map((match, idx) => {
              const nativeFlag = getFlagForLang(match.nativeLanguage);
              const targetFlag = getFlagForLang(match.learningLanguage);
              const mName = match.displayName || match.username || match.email.split('@')[0];
              const mAvatar = (match.avatar && match.avatar.startsWith('http'))
                ? match.avatar
                : (match.photoURL && match.photoURL.startsWith('http'))
                ? match.photoURL
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}&background=4B1A56&color=ffffff&size=256`;

              return (
                <TouchableOpacity
                  key={match.id || match.email || idx}
                  style={styles.matchCard}
                  onPress={() => onStartChatWithUser && onStartChatWithUser({
                    displayName: mName,
                    avatar: mAvatar,
                    email: match.email,
                  })}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: mAvatar }}
                    style={styles.matchAvatar}
                  />

                  <View style={styles.matchInfo}>
                    <Text style={styles.matchName}>
                      {mName}
                    </Text>
                    <Text style={styles.matchLangText}>
                      Native: {nativeFlag} {match.nativeLanguage || 'English'} ⇄ Learns: {targetFlag} {match.learningLanguage || 'Japanese'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.chatActionBtn}
                    onPress={() => onStartChatWithUser && onStartChatWithUser({
                      displayName: mName,
                      avatar: mAvatar,
                      email: match.email,
                    })}
                  >
                    <FontAwesome name="comment" size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyRegisteredBox}>
              <Text style={styles.emptyRegisteredText}>
                No other users registered yet. Register a second account to start real live chat testing!
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff7fc',
  },
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
    backgroundColor: 'rgba(255, 215, 243, 0.4)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(253, 168, 237, 0.25)',
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#320034',
    letterSpacing: -0.5,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffd7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#320034',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b4482',
  },
  storiesContainer: {
    paddingBottom: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 66,
  },
  addStoryRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#320034',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF5F9',
    position: 'relative',
  },
  addIconMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4B1A56',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  storyAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#4B1A56',
    padding: 2,
    position: 'relative',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4f434c',
    marginTop: 5,
    textAlign: 'center',
  },
  noStoriesNotice: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  noStoriesText: {
    fontSize: 12,
    color: '#80737d',
    fontStyle: 'italic',
  },

  heroCard: {
    backgroundColor: '#320034',
    borderRadius: 28,
    padding: 22,
    marginVertical: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(253, 168, 237, 0.15)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 243, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffd7f3',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 25,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12.5,
    color: '#f8ebf5',
    lineHeight: 17,
    marginBottom: 18,
  },
  heroButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd7f3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  heroSearchText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#320034',
  },
  heroVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  heroVoiceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
  },
  quickCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#320034',
    marginBottom: 2,
  },
  quickCardSub: {
    fontSize: 11,
    color: '#702c68',
  },

  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  matchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4B1A56',
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1c1b1f',
  },
  matchLangText: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  chatActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4B1A56',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRegisteredBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  emptyRegisteredText: {
    fontSize: 12.5,
    color: '#80737d',
    textAlign: 'center',
    lineHeight: 18,
  },
});
