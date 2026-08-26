import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import CachedImage from './CachedImage';

export default function InAppNotificationBanner({ data, onPress, onDismiss }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;

    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4.5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [data]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!data) return null;

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 16)) + 4;
  const senderTitle = data.senderName || data.senderEmail?.split('@')[0] || 'New Message';
  const avatarUrl = data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderTitle)}&background=4B1A56&color=ffffff&size=256`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          handleClose();
          if (onPress) onPress(data.senderEmail);
        }}
      >
        <View style={styles.avatarWrapper}>
          <CachedImage
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            fallbackUri={`https://ui-avatars.com/api/?name=${encodeURIComponent(senderTitle)}&background=4B1A56&color=ffffff&size=256`}
          />
          <View style={styles.badgeDot} />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.senderName} numberOfLines={1}>
              {senderTitle}
            </Text>
            <Text style={styles.timeTag}>Just now</Text>
          </View>
          <Text style={styles.messageSnippet} numberOfLines={1}>
            {data.text || 'Photo / Voice Note'}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FontAwesome name="times" size={14} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#4B1A56',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(75, 26, 86, 0.1)',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  badgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    maxWidth: '75%',
  },
  timeTag: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  messageSnippet: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
