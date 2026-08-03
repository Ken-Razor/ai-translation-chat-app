import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

/**
 * Axis Subzero 2.0 Input Component
 * Enterprise inputs with focus ring, start/end content, and clear button
 */
export default function SubzeroInput({
  value,
  onChangeText,
  placeholder,
  startContent,
  endContent,
  isClearable = false,
  onClear,
  style,
  inputStyle,
  theme,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isDark = theme?.mode === 'dark';

  const inputBg = theme?.inputBg || (isDark ? '#0F172A' : '#F1F5F9');
  const borderColor = isFocused
    ? (theme?.primary || '#97123A')
    : (theme?.border || (isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: inputBg,
          borderColor: borderColor,
          borderWidth: isFocused ? 1.5 : 1,
          borderRadius: 12,
        },
        style,
      ]}
    >
      {startContent && <View style={styles.startContent}>{startContent}</View>}
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme?.mutedText || '#64748B'}
        style={[
          styles.input,
          { color: theme?.text || '#F8FAFC' },
          inputStyle,
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />

      {isClearable && value && value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            if (onChangeText) onChangeText('');
            if (onClear) onClear();
          }}
          style={styles.clearBtn}
        >
          <FontAwesome name="times-circle" size={16} color={theme?.subtext || '#94A3B8'} />
        </TouchableOpacity>
      )}

      {endContent && <View style={styles.endContent}>{endContent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  startContent: {
    marginRight: 10,
  },
  endContent: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
  },
});
