import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { fetchUserList, fetchPeerMessages } from '../services/translationService';

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

export default function ChatListScreen({
  currentUser,
  onSelectChat,
  onOpenProfile,
  onOpenVocab,
  theme,
  themePreference,
  onToggleTheme
}) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const myEmail = (currentUser?.email || '').toLowerCase();

  // 1. Instant 0ms Load from Local Storage Cache on Mount
  useEffect(() => {
    if (!myEmail) return;
    storageService.getLocalChatList(myEmail).then(cached => {
      if (Array.isArray(cached) && cached.length > 0) {
        setChatList(cached);
        setLoading(false);
      }
    });
  }, [myEmail]);

  // Load real registered users from backend and fetch recent conversation snippet
  const loadConversations = useCallback(async () => {
    try {
      const serverUsers = await fetchUserList();
      if (Array.isArray(serverUsers)) {
        // Exclude currently logged in user
        const otherUsers = serverUsers.filter(u => u.email && u.email.toLowerCase() !== myEmail);

        const formattedList = await Promise.all(
          otherUsers.map(async (u) => {
            const peerEmail = u.email.toLowerCase();
            let lastMsgText = u.bio || 'Tap to start conversation';
            let timestamp = 'Active now';
            let unread = 0;

            try {
              const msgs = await fetchPeerMessages(myEmail, peerEmail);
              if (Array.isArray(msgs) && msgs.length > 0) {
                // Filter out call signal messages
                const normalMsgs = msgs.filter(m => {
                  const orig = m.originalText || m.text || '';
                  return !orig.includes('[CALL_') && !orig.includes('[AUDIO_CHUNK:') && !orig.includes('[VIDEO_FRAME:');
                });

                if (normalMsgs.length > 0) {
                  const lastMsg = normalMsgs[normalMsgs.length - 1];
                  lastMsgText = lastMsg.originalText || lastMsg.text || 'Photo / Voice Note';
                  if (lastMsg.timestamp) {
                    const d = new Date(lastMsg.timestamp);
                    timestamp = isNaN(d.getTime())
                      ? 'Recently'
                      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                }
              }
            } catch (msgErr) {}

            const nativeFlag = getFlagForLang(u.nativeLanguage);
            const targetFlag = getFlagForLang(u.learningLanguage);

            return {
              id: u.id || u.email,
              email: u.email,
              displayName: u.displayName || u.username || u.email.split('@')[0],
              username: u.username ? (u.username.startsWith('@') ? u.username : `@${u.username}`) : '',
              lastMessage: lastMsgText,
              timestamp: timestamp,
              unread: unread,
              nativeLang: u.nativeLanguage || 'English',
              learningLang: u.learningLanguage || 'Japanese',
              nativeFlag: nativeFlag,
              avatar: (u.avatar && u.avatar.startsWith('http'))
                ? u.avatar
                : (u.photoURL && u.photoURL.startsWith('http'))
                ? u.photoURL
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.email)}&background=4B1A56&color=ffffff&size=256`,
              online: true,
            };
          })
        );

        setChatList(formattedList);
        // Persist locally for instant future loads
        if (myEmail) {
          storageService.saveLocalChatList(myEmail, formattedList);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh conversation list:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [myEmail]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
  };

  const filteredChats = chatList.filter(c =>
    (c.displayName && c.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.nativeLang && c.nativeLang.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 6;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View>
          <Text style={styles.headerTitle}>Chats</Text>
          <Text style={styles.headerSub}>
            {chatList.length} registered {chatList.length === 1 ? 'partner' : 'partners'}
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <FontAwesome name="refresh" size={15} color="#4B1A56" />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={15} color="#80737d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search partners by name or language..."
            placeholderTextColor="#80737d"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <FontAwesome name="times-circle" size={15} color="#80737d" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chats List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#4B1A56" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <FontAwesome name="comment-o" size={32} color="#4B1A56" />
          </View>
          <Text style={styles.emptyTitle}>No Conversations Yet</Text>
          <Text style={styles.emptySub}>
            Register another account or find language partners in the Matches tab to start chatting!
          </Text>
          <TouchableOpacity style={styles.refreshEmptyBtn} onPress={onRefresh} activeOpacity={0.8}>
            <FontAwesome name="refresh" size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.refreshEmptyBtnText}>Refresh Chats</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.email}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => onSelectChat && onSelectChat(item.email)}
              activeOpacity={0.7}
            >
              {/* Avatar & Online Dot */}
              <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                <View style={styles.onlineDot} />
              </View>

              {/* Chat Info */}
              <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                  <Text style={styles.partnerName} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  <Text style={styles.timestampText}>{item.timestamp}</Text>
                </View>

                {/* Language Pair Pill */}
                <View style={styles.langPairRow}>
                  <Text style={styles.langPillText}>
                    {item.nativeFlag} {item.nativeLang} ⇄ {item.targetFlag} {item.learningLang}
                  </Text>
                </View>

                <Text style={styles.lastMsgText} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#320034',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#80737d',
    fontWeight: '600',
    marginTop: 1,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF5FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FA',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1c1b1f',
  },

  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#4B1A56',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  chatInfo: {
    flex: 1,
    gap: 2,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1c1b1f',
    letterSpacing: -0.2,
    flex: 1,
  },
  timestampText: {
    fontSize: 11,
    color: '#80737d',
    fontWeight: '600',
    marginLeft: 6,
  },
  langPairRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  langPillText: {
    fontSize: 11,
    color: '#4B1A56',
    fontWeight: '700',
    backgroundColor: '#FFF0FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lastMsgText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#320034',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#80737d',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  refreshEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4B1A56',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  refreshEmptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
