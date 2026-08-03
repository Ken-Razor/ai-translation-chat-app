import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DARK_THEME } from '../theme/colors';

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
  theme = DARK_THEME
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = theme.mode === 'dark';

  // Extract shared media items (photos & documents sent in chat)
  const sharedMedia = messages.filter(m => m.imageUri || (m.originalText && m.originalText.includes('Document:')));
  const sharedVoiceNotes = messages.filter(m => m.isVoiceNote);

  // Filter messages by search query if non-empty
  const searchResults = searchQuery.trim()
    ? messages.filter(m =>
        (m.originalText && m.originalText.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.translatedText && m.translatedText.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleConfirmClear = () => {
    Alert.alert(
      "Clear Chat History",
      "Are you sure you want to delete all messages in this conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            onClearHistory();
            onClose();
          }
        }
      ]
    );
  };

  const getLangName = (code) => {
    const langs = {
      zh: 'Chinese (Simplified)',
      es: 'Spanish',
      ja: 'Japanese',
      fr: 'French',
      de: 'German',
      ko: 'Korean',
      en: 'English'
    };
    return langs[code] || 'Chinese (Simplified)';
  };

  const cardStyle = {
    backgroundColor: theme.card,
    borderColor: theme.border,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]} onPress={onClose}>
          <FontAwesome name="arrow-left" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Info</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large Profile Hero Card */}
        <View style={[styles.heroSection, cardStyle]}>
          <View style={[styles.avatarCircle, { backgroundColor: partnerUser?.avatarColor || (isDark ? '#1E293B' : '#E2E8F0'), borderColor: '#38BDF8', overflow: 'hidden' }]}>
            {partnerUser?.avatarUrl ? (
              <Image source={{ uri: partnerUser.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
            ) : (
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' }}>
                {partnerUser?.displayName ? partnerUser.displayName.charAt(0).toUpperCase() : (partnerEmail ? partnerEmail.charAt(0).toUpperCase() : 'F')}
              </Text>
            )}
            <View style={[styles.onlineStatusBadge, { borderColor: theme.card }]} />
          </View>
          <Text style={[styles.friendName, { color: theme.text }]}>
            {partnerUser?.displayName || (partnerEmail ? partnerEmail.split('@')[0] : 'Friend')}
          </Text>
          <Text style={[styles.friendEmail, { color: theme.subtext }]}>
            {partnerEmail} {partnerUser?.uid ? `• 🆔 ${partnerUser.uid}` : ''}
          </Text>
          <Text style={styles.statusSubText}>Active now • BridgeTalk AI End-to-End Encrypted</Text>

          {/* Action Row: Call & Video Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.callActionBtn} onPress={onStartVoiceCall}>
              <FontAwesome name="phone" size={18} color="#38BDF8" />
              <Text style={styles.callActionText}>Voice Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.callActionBtn} onPress={onStartVideoCall}>
              <FontAwesome name="video-camera" size={18} color="#38BDF8" />
              <Text style={styles.callActionText}>Video Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search in Chat Section */}
        <View style={[styles.sectionCard, cardStyle]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔍 Search Conversation</Text>
          <View style={[styles.searchBarContainer, { backgroundColor: isDark ? '#0B0F19' : '#F1F5F9', borderColor: theme.border }]}>
            <FontAwesome name="search" size={14} color={theme.subtext} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search messages, translations, words..."
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome name="times-circle" size={16} color={theme.subtext} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Display */}
          {searchQuery.trim().length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchCountText}>
                {searchResults.length} matching message{searchResults.length === 1 ? '' : 's'} found:
              </Text>
              {searchResults.map((m, idx) => (
                <View key={m.id || idx} style={[styles.searchItemCard, { backgroundColor: isDark ? '#0B0F19' : '#F1F5F9', borderColor: theme.border }]}>
                  <Text style={styles.searchItemSender}>
                    {m.sender === 'user' ? 'You' : partnerEmail.split('@')[0]}
                  </Text>
                  <Text style={[styles.searchItemText, { color: theme.text }]}>{m.originalText}</Text>
                  {m.translatedText && (
                    <Text style={styles.searchItemSub}>{m.translatedText}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Translation Settings Section */}
        <View style={[styles.sectionCard, cardStyle]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🌐 AI Translation Settings</Text>
          <TouchableOpacity style={styles.settingRow} onPress={onOpenLangPicker}>
            <View style={styles.settingLeft}>
              <View style={styles.iconSquare}>
                <FontAwesome name="language" size={16} color="#38BDF8" />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: theme.subtext }]}>Target Translation Language</Text>
                <Text style={[styles.settingValue, { color: theme.text }]}>{getLangName(targetLang)}</Text>
              </View>
            </View>
            <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* Shared Media & Files History Gallery */}
        <View style={[styles.sectionCard, cardStyle]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🖼️ Shared Photos & Files ({sharedMedia.length})</Text>
          </View>

          {sharedMedia.length === 0 ? (
            <Text style={[styles.emptyMediaText, { color: theme.subtext }]}>No shared photos or documents in this chat yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaGalleryRow}>
              {sharedMedia.map((m, idx) => (
                <TouchableOpacity
                  key={m.id || idx}
                  style={[styles.mediaItemCard, { backgroundColor: isDark ? '#0B0F19' : '#F1F5F9', borderColor: theme.border }]}
                  onPress={() => m.imageUri && onViewImage && onViewImage(m.imageUri)}
                >
                  {m.imageUri ? (
                    <Image source={{ uri: m.imageUri }} style={styles.mediaImage} />
                  ) : (
                    <View style={styles.docFileSquare}>
                      <FontAwesome name="file-text" size={24} color="#38BDF8" />
                      <Text style={[styles.docFileName, { color: theme.subtext }]} numberOfLines={1}>
                        {m.originalText.replace('📄 Document: ', '')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Shared Voice Notes Count */}
          <View style={[styles.voiceNoteCountRow, { borderTopColor: theme.border }]}>
            <FontAwesome name="microphone" size={14} color="#F59E0B" style={{ marginRight: 8 }} />
            <Text style={styles.voiceNoteCountText}>
              {sharedVoiceNotes.length} Voice Note{sharedVoiceNotes.length === 1 ? '' : 's'} recorded
            </Text>
          </View>
        </View>

        {/* Danger Zone: Clear Chat History */}
        <View style={[styles.sectionCard, cardStyle]}>
          <TouchableOpacity style={styles.clearHistoryBtn} onPress={handleConfirmClear}>
            <FontAwesome name="trash-o" size={18} color="#EF4444" style={{ marginRight: 10 }} />
            <Text style={styles.clearHistoryText}>Clear Chat History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroSection: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
    borderWidth: 2,
  },
  onlineStatusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 3,
  },
  friendName: {
    fontSize: 20,
    fontWeight: '700',
  },
  friendEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  statusSubText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 18,
  },
  callActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  callActionText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  searchResultsContainer: {
    marginTop: 12,
  },
  searchCountText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  searchItemCard: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  searchItemSender: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  searchItemText: {
    fontSize: 13,
  },
  searchItemSub: {
    color: '#D97706',
    fontSize: 12,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyMediaText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  mediaGalleryRow: {
    flexDirection: 'row',
  },
  mediaItemCard: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  docFileSquare: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  docFileName: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  voiceNoteCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  voiceNoteCountText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  clearHistoryText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
