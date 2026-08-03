import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Axis Subzero 2.0 Badge / Chip Component
 * Colors: primary (#97123A), secondary (#EAB308), success (#10B981), warning (#F59E0B), danger (#EF4444)
 */
export default function SubzeroBadge({
  children,
  label,
  variant = 'flat',
  color = 'primary',
  size = 'md',
  style,
  textStyle,
  theme,
  startContent,
}) {
  const COLOR_MAP = {
    primary: { main: '#97123A', light: 'rgba(151, 18, 58, 0.18)', text: '#97123A', solidText: '#FFFFFF' },
    secondary: { main: '#EAB308', light: 'rgba(234, 179, 8, 0.18)', text: '#EAB308', solidText: '#0F172A' },
    success: { main: '#10B981', light: 'rgba(16, 185, 129, 0.18)', text: '#10B981', solidText: '#FFFFFF' },
    warning: { main: '#F59E0B', light: 'rgba(245, 158, 11, 0.18)', text: '#F59E0B', solidText: '#FFFFFF' },
    danger: { main: '#EF4444', light: 'rgba(239, 68, 68, 0.18)', text: '#EF4444', solidText: '#FFFFFF' },
    default: { main: theme?.content3 || '#334155', light: theme?.content2 || '#0F172A', text: theme?.text || '#F8FAFC', solidText: '#FFFFFF' },
  };

  const selectedColor = COLOR_MAP[color] || COLOR_MAP.primary;

  const SIZE_MAP = {
    sm: { paddingVertical: 3, paddingHorizontal: 8, fontSize: 10, dotSize: 6 },
    md: { paddingVertical: 5, paddingHorizontal: 11, fontSize: 12, dotSize: 8 },
    lg: { paddingVertical: 7, paddingHorizontal: 15, fontSize: 13, dotSize: 10 },
  };

  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;

  let bg = selectedColor.light;
  let textColor = selectedColor.text;
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'solid') {
    bg = selectedColor.main;
    textColor = selectedColor.solidText;
  } else if (variant === 'bordered') {
    bg = 'transparent';
    textColor = selectedColor.text;
    borderWidth = 1;
    borderColor = selectedColor.main;
  } else if (variant === 'dot') {
    bg = selectedColor.light;
    textColor = selectedColor.text;
    borderWidth = 1;
    borderColor = 'rgba(255,255,255,0.08)';
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderWidth,
          borderColor,
          borderRadius: 8,
        },
        style,
      ]}
    >
      {variant === 'dot' && (
        <View
          style={[
            styles.dot,
            {
              width: currentSize.dotSize,
              height: currentSize.dotSize,
              borderRadius: currentSize.dotSize / 2,
              backgroundColor: selectedColor.main,
            },
          ]}
        />
      )}
      {startContent && <View style={styles.startContent}>{startContent}</View>}
      <Text
        style={[
          styles.text,
          { color: textColor, fontSize: currentSize.fontSize },
          textStyle,
        ]}
      >
        {label || children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    marginRight: 6,
  },
  startContent: {
    marginRight: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
