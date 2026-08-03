import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';

const LANGUAGES = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese (中文)', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'jp', name: 'Japanese (日本語)', flag: '🇯🇵' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪' },
];

export default function LanguagePickerModal({ visible, onClose, selectedLang = 'en', onSelectLang }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🌐 Target Translation Language</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={LANGUAGES}
            keyExtractor={item => item.code}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedLang === item.code;
              return (
                <TouchableOpacity
                  style={[styles.langRow, isSelected && styles.langRowSelected]}
                  onPress={() => {
                    onSelectLang(item.code);
                    onClose();
                  }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                    {item.name}
                  </Text>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#131C2E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#233048',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    color: '#94A3B8',
    fontSize: 16,
  },
  listContent: {
    gap: 8,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#0B0F19',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  langRowSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: '#2563EB',
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  langName: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  langNameSelected: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  checkMark: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
