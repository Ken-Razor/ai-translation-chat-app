import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DARK_THEME } from '../theme/colors';

const QUICK_REPLIES = [
  'How are you doing?',
  'What are you up to right now?',
  'Have you eaten yet?',
  'Let us meet up tomorrow!',
];

export default function QuickReplies({ onSelectReply, theme = DARK_THEME }) {
  const isDark = theme.mode === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.sectionHeader, { color: theme.subtext }]}>SMART REPLIES:</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {QUICK_REPLIES.map((reply, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.replyChip,
              {
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                borderColor: theme.border,
              }
            ]}
            onPress={() => onSelectReply(reply)}
          >
            <Text style={[styles.replyText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  scrollContent: {
    gap: 8,
  },
  replyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  replyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
