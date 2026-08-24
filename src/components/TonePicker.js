import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const TONES = [
  { id: 'casual', label: '💬 Casual', desc: 'Natural & Everyday' },
  { id: 'friendly', label: '🎉 Friendly', desc: 'Warm & Cheerful' },
  { id: 'formal', label: '🤝 Polite / Formal', desc: 'Respectful' },
  { id: 'business', label: '👔 Professional', desc: 'Work & Clear' },
  { id: 'slang', label: '🔥 Slang', desc: 'Trendy & Relaxed' },
];

export default function TonePicker({ selectedTone = 'casual', onSelectTone, onRewriteDraft, isVisible = true, theme }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);

  if (!isVisible) return null;

  const activeTone = TONES.find(t => t.id === selectedTone) || TONES[0];

  const handleRewrite = async (toneToUse) => {
    if (!onRewriteDraft) return;
    setIsRewriting(true);
    try {
      await onRewriteDraft(toneToUse || selectedTone);
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerTitleRow}
          onPress={() => setIsExpanded(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={styles.magicIconCircle}>
            <FontAwesome name="magic" size={11} color="#4B1A56" />
          </View>
          <Text style={styles.sectionHeader}>AI TONE:</Text>
          <View style={styles.activeTonePill}>
            <Text style={styles.activeToneText}>{activeTone.label}</Text>
          </View>
          <FontAwesome
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={10}
            color="#80737d"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>

        {/* Real Interactive Rewrite Button */}
        {onRewriteDraft && (
          <TouchableOpacity
            style={[styles.rewriteBtn, isRewriting && styles.rewriteBtnBusy]}
            onPress={() => handleRewrite(selectedTone)}
            disabled={isRewriting}
            activeOpacity={0.8}
          >
            {isRewriting ? (
              <ActivityIndicator size="small" color="#4B1A56" style={{ marginRight: 4 }} />
            ) : (
              <FontAwesome name="bolt" size={11} color="#4B1A56" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.rewriteBtnText}>
              {isRewriting ? 'Refining...' : 'Rewrite Draft'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
                  isSelected && styles.toneChipSelected
                ]}
                onPress={() => {
                  onSelectTone(tone.id);
                  handleRewrite(tone.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toneChipText, isSelected && styles.toneChipTextSelected]}>
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
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  magicIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF0FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#80737d',
    letterSpacing: 0.5,
  },
  activeTonePill: {
    backgroundColor: '#FFF0FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  activeToneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B1A56',
  },
  rewriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B1A56',
  },
  rewriteBtnBusy: {
    opacity: 0.7,
  },
  rewriteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B1A56',
  },
  scrollContent: {
    gap: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  toneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FAF5FA',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  toneChipSelected: {
    backgroundColor: '#FFF0FA',
    borderColor: '#4B1A56',
  },
  toneChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  toneChipTextSelected: {
    color: '#4B1A56',
    fontWeight: '800',
  },
});
