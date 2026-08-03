import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DARK_THEME } from '../theme/colors';

const TONES = [
  { id: 'casual', label: '💬 Casual (日常)' },
  { id: 'formal', label: '🤝 Polite (礼貌)' },
  { id: 'slang', label: '🔥 Internet Slang (网络流行语)' },
];

export default function TonePicker({ selectedTone, onSelectTone, isVisible = true, theme = DARK_THEME }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  const activeToneLabel = TONES.find(t => t.id === selectedTone)?.label || '💬 Casual (日常)';
  const isDark = theme.mode === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
      {/* Header Bar with Expand / Collapse Toggle Button */}
      <TouchableOpacity
        style={styles.headerBar}
        onPress={() => setIsExpanded(prev => !prev)}
        activeOpacity={0.7}
      >
        <View style={styles.headerTitleRow}>
          <FontAwesome name="magic" size={12} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text style={[styles.sectionHeader, { color: theme.subtext }]}>AI TONE REWRITER:</Text>
          <Text style={styles.activeTonePill}>{activeToneLabel}</Text>
        </View>

        <View style={styles.toggleBtn}>
          <Text style={styles.toggleText}>{isExpanded ? 'Collapse' : 'Expand'}</Text>
          <FontAwesome
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={11}
            color="#38BDF8"
            style={{ marginLeft: 4 }}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Tone Chips Selector */}
      {isExpanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {TONES.map(tone => {
            const isSelected = selectedTone === tone.id;
            return (
              <TouchableOpacity
                key={tone.id}
                style={[
                  styles.toneChip,
                  { backgroundColor: isDark ? '#1E293B' : '#E2E8F0', borderColor: theme.border },
                  isSelected && styles.toneChipSelected
                ]}
                onPress={() => {
                  onSelectTone(tone.id);
                }}
              >
                <Text style={[styles.toneChipText, { color: theme.subtext }, isSelected && styles.toneChipTextSelected]}>
                  {tone.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 8,
  },
  activeTonePill: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  toggleText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  toneChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  toneChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  toneChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  toneChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
