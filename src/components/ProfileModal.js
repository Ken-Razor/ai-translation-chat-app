import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Switch, ScrollView } from 'react-native';

export default function ProfileModal({ visible, onClose, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'notifications' | 'privacy'

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || 'Jordan Davis');
  const [username, setUsername] = useState('@' + (user?.email ? user.email.split('@')[0] : 'jordan.davis'));
  const [email, setEmail] = useState(user?.email || 'jordan.davis@company.com');
  const [department, setDepartment] = useState('Product Engineering');

  // Toggle states (Figma Screenshots 4 & 5)
  const [newMessages, setNewMessages] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [smartReplySuggestions, setSmartReplySuggestions] = useState(true);
  const [translationUpdates, setTranslationUpdates] = useState(false);
  const [emailDigest, setEmailDigest] = useState(false);

  const [readReceipts, setReadReceipts] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [translationHistory, setTranslationHistory] = useState(false);
  const [smartReplyData, setSmartReplyData] = useState(true);

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Account Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Main Layout: Sidebar + Content */}
          <View style={styles.bodyLayout}>
            {/* Left Navigation Sidebar */}
            <View style={styles.sidebar}>
              <TouchableOpacity
                style={[styles.sidebarItem, activeTab === 'profile' && styles.sidebarItemActive]}
                onPress={() => setActiveTab('profile')}
              >
                <Text style={[styles.sidebarItemText, activeTab === 'profile' && styles.sidebarItemTextActive]}>
                  👤 Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sidebarItem, activeTab === 'notifications' && styles.sidebarItemActive]}
                onPress={() => setActiveTab('notifications')}
              >
                <Text style={[styles.sidebarItemText, activeTab === 'notifications' && styles.sidebarItemTextActive]}>
                  🔔 Notifications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sidebarItem, activeTab === 'privacy' && styles.sidebarItemActive]}
                onPress={() => setActiveTab('privacy')}
              >
                <Text style={[styles.sidebarItemText, activeTab === 'privacy' && styles.sidebarItemTextActive]}>
                  🛡️ Privacy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem}>
                <Text style={styles.sidebarItemText}>⚙️ Appearance</Text>
              </TouchableOpacity>

              <View style={styles.sidebarSpacer} />

              <TouchableOpacity style={styles.signOutBtn} onPress={onLogout}>
                <Text style={styles.signOutText}>🚪 Sign out</Text>
              </TouchableOpacity>
            </View>

            {/* Right Tab Content Container */}
            <ScrollView style={styles.tabContentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
              {activeTab === 'profile' && (
                <View>
                  {/* Avatar & Info */}
                  <View style={styles.avatarRow}>
                    <View style={styles.avatarWrapper}>
                      <View style={[styles.avatar, { backgroundColor: user.avatarColor || '#8B5CF6' }]}>
                        <Text style={styles.avatarText}>
                          {displayName ? displayName.charAt(0).toUpperCase() : 'J'}
                        </Text>
                      </View>
                      <View style={styles.cameraBadge}>
                        <Text style={styles.cameraBadgeText}>📷</Text>
                      </View>
                    </View>

                    <View>
                      <Text style={styles.heroName}>{displayName}</Text>
                      <Text style={styles.heroEmail}>{email}</Text>
                      <Text style={styles.heroStatus}>● Online</Text>
                    </View>
                  </View>

                  {/* Form Inputs */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Display Name</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={displayName}
                      onChangeText={setDisplayName}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Username</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Department</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={department}
                      onChangeText={setDepartment}
                    />
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
                    <Text style={styles.saveBtnText}>Save changes</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'notifications' && (
                <View style={styles.switchList}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>New messages</Text>
                      <Text style={styles.switchSub}>Get notified for every new message</Text>
                    </View>
                    <Switch value={newMessages} onValueChange={setNewMessages} trackColor={{ true: '#8B5CF6' }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Mentions</Text>
                      <Text style={styles.switchSub}>When someone @mentions you</Text>
                    </View>
                    <Switch value={mentions} onValueChange={setMentions} trackColor={{ true: '#8B5CF6' }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Smart reply suggestions</Text>
                      <Text style={styles.switchSub}>Show AI quick replies above input</Text>
                    </View>
                    <Switch value={smartReplySuggestions} onValueChange={setSmartReplySuggestions} trackColor={{ true: '#8B5CF6' }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Translation updates</Text>
                      <Text style={styles.switchSub}>When a translation completes</Text>
                    </View>
                    <Switch value={translationUpdates} onValueChange={setTranslationUpdates} trackColor={{ true: '#8B5CF6' }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Email digest</Text>
                      <Text style={styles.switchSub}>Daily summary to your inbox</Text>
                    </View>
                    <Switch value={emailDigest} onValueChange={setEmailDigest} trackColor={{ true: '#8B5CF6' }} />
                  </View>
                </View>
              )}

              {activeTab === 'privacy' && (
                <View style={styles.switchList}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Read receipts</Text>
                      <Text style={styles.switchSub}>Let others see when you've read</Text>
                    </View>
                    <Switch value={readReceipts} onValueChange={setReadReceipts} trackColor={{ true: '#8B5CF6' }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Show online status</Text>
                      <Text style={styles.switchSub}>Let contacts see when active</Text>
                    </View>
                    <Switch value={showOnlineStatus} onValueChange={setShowOnlineStatus} trackColor={{ true: '#8B5CF6' }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Translation history</Text>
                      <Text style={styles.switchSub}>Store auto-translation logs</Text>
                    </View>
                    <Switch value={translationHistory} onValueChange={setTranslationHistory} trackColor={{ true: '#8B5CF6' }} />
                  </View>

                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelBox}>
                      <Text style={styles.switchTitle}>Smart reply data</Text>
                      <Text style={styles.switchSub}>Use chat history to improve suggestions</Text>
                    </View>
                    <Switch value={smartReplyData} onValueChange={setSmartReplyData} trackColor={{ true: '#8B5CF6' }} />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeIcon: {
    fontSize: 18,
    color: '#64748B',
  },
  bodyLayout: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 380,
  },
  sidebar: {
    width: 140,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sidebarItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  sidebarItemActive: {
    backgroundColor: '#F3E8FF', // Soft Purple tint
  },
  sidebarItemText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  sidebarItemTextActive: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  sidebarSpacer: {
    flex: 1,
  },
  signOutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  tabContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cameraBadgeText: {
    fontSize: 10,
  },
  heroName: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  heroEmail: {
    color: '#64748B',
    fontSize: 12,
  },
  heroStatus: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  switchList: {
    gap: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabelBox: {
    flex: 1,
    paddingRight: 10,
  },
  switchTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
});
