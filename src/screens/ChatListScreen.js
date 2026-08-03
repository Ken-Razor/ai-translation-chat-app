import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Modal,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import {
  fetchUserList,
  fetchPeerMessages,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  fetchFriendRequests
} from '../services/translationService';

const AVATAR_COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#F97316', '#10B981', '#6366F1'];

export default function ChatListScreen({
  activeTab: controlledTab = 'chats',
  onSelectTab,
  currentUser,
  onSelectChat,
  onOpenProfile,
  theme,
  themePreference,
  onToggleTheme
}) {
  const [internalTab, setInternalTab] = useState(controlledTab);

  useEffect(() => {
    if (controlledTab && (controlledTab === 'chats' || controlledTab === 'contacts')) {
      setInternalTab(controlledTab);
    }
  }, [controlledTab]);

  const activeTab = controlledTab || internalTab;

  const handleTabChange = (tab) => {
    setInternalTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  const [userList, setUserList] = useState([]);
  const [chatPreviews, setChatPreviews] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTranslationOn, setIsTranslationOn] = useState(true);

  // Friend Request States
  // Live profile state synced with backend database
  const [myProfile, setMyProfile] = useState(currentUser);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [localAddedFriends, setLocalAddedFriends] = useState([]);

  // Search & Add Friend Modal States
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingFriendEmail, setAddingFriendEmail] = useState('');
  const [modalFeedback, setModalFeedback] = useState('');

  const displayUser = myProfile || currentUser;
  const userInitial = displayUser?.displayName ? displayUser.displayName.charAt(0).toUpperCase() : 'J';

  const loadChats = async () => {
    if (!currentUser) return;

    // Fetch user list & active previews
    const users = await fetchUserList();
    
    // Sync current user's profile live from backend (updates friends list automatically)
    const me = users.find(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (me) {
      setMyProfile(me);
    }

    const filtered = users.filter(u => u.email.toLowerCase() !== currentUser.email.toLowerCase());
    setUserList(filtered);

    const previews = {};
    for (const u of filtered) {
      const msgs = await fetchPeerMessages(currentUser.email, u.email);
      if (msgs && msgs.length > 0) {
        previews[u.email] = msgs[msgs.length - 1];
      }
    }
    setChatPreviews(previews);

    // Fetch pending friend requests
    const reqs = await fetchFriendRequests(currentUser.email);
    setReceivedRequests(reqs.received || []);
    setSentRequests(reqs.sent || []);

    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      if (!currentUser) return;
      await loadChats();
    };

    poll();
    const interval = setInterval(poll, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleSearchFriend = async (text) => {
    setFriendSearchInput(text);
    if (!text.trim()) {
      setSearchResults([]);
      setModalFeedback('');
      return;
    }
    setIsSearching(true);
    setModalFeedback('');
    try {
      const results = await searchUsers(text, currentUser?.email || '');
      setSearchResults(results);
      if (results.length === 0) {
        setModalFeedback(`No users found matching "${text}". Try searching by User ID (e.g. iam_go_5800) or email.`);
      }
    } catch (err) {
      setModalFeedback('Error searching for users.');
    } finally {
      setIsSearching(false);
    }
  };

  // Friend Request Actions
  const handleSendRequestSubmit = async (targetUser) => {
    setAddingFriendEmail(targetUser.email);
    setModalFeedback('');
    try {
      const queryKey = targetUser.uid || targetUser.email;
      await sendFriendRequest(currentUser.email, queryKey);
      setSentRequests(prev => [...prev, targetUser.email.toLowerCase()]);
      setModalFeedback(`📩 Friend request sent to ${targetUser.displayName || targetUser.email}!`);
      await loadChats();
    } catch (err) {
      setModalFeedback(`⚠️ ${err.message || 'Failed to send friend request'}`);
    } finally {
      setAddingFriendEmail('');
    }
  };

  const handleAcceptRequest = async (senderEmail) => {
    try {
      await acceptFriendRequest(currentUser.email, senderEmail);
      setLocalAddedFriends(prev => [...prev, senderEmail]);
      await loadChats();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (senderEmail) => {
    try {
      await declineFriendRequest(currentUser.email, senderEmail);
      await loadChats();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to decline friend request');
    }
  };

  // Contacts = Only users explicitly added as friends or with active chat history
  const friendList = [
    ...(myProfile?.friends || []),
    ...(currentUser?.friends || []),
    ...localAddedFriends
  ];

  const contactUsers = userList.filter(u => {
    const isFriend = friendList.some(f =>
      f.toLowerCase() === u.email.toLowerCase() ||
      (u.uid && f.toLowerCase() === u.uid.toLowerCase())
    ) || !!chatPreviews[u.email];

    if (!isFriend) return false;

    return (
      (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.uid && u.uid.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Chats = Only contacts with whom you have active message history
  const chatUsers = contactUsers.filter(u => !!chatPreviews[u.email]);

  const currentTabUsers = activeTab === 'chats' ? chatUsers : contactUsers;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

      {/* Top Header Bar */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {activeTab === 'chats' ? 'ViveTalk' : 'Contacts'}
        </Text>
      </View>



      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
          placeholder={activeTab === 'chats' ? "Search active chats..." : "Search contacts by name, email, or User ID..."}
          placeholderTextColor={theme.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Pending Friend Requests Section (Shown on Contacts tab if requests exist) */}
      {activeTab === 'contacts' && receivedRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <View style={styles.requestsHeaderRow}>
            <Text style={[styles.requestsHeaderTitle, { color: theme.primary }]}>
              📩 PENDING FRIEND REQUESTS ({receivedRequests.length})
            </Text>
          </View>

          {receivedRequests.map(reqUser => (
            <View key={reqUser.email} style={[styles.requestCard, { backgroundColor: theme.card, borderColor: theme.primary }]}>
              <View style={[styles.requestAvatar, { backgroundColor: reqUser.avatarColor || theme.primary }]}>
                <Text style={styles.requestAvatarText}>
                  {reqUser.displayName ? reqUser.displayName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>

              <View style={styles.requestInfo}>
                <Text style={[styles.requestName, { color: theme.text }]}>
                  {reqUser.displayName || reqUser.email}
                </Text>
                <Text style={[styles.requestId, { color: theme.primary }]}>
                  🆔 {reqUser.uid || 'user_id'}
                </Text>
              </View>

              <View style={styles.requestActionRow}>
                <TouchableOpacity
                  style={[styles.acceptBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => handleAcceptRequest(reqUser.email)}
                >
                  <Text style={styles.actionBtnText}>✅ Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.declineBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleDeclineRequest(reqUser.email)}
                >
                  <Text style={styles.actionBtnText}>✕ Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>
          {activeTab === 'chats' ? 'ACTIVE CONVERSATIONS' : `FRIENDS LIST (${contactUsers.length})`}
        </Text>
        {activeTab === 'contacts' && (
          <TouchableOpacity
            style={styles.addFriendTextLink}
            onPress={() => {
              setShowAddFriendModal(true);
              setFriendSearchInput('');
              setSearchResults([]);
              setModalFeedback('');
            }}
          >
            <Text style={[styles.addFriendTextLinkTitle, { color: theme.primary }]}>🔍 Search & Add Friend</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main List Rendering */}
      <FlatList
        data={currentTabUsers}
        keyExtractor={item => item.uid || item.email}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const preview = chatPreviews[item.email];
          const initial = item.displayName ? item.displayName.charAt(0).toUpperCase() : item.email.charAt(0).toUpperCase();
          const avatarBg = AVATAR_COLORS[index % AVATAR_COLORS.length];

          return (
            <TouchableOpacity
              style={[styles.chatRow, { borderBottomColor: theme.border }]}
              onPress={() => onSelectChat(item.email)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarWrapper}>
                <View style={[styles.contactAvatar, { backgroundColor: item.avatarColor || avatarBg }]}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.contactAvatarText}>{initial}</Text>
                  )}
                </View>
                <View style={[styles.onlineDot, { borderColor: theme.card }]} />
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.titleRow}>
                  <Text style={[styles.contactName, { color: theme.text }]} numberOfLines={1}>
                    {item.displayName || item.email}
                  </Text>
                  {activeTab === 'chats' && preview && (
                    <Text style={[styles.timestamp, { color: theme.subtext }]}>
                      {preview.timestamp || '12:50 PM'}
                    </Text>
                  )}
                </View>

                <View style={styles.subRow}>
                  <Text style={[styles.userIdBadge, { color: theme.primary }]}>
                    🆔 {item.uid || 'sayflash_user'}
                  </Text>
                  <Text style={[styles.langTagText, { color: theme.subtext }]}>
                    • {item.nativeLanguage === 'zh' ? 'Chinese 🇨🇳' : 'English 🇺🇸'}
                  </Text>
                </View>

                <Text style={[styles.previewText, { color: theme.subtext }]} numberOfLines={1}>
                  {activeTab === 'chats'
                    ? preview ? preview.originalText : 'No messages yet'
                    : `Tap to open instant real-time translation chat`}
                </Text>
              </View>

              {activeTab === 'contacts' && (
                <TouchableOpacity
                  style={[styles.chatActionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => onSelectChat(item.email)}
                >
                  <Text style={styles.chatActionBtnText}>💬 Chat</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <ActivityIndicator color={theme.primary} size="large" />
            ) : activeTab === 'chats' ? (
              <>
                <Text style={styles.emptyIconText}>💬</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Active Conversations</Text>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>
                  You don't have any ongoing chat threads yet. Select a contact from your Phonebook to start talking!
                </Text>
                <TouchableOpacity
                  style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
                  onPress={() => handleTabChange('contacts')}
                >
                  <Text style={styles.emptyAddBtnText}>📇 Go to Contacts & Phonebook</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.emptyIconText}>📇</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>There's no contact yet</Text>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>
                  Your friends list is currently empty. Send a friend request using their User ID or email to connect!
                </Text>
                <TouchableOpacity
                  style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowAddFriendModal(true);
                    setFriendSearchInput('');
                    setSearchResults([]);
                    setModalFeedback('');
                  }}
                >
                  <Text style={styles.emptyAddBtnText}>➕ Add a Friend Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      {/* 🔍 SEARCH & ADD FRIEND MODAL */}
      <Modal visible={showAddFriendModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.addFriendModalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>🔍 Find Friends</Text>
                <Text style={[styles.modalSub, { color: theme.subtext }]}>
                  Your User ID: <Text style={{ color: theme.primary, fontWeight: '700' }}>{displayUser?.uid || 'iam_go_user'}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: theme.cardSecondary }]}
                onPress={() => setShowAddFriendModal(false)}
              >
                <Text style={[styles.closeModalBtnText, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBox}>
              <TextInput
                style={[styles.modalSearchInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                placeholder="Enter User ID (e.g. iam_go_5800) or Email..."
                placeholderTextColor={theme.subtext}
                value={friendSearchInput}
                onChangeText={handleSearchFriend}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isSearching && <ActivityIndicator style={styles.searchSpinner} color={theme.primary} />}
            </View>

            {/* Modal Feedback Banner */}
            {!!modalFeedback && (
              <View style={[styles.feedbackBanner, { backgroundColor: modalFeedback.includes('✅') || modalFeedback.includes('📩') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={[styles.feedbackText, { color: modalFeedback.includes('✅') || modalFeedback.includes('📩') ? '#10B981' : '#F87171' }]}>
                  {modalFeedback}
                </Text>
              </View>
            )}

            {/* Search Results List */}
            <FlatList
              data={searchResults}
              keyExtractor={item => item.uid || item.email}
              style={styles.modalResultsList}
              renderItem={({ item }) => {
                const initial = item.displayName ? item.displayName.charAt(0).toUpperCase() : item.email.charAt(0).toUpperCase();
                const isAdding = addingFriendEmail === item.email;
                const isAlreadyFriend = friendList.some(f => f.toLowerCase() === item.email.toLowerCase() || (item.uid && f.toLowerCase() === item.uid.toLowerCase()));
                const isPendingSent = sentRequests.some(s => s.toLowerCase() === item.email.toLowerCase());
                const isReceivedReq = receivedRequests.some(r => r.email.toLowerCase() === item.email.toLowerCase());

                return (
                  <View style={[styles.friendResultCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[styles.resultAvatar, { backgroundColor: item.avatarColor || theme.primary }]}>
                      <Text style={styles.resultAvatarText}>{initial}</Text>
                    </View>

                    <View style={styles.resultDetails}>
                      <Text style={[styles.resultName, { color: theme.text }]}>{item.displayName || 'Sayflash User'}</Text>
                      <Text style={[styles.resultId, { color: theme.primary }]}>🆔 ID: {item.uid || 'user_id'}</Text>
                      <Text style={[styles.resultEmail, { color: theme.subtext }]}>{item.email}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addResultBtn,
                        {
                          backgroundColor: isAlreadyFriend
                            ? '#10B981'
                            : isReceivedReq
                            ? '#3B82F6'
                            : isPendingSent
                            ? theme.cardSecondary
                            : theme.primary
                        }
                      ]}
                      onPress={() => {
                        if (isAlreadyFriend) {
                          setShowAddFriendModal(false);
                          onSelectChat(item.email);
                        } else if (isReceivedReq) {
                          handleAcceptRequest(item.email);
                        } else if (!isPendingSent) {
                          handleSendRequestSubmit(item);
                        }
                      }}
                      disabled={isAdding || isPendingSent}
                    >
                      {isAdding ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={[styles.addResultBtnText, isPendingSent && { color: theme.subtext }]}>
                          {isAlreadyFriend
                            ? '💬 Chat'
                            : isReceivedReq
                            ? '✅ Accept'
                            : isPendingSent
                            ? '⏳ Pending'
                            : '📩 Request'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                !isSearching && !friendSearchInput ? (
                  <View style={styles.emptyModalState}>
                    <Text style={styles.emptyModalIcon}>👥</Text>
                    <Text style={[styles.emptyModalTitle, { color: theme.text }]}>Find Friends by User ID</Text>
                    <Text style={[styles.emptyModalSub, { color: theme.subtext }]}>
                      Type a friend's unique User ID (like <Text style={{ color: theme.primary }}>iam_go_5800</Text>) or email address above to send them a friend request!
                    </Text>
                  </View>
                ) : null
              }
            />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  idBadgeRow: {
    marginTop: 1,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addFriendHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  iconBtn: {
    padding: 4,
  },
  iconBtnText: {
    fontSize: 18,
  },
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  langDropdown: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  langDropdownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  requestsSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  requestsHeaderRow: {
    paddingVertical: 6,
  },
  requestsHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
    gap: 10,
  },
  requestAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 13,
    fontWeight: '700',
  },
  requestId: {
    fontSize: 11,
    fontWeight: '700',
  },
  requestActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  declineBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  addFriendTextLink: {
    paddingVertical: 2,
  },
  addFriendTextLinkTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contactAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
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
  },
  chatInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 11,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  userIdBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewText: {
    fontSize: 12,
  },
  langTagText: {
    fontSize: 11,
  },
  chatActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  chatActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconText: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  addFriendModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSearchBox: {
    position: 'relative',
    marginBottom: 12,
  },
  modalSearchInput: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  searchSpinner: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  feedbackBanner: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalResultsList: {
    maxHeight: 300,
  },
  friendResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultDetails: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultId: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  resultEmail: {
    fontSize: 11,
  },
  addResultBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addResultBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyModalState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyModalIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyModalSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
