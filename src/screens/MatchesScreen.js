import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { voiceService } from '../services/voiceService';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { imageCacheService } from '../services/imageCacheService';
import CachedImage from '../components/CachedImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const LANGUAGE_FILTERS = [
  { id: 'all', label: 'All Languages', flag: '🌐' },
  { id: 'en',  label: 'English', flag: '🇺🇸' },
  { id: 'id',  label: 'Indonesian', flag: '🇮🇩' },
  { id: 'ja',  label: 'Japanese', flag: '🇯🇵' },
  { id: 'es',  label: 'Spanish',  flag: '🇪🇸' },
  { id: 'zh',  label: 'Chinese',  flag: '🇨🇳' },
  { id: 'fr',  label: 'French',   flag: '🇫🇷' },
  { id: 'ko',  label: 'Korean',   flag: '🇰🇷' },
];

export default function MatchesScreen({ onStartChatWithPartner }) {
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedLangFilter, setSelectedLangFilter] = useState('all');
  const [onlineOnlyFilter, setOnlineOnlyFilter] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [likesReceived, setLikesReceived] = useState([]);
  const [isLikesModalVisible, setIsLikesModalVisible] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [matchedModalUser, setMatchedModalUser] = useState(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.7)).current;

  // Fetch real registered users from backend API
  const fetchRegisteredUsers = useCallback(async () => {
    try {
      const allUsers = await authService.getAllUsers();
      const currentUser = authService.getCurrentUser();
      const currentEmail = (currentUser?.email || '').toLowerCase();
      const interactedMap = await storageService.getInteractedUsers(currentEmail);
      const localChatList = await storageService.getLocalChatList(currentEmail);
      const chatEmails = new Set((localChatList || []).map(c => (c.email || '').toLowerCase()));

      // Exclude currently logged in user AND already liked/passed/matched/chatted users
      const otherUsers = (allUsers || []).filter(u => {
        const uEmail = (u.email || '').toLowerCase();
        const uId = (u.id || '').toLowerCase();
        if (!uEmail || uEmail === currentEmail) return false;
        if (interactedMap[uEmail] || (uId && interactedMap[uId])) return false;
        if (chatEmails.has(uEmail)) return false;
        return true;
      });

      // Map users to match card model
      const formattedProfiles = otherUsers.map((u, idx) => {
        const nativeDetails = getLangDetails(u.nativeLanguage);
        const learningDetails = getLangDetails(u.learningLanguage);

        return {
          id: u.id || u.email || `usr_${idx}`,
          email: u.email,
          name: u.displayName || u.username || u.email.split('@')[0],
          username: u.username ? (u.username.startsWith('@') ? u.username : `@${u.username}`) : `@${(u.displayName || 'user').toLowerCase().replace(/\s+/g, '_')}`,
          photo: (u.avatar && u.avatar.startsWith('http'))
            ? u.avatar
            : (u.photoURL && u.photoURL.startsWith('http'))
            ? u.photoURL
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.email)}&background=4B1A56&color=ffffff&size=256`,
          native: nativeDetails.name,
          nativeFlag: nativeDetails.flag,
          nativeLangCode: (u.nativeLanguage || 'en').toLowerCase(),
          learning: learningDetails.name,
          learningFlag: learningDetails.flag,
          learningLevel: u.learningLevel ? u.learningLevel.toUpperCase() : 'INTERMEDIATE',
          matchScore: `${90 + (idx * 3) % 9}%`,
          bio: u.bio || 'Looking for a friendly language exchange partner to practice conversations!',
          interests: Array.isArray(u.interests) && u.interests.length > 0
            ? u.interests
            : ['☕ Coffee Shops', '💻 Tech & Coding', '✈️ Travel & Culture'],
          voiceAudioUri: u.voiceAudioUri || null,
          voiceDuration: u.voiceDuration || '0:05',
          voiceIntroText: u.voiceIntroText || `Hello! I speak ${nativeDetails.name} and I am learning ${learningDetails.name}. Let's chat!`,
          voiceIntroLang: u.nativeLanguage || 'en',
          isOnline: true,
          icebreaker: Array.isArray(u.interests) && u.interests.length > 0
            ? `Ask about ${u.interests[0]}!`
            : `What is your favorite phrase in ${nativeDetails.name}?`,
        };
      });

      setProfiles(formattedProfiles);
      setCurrentIndex(0);
      imageCacheService.preloadUserAvatars(formattedProfiles);
    } catch (err) {
      console.warn('Failed to load registered users for matches:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRegisteredUsers();
  }, [fetchRegisteredUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegisteredUsers();
  };

  useEffect(() => {
    return () => {
      voiceService.stopPlayback();
      Speech.stop();
    };
  }, [currentIndex]);

  // Filtered dataset
  const filteredProfiles = profiles.filter(p => {
    const matchesLang = selectedLangFilter === 'all' || p.nativeLangCode === selectedLangFilter;
    const matchesOnline = !onlineOnlyFilter || p.isOnline;
    return matchesLang && matchesOnline;
  });

  const hasActiveFilters = selectedLangFilter !== 'all' || onlineOnlyFilter;
  const currentProfile = (filteredProfiles.length > 0 && currentIndex < filteredProfiles.length)
    ? filteredProfiles[currentIndex]
    : (filteredProfiles.length > 0 ? filteredProfiles[0] : null);

  const handlePlayVoiceIntro = async (profile = currentProfile) => {
    if (!profile) return;
    if (isPlayingAudio) {
      voiceService.stopPlayback();
      Speech.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    if (profile.voiceAudioUri) {
      await voiceService.playAudio(profile.voiceAudioUri, () => {
        setIsPlayingAudio(false);
      });
    } else if (profile.voiceIntroText) {
      Speech.speak(profile.voiceIntroText, {
        language: profile.voiceIntroLang || 'en',
        rate: 0.95,
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
        onStopped: () => setIsPlayingAudio(false),
      });
    } else {
      setIsPlayingAudio(false);
    }
  };

  const handlePass = async () => {
    if (!currentProfile) return;
    const target = currentProfile;
    voiceService.stopPlayback();
    Speech.stop();
    setIsPlayingAudio(false);

    const currentUser = authService.getCurrentUser();
    const currentEmail = (currentUser?.email || '').toLowerCase();
    if (currentEmail && target) {
      if (target.email) storageService.saveInteractedUser(currentEmail, target.email, 'passed');
      if (target.id) storageService.saveInteractedUser(currentEmail, target.id, 'passed');
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setProfiles(prev => prev.filter(p => p.id !== target.id && p.email !== target.email));
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleLike = async (targetProfile = currentProfile) => {
    if (!targetProfile) return;
    const target = targetProfile;
    voiceService.stopPlayback();
    Speech.stop();
    setIsPlayingAudio(false);

    const currentUser = authService.getCurrentUser();
    const currentEmail = (currentUser?.email || '').toLowerCase();
    if (currentEmail && target) {
      if (target.email) storageService.saveInteractedUser(currentEmail, target.email, 'liked');
      if (target.id) storageService.saveInteractedUser(currentEmail, target.id, 'liked');
    }

    setMatchedModalUser(target);
    modalScaleAnim.setValue(0.7);
    Animated.spring(modalScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start();

    setProfiles(prev => prev.filter(p => p.id !== target.id && p.email !== target.email));
  };

  const handleSuperLike = () => {
    handleLike(currentProfile);
  };

  const handleStartChatFromMatch = (userToChat) => {
    setMatchedModalUser(null);
    if (onStartChatWithPartner && userToChat) {
      onStartChatWithPartner({
        id: userToChat.id || userToChat.email,
        name: userToChat.name,
        email: userToChat.email,
        avatar: userToChat.photo,
        nativeLanguage: userToChat.native,
      });
    }
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 6;
  const bottomBarHeight = (insets.bottom > 0 ? insets.bottom : 16) + 68;

  return (
    <View style={styles.container}>
      {/* Symmetrical Top Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        {/* Left Action: Language Filter Sheet */}
        <TouchableOpacity
          style={[styles.headerSideBtn, hasActiveFilters && styles.headerSideBtnActive]}
          onPress={() => setIsFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <FontAwesome name="sliders" size={17} color={hasActiveFilters ? '#FFFFFF' : '#4B1A56'} />
          {hasActiveFilters && <View style={styles.activeFilterDot} />}
        </TouchableOpacity>

        {/* Center Title */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Language Matches</Text>
          <Text style={styles.headerSubtitle}>
            {filteredProfiles.length} registered {filteredProfiles.length === 1 ? 'partner' : 'partners'} nearby
          </Text>
        </View>

        {/* Right Action: Refresh registered users */}
        <TouchableOpacity
          style={styles.headerSideBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <FontAwesome name="refresh" size={16} color="#4B1A56" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#4B1A56" />
          <Text style={styles.loadingText}>Fetching registered language partners...</Text>
        </View>
      ) : filteredProfiles.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome name="check-circle" size={40} color="#4B1A56" />
            </View>
            <Text style={styles.emptyTitle}>You're All Caught Up! 🎉</Text>
            <Text style={styles.emptySub}>
              You have explored all language partners available right now. Start a conversation with your matches in Chats!
            </Text>

            <TouchableOpacity
              style={styles.refreshEmptyBtn}
              onPress={async () => {
                const currentUser = authService.getCurrentUser();
                const currentEmail = (currentUser?.email || '').toLowerCase();
                await storageService.clearInteractedUsers(currentEmail);
                fetchRegisteredUsers();
              }}
              activeOpacity={0.8}
            >
              <FontAwesome name="refresh" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.refreshEmptyBtnText}>Review All Partners Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.cardWrapper, { paddingBottom: bottomBarHeight }]}>
          {currentProfile && (
            <Animated.View
              style={[
                styles.profileCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <ScrollView
                style={styles.cardScrollView}
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* 1. Photo Showcase with embedded voice pill */}
                <View style={styles.photoContainer}>
                  <CachedImage
                    source={{ uri: currentProfile.photo }}
                    style={styles.profilePhoto}
                    fallbackUri={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile.name)}&background=4B1A56&color=ffffff&size=256`}
                  />

                  <LinearGradient
                    colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.photoGradient}
                  />

                  {/* Top Badges on Photo */}
                  <View style={styles.photoTopBadges}>
                    <View style={styles.synergyBadge}>
                      <Text style={styles.synergyText}>✨ {currentProfile.matchScore} Synergy</Text>
                    </View>

                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineGreenDot} />
                      <Text style={styles.onlineBadgeText}>Live</Text>
                    </View>
                  </View>

                  {/* Embedded Micro Voice Note Pill */}
                  <TouchableOpacity
                    style={[styles.voiceIntroPill, isPlayingAudio && styles.voiceIntroPillActive]}
                    onPress={() => handlePlayVoiceIntro(currentProfile)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.voicePlayMiniBtn}>
                      <FontAwesome
                        name={isPlayingAudio ? 'pause' : 'volume-up'}
                        size={12}
                        color="#4B1A56"
                      />
                    </View>
                    <Text style={styles.voiceIntroPillText}>
                      {isPlayingAudio ? 'Playing...' : currentProfile.voiceAudioUri ? `Voice Note (${currentProfile.voiceDuration})` : 'Voice Greeting'}
                    </Text>
                    <View style={styles.waveformMicroBars}>
                      <View style={[styles.microBar, { height: isPlayingAudio ? 12 : 5 }]} />
                      <View style={[styles.microBar, { height: isPlayingAudio ? 16 : 8 }]} />
                      <View style={[styles.microBar, { height: isPlayingAudio ? 10 : 4 }]} />
                      <View style={[styles.microBar, { height: isPlayingAudio ? 14 : 7 }]} />
                    </View>
                  </TouchableOpacity>

                  {/* Name & Handle on Photo Bottom */}
                  <View style={styles.photoBottomInfo}>
                    <Text style={styles.photoNameText}>{currentProfile.name}</Text>
                    <Text style={styles.photoHandleText}>{currentProfile.username}</Text>
                  </View>
                </View>

                {/* 2. Structured Card Details Body */}
                <View style={styles.cardDetailsBody}>
                  {/* Language Exchange DNA Rows */}
                  <View style={styles.langExchangeBox}>
                    <View style={styles.langRow}>
                      <View style={styles.langRowLeft}>
                        <Text style={styles.langFlag}>{currentProfile.nativeFlag}</Text>
                        <View>
                          <Text style={styles.langLabel}>NATIVE LANGUAGE</Text>
                          <Text style={styles.langValue}>{currentProfile.native}</Text>
                        </View>
                      </View>
                      <View style={styles.langLevelPill}>
                        <Text style={styles.langLevelPillText}>NATIVE</Text>
                      </View>
                    </View>

                    <View style={styles.langDivider} />

                    <View style={styles.langRow}>
                      <View style={styles.langRowLeft}>
                        <Text style={styles.langFlag}>{currentProfile.learningFlag}</Text>
                        <View>
                          <Text style={styles.langLabel}>WANTS TO LEARN</Text>
                          <Text style={styles.langValue}>{currentProfile.learning}</Text>
                        </View>
                      </View>
                      <View style={[styles.langLevelPill, { backgroundColor: '#F3E8FF' }]}>
                        <Text style={[styles.langLevelPillText, { color: '#7C3AED' }]}>
                          {currentProfile.learningLevel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bio & Goal */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>ABOUT & LEARNING GOAL</Text>
                    <Text style={styles.bioBodyText}>{currentProfile.bio}</Text>
                  </View>

                  {/* Topic Interests Pills */}
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionHeading}>FAVORITE TOPICS</Text>
                    <View style={styles.interestsPillsWrap}>
                      {currentProfile.interests.map((interest, idx) => (
                        <View key={idx} style={styles.interestTagPill}>
                          <Text style={styles.interestTagText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Icebreaker Prompt Box */}
                  <View style={styles.icebreakerCard}>
                    <View style={styles.icebreakerHeader}>
                      <FontAwesome name="bolt" size={13} color="#D97706" style={{ marginRight: 6 }} />
                      <Text style={styles.icebreakerTitle}>Suggested Icebreaker</Text>
                    </View>
                    <Text style={styles.icebreakerText}>"{currentProfile.icebreaker}"</Text>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          )}

          {/* Floating Action Buttons Dock */}
          <View style={styles.floatingActionDock}>
            <TouchableOpacity style={styles.actionPassBtn} onPress={handlePass} activeOpacity={0.8}>
              <FontAwesome name="times" size={24} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionSuperBtn} onPress={handleSuperLike} activeOpacity={0.8}>
              <FontAwesome name="star" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionLikeBtn} onPress={() => handleLike(currentProfile)} activeOpacity={0.8}>
              <FontAwesome name="heart" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========================================================
          IT'S A MATCH CELEBRATION MODAL
      ======================================================== */}
      <Modal visible={!!matchedModalUser} transparent animationType="fade">
        <View style={styles.matchModalOverlay}>
          <Animated.View style={[styles.matchModalCard, { transform: [{ scale: modalScaleAnim }] }]}>
            <View style={styles.matchBadgePill}>
              <Text style={styles.matchBadgePillText}>🎉 IT'S A MATCH!</Text>
            </View>

            <Text style={styles.matchTitle}>Language Partners Connected!</Text>
            <Text style={styles.matchSub}>
              You and <Text style={{ fontWeight: '800', color: '#4B1A56' }}>{matchedModalUser?.name}</Text> can now practice languages together!
            </Text>

            {/* Avatars Collision */}
            <View style={styles.matchAvatarRow}>
              <CachedImage
                source={{ uri: matchedModalUser?.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400' }}
                style={styles.matchUserImg}
              />
            </View>

            <TouchableOpacity
              style={styles.startChatBtn}
              onPress={() => handleStartChatFromMatch(matchedModalUser)}
              activeOpacity={0.88}
            >
              <FontAwesome name="commenting" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.startChatBtnText}>Send First Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepBrowsingBtn}
              onPress={() => setMatchedModalUser(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.keepBrowsingBtnText}>Keep Browsing Partners</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ========================================================
          FILTER BOTTOM SHEET MODAL
      ======================================================== */}
      <Modal visible={isFilterModalVisible} transparent animationType="slide">
        <View style={styles.filterModalOverlay}>
          <View style={[styles.filterSheetCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filter Matches</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <FontAwesome name="times" size={18} color="#80737d" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterGroupLabel}>NATIVE LANGUAGE</Text>
            <View style={styles.filterChipsRow}>
              {LANGUAGE_FILTERS.map(item => {
                const isSelected = selectedLangFilter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedLangFilter(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.filterChipFlag}>{item.flag}</Text>
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setIsFilterModalVisible(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.applyFilterBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  headerSideBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF5FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    position: 'relative',
  },
  headerSideBtnActive: {
    backgroundColor: '#4B1A56',
    borderColor: '#4B1A56',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#320034',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#80737d',
    fontWeight: '600',
    marginTop: 1,
  },

  // Center Loading & Empty State
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#80737d',
    fontWeight: '600',
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    maxWidth: 380,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#320034',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#80737d',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  refreshEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B1A56',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
  },
  refreshEmptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Card Container
  cardWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  profileCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#4B1A56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardScrollView: {
    flex: 1,
  },
  cardScrollContent: {
    paddingBottom: 20,
  },

  // Photo Showcase
  photoContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.38,
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  photoTopBadges: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  synergyBadge: {
    backgroundColor: 'rgba(75, 26, 86, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  synergyText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  onlineGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Voice Pill on Photo
  voiceIntroPill: {
    position: 'absolute',
    top: 50,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  voiceIntroPillActive: {
    backgroundColor: '#FDF2F8',
    borderColor: '#EC4899',
    borderWidth: 1,
  },
  voicePlayMiniBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIntroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B1A56',
  },
  waveformMicroBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  microBar: {
    width: 2.5,
    backgroundColor: '#C026D3',
    borderRadius: 1.25,
  },

  // Photo Bottom Info
  photoBottomInfo: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
  },
  photoNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photoHandleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9A8D4',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Card Body Details
  cardDetailsBody: {
    padding: 16,
    gap: 14,
  },
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
  langRowLeft: {
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1c1b1f',
  },
  langLevelPill: {
    backgroundColor: '#FFF0FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  langLevelPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B1A56',
  },
  langDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },

  infoSection: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#80737d',
    letterSpacing: 0.8,
  },
  bioBodyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  interestsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestTagPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  interestTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B1A56',
  },

  icebreakerCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  icebreakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icebreakerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  icebreakerText: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
  },

  // Floating Actions Dock
  floatingActionDock: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  actionPassBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionSuperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLikeBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },

  // Match Celebration Modal
  matchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  matchModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  matchBadgePill: {
    backgroundColor: '#FFF0FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  matchBadgePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4B1A56',
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#320034',
    textAlign: 'center',
    marginBottom: 6,
  },
  matchSub: {
    fontSize: 13,
    color: '#80737d',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  matchAvatarRow: {
    marginBottom: 20,
  },
  matchUserImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#4B1A56',
  },
  startChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B1A56',
    width: '100%',
    height: 48,
    borderRadius: 18,
    marginBottom: 10,
  },
  startChatBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  keepBrowsingBtn: {
    paddingVertical: 8,
  },
  keepBrowsingBtnText: {
    fontSize: 13,
    color: '#80737d',
    fontWeight: '600',
  },

  // Filter Sheet Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#320034',
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#80737d',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#4B1A56',
    borderColor: '#4B1A56',
  },
  filterChipFlag: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  applyFilterBtn: {
    backgroundColor: '#4B1A56',
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
