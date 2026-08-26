/**
 * ViveTalk Motion for React (Native / Mobile Target)
 * Pure React Native implementation using Animated API for Expo Go, iOS, and Android.
 * Has zero dependency on DOM or web-only packages to prevent Metro resolver errors.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';

export const AnimatePresence = ({ children }) => <>{children}</>;
export const motion = {
  div: View,
  span: Text,
  button: TouchableOpacity,
  img: Image,
};

export const MotionView = React.forwardRef(({ children, style, initial, animate, exit, transition, whileHover, whileTap, ...props }, ref) => {
  const fadeAnim = useRef(new Animated.Value(initial?.opacity !== undefined ? initial.opacity : 1)).current;
  const transY = useRef(new Animated.Value(initial?.y !== undefined ? initial.y : 0)).current;
  const transX = useRef(new Animated.Value(initial?.x !== undefined ? initial.x : 0)).current;
  const scaleAnim = useRef(new Animated.Value(initial?.scale !== undefined ? initial.scale : 1)).current;

  useEffect(() => {
    if (animate) {
      const anims = [];
      if (animate.opacity !== undefined) {
        anims.push(Animated.timing(fadeAnim, { toValue: animate.opacity, duration: 300, useNativeDriver: true }));
      }
      if (animate.y !== undefined && typeof animate.y === 'number') {
        anims.push(Animated.spring(transY, { toValue: animate.y, friction: 8, useNativeDriver: true }));
      }
      if (animate.x !== undefined && typeof animate.x === 'number') {
        anims.push(Animated.spring(transX, { toValue: animate.x, friction: 8, useNativeDriver: true }));
      }
      if (animate.scale !== undefined && typeof animate.scale === 'number') {
        anims.push(Animated.spring(scaleAnim, { toValue: animate.scale, friction: 7, useNativeDriver: true }));
      }
      if (anims.length > 0) {
        Animated.parallel(anims).start();
      }
    }
  }, [animate]);

  return (
    <Animated.View
      ref={ref}
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: transY }, { translateX: transX }, { scale: scaleAnim }],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
});

export const MotionText = React.forwardRef(({ children, style, initial, animate, exit, transition, whileHover, whileTap, ...props }, ref) => {
  return (
    <Text ref={ref} style={style} {...props}>
      {children}
    </Text>
  );
});

export const MotionButton = React.forwardRef(({ children, style, onPress, disabled, whileHover, whileTap, initial, animate, exit, transition, ...props }, ref) => {
  return (
    <TouchableOpacity
      ref={ref}
      style={style}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
});

export const MotionImage = React.forwardRef(({ children, style, source, ...props }, ref) => {
  return <Image ref={ref} style={style} source={source} {...props} />;
});

/**
 * Pre-configured Motion Spring Presets & Animation Variants
 */
export const SPRING_BOUNCY = {
  type: 'spring',
  stiffness: 340,
  damping: 20,
  mass: 1,
};

export const SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 220,
  damping: 26,
  mass: 1,
};

export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 450,
  damping: 30,
};

export const FADE_IN_UP = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: SPRING_SMOOTH,
};

export const SCALE_POP = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: SPRING_BOUNCY,
};

export const SLIDE_HORIZONTAL = {
  initial: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: SPRING_SMOOTH,
  },
  exit: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
    transition: { duration: 0.2 },
  }),
};

export const STAGGER_CONTAINER = (staggerDelay = 0.08) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const HOVER_TAP_BTN = {
  whileHover: { scale: 1.025, transition: { duration: 0.15 } },
  whileTap: { scale: 0.96, transition: { duration: 0.1 } },
};

export const PULSE_LOOP = {
  animate: {
    scale: [1, 1.06, 1],
    opacity: [0.8, 1, 0.8],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const FLOAT_LOOP = (distance = 6, duration = 3.5) => ({
  animate: {
    y: [-distance, distance, -distance],
  },
  transition: {
    duration,
    repeat: Infinity,
    ease: 'easeInOut',
  },
});
