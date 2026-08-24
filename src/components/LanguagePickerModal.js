import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (Mandarin)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

export default function LanguagePickerModal({ visible, onClose, selectedLang = 'en', onSelectLang }) {
  const normSelected = String(selectedLang || 'en').toLowerCase().trim();

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.globeIconCircle}>
                <FontAwesome name="globe" size={16} color="#4B1A56" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Translation Language</Text>
                <Text style={styles.modalSubtitle}>Select your target language for this chat</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <FontAwesome name="times" size={16} color="#80737d" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={LANGUAGES}
            keyExtractor={item => item.code}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = normSelected === item.code || (normSelected === 'jp' && item.code === 'ja') || (normSelected === 'chinese' && item.code === 'zh') || (normSelected === 'english' && item.code === 'en') || (normSelected === 'indonesian' && item.code === 'id');

              return (
                <TouchableOpacity
                  style={[styles.langRow, isSelected && styles.langRowSelected]}
                  onPress={() => {
                    onSelectLang(item.code);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.langNameWrap}>
                    <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.nativeLangName}>
                      {item.nativeName}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.checkCircleActive}>
                      <FontAwesome name="check" size={12} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.checkCircleInactive} />
                  )}
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
    backgroundColor: 'rgba(50, 0, 52, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    maxHeight: '80%',
    shadowColor: '#4B1A56',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  globeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#320034',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    color: '#80737d',
    fontSize: 11.5,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF5FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    gap: 6,
    paddingVertical: 4,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FAF5FA',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  langRowSelected: {
    backgroundColor: '#FFF0FA',
    borderColor: '#4B1A56',
  },
  flag: {
    fontSize: 22,
    marginRight: 12,
  },
  langNameWrap: {
    flex: 1,
  },
  langName: {
    color: '#320034',
    fontSize: 14.5,
    fontWeight: '700',
  },
  langNameSelected: {
    color: '#4B1A56',
    fontWeight: '800',
  },
  nativeLangName: {
    color: '#80737d',
    fontSize: 11.5,
    marginTop: 1,
  },
  checkCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4B1A56',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
});
