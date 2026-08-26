/**
 * ViveTalk Animated Splash Screen
 * Slower, cinematic Motion transitions with glowing radiant aura rings and shimmer progress.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  MotionView,
  SPRING_BOUNCY,
  SPRING_SMOOTH,
  FLOAT_LOOP,
} from '../components/motion/Motion';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    // Keep splash visible for 3.2s for a luxurious, calm brand presentation
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Ambient Glow Gradients */}
      <MotionView
        style={styles.ambientGlow1}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.65, 0.35],
          x: [-15, 15, -15],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionView
        style={styles.ambientGlow2}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.6, 0.3],
          y: [15, -15, 15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <View style={styles.contentWrapper}>
        {/* Animated Icon & Radiant Waves */}
        <View style={styles.logoSection}>
          {/* Outward Pulsing Ring */}
          <MotionView
            style={styles.pulseRing}
            animate={{
              scale: [1, 1.65, 2.2],
              opacity: [0.7, 0.25, 0],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Core Logo Capsule */}
          <MotionView
            style={styles.logoBadge}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_BOUNCY}
            {...FLOAT_LOOP(4, 4.5)}
          >
            <FontAwesome name="globe" size={44} color="#FFFFFF" />
            <MotionView
              style={styles.sparkleDot}
              animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FontAwesome name="bolt" size={13} color="#FBBF24" />
            </MotionView>
          </MotionView>
        </View>

        {/* Brand Typography */}
        <MotionView
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SMOOTH, delay: 0.35 }}
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
          transition={{ ...SPRING_SMOOTH, delay: 0.55 }}
        >
          <MotionView
            style={styles.progressBarFill}
            animate={{
              x: [-50, 50, -50],
            }}
            transition={{
              duration: 2.4,
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
          transition={{ ...SPRING_SMOOTH, delay: 0.75 }}
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
        transition={{ delay: 0.95, duration: 0.8 }}
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
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(216, 180, 254, 0.45)',
  },
  ambientGlow2: {
    position: 'absolute',
    bottom: '20%',
    right: '10%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(251, 207, 232, 0.45)',
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
    marginBottom: 26,
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
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 30,
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
    marginBottom: 32,
  },
  progressBarFill: {
    position: 'absolute',
    left: '25%',
    top: 0,
    bottom: 0,
    width: '50%',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  footer: {
    position: 'absolute',
    bottom: 26,
    zIndex: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
