import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

/**
 * HeroUI Input Component
 * Features rounded surfaces, subtle focus borders, start/end icons, clear button
 */
export default function HeroInput({
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

  const inputBg = theme?.inputBg || (isDark ? '#27272A' : '#F4F4F5');
  const borderColor = isFocused
    ? (theme?.primary || '#006FEE')
    : (theme?.border || (isDark ? 'rgba(255,255,255,0.12)' : '#E4E4E7'));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: inputBg,
          borderColor: borderColor,
          borderWidth: isFocused ? 1.5 : 1,
          borderRadius: 16,
        },
        style,
      ]}
    >
      {startContent && <View style={styles.startContent}>{startContent}</View>}
      
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme?.mutedText || '#71717A'}
        style={[
          styles.input,
          { color: theme?.text || '#ECEDEE' },
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
          <FontAwesome name="times-circle" size={16} color={theme?.subtext || '#A1A1AA'} />
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
    minHeight: 46,
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
