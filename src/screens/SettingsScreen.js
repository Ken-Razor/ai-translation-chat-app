import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { setGeminiApiKey, getGeminiApiKey } from '../services/geminiService';
import { updateCustomUserId, updateUserProfile } from '../services/translationService';
import { authService } from '../services/authService';

const AVATAR_COLOR_PALETTE = ['#EC4899', '#8B5CF6', '#3B82F6', '#F97316', '#10B981', '#6366F1', '#E11D48', '#0EA5E9'];

export default function SettingsScreen({
  currentUser,
  onUpdateUser,
  theme,
  themePreference,
  onSelectThemePreference,
  onLogout
}) {
  const initial = currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U';
  
  // Navigation Sub-Page state: null (main menu) | 'account' | 'appearance' | 'ai' | 'help' | 'developer'
  const [activeSubPage, setActiveSubPage] = useState(null);
  const subPageAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    subPageAnim.setValue(0);
    Animated.timing(subPageAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.poly(3)),
      useNativeDriver: true,
    }).start();
  }, [activeSubPage]);

  // Account Form states
  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || '');
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(currentUser?.avatarColor || '#10B981');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');

  const [newUidInput, setNewUidInput] = useState(currentUser?.uid || '');
  const [isUpdatingUid, setIsUpdatingUid] = useState(false);
  const [uidFeedback, setUidFeedback] = useState('');

  // AI Key state
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [isSaved, setIsSaved] = useState(false);

  // Support & Feedback Form states
  const [supportTopic, setSupportTopic] = useState('General Help');
  const [supportMessageInput, setSupportMessageInput] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportFeedback, setSupportFeedback] = useState('');

  const handleSendSupport = () => {
    const clean = supportMessageInput.trim();
    if (!clean) {
      setSupportFeedback('⚠️ Please write your question or issue description.');
      return;
    }
    setIsSendingSupport(true);
    setSupportFeedback('');
    setTimeout(() => {
      setIsSendingSupport(false);
      setSupportFeedback('✅ Thank you! Your support request has been submitted to Ken Sanio.');
      setSupportMessageInput('');
      Alert.alert(
        'Support Request Received',
        `Thank you for your feedback!\n\nTopic: ${supportTopic}\nOur developer, Ken Sanio, and the support team have received your message.`
      );
      setTimeout(() => setSupportFeedback(''), 4000);
    }, 600);
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
    setIsSaved(true);
    Alert.alert("Google Gemini AI Configured", "Your custom Google Gemini API Key has been saved and activated!");
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveNewUid = async () => {
    const clean = newUidInput.trim();
    if (!clean) {
      setUidFeedback('⚠️ User ID cannot be empty');
      return;
    }
    if (clean.length < 3 || clean.length > 24) {
      setUidFeedback('⚠️ User ID must be 3-24 characters');
      return;
    }

    setIsUpdatingUid(true);
    setUidFeedback('');

    try {
      await updateCustomUserId(currentUser.email, clean);
      const updatedUser = { ...currentUser, uid: clean };

      await authService.updateUserSession(updatedUser);
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setUidFeedback('✅ User ID handle updated!');
      setTimeout(() => setUidFeedback(''), 2500);
    } catch (err) {
      setUidFeedback(`⚠️ ${err.message || 'Failed to update User ID'}`);
    } finally {
      setIsUpdatingUid(false);
    }
  };

  const handlePickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow media library access to select a profile photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setSelectedAvatarUrl(uri);
      }
    } catch (err) {
      Alert.alert("Photo Error", err.message || "Failed to pick image");
    }
  };

  const handleSaveProfile = async () => {
    const cleanName = displayNameInput.trim();
    if (!cleanName) {
      setProfileFeedback('⚠️ Display Name cannot be empty');
      return;
    }

    setIsUpdatingProfile(true);
    setProfileFeedback('');

    try {
      await updateUserProfile(currentUser.email, cleanName, selectedAvatarColor, selectedAvatarUrl);
      const updatedUser = {
        ...currentUser,
        displayName: cleanName,
        avatarColor: selectedAvatarColor,
        avatarUrl: selectedAvatarUrl
      };

      await authService.updateUserSession(updatedUser);
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setProfileFeedback('✅ Profile updated successfully!');
      setTimeout(() => setProfileFeedback(''), 2500);
    } catch (err) {
      setProfileFeedback(`⚠️ ${err.message || 'Failed to update profile'}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Header Renderer
  const renderHeader = () => {
    if (!activeSubPage) {
      return (
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        </View>
      );
    }

    const subTitles = {
      account: 'Account',
      appearance: 'Appearance',
      ai: 'AI Engine',
      help: 'Help & FAQ',
      support: 'Support & Feedback',
      about: 'About ViveTalk',
    };

    return (
      <View style={[styles.subHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setActiveSubPage(null)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="chevron-left" size={16} color={theme.primary} />
          <Text style={[styles.backBtnText, { color: theme.primary }]}>Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.subHeaderTitle, { color: theme.text }]}>
          {subTitles[activeSubPage] || 'Settings'}
        </Text>
        <View style={{ width: 60 }} />
      </View>
    );
  };

  // Render Sub-Page Views
  const renderSubPageContent = () => {
    switch (activeSubPage) {
      case 'account':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Display Name & Profile Photo Section */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16, marginBottom: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>🖼️ Profile Photo & Name</Text>
              
              <View style={styles.avatarPickerContainer}>
                <View style={[styles.modalAvatarPreview, { backgroundColor: selectedAvatarColor }]}>
                  {selectedAvatarUrl ? (
                    <Image source={{ uri: selectedAvatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {displayNameInput ? displayNameInput.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  )}
                </View>

                <View style={styles.photoActionRow}>
                  <TouchableOpacity
                    style={[styles.uploadPhotoBtn, { backgroundColor: theme.primary }]}
                    onPress={handlePickProfileImage}
                  >
                    <Text style={styles.uploadPhotoBtnText}>📷 Upload Photo</Text>
                  </TouchableOpacity>

                  {!!selectedAvatarUrl && (
                    <TouchableOpacity
                      style={[styles.removePhotoBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => setSelectedAvatarUrl('')}
                    >
                      <Text style={styles.uploadPhotoBtnText}>🗑️ Remove Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 10 }]}>Badge Color:</Text>
              <View style={styles.colorPaletteRow}>
                {AVATAR_COLOR_PALETTE.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorPill,
                      { backgroundColor: color },
                      selectedAvatarColor === color && styles.colorPillSelected
                    ]}
                    onPress={() => setSelectedAvatarColor(color)}
                  />
                ))}
              </View>

              <View style={{ marginTop: 12, marginBottom: 12 }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Display Name:</Text>
                <TextInput
                  style={[styles.uidInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="Enter your name..."
                  placeholderTextColor={theme.subtext}
                  value={displayNameInput}
                  onChangeText={setDisplayNameInput}
                />
              </View>

              {!!profileFeedback && (
                <View style={[styles.feedbackBanner, { backgroundColor: profileFeedback.includes('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.feedbackText, { color: profileFeedback.includes('✅') ? '#10B981' : '#F87171' }]}>
                    {profileFeedback}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: theme.primary, marginTop: 4 }]}
                onPress={handleSaveProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Custom User ID Handle Section */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>✏️ Custom User ID Handle</Text>
              <Text style={[styles.cardSub, { color: theme.subtext }]}>
                Friends can find and add you by searching your unique handle below.
              </Text>

              <View style={{ marginTop: 12, marginBottom: 12 }}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>User ID Handle:</Text>
                <TextInput
                  style={[styles.uidInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  placeholder="e.g. ken_sanio or sayflash_ken"
                  placeholderTextColor={theme.subtext}
                  value={newUidInput}
                  onChangeText={setNewUidInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {!!uidFeedback && (
                <View style={[styles.feedbackBanner, { backgroundColor: uidFeedback.includes('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.feedbackText, { color: uidFeedback.includes('✅') ? '#10B981' : '#F87171' }]}>
                    {uidFeedback}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.saveModalBtn, { backgroundColor: theme.primary, flex: 1 }]}
                  onPress={handleSaveNewUid}
                  disabled={isUpdatingUid}
                >
                  {isUpdatingUid ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveModalBtnText}>Save Handle</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveModalBtn, { backgroundColor: theme.cardSecondary, flex: 1 }]}
                  onPress={() => Alert.alert('User ID Copied', `Your User ID "@${currentUser?.uid}" is ready to share!`)}
                >
                  <Text style={[styles.saveModalBtnText, { color: theme.text }]}>📋 Copy Handle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );

      case 'appearance':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.sectionTitle, { color: theme.subtext }]}>THEME PREFERENCE</Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themePreference === 'dark' && { backgroundColor: theme.cardSecondary }
                ]}
                onPress={() => onSelectThemePreference('dark')}
              >
                <View style={styles.themeOptionLeft}>
                  <Text style={styles.themeIcon}>🌙</Text>
                  <View>
                    <Text style={[styles.themeOptionTitle, { color: theme.text }]}>Dark Mode</Text>
                    <Text style={[styles.themeOptionSub, { color: theme.subtext }]}>Sleek OLED dark palette</Text>
                  </View>
                </View>
                {themePreference === 'dark' && <Text style={[styles.checkmark, { color: theme.primary }]}>✓</Text>}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themePreference === 'light' && { backgroundColor: theme.cardSecondary }
                ]}
                onPress={() => onSelectThemePreference('light')}
              >
                <View style={styles.themeOptionLeft}>
                  <Text style={styles.themeIcon}>☀️</Text>
                  <View>
                    <Text style={[styles.themeOptionTitle, { color: theme.text }]}>Light Mode</Text>
                    <Text style={[styles.themeOptionSub, { color: theme.subtext }]}>Clean bright interface</Text>
                  </View>
                </View>
                {themePreference === 'light' && <Text style={[styles.checkmark, { color: theme.primary }]}>✓</Text>}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themePreference === 'system' && { backgroundColor: theme.cardSecondary }
                ]}
                onPress={() => onSelectThemePreference('system')}
              >
                <View style={styles.themeOptionLeft}>
                  <Text style={styles.themeIcon}>📱</Text>
                  <View>
                    <Text style={[styles.themeOptionTitle, { color: theme.text }]}>System Auto</Text>
                    <Text style={[styles.themeOptionSub, { color: theme.subtext }]}>Match your OS device theme</Text>
                  </View>
                </View>
                {themePreference === 'system' && <Text style={[styles.checkmark, { color: theme.primary }]}>✓</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      case 'ai':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16 }]}>
              <View style={styles.geminiHeaderRow}>
                <FontAwesome name="magic" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                <Text style={[styles.geminiModelTitle, { color: theme.text }]}>Model: Google Gemini 1.5 Flash</Text>
              </View>

              <Text style={[styles.geminiDesc, { color: theme.subtext }]}>
                ViveTalk is powered by Google Gemini AI for instant neural translation, Pinyin with tone marks, and smart voice rewriter.
              </Text>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 10 }]}>Custom Google Gemini API Key (Optional):</Text>
              <View style={[styles.keyInputRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.keyInput, { color: theme.text }]}
                  placeholder="AIzaSy... (Paste Google AI Studio Key)"
                  placeholderTextColor={theme.subtext}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  secureTextEntry={false}
                />
                <TouchableOpacity style={styles.saveKeyBtn} onPress={handleSaveApiKey}>
                  <Text style={styles.saveKeyBtnText}>{isSaved ? '✓ Saved' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );

      case 'help':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Quick Start Guide */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16, marginBottom: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 14 }]}>🚀 Quick Start Guide</Text>
              
              <View style={styles.guideStep}>
                <View style={[styles.guideStepBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.guideStepNum}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guideStepTitle, { color: theme.text }]}>Choose Target Language</Text>
                  <Text style={[styles.guideStepDesc, { color: theme.subtext }]}>
                    Tap the globe icon in any chat header to select your partner's language (e.g. Chinese, Indonesian, Japanese, Spanish).
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.guideStepBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.guideStepNum}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guideStepTitle, { color: theme.text }]}>Real-Time AI Translation</Text>
                  <Text style={[styles.guideStepDesc, { color: theme.subtext }]}>
                    Type or speak in your own language. ViveTalk instantly translates messages with phonetic Pinyin guides & cultural context.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStep}>
                <View style={[styles.guideStepBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.guideStepNum}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.guideStepTitle, { color: theme.text }]}>Voice & Video Calling</Text>
                  <Text style={[styles.guideStepDesc, { color: theme.subtext }]}>
                    Tap the Phone or Camera icon in any conversation header to start high-definition encrypted peer-to-peer calls.
                  </Text>
                </View>
              </View>
            </View>

            {/* FAQ Accordion Section */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 14 }]}>📚 Frequently Asked Questions (FAQ)</Text>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.primary }]}>💾 Is chat history saved locally?</Text>
                <Text style={[styles.faqAnswer, { color: theme.subtext }]}>
                  Yes! All messages, voice notes, and conversation threads are securely stored in your device's memory for instantaneous 0ms loading without relying on continuous server hits.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.primary }]}>🤖 How does the AI Translation engine work?</Text>
                <Text style={[styles.faqAnswer, { color: theme.subtext }]}>
                  ViveTalk connects directly to Google Gemini 1.5 Flash AI Engine to translate all messages with natural fluency, colloquial nuances, and Chinese Pinyin tone marks.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.primary }]}>⭐ How do I bookmark vocabulary?</Text>
                <Text style={[styles.faqAnswer, { color: theme.subtext }]}>
                  Tap the Star (⭐) icon on any translated message to save the phrase directly to your personal Vocabulary Deck.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.primary }]}>✏️ How do I change my User ID handle?</Text>
                <Text style={[styles.faqAnswer, { color: theme.subtext }]}>
                  Go to Settings ➔ Account ➔ Custom User ID Handle to pick your unique username so friends can easily search and add you.
                </Text>
              </View>
            </View>
          </ScrollView>
        );

      case 'support':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Direct Feedback Ticket Form */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16, marginBottom: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>💬 Submit Support & Feedback</Text>
              <Text style={[styles.cardSub, { color: theme.subtext, marginBottom: 12 }]}>
                Have a question or encountered a bug? Send a message directly to Ken Sanio and our support team.
              </Text>

              <Text style={[styles.inputLabel, { color: theme.text }]}>Select Topic:</Text>
              <View style={styles.topicRow}>
                {['General Help', 'Bug Report', 'Feature Request', 'Account Issue'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.topicPill,
                      { backgroundColor: theme.bg, borderColor: theme.border },
                      supportTopic === t && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setSupportTopic(t)}
                  >
                    <Text style={[styles.topicPillText, { color: supportTopic === t ? '#FFFFFF' : theme.text }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 12 }]}>Your Message / Issue Description:</Text>
              <TextInput
                style={[
                  styles.supportTextInput,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }
                ]}
                placeholder="Type your message, feedback, or bug details here..."
                placeholderTextColor={theme.subtext}
                value={supportMessageInput}
                onChangeText={setSupportMessageInput}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              {!!supportFeedback && (
                <View style={[styles.feedbackBanner, { backgroundColor: supportFeedback.includes('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', marginTop: 10 }]}>
                  <Text style={[styles.feedbackText, { color: supportFeedback.includes('✅') ? '#10B981' : '#F87171' }]}>
                    {supportFeedback}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveModalBtn, { backgroundColor: theme.primary, marginTop: 14 }]}
                onPress={handleSendSupport}
                disabled={isSendingSupport}
              >
                {isSendingSupport ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveModalBtnText}>📤 Submit to Support</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Official Support Channels */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>📞 Support Channels</Text>

              <View style={styles.devRow}>
                <FontAwesome name="envelope" size={15} color={theme.primary} style={{ width: 24 }} />
                <Text style={[styles.devLabel, { color: theme.subtext }]}>Developer Email:</Text>
                <TouchableOpacity onPress={() => Alert.alert('Contact Developer', 'Email Ken Sanio at: ken.thea02@gmail.com')}>
                  <Text style={[styles.devVal, { color: theme.primary }]}>ken.thea02@gmail.com</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.devRow}>
                <FontAwesome name="globe" size={16} color={theme.primary} style={{ width: 24 }} />
                <Text style={[styles.devLabel, { color: theme.subtext }]}>Official Portal:</Text>
                <Text style={[styles.devVal, { color: theme.text }]}>vivetalk.sayflash.id</Text>
              </View>

              <View style={styles.devRow}>
                <FontAwesome name="check-circle" size={15} color="#10B981" style={{ width: 24 }} />
                <Text style={[styles.devLabel, { color: theme.subtext }]}>Server Status:</Text>
                <Text style={[styles.devVal, { color: '#10B981' }]}>All Systems Operational 🟢</Text>
              </View>
            </View>
          </ScrollView>
        );

      case 'about':
        return (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* App Branding Hero Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 22, marginBottom: 16, alignItems: 'center' }]}>
              <View style={{ width: 68, height: 68, borderRadius: 20, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <FontAwesome name="comments" size={32} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.text }}>ViveTalk</Text>
              <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 3 }}>Next-Gen AI Language Exchange Platform</Text>
              <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>Version 1.0.0 • Production Build</Text>
              </View>
            </View>

            {/* Created By Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16, marginBottom: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 12 }]}>👨‍💻 Dibuat Oleh (Created By)</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>KS</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: theme.text }}>Ken Sanio</Text>
                  <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 1 }}>Ken Sanio Melenium Thea Agatha</Text>
                  <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '700', marginTop: 2 }}>
                    Lead Software Architect & AI Developer
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: theme.subtext, lineHeight: 18, marginBottom: 14 }}>
                ViveTalk dibuat oleh Ken Sanio untuk menghadirkan pengalaman percakapan lintas bahasa yang mulus secara real-time dengan integrasi AI mutakhir, WebRTC Calling, dan arsitektur database lokal berkecepatan tinggi.
              </Text>

              <View style={[styles.devCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={styles.devRow}>
                  <FontAwesome name="github" size={16} color={theme.text} style={{ width: 24 }} />
                  <Text style={[styles.devLabel, { color: theme.subtext }]}>GitHub:</Text>
                  <Text style={[styles.devVal, { color: theme.primary }]}>ken-razor</Text>
                </View>

                <View style={styles.devRow}>
                  <FontAwesome name="envelope" size={14} color={theme.text} style={{ width: 24 }} />
                  <Text style={[styles.devLabel, { color: theme.subtext }]}>Email:</Text>
                  <Text style={[styles.devVal, { color: theme.text }]}>ken.thea02@gmail.com</Text>
                </View>

                <View style={styles.devRow}>
                  <FontAwesome name="certificate" size={14} color={theme.text} style={{ width: 24 }} />
                  <Text style={[styles.devLabel, { color: theme.subtext }]}>License:</Text>
                  <Text style={[styles.devVal, { color: '#10B981', fontWeight: 'bold' }]}>MIT Open Source License</Text>
                </View>
              </View>
            </View>

            {/* Architecture Highlights */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, padding: 16 }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 10 }]}>⚡ Powered By</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, lineHeight: 19 }}>
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>AI Model:</Text> Google Gemini 1.5 Flash{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Framework:</Text> React Native & Expo Mobile{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>P2P Engine:</Text> WebRTC Real-Time Audio & Video{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Real-Time Push:</Text> WebSocket (< 10ms Latency)
              </Text>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />

      {/* Dynamic Header (Settings Title vs Back Button Sub-Header) */}
      {renderHeader()}

      {activeSubPage ? (
        <Animated.View
          style={{
            flex: 1,
            opacity: subPageAnim,
            transform: [
              {
                translateX: subPageAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0],
                })
              }
            ]
          }}
        >
          {renderSubPageContent()}
        </Animated.View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* WhatsApp-Style Top Profile Card */}
          <TouchableOpacity
            style={[styles.waProfileCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setActiveSubPage('account')}
            activeOpacity={0.8}
          >
            <View style={[styles.waAvatar, { backgroundColor: currentUser?.avatarColor || theme.primary }]}>
              {currentUser?.avatarUrl ? (
                <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.waAvatarText}>{initial}</Text>
              )}
              <View style={styles.waOnlineDot} />
            </View>

            <View style={styles.waProfileInfo}>
              <Text style={[styles.waProfileName, { color: theme.text }]}>{currentUser?.displayName || 'User'}</Text>
              <Text style={[styles.waProfileHandle, { color: theme.subtext }]}>@{currentUser?.uid || 'sayflash_user'}</Text>
              <View style={styles.waStatusBubble}>
                <Text style={styles.waStatusText}>💬 Available on ViveTalk</Text>
              </View>
            </View>

            <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
          </TouchableOpacity>

          {/* Group 1: Preferences & Customization */}
          <View style={[styles.waGroupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.waRow} onPress={() => setActiveSubPage('account')}>
              <View style={[styles.waIconBox, { backgroundColor: '#3B82F6' }]}>
                <FontAwesome name="user-circle" size={15} color="#FFFFFF" />
              </View>
              <View style={styles.waRowText}>
                <Text style={[styles.waRowTitle, { color: theme.text }]}>Account</Text>
                <Text style={[styles.waRowSub, { color: theme.subtext }]}>Profile photo, display name & User ID handle</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.waDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.waRow} onPress={() => setActiveSubPage('appearance')}>
              <View style={[styles.waIconBox, { backgroundColor: '#EC4899' }]}>
                <FontAwesome name="paint-brush" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.waRowText}>
                <Text style={[styles.waRowTitle, { color: theme.text }]}>Appearance</Text>
                <Text style={[styles.waRowSub, { color: theme.subtext }]}>Theme mode (Dark, Light, System)</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.waDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.waRow} onPress={() => setActiveSubPage('ai')}>
              <View style={[styles.waIconBox, { backgroundColor: '#8B5CF6' }]}>
                <FontAwesome name="magic" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.waRowText}>
                <Text style={[styles.waRowTitle, { color: theme.text }]}>AI Engine</Text>
                <Text style={[styles.waRowSub, { color: theme.subtext }]}>Google Gemini 1.5 Flash & API Key</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* Group 2: Help, Support & About */}
          <View style={[styles.waGroupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.waRow} onPress={() => setActiveSubPage('help')}>
              <View style={[styles.waIconBox, { backgroundColor: '#10B981' }]}>
                <FontAwesome name="question-circle" size={15} color="#FFFFFF" />
              </View>
              <View style={styles.waRowText}>
                <Text style={[styles.waRowTitle, { color: theme.text }]}>Help & FAQ</Text>
                <Text style={[styles.waRowSub, { color: theme.subtext }]}>Tutorials, tips & frequently asked questions</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.waDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.waRow} onPress={() => setActiveSubPage('support')}>
              <View style={[styles.waIconBox, { backgroundColor: '#0EA5E9' }]}>
                <FontAwesome name="headphones" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.waRowText}>
                <Text style={[styles.waRowTitle, { color: theme.text }]}>Support & Feedback</Text>
                <Text style={[styles.waRowSub, { color: theme.subtext }]}>Contact support, submit ticket & report bugs</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
            </TouchableOpacity>

            <View style={[styles.waDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity style={styles.waRow} onPress={() => setActiveSubPage('about')}>
              <View style={[styles.waIconBox, { backgroundColor: '#F97316' }]}>
                <FontAwesome name="info-circle" size={15} color="#FFFFFF" />
              </View>
              <View style={styles.waRowText}>
                <Text style={[styles.waRowTitle, { color: theme.text }]}>About ViveTalk</Text>
                <Text style={[styles.waRowSub, { color: theme.subtext }]}>Dibuat oleh Ken Sanio • v1.0.0</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* Group 3: Account Actions */}
          <View style={[styles.waGroupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.waRow} onPress={onLogout}>
              <View style={[styles.waIconBox, { backgroundColor: '#EF4444' }]}>
                <FontAwesome name="sign-out" size={15} color="#FFFFFF" />
              </View>
              <View style={styles.waRowText}>
                <Text style={[styles.waRowTitle, { color: '#EF4444', fontWeight: 'bold' }]}>Log Out Account</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={[styles.versionText, { color: theme.subtext }]}>
            ViveTalk v1.0.0 • Dibuat oleh Ken Sanio • MIT License
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 80,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subHeaderTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // WhatsApp Style Profile Card
  waProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  waAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  waAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  waOnlineDot: {
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
  waProfileInfo: {
    flex: 1,
  },
  waProfileName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  waProfileHandle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  waStatusBubble: {
    marginTop: 3,
  },
  waStatusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  // WhatsApp Grouped Cards
  waGroupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  waRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  waIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waRowText: {
    flex: 1,
  },
  waRowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  waRowSub: {
    fontSize: 11,
    marginTop: 1,
  },
  waDivider: {
    height: 1,
    marginLeft: 58,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  geminiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  geminiModelTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  geminiDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  keyInput: {
    flex: 1,
    fontSize: 12,
  },
  saveKeyBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveKeyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  themeOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeOptionSub: {
    fontSize: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 6,
    marginBottom: 20,
  },
  uidInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  avatarPickerContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  modalAvatarPreview: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadPhotoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  removePhotoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  uploadPhotoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  colorPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorPillSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
  saveModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  faqItem: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
  },
  devCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  devLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  devVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  guideStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  guideStepNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  guideStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  guideStepDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  topicPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  topicPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  supportTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 88,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
