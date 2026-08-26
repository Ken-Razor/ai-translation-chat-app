/**
 * ViveTalk Motion for React (Web Target)
 * Powered by motion.dev (motion/react) for Web Browser and PWA.
 * Ultra-smooth, relaxed, and cinematic transition curves.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { motion, AnimatePresence } from 'motion/react';

export const MotionView = React.forwardRef(({ style, ...props }, ref) => (
  <motion.div ref={ref} style={StyleSheet.flatten(style)} {...props} />
));

export const MotionText = React.forwardRef(({ style, ...props }, ref) => (
  <motion.span ref={ref} style={StyleSheet.flatten(style)} {...props} />
));

export const MotionButton = React.forwardRef(({ style, ...props }, ref) => (
  <motion.button ref={ref} style={StyleSheet.flatten(style)} {...props} />
));

export const MotionImage = React.forwardRef(({ style, ...props }, ref) => (
  <motion.img ref={ref} style={StyleSheet.flatten(style)} {...props} />
));

export { motion, AnimatePresence };

/**
 * Ultra-Smooth Exponential Deceleration Curve (Velvety, Relaxed Pacing)
 */
export const EASE_CINEMATIC = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.4, 0, 0.2, 1];

/**
 * Pre-configured Motion Spring Presets & Animation Variants (Noticeably Slower & Luxurious)
 */
export const SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 70,
  damping: 20,
  mass: 1.2,
};

export const SPRING_BOUNCY = {
  type: 'spring',
  stiffness: 85,
  damping: 14,
  mass: 1.2,
};

export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 120,
  damping: 18,
};

export const FADE_IN_UP = {
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
  transition: { duration: 0.95, ease: EASE_CINEMATIC },
};

export const SCALE_POP = {
  initial: { opacity: 0, scale: 0.82 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.88 },
  transition: SPRING_BOUNCY,
};

export const SLIDE_HORIZONTAL = {
  initial: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.94,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.95, ease: EASE_CINEMATIC },
  },
  exit: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    scale: 0.94,
    transition: { duration: 0.65, ease: EASE_IN_OUT },
  }),
};

export const STAGGER_CONTAINER = (staggerDelay = 0.2) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const HOVER_TAP_BTN = {
  whileHover: { scale: 1.025, transition: { duration: 0.3 } },
  whileTap: { scale: 0.96, transition: { duration: 0.2 } },
};

export const PULSE_LOOP = {
  animate: {
    scale: [1, 1.06, 1],
    opacity: [0.8, 1, 0.8],
  },
  transition: {
    duration: 5.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const FLOAT_LOOP = (distance = 6, duration = 5.5) => ({
  animate: {
    y: [-distance, distance, -distance],
  },
  transition: {
    duration,
    repeat: Infinity,
    ease: 'easeInOut',
  },
});
