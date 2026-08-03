import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';

export default function LandingScreen({ onFinishLoading }) {
  useEffect(() => {
    // Automatically transition to app after 1.8 seconds of clean splash logo display
    const timer = setTimeout(() => {
      if (onFinishLoading) onFinishLoading();
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={onFinishLoading}
    >
      {/* Subtle Background Glow Orbs */}
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />

      <View style={styles.contentContainer}>
        {/* Glowing Flash Logo Badge */}
        <View style={styles.logoBadgeOuter}>
          <View style={styles.logoBadgeInner}>
            <Text style={styles.logoText}>⚡</Text>
          </View>
        </View>

        {/* Clean App Name & Tagline */}
        <Text style={styles.brandTitle}>ViveTalk</Text>
        <Text style={styles.brandSubtitle}>AI-Powered Instant Translation & Communication</Text>

        {/* Subtle Spinner */}
        <View style={styles.spinnerContainer}>
          <ActivityIndicator color="#38BDF8" size="small" />
        </View>
      </View>

      {/* Footer Tag */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Sayflash AI</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  contentContainer: {
    alignItems: 'center',
  },
  logoBadgeOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  logoBadgeInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
  },
  brandTitle: {
    color: '#F8FAFC',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  spinnerContainer: {
    marginTop: 36,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
