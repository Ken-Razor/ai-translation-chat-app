/**
 * ViveTalk Motion for React (Web Target)
 * Powered by motion.dev (motion/react) for Web Browser and PWA.
 * Slower, cinematic easing curves and spring physics.
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
 * Standard Cubic Easing for Cinematic, Smooth Motion
 */
export const EASE_CINEMATIC = [0.22, 1, 0.36, 1]; // Smooth deceleration
export const EASE_IN_OUT = [0.4, 0, 0.2, 1];

/**
 * Pre-configured Motion Spring Presets & Animation Variants (Slower & Elegant)
 */
export const SPRING_SMOOTH = {
  type: 'spring',
  stiffness: 110,
  damping: 22,
  mass: 1.1,
};

export const SPRING_BOUNCY = {
  type: 'spring',
  stiffness: 130,
  damping: 15,
  mass: 1.1,
};

export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 180,
  damping: 22,
};

export const FADE_IN_UP = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.65, ease: EASE_CINEMATIC },
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
    x: direction > 0 ? 80 : -80,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_CINEMATIC },
  },
  exit: (direction = 1) => ({
    opacity: 0,
    x: direction > 0 ? -80 : 80,
    scale: 0.95,
    transition: { duration: 0.45, ease: EASE_IN_OUT },
  }),
};

export const STAGGER_CONTAINER = (staggerDelay = 0.14) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export const HOVER_TAP_BTN = {
  whileHover: { scale: 1.025, transition: { duration: 0.25 } },
  whileTap: { scale: 0.96, transition: { duration: 0.15 } },
};

export const PULSE_LOOP = {
  animate: {
    scale: [1, 1.06, 1],
    opacity: [0.8, 1, 0.8],
  },
  transition: {
    duration: 4.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const FLOAT_LOOP = (distance = 6, duration = 4.5) => ({
  animate: {
    y: [-distance, distance, -distance],
  },
  transition: {
    duration,
    repeat: Infinity,
    ease: 'easeInOut',
  },
});
