import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function TypingIndicator({ partnerName = 'Partner' }) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -5,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.delay(300),
        ])
      );
    };

    const anim1 = createBounce(dot1Anim, 0);
    const anim2 = createBounce(dot2Anim, 140);
    const anim3 = createBounce(dot3Anim, 280);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot1Anim }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot2Anim }] }]} />
          <Animated.View style={[styles.dot, { transform: [{ translateY: dot3Anim }] }]} />
        </View>
      </View>
      <Text style={styles.label}>{partnerName} is typing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    shadowColor: '#4B1A56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 12,
  },
  dot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: '#4B1A56',
  },
  label: {
    fontSize: 11.5,
    color: '#8E7199',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
