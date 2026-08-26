import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import {
  MotionView,
  MotionButton,
  AnimatePresence,
  SPRING_BOUNCY,
  SPRING_SMOOTH,
  FLOAT_LOOP,
  EASE_CINEMATIC,
} from '../components/motion/Motion';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    step: 1,
    title: 'Welcome to\nViveTalk',
    subtitle: 'Translate your conversations and voice notes instantly in over 50+ languages with neural AI.',
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

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.94,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.95,
      ease: EASE_CINEMATIC,
    },
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.94,
    transition: {
      duration: 0.65,
      ease: 'easeInOut',
    },
  }),
};

export default function LandingScreen({ onFinishLoading, onDirectSignIn }) {
  const insets = useSafeAreaInsets();
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection) => {
    if (page + newDirection >= 0 && page + newDirection < ONBOARDING_SLIDES.length) {
      setPage([page + newDirection, newDirection]);
    } else if (page + newDirection >= ONBOARDING_SLIDES.length) {
      if (onFinishLoading) onFinishLoading();
    }
  };

  const handleNext = () => paginate(1);
  const handleSkip = () => {
    if (onFinishLoading) onFinishLoading();
  };

  const handleSignInClick = () => {
    if (onDirectSignIn) onDirectSignIn();
    else handleSkip();
  };

  const currentSlide = page;
  const slide = ONBOARDING_SLIDES[currentSlide];
  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 8;
  const bottomPadding = (insets.bottom > 0 ? insets.bottom : 20) + 8;

  return (
    <View style={styles.outerContainer}>
      {/* Soft Pastel Ambient Animated Mesh */}
      <MotionView
        style={styles.glowOrbTop}
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 15, 0],
          y: [0, -10, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionView
        style={styles.glowOrbBottom}
        animate={{
          scale: [1.1, 1, 1.1],
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />

      <View style={{ flex: 1, width: '100%', alignItems: 'center', paddingTop: topPadding, paddingBottom: bottomPadding }}>
        <View style={styles.container}>
          {/* Top Header Bar */}
          <View style={styles.topBar}>
            <MotionView
              style={styles.brandBadge}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
            >
              <FontAwesome name="globe" size={16} color="#320034" style={{ marginRight: 7 }} />
              <Text style={styles.brandBadgeText}>ViveTalk</Text>
            </MotionView>

            <MotionButton
              onPress={handleSkip}
              style={styles.skipBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </MotionButton>
          </View>

          {/* Center Visual Showcase Card with AnimatePresence */}
          <View style={styles.centerContainer}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <MotionView
                key={page}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={styles.slideCardContainer}
              >
                {/* Visual Card */}
                <MotionView
                  style={styles.visualCard}
                  whileHover={{ y: -4, transition: { duration: 0.4 } }}
                >
                  <View style={styles.visualHeader}>
                    <MotionView
                      style={styles.visualIconBadge}
                      animate={{ rotate: [0, 8, -8, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <FontAwesome name={slide.icon} size={18} color="#320034" />
                    </MotionView>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.visualCardTitle}>{slide.cardTitle}</Text>
                      <Text style={styles.visualCardSub}>{slide.cardSub}</Text>
                    </View>
                  </View>

                  {/* Interactive Chat Simulation with Slower Staggered Entrance */}
                  <View style={styles.mockChatBox}>
                    <MotionView
                      style={styles.mockBubbleUser}
                      initial={{ opacity: 0, x: 35, scale: 0.92 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.85, delay: 0.35, ease: EASE_CINEMATIC }}
                    >
                      <Text style={styles.mockBubbleUserText}>{slide.bubble1}</Text>
                    </MotionView>

                    <MotionView
                      style={styles.mockBubblePartner}
                      initial={{ opacity: 0, x: -35, scale: 0.92 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.95, delay: 0.8, ease: EASE_CINEMATIC }}
                    >
                      <Text style={styles.mockBubblePartnerText}>{slide.bubble2}</Text>
                    </MotionView>
                  </View>

                  {/* Tag Chip */}
                  <MotionView
                    style={styles.tagChip}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1.15, ease: EASE_CINEMATIC }}
                    {...FLOAT_LOOP(3, 5.5)}
                  >
                    <Text style={styles.tagChipText}>{slide.chip}</Text>
                  </MotionView>
                </MotionView>

                {/* Headlines Section */}
                <MotionView
                  style={styles.contentSection}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.45, ease: EASE_CINEMATIC }}
                >
                  <Text style={styles.titleText}>{slide.title}</Text>
                  <Text style={styles.subtitleText}>{slide.subtitle}</Text>
                </MotionView>
              </MotionView>
            </AnimatePresence>
          </View>

          {/* Bottom Navigation & CTAs */}
          <View style={styles.bottomSection}>
            {/* Step Indicator Dots with Dynamic Spring Width */}
            <View style={styles.dotsRow}>
              {ONBOARDING_SLIDES.map((_, idx) => (
                <MotionView
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentSlide ? styles.activeDot : styles.inactiveDot,
                  ]}
                  animate={{
                    width: idx === currentSlide ? 28 : 8,
                    backgroundColor: idx === currentSlide ? '#320034' : 'rgba(50, 0, 52, 0.15)',
                  }}
                  transition={{ duration: 0.65, ease: EASE_CINEMATIC }}
                />
              ))}
            </View>

            {/* Primary Action Button with Motion Feedback */}
            <MotionButton
              style={styles.primaryButton}
              onPress={handleNext}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.96 }}
            >
              <Text style={styles.primaryButtonText}>
                {currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <MotionView
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <FontAwesome
                  name={currentSlide === ONBOARDING_SLIDES.length - 1 ? 'arrow-right' : 'chevron-right'}
                  size={15}
                  color="#FFFFFF"
                  style={{ marginLeft: 8 }}
                />
              </MotionView>
            </MotionButton>

            {/* Direct Sign In link */}
            <MotionButton
              style={styles.signInLinkBtn}
              onPress={handleSignInClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Text style={styles.signInLinkText}>
                Already have an account? <Text style={{ color: '#320034', fontWeight: 'bold' }}>Sign In</Text>
              </Text>
            </MotionButton>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 480,
  },
  glowOrbTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(253, 168, 237, 0.3)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(216, 180, 254, 0.35)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    zIndex: 10,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(50, 0, 52, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  brandBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#320034',
    letterSpacing: -0.3,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(50, 0, 52, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skipBtnText: {
    color: '#4F434C',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  slideCardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  visualCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(50, 0, 52, 0.08)',
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  visualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  visualIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFD7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  visualCardSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  mockChatBox: {
    gap: 10,
    marginVertical: 6,
  },
  mockBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#320034',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  mockBubbleUserText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  mockBubblePartner: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    maxWidth: '85%',
  },
  mockBubblePartnerText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '500',
  },
  tagChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 243, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(253, 168, 237, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E22CE',
  },
  contentSection: {
    width: '100%',
    paddingHorizontal: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#320034',
    lineHeight: 34,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    fontWeight: '400',
  },
  bottomSection: {
    width: '100%',
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#320034',
  },
  inactiveDot: {
    backgroundColor: 'rgba(50, 0, 52, 0.15)',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#320034',
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  signInLinkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  signInLinkText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
