import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';

export default function VocabularyModal({ visible, onClose, vocabList, onDeleteItem }) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>📖 Chinese-English Notebook</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {vocabList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No saved words yet</Text>
              <Text style={styles.emptyDesc}>Tap "⭐ Save Phrase" under any chat message to save words to your dictionary!</Text>
            </View>
          ) : (
            <FlatList
              data={vocabList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.vocabItem}>
                  <View style={styles.vocabMain}>
                    <Text style={styles.originalText}>{item.original}</Text>
                    {item.pinyin ? <Text style={styles.pinyinText}>{item.pinyin}</Text> : null}
                    <Text style={styles.translationText}>{item.translation}</Text>
                  </View>
                  <TouchableOpacity onPress={() => onDeleteItem(index)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: '40%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  vocabItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  vocabMain: {
    flex: 1,
  },
  originalText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  pinyinText: {
    color: '#F59E0B',
    fontSize: 12,
    marginVertical: 2,
    fontStyle: 'italic',
  },
  translationText: {
    color: '#38BDF8',
    fontSize: 13,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 14,
  },
});
