/**
 * ViveTalk Motion for React (Web Target)
 * Powered by motion.dev (motion/react) for Web Browser and PWA.
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
