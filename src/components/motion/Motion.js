/**
 * ViveTalk Motion for React (Native / Mobile Target)
 * Pure React Native implementation using Animated API for Expo Go, iOS, and Android.
 * Has zero dependency on DOM or web-only packages to prevent Metro resolver errors.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, StyleSheet, Platform } from 'react-native';

export const AnimatePresence = ({ children }) => <>{children}</>;
export const motion = {
  div: View,
  span: Text,
  button: TouchableOpacity,
  img: Image,
};

const sanitizeStyle = (s) => {
  if (!s) return undefined;
  if (Platform.OS === 'web') return s;
  const flat = StyleSheet.flatten(s);
  if (!flat) return undefined;
  const { boxShadow, filter, cursor, animationDelay, ...safeStyle } = flat;
  return safeStyle;
};

const getInitialNumber = (val, fallback) => {
  if (val === undefined || val === null) return fallback;
  if (Array.isArray(val)) return typeof val[0] === 'number' ? val[0] : fallback;
  if (typeof val === 'number') return val;
  return fallback;
};

export const MotionView = React.forwardRef(({ children, style, initial, animate, exit, transition, whileHover, whileTap, variants, custom, ...props }, ref) => {
  const targetAnimate = (variants && animate && typeof animate === 'string' && variants[animate])
    ? (typeof variants[animate] === 'function' ? variants[animate](custom) : variants[animate])
    : (animate || {});

  const initOpacity = getInitialNumber(initial?.opacity, 1);
  const initY = getInitialNumber(initial?.y, 0);
  const initX = getInitialNumber(initial?.x, 0);
  const initScale = getInitialNumber(initial?.scale, 1);

  const fadeAnim = useRef(new Animated.Value(initOpacity)).current;
  const transY = useRef(new Animated.Value(initY)).current;
  const transX = useRef(new Animated.Value(initX)).current;
  const scaleAnim = useRef(new Animated.Value(initScale)).current;

  useEffect(() => {
    let runningAnimation = null;
    const animList = [];

    const isInfinite = transition?.repeat === Infinity;
    const duration = (transition?.duration || 0.35) * 1000;

    // Helper for single value or keyframe array
    const buildAnim = (animVal, val, isSpring = false) => {
      if (Array.isArray(val)) {
        if (val.length === 0) return null;
        const stepTime = duration / Math.max(1, val.length);
        const steps = val.map(target =>
          Animated.timing(animVal, {
            toValue: typeof target === 'number' ? target : parseFloat(target) || 0,
            duration: stepTime,
            useNativeDriver: true,
          })
        );
        const seq = Animated.sequence(steps);
        return isInfinite ? Animated.loop(seq) : seq;
      } else if (typeof val === 'number') {
        if (isSpring && !isInfinite) {
          return Animated.spring(animVal, {
            toValue: val,
            friction: transition?.damping || 8,
            tension: transition?.stiffness || 40,
            useNativeDriver: true,
          });
        }
        return Animated.timing(animVal, {
          toValue: val,
          duration: isInfinite ? duration : 300,
          useNativeDriver: true,
        });
      }
      return null;
    };

    if (targetAnimate.opacity !== undefined) {
      const a = buildAnim(fadeAnim, targetAnimate.opacity, false);
      if (a) animList.push(a);
    }
    if (targetAnimate.y !== undefined) {
      const a = buildAnim(transY, targetAnimate.y, true);
      if (a) animList.push(a);
    }
    if (targetAnimate.x !== undefined) {
      const a = buildAnim(transX, targetAnimate.x, true);
      if (a) animList.push(a);
    }
    if (targetAnimate.scale !== undefined) {
      const a = buildAnim(scaleAnim, targetAnimate.scale, true);
      if (a) animList.push(a);
    }

    if (animList.length > 0) {
      runningAnimation = Animated.parallel(animList);
      runningAnimation.start();
    }

    return () => {
      if (runningAnimation) {
        try { runningAnimation.stop(); } catch (e) {}
      }
    };
  }, [targetAnimate]);

  const safeStyle = sanitizeStyle(style);

  return (
    <Animated.View
      ref={ref}
      style={[
        safeStyle,
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
    <Text ref={ref} style={sanitizeStyle(style)} {...props}>
      {children}
    </Text>
  );
});

export const MotionButton = React.forwardRef(({ children, style, onPress, disabled, whileHover, whileTap, initial, animate, exit, transition, ...props }, ref) => {
  return (
    <TouchableOpacity
      ref={ref}
      style={sanitizeStyle(style)}
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
  return <Image ref={ref} style={sanitizeStyle(style)} source={source} {...props} />;
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
