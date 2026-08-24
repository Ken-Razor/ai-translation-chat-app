import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const DEFAULT_QUICK_REPLIES = [
  '👋 Hi! Nice to meet you!',
  '☕ How is your day going?',
  '📚 What languages are you learning?',
  '🍜 Have you eaten yet?',
  '🎙️ Would you like to practice voice notes?',
  '✨ Let us chat!',
];

export default function QuickReplies({ onSelectReply, theme }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <FontAwesome name="lightbulb-o" size={12} color="#4B1A56" style={{ marginRight: 5 }} />
        <Text style={styles.sectionHeader}>SMART REPLIES:</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {DEFAULT_QUICK_REPLIES.map((reply, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.replyChip}
            onPress={() => onSelectReply(reply)}
            activeOpacity={0.8}
          >
            <Text style={styles.replyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#80737d',
    letterSpacing: 0.6,
  },
  scrollContent: {
    gap: 6,
    paddingBottom: 2,
  },
  replyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF0FA',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  replyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B1A56',
  },
});
