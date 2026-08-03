import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * HeroUI Chip / Badge Component
 * Variants: solid, flat, bordered, dot
 * Colors: primary, secondary, success, warning, danger, default
 */
export default function HeroChip({
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
    primary: { main: '#006FEE', light: 'rgba(0, 111, 238, 0.15)', text: '#006FEE', solidText: '#FFFFFF' },
    secondary: { main: '#7C3AED', light: 'rgba(124, 58, 237, 0.15)', text: '#7C3AED', solidText: '#FFFFFF' },
    success: { main: '#17C964', light: 'rgba(23, 201, 100, 0.15)', text: '#17C964', solidText: '#FFFFFF' },
    warning: { main: '#F5A524', light: 'rgba(245, 165, 36, 0.15)', text: '#F5A524', solidText: '#000000' },
    danger: { main: '#F31260', light: 'rgba(243, 18, 96, 0.15)', text: '#F31260', solidText: '#FFFFFF' },
    default: { main: theme?.content4 || '#52525B', light: theme?.content2 || '#27272A', text: theme?.text || '#ECEDEE', solidText: '#FFFFFF' },
  };

  const selectedColor = COLOR_MAP[color] || COLOR_MAP.primary;

  const SIZE_MAP = {
    sm: { paddingVertical: 2, paddingHorizontal: 8, fontSize: 10, dotSize: 6 },
    md: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12, dotSize: 8 },
    lg: { paddingVertical: 6, paddingHorizontal: 14, fontSize: 13, dotSize: 10 },
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
        styles.chip,
        {
          backgroundColor: bg,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderWidth,
          borderColor,
          borderRadius: 9999,
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    marginRight: 6,
  },
  startContent: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
