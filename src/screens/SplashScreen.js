/**
 * ViveTalk Animated Splash Screen
 * Features Motion for React animations with spring physics, radiant aura rings, and shimmer progress.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  MotionView,
  MotionText,
  SPRING_BOUNCY,
  SPRING_SMOOTH,
  FLOAT_LOOP,
} from '../components/motion/Motion';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    // Keep splash visible for at least 1.8s for a polished brand impression
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Ambient Glow Gradients */}
      <MotionView
        style={styles.ambientGlow1}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.7, 0.4],
          x: [-20, 20, -20],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionView
        style={styles.ambientGlow2}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.6, 0.3],
          y: [20, -20, 20],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <View style={styles.contentWrapper}>
        {/* Animated Icon & Radiant Waves */}
        <View style={styles.logoSection}>
          {/* Outward Pulsing Rings */}
          <MotionView
            style={styles.pulseRing}
            animate={{
              scale: [1, 1.7, 2.2],
              opacity: [0.7, 0.25, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <MotionView
            style={[styles.pulseRing, { animationDelay: '0.8s' }]}
            animate={{
              scale: [1, 1.5, 2.0],
              opacity: [0.6, 0.2, 0],
            }}
            transition={{
              duration: 2.4,
              delay: 0.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Core Logo Capsule */}
          <MotionView
            style={styles.logoBadge}
            initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={SPRING_BOUNCY}
            {...FLOAT_LOOP(4, 3)}
          >
            <FontAwesome name="globe" size={44} color="#FFFFFF" />
            <MotionView
              style={styles.sparkleDot}
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <FontAwesome name="bolt" size={14} color="#FBBF24" />
            </MotionView>
          </MotionView>
        </View>

        {/* Brand Typography */}
        <MotionView
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SMOOTH, delay: 0.25 }}
          style={styles.textSection}
        >
          <Text style={styles.brandTitle}>ViveTalk</Text>
          <Text style={styles.brandTagline}>AI Neural Translation & Voice Chat</Text>
        </MotionView>

        {/* Shimmering Progress Capsule */}
        <MotionView
          style={styles.progressCapsule}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING_SMOOTH, delay: 0.45 }}
        >
          <MotionView
            style={styles.progressBarFill}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </MotionView>

        {/* Feature Pills */}
        <MotionView
          style={styles.featurePillsRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SMOOTH, delay: 0.6 }}
        >
          <View style={styles.featurePill}>
            <FontAwesome name="lock" size={11} color="#6B21A8" style={{ marginRight: 5 }} />
            <Text style={styles.featurePillText}>AES-256-GCM</Text>
          </View>
          <View style={styles.featurePill}>
            <FontAwesome name="language" size={11} color="#6B21A8" style={{ marginRight: 5 }} />
            <Text style={styles.featurePillText}>50+ Languages</Text>
          </View>
          <View style={styles.featurePill}>
            <FontAwesome name="feed" size={11} color="#6B21A8" style={{ marginRight: 5 }} />
            <Text style={styles.featurePillText}>WebRTC Live</Text>
          </View>
        </MotionView>
      </View>

      {/* Footer Info */}
      <MotionView
        style={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <Text style={styles.footerText}>Sayflash AI Studio • Ultra-Low Latency</Text>
      </MotionView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  ambientGlow1: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(216, 180, 254, 0.45)', // Soft purple
    filter: Platform.OS === 'web' ? 'blur(70px)' : undefined,
  },
  ambientGlow2: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(251, 207, 232, 0.45)', // Soft pink
    filter: Platform.OS === 'web' ? 'blur(70px)' : undefined,
  },
  contentWrapper: {
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 24,
  },
  logoSection: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#7E22CE',
    backgroundColor: 'rgba(126, 34, 206, 0.08)',
  },
  logoBadge: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: '#320034',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 16px 36px rgba(50, 0, 52, 0.28)',
    position: 'relative',
  },
  sparkleDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#320034',
    letterSpacing: -0.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  brandTagline: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  progressCapsule: {
    width: 160,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(50, 0, 52, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 36,
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '45%',
    backgroundColor: '#7E22CE',
    borderRadius: 3,
  },
  featurePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(216, 180, 254, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    zIndex: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
