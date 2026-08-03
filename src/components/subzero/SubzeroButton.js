import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

/**
 * Axis Subzero 2.0 Button Component
 * Primary color: #97123A (Subzero Maroon)
 * Secondary: #EAB308 (Subzero Gold)
 * Variants: solid, flat, bordered, ghost
 */
export default function SubzeroButton({
  children,
  title,
  onPress,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  radius = 'md',
  isDisabled = false,
  isLoading = false,
  startContent,
  endContent,
  style,
  textStyle,
  theme,
}) {
  const COLOR_MAP = {
    primary: { main: '#97123A', light: 'rgba(151, 18, 58, 0.18)', text: '#FFFFFF', darkText: '#97123A' },
    secondary: { main: '#EAB308', light: 'rgba(234, 179, 8, 0.18)', text: '#0F172A', darkText: '#EAB308' },
    success: { main: '#10B981', light: 'rgba(16, 185, 129, 0.18)', text: '#FFFFFF', darkText: '#10B981' },
    warning: { main: '#F59E0B', light: 'rgba(245, 158, 11, 0.18)', text: '#FFFFFF', darkText: '#F59E0B' },
    danger: { main: '#EF4444', light: 'rgba(239, 68, 68, 0.18)', text: '#FFFFFF', darkText: '#EF4444' },
    default: { main: theme?.content3 || '#334155', light: theme?.content2 || '#0F172A', text: theme?.text || '#F8FAFC', darkText: theme?.text || '#F8FAFC' },
  };

  const selectedColor = COLOR_MAP[color] || COLOR_MAP.primary;

  const RADIUS_MAP = {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  };

  const SIZE_MAP = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 10, paddingHorizontal: 18, fontSize: 14 },
    lg: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
  };

  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;
  const currentRadius = RADIUS_MAP[radius] !== undefined ? RADIUS_MAP[radius] : 12;

  let buttonBg = selectedColor.main;
  let textColor = selectedColor.text;
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'flat') {
    buttonBg = selectedColor.light;
    textColor = selectedColor.darkText;
  } else if (variant === 'bordered') {
    buttonBg = 'transparent';
    textColor = selectedColor.darkText;
    borderWidth = 1.5;
    borderColor = selectedColor.main;
  } else if (variant === 'ghost') {
    buttonBg = 'transparent';
    textColor = selectedColor.darkText;
    borderWidth = 1;
    borderColor = selectedColor.light;
  }

  if (isDisabled) {
    buttonBg = theme?.content2 || '#0F172A';
    textColor = theme?.subtext || '#64748B';
    borderColor = 'transparent';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled || isLoading}
      style={[
        styles.button,
        {
          backgroundColor: buttonBg,
          borderRadius: currentRadius,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderWidth,
          borderColor,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {startContent && <View style={styles.startIcon}>{startContent}</View>}
          <Text
            style={[
              styles.text,
              { color: textColor, fontSize: currentSize.fontSize },
              textStyle,
            ]}
          >
            {title || children}
          </Text>
          {endContent && <View style={styles.endIcon}>{endContent}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  startIcon: {
    marginRight: 6,
  },
  endIcon: {
    marginLeft: 6,
  },
});
