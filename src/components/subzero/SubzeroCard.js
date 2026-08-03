import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Axis Subzero 2.0 Card Component
 * Enterprise container with Subzero 1px subtle border, soft radius, and shadow.
 */
export default function SubzeroCard({
  children,
  onPress,
  variant = 'bordered',
  style,
  theme,
  isPressable = false,
}) {
  const isDark = theme?.mode === 'dark';

  const cardBg = variant === 'flat'
    ? (theme?.content2 || '#0F172A')
    : (theme?.content1 || '#1E293B');

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
          borderRadius: theme?.radius || 14,
          shadowColor: theme?.shadow || '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.05,
          shadowRadius: 8,
          elevation: isDark ? 3 : 2,
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
