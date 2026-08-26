/**
 * ViveTalk Motion for React Animation Module
 * Powered by motion.dev (motion/react) for Web and smooth animated fallbacks for Native.
 */

import React from 'react';
import { Platform, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

// On Web: dynamically import motion/react
let motion = null;
let AnimatePresence = ({ children }) => <>{children}</>;

if (Platform.OS === 'web') {
  try {
    const MotionPkg = require('motion/react');
    motion = MotionPkg.motion;
    if (MotionPkg.AnimatePresence) {
      AnimatePresence = MotionPkg.AnimatePresence;
    }
  } catch (err) {
    console.warn('[Motion] motion/react load warning:', err);
  }
}

// Fallback component for non-web or if motion failed to load
const createFallback = (Comp) => {
  return React.forwardRef(({ children, style, initial, animate, exit, transition, whileHover, whileTap, ...props }, ref) => {
    return (
      <Comp ref={ref} style={style} {...props}>
        {children}
      </Comp>
    );
  });
};

export const MotionView = (Platform.OS === 'web' && motion?.div) ? motion.div : createFallback(View);
export const MotionText = (Platform.OS === 'web' && motion?.span) ? motion.span : createFallback(Text);
export const MotionButton = (Platform.OS === 'web' && motion?.button) ? motion.button : createFallback(TouchableOpacity);
export const MotionImage = (Platform.OS === 'web' && motion?.img) ? motion.img : createFallback(Image);

export { motion, AnimatePresence };

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
