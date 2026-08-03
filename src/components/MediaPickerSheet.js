import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { DARK_THEME } from '../theme/colors';

export default function MediaPickerSheet({
  visible,
  onClose,
  onLaunchCamera,
  onPickLibrary,
  onPickDocument,
  theme = DARK_THEME
}) {
  if (!visible) return null;

  const isDark = theme.mode === 'dark';

  return (
    <View style={[styles.sheetContainer, { backgroundColor: isDark ? '#131C2E' : '#FFFFFF', borderColor: theme.border }]}>
      <View style={styles.sheetHeader}>
        <Text style={[styles.sheetTitle, { color: theme.subtext }]}>SHARE CONTENT & MEDIA</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <FontAwesome name="times-circle" size={18} color={theme.subtext} />
        </TouchableOpacity>
      </View>

      <View style={styles.optionsRow}>
        {/* Option 1: Live Native Camera */}
        <TouchableOpacity
          style={styles.optionCard}
          activeOpacity={0.7}
          onPress={() => {
            onClose();
            if (onLaunchCamera) onLaunchCamera();
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#2563EB' }]}>
            <FontAwesome name="camera" size={18} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionLabel, { color: theme.text }]}>Camera</Text>
        </TouchableOpacity>

        {/* Option 2: Photo & Video Library */}
        <TouchableOpacity
          style={styles.optionCard}
          activeOpacity={0.7}
          onPress={() => {
            onClose();
            if (onPickLibrary) onPickLibrary();
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#8B5CF6' }]}>
            <FontAwesome name="image" size={18} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionLabel, { color: theme.text }]}>Gallery</Text>
        </TouchableOpacity>

        {/* Option 3: Document */}
        <TouchableOpacity
          style={styles.optionCard}
          activeOpacity={0.7}
          onPress={() => {
            onClose();
            if (onPickDocument) onPickDocument();
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
            <FontAwesome name="file-text" size={18} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionLabel, { color: theme.text }]}>Document</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  optionCard: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 3,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
