import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

export default function ChatOptionsMenu({
  visible,
  onClose,
  onOpenLangPicker,
  onClearHistory,
  onOpenProfile
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheetCard}>
          <View style={styles.dragHandle} />
          <Text style={styles.sheetTitle}>Chat Options & Tools</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              onOpenLangPicker();
            }}
          >
            <Text style={styles.menuIcon}>🌐</Text>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Target Translation Language</Text>
              <Text style={styles.menuSub}>Choose preferred language (English, Chinese, etc.)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              if (onOpenProfile) onOpenProfile();
            }}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>View Contact Profile & IAM Info</Text>
              <Text style={styles.menuSub}>Inspect account credentials and language settings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onClose();
              if (onClearHistory) onClearHistory();
            }}
          >
            <Text style={styles.menuIcon}>🧹</Text>
            <View style={styles.menuTextBox}>
              <Text style={styles.menuTitle}>Clear Chat History</Text>
              <Text style={styles.menuSub}>Remove messages from current thread view</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.cancelItem]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#131C2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#233048',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  menuSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  cancelItem: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
