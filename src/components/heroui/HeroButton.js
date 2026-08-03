import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

/**
 * HeroUI Button Component
 * Supports variants: solid, flat, bordered, ghost, light
 * Colors: primary (#006FEE), secondary (#7C3AED), success (#17C964), warning (#F5A524), danger (#F31260), default
 * Sizes: sm, md, lg
 * Radius: sm (8), md (12), lg (16), full (9999)
 */
export default function HeroButton({
  children,
  title,
  onPress,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  radius = 'lg',
  isDisabled = false,
  isLoading = false,
  startContent,
  endContent,
  style,
  textStyle,
  theme,
}) {
  const COLOR_MAP = {
    primary: { main: '#006FEE', light: 'rgba(0, 111, 238, 0.15)', text: '#FFFFFF', darkText: '#006FEE' },
    secondary: { main: '#7C3AED', light: 'rgba(124, 58, 237, 0.15)', text: '#FFFFFF', darkText: '#7C3AED' },
    success: { main: '#17C964', light: 'rgba(23, 201, 100, 0.15)', text: '#FFFFFF', darkText: '#17C964' },
    warning: { main: '#F5A524', light: 'rgba(245, 165, 36, 0.15)', text: '#000000', darkText: '#F5A524' },
    danger: { main: '#F31260', light: 'rgba(243, 18, 96, 0.15)', text: '#FFFFFF', darkText: '#F31260' },
    default: { main: theme?.content3 || '#3F3F46', light: theme?.content2 || '#27272A', text: theme?.text || '#ECEDEE', darkText: theme?.text || '#ECEDEE' },
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
    md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
    lg: { paddingVertical: 14, paddingHorizontal: 22, fontSize: 16 },
  };

  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;
  const currentRadius = RADIUS_MAP[radius] !== undefined ? RADIUS_MAP[radius] : 16;

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
  } else if (variant === 'light') {
    buttonBg = 'transparent';
    textColor = selectedColor.darkText;
  }

  if (isDisabled) {
    buttonBg = theme?.content2 || '#27272A';
    textColor = theme?.subtext || '#71717A';
    borderColor = 'transparent';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
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
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  startIcon: {
    marginRight: 6,
  },
  endIcon: {
    marginLeft: 6,
  },
});
