import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * HeroUI Card Component
 * Variants: shadow, bordered, flat
 * Provides modern HeroUI rounded surfaces with sleek subtle borders
 */
export default function HeroCard({
  children,
  onPress,
  variant = 'bordered',
  style,
  theme,
  isPressable = false,
}) {
  const isDark = theme?.mode === 'dark';
  
  const cardBg = variant === 'flat' 
    ? (theme?.content2 || '#27272A')
    : (theme?.content1 || '#18181B');

  const borderColor = variant === 'bordered'
    ? (theme?.border || 'rgba(255,255,255,0.12)')
    : 'transparent';

  const CardWrapper = isPressable || onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
          borderWidth: variant === 'bordered' ? 1 : 0,
          borderRadius: theme?.radius || 18,
          shadowColor: theme?.shadow || '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.06,
          shadowRadius: 10,
          elevation: isDark ? 4 : 2,
        },
        style,
      ]}
    >
      {children}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    overflow: 'hidden',
  },
});
