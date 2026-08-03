import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

/**
 * HeroUI Avatar Component
 * Features status indicator ring (isBordered), color ring, online status dot
 */
export default function HeroAvatar({
  name = 'User',
  src = '',
  size = 'md',
  color = 'primary',
  isBordered = false,
  isOnline = false,
  bgColor,
  theme,
}) {
  const COLOR_MAP = {
    primary: '#006FEE',
    secondary: '#7C3AED',
    success: '#17C964',
    warning: '#F5A524',
    danger: '#F31260',
    default: '#3F3F46',
  };

  const ringColor = COLOR_MAP[color] || COLOR_MAP.primary;

  const SIZE_MAP = {
    sm: { avatarSize: 36, fontSize: 14, statusSize: 10 },
    md: { avatarSize: 44, fontSize: 17, statusSize: 12 },
    lg: { avatarSize: 56, fontSize: 22, statusSize: 14 },
    xl: { avatarSize: 72, fontSize: 28, statusSize: 16 },
  };

  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  const defaultBg = bgColor || ringColor;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarRing,
          {
            width: currentSize.avatarSize + (isBordered ? 6 : 0),
            height: currentSize.avatarSize + (isBordered ? 6 : 0),
            borderRadius: (currentSize.avatarSize + (isBordered ? 6 : 0)) / 2,
            borderWidth: isBordered ? 2 : 0,
            borderColor: isBordered ? ringColor : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {src ? (
          <Image
            source={{ uri: src }}
            style={{
              width: currentSize.avatarSize,
              height: currentSize.avatarSize,
              borderRadius: currentSize.avatarSize / 2,
            }}
          />
        ) : (
          <View
            style={[
              styles.avatarInner,
              {
                width: currentSize.avatarSize,
                height: currentSize.avatarSize,
                borderRadius: currentSize.avatarSize / 2,
                backgroundColor: defaultBg,
              },
            ]}
          >
            <Text style={[styles.initialText, { fontSize: currentSize.fontSize }]}>
              {initial}
            </Text>
          </View>
        )}
      </View>

      {isOnline && (
        <View
          style={[
            styles.statusDot,
            {
              width: currentSize.statusSize,
              height: currentSize.statusSize,
              borderRadius: currentSize.statusSize / 2,
              backgroundColor: '#17C964',
              borderColor: theme?.bg || '#000000',
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
  },
});
