import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    step: 1,
    title: 'Welcome to\nViveTalk',
    subtitle: 'Translate your conversations and voice notes instantly in over 50+ languages.',
    chip: '50+ Languages Supported',
    icon: 'globe',
    cardTitle: 'Real-Time Neural Translation',
    cardSub: 'Auto-detecting spoken language',
    bubble1: 'Hello! How are you doing today? 🇺🇸',
    bubble2: '你好！你今天过得怎么样？ 🇨🇳',
  },
  {
    step: 2,
    title: 'Bilateral Voice\nTranscription',
    subtitle: 'Speak naturally and let ViveTalk translate your voice notes with ultra-crisp audio synthesis.',
    chip: 'Neural Voice Synthesis',
    icon: 'microphone',
    cardTitle: 'Instant Voice Transcription',
    cardSub: 'Sub-50ms bilateral stream',
    bubble1: '🎙️ Voice Note (0:04) — Playing...',
    bubble2: '🗣️ 音声翻訳が完了しました 🇯🇵',
  },
  {
    step: 3,
    title: 'Context-Aware\nCultural AI',
    subtitle: 'Understand tone, formal politeness levels, and local idioms without missing nuances.',
    chip: 'Gemini 2.5 Intelligence',
    icon: 'bolt',
    cardTitle: 'Deep Cultural Understanding',
    cardSub: 'Powered by Sayflash AI Studio',
    bubble1: 'Tone: Professional / Casual',
    bubble2: '⚡ Bilateral Pinyin & Phonetics',
  },
];

export default function LandingScreen({ onFinishLoading, onDirectSignIn }) {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const animateExit = (callback) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: -40, duration: 250, useNativeDriver: false })
    ]).start(() => {
      if (callback) callback();
    });
  };

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(slideAnim, { toValue: -40, duration: 250, useNativeDriver: false })
      ]).start(() => {
        setCurrentSlide(currentSlide + 1);
        slideAnim.setValue(40);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: false })
        ]).start();
      });
    } else {
      animateExit(onFinishLoading);
    }
  };

  const handleSkip = () => {
    animateExit(onFinishLoading);
  };

  const handleSignInClick = () => {
    animateExit(onDirectSignIn ? onDirectSignIn : handleSkip);
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;
  const bottomPadding = (insets.bottom > 0 ? insets.bottom : 20) + 8;

  return (
    <View style={styles.outerContainer}>
      {/* Soft Pastel Ambient Mesh */}
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />
      
      <View style={{ flex: 1, width: '100%', alignItems: 'center', paddingTop: topPadding, paddingBottom: bottomPadding }}>
        <View style={styles.container}>
          {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandBadge}>
            <FontAwesome name="globe" size={16} color="#320034" style={{ marginRight: 6 }} />
            <Text style={styles.brandBadgeText}>ViveTalk</Text>
          </View>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Center Visual Showcase Card */}
        <Animated.View style={{ flex: 1, width: '100%', justifyContent: 'center', opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
          <View style={styles.visualCard}>
            <View style={styles.visualHeader}>
              <View style={styles.visualIconBadge}>
                <FontAwesome name={slide.icon} size={18} color="#320034" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.visualCardTitle}>{slide.cardTitle}</Text>
                <Text style={styles.visualCardSub}>{slide.cardSub}</Text>
              </View>
            </View>

            {/* Interactive Chat Simulation */}
            <View style={styles.mockChatBox}>
              <View style={styles.mockBubbleUser}>
                <Text style={styles.mockBubbleUserText}>{slide.bubble1}</Text>
              </View>
              <View style={styles.mockBubblePartner}>
                <Text style={styles.mockBubblePartnerText}>{slide.bubble2}</Text>
              </View>
            </View>

            <View style={styles.tagChip}>
              <Text style={styles.tagChipText}>{slide.chip}</Text>
            </View>
          </View>

          {/* Headlines Section */}
          <View style={styles.contentSection}>
            <Text style={styles.titleText}>{slide.title}</Text>
            <Text style={styles.subtitleText}>{slide.subtitle}</Text>
          </View>
        </Animated.View>

        {/* Bottom Navigation & CTAs */}
        <View style={styles.bottomSection}>
          {/* Step Indicator Dots */}
          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === currentSlide ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>
              {currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <FontAwesome
              name={currentSlide === ONBOARDING_SLIDES.length - 1 ? 'arrow-right' : 'chevron-right'}
              size={15}
              color="#FFFFFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>

          {/* Direct Sign In link */}
          <TouchableOpacity
            style={styles.signInLinkBtn}
            onPress={handleSignInClick}
            activeOpacity={0.7}
          >
            <Text style={styles.signInLinkText}>
              Already have an account? <Text style={{ color: '#320034', fontWeight: 'bold' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '100%',
    maxWidth: 480,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(253, 168, 237, 0.25)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 215, 243, 0.35)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  brandBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#320034',
    letterSpacing: -0.3,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e3e4',
  },
  skipBtnText: {
    color: '#4f434c',
    fontSize: 13,
    fontWeight: '700',
  },
  visualCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e1e3e4',
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  visualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  visualIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffd7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#320034',
  },
  visualCardSub: {
    fontSize: 12,
    color: '#4f434c',
    marginTop: 2,
  },
  mockChatBox: {
    backgroundColor: '#f3f4f5',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginTop: 16,
  },
  mockBubbleUser: {
    backgroundColor: '#320034',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockBubbleUserText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  mockBubblePartner: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e1e3e4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockBubblePartnerText: {
    color: '#191c1d',
    fontSize: 13,
    fontWeight: '500',
  },
  featureTag: {
    backgroundColor: '#ffd7f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  featureTagText: {
    color: '#320034',
    fontSize: 11,
    fontWeight: '800',
  },
  contentSection: {
    marginBottom: 16,
  },
  titleText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#320034',
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    color: '#4f434c',
    lineHeight: 24,
    fontWeight: '400',
  },
  bottomSection: {
    gap: 14,
    alignItems: 'center',
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#320034',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#d2c2cd',
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#320034',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  signInLinkBtn: {
    paddingVertical: 4,
  },
  signInLinkText: {
    fontSize: 13,
    color: '#4f434c',
  },
});
