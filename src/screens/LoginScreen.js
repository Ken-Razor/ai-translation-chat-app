import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../services/authService';
import { voiceService } from '../services/voiceService';
import {
  MotionView,
  MotionButton,
  AnimatePresence,
  SPRING_BOUNCY,
  SPRING_SMOOTH,
  FLOAT_LOOP,
  EASE_CINEMATIC,
} from '../components/motion/Motion';

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
];

const PROFICIENCY_LEVELS = [
  { id: 'beginner', label: 'Beginner (A1/A2)', desc: 'Just starting out or know basic greetings' },
  { id: 'intermediate', label: 'Intermediate (B1/B2)', desc: 'Can hold simple everyday conversations' },
  { id: 'advanced', label: 'Advanced (C1/C2)', desc: 'Fluent and looking to polish nuances' },
];

const AVAILABLE_INTERESTS = [
  { id: 'coffee', label: '☕ Coffee Shops' },
  { id: 'tech', label: '💻 Tech & Coding' },
  { id: 'anime', label: '🎌 Anime & Manga' },
  { id: 'travel', label: '✈️ Travel & Culture' },
  { id: 'art', label: '🎨 Art & Design' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'music', label: '🎵 Music' },
  { id: 'food', label: '🍕 Food & Cooking' },
  { id: 'books', label: '📚 Books' },
  { id: 'fitness', label: '🏃 Fitness' },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
];

const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.94,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.95,
      ease: EASE_CINEMATIC,
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.94,
    transition: {
      duration: 0.65,
      ease: 'easeInOut',
    },
  }),
};

export default function LoginScreen({ onLoginSuccess, onBackToLanding }) {
  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState('signin');
  // Multi-step signup: 1..7 and transition direction
  const [[signUpStep, stepDirection], setStepState] = useState([1, 1]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);

  // Real Microphone Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedVoiceUri, setRecordedVoiceUri] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceIntroText, setVoiceIntroText] = useState('Hello! I would love to practice languages with you over friendly chats and voice notes!');
  const recordIntervalRef = useRef(null);

  // Language & Learning DNA
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [learningLanguage, setLearningLanguage] = useState('ja');
  const [learningLevel, setLearningLevel] = useState('intermediate');

  // Interests & Bio
  const [selectedInterests, setSelectedInterests] = useState(['coffee', 'travel', 'tech']);
  const [bio, setBio] = useState('Looking for a friendly language exchange partner to practice conversational skills!');

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // OTP Verification
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const insets = useSafeAreaInsets();

  useEffect(() => {
    return () => {
      voiceService.stopPlayback();
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  const goToStep = (newStep, dir = 1) => {
    voiceService.stopPlayback();
    setIsPlayingAudio(false);
    setErrorMsg('');
    setStepState([newStep, dir]);
  };

  // --- Real Microphone Recording Handlers ---
  const handleStartRecording = async () => {
    voiceService.stopPlayback();
    setIsPlayingAudio(false);
    setErrorMsg('');

    const started = await voiceService.startRecording();
    if (!started) {
      Alert.alert('Microphone Access', 'Please allow microphone permissions to record your voice intro.');
      return;
    }

    setIsRecording(true);
    setRecordSeconds(0);

    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    recordIntervalRef.current = setInterval(() => {
      setRecordSeconds(prev => {
        if (prev >= 15) {
          handleStopRecording();
          return 15;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = async () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);

    const uri = await voiceService.stopRecording();
    if (uri) {
      setRecordedVoiceUri(uri);
    } else {
      Alert.alert('Recording Failed', 'Unable to capture voice audio. Please try again.');
    }
  };

  const handlePlayRecording = async () => {
    if (!recordedVoiceUri) return;

    if (isPlayingAudio) {
      await voiceService.stopPlayback();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    await voiceService.playAudio(recordedVoiceUri, () => {
      setIsPlayingAudio(false);
    });
  };

  const handleResetRecording = () => {
    voiceService.stopPlayback();
    setIsPlayingAudio(false);
    setRecordedVoiceUri(null);
    setRecordSeconds(0);
  };

  const handlePickCustomImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow photo library access to upload your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        setSelectedAvatar(localUri);

        if (base64) {
          try {
            const upRes = await fetch('https://vivetalk.sayflash.id/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: base64, type: 'avatar', ext: '.jpg' })
            });
            const upData = await upRes.json();
            if (upData && upData.url) {
              setSelectedAvatar(upData.url);
            }
          } catch (upErr) {}
        }
      }
    } catch (err) {
      Alert.alert('Image Error', err.message || 'Failed to select image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take a profile picture.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const base64 = result.assets[0].base64;
        setSelectedAvatar(localUri);

        if (base64) {
          try {
            const upRes = await fetch('https://vivetalk.sayflash.id/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: base64, type: 'avatar', ext: '.jpg' })
            });
            const upData = await upRes.json();
            if (upData && upData.url) {
              setSelectedAvatar(upData.url);
            }
          } catch (upErr) {}
        }
      }
    } catch (err) {
      Alert.alert('Camera Error', err.message || 'Failed to take photo');
    }
  };

  const toggleInterest = (interestId) => {
    if (selectedInterests.includes(interestId)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter(i => i !== interestId));
      }
    } else {
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  // Sign In Handler
  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      setLoading(false);
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    }
  };

  // Guest Sign In
  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const user = await authService.loginAsGuest();
      setLoading(false);
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Guest login failed.');
    }
  };

  // Multi-Step Next Handler
  const handleSignUpNext = async () => {
    setErrorMsg('');

    if (signUpStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!username.trim()) {
        setErrorMsg('Please choose a username.');
        return;
      }
      goToStep(2, 1);
    } else if (signUpStep === 2) {
      if (!selectedAvatar) {
        setErrorMsg('Please select or upload a profile picture.');
        return;
      }
      goToStep(3, 1);
    } else if (signUpStep === 3) {
      goToStep(4, 1);
    } else if (signUpStep === 4) {
      if (nativeLanguage === learningLanguage) {
        setErrorMsg('Your learning language must be different from your native language.');
        return;
      }
      goToStep(5, 1);
    } else if (signUpStep === 5) {
      if (selectedInterests.length === 0) {
        setErrorMsg('Please select at least 1 topic of interest.');
        return;
      }
      if (!bio.trim()) {
        setErrorMsg('Please write a short bio or learning goal.');
        return;
      }
      goToStep(6, 1);
    } else if (signUpStep === 6) {
      if (!email || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('Please agree to the Terms of Service & Privacy Policy.');
        return;
      }

      // Send Real 6-Digit OTP
      setOtpLoading(true);
      try {
        await authService.sendOTP(email);
        setOtpLoading(false);
        setOtpTimer(60);
        goToStep(7, 1);
      } catch (err) {
        setOtpLoading(false);
        setErrorMsg(err.message || 'Failed to send verification code to your email.');
      }
    } else if (signUpStep === 7) {
      const fullOtp = otpDigits.join('');
      if (fullOtp.length < 6) {
        setErrorMsg('Please enter all 6 digits of the verification code.');
        return;
      }

      setLoading(true);
      try {
        await authService.verifyOTP(email, fullOtp);
        const user = await authService.register(
          email,
          password,
          fullName,
          nativeLanguage
        );

        const enrichedUser = {
          ...user,
          avatar: selectedAvatar,
          photoURL: selectedAvatar,
          username: username.toLowerCase().trim(),
          voiceAudioUri: recordedVoiceUri || null,
          voiceDuration: recordSeconds > 0 ? `0:${recordSeconds.toString().padStart(2, '0')}` : '0:05',
          voiceIntroText: voiceIntroText.trim(),
          nativeLanguage,
          learningLanguage,
          learningLevel,
          interests: selectedInterests.map(id => AVAILABLE_INTERESTS.find(i => i.id === id)?.label || id),
          bio: bio.trim(),
        };

        await authService.updateUserSession(enrichedUser);

        setLoading(false);
        if (enrichedUser && onLoginSuccess) {
          onLoginSuccess(enrichedUser);
        }
      } catch (err) {
        setLoading(false);
        setErrorMsg(err.message || 'Invalid or expired verification code.');
      }
    }
  };

  const handleSignUpBack = () => {
    setErrorMsg('');
    if (signUpStep > 1) {
      goToStep(signUpStep - 1, -1);
    } else {
      setAuthMode('signin');
    }
  };

  const handleResendOTP = async () => {
    if (otpTimer > 0) return;
    setOtpLoading(true);
    setErrorMsg('');
    try {
      await authService.sendOTP(email);
      setOtpLoading(false);
      setOtpTimer(60);
    } catch (err) {
      setOtpLoading(false);
      setErrorMsg(err.message || 'Failed to resend code.');
    }
  };

  const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 48 : 20)) + 6;
  const bottomPadding = (insets.bottom > 0 ? insets.bottom : 20) + 6;

  const progressPercentage = `${Math.round((signUpStep / 7) * 100)}%`;

  return (
    <View style={styles.rootBackground}>
      {/* Soft Ambient Animated Orbs */}
      <MotionView
        style={styles.glowOrbTop}
        animate={{
          scale: [1, 1.2, 1],
          x: [-15, 15, -15],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionView
        style={styles.glowOrbBottom}
        animate={{
          scale: [1.15, 1, 1.15],
          y: [15, -15, 15],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />

      <View style={[styles.safeArea, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <AnimatePresence mode="wait">
              {authMode === 'signin' ? (
                /* ========================================================
                   SIGN IN SCREEN
                ======================================================== */
                <MotionView
                  key="signin"
                  initial={{ opacity: 0, y: 32, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.95 }}
                  transition={{ duration: 0.95, ease: EASE_CINEMATIC }}
                  style={[styles.viewBlock, { flex: 1, justifyContent: 'center' }]}
                >
                  {/* Brand Mark Header */}
                  <View style={styles.brandHeader}>
                    <MotionView
                      style={styles.brandBadge}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={SPRING_BOUNCY}
                    >
                      <FontAwesome name="globe" size={16} color="#320034" style={{ marginRight: 6 }} />
                      <Text style={styles.brandBadgeText}>ViveTalk</Text>
                    </MotionView>
                  </View>

                  {/* Title & Subtitle */}
                  <MotionView
                    style={styles.titleSection}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.85, delay: 0.2, ease: EASE_CINEMATIC }}
                  >
                    <Text style={styles.displayTitle}>Welcome Back</Text>
                    <Text style={styles.displaySub}>Sign in to continue your global language exchange.</Text>
                  </MotionView>

                  {/* Error Banner with Shake Animation */}
                  {!!errorMsg && (
                    <MotionView
                      style={styles.errorBanner}
                      animate={{ x: [-8, 8, -6, 6, -3, 3, 0] }}
                      transition={{ duration: 0.55 }}
                    >
                      <FontAwesome name="exclamation-circle" size={16} color="#BA1A1A" style={{ marginRight: 8 }} />
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </MotionView>
                  )}

                  {/* Form Card */}
                  <MotionView
                    style={styles.formCard}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.3, ease: EASE_CINEMATIC }}
                  >
                    {/* Email Input */}
                    <View style={styles.inputBlock}>
                      <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                      <View style={styles.inputWrapper}>
                        <FontAwesome name="envelope-o" size={16} color="#80737d" style={styles.leftIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="name@example.com"
                          placeholderTextColor="#80737d"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputBlock}>
                      <View style={styles.labelRow}>
                        <Text style={styles.fieldLabel}>PASSWORD</Text>
                        <TouchableOpacity onPress={() => Alert.alert('Support', 'Contact contact@sayflash.id for password reset.')}>
                          <Text style={styles.forgotLink}>Forgot Password?</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.inputWrapper}>
                        <FontAwesome name="lock" size={17} color="#80737d" style={styles.leftIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter your password"
                          placeholderTextColor="#80737d"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.rightIconBtn}>
                          <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={16} color="#80737d" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Primary Button */}
                    <MotionButton
                      style={[styles.primaryBtn, loading && styles.btnDisabled]}
                      onPress={handleSignIn}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryBtnText}>Sign In</Text>
                          <FontAwesome name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </>
                      )}
                    </MotionButton>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerLabel}>OR CONTINUE WITH</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Guest Login */}
                    <MotionButton
                      style={styles.guestBtn}
                      onPress={handleGuestLogin}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <FontAwesome name="user-secret" size={16} color="#8b4482" style={{ marginRight: 10 }} />
                      <Text style={styles.guestBtnText}>Continue as Guest</Text>
                    </MotionButton>
                  </MotionView>

                  {/* Footer Link to Multi-Step Sign Up */}
                  <MotionView
                    style={styles.footerSection}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55, duration: 0.8 }}
                  >
                    <Text style={styles.footerPrompt}>
                      Don't have an account?{' '}
                      <Text
                        style={styles.footerLinkText}
                        onPress={() => {
                          setAuthMode('signup');
                          setStepState([1, 1]);
                          setErrorMsg('');
                        }}
                      >
                        Sign Up
                      </Text>
                    </Text>
                  </MotionView>
                </MotionView>
              ) : (
                /* ========================================================
                   MULTI-STEP SIGN UP WIZARD (7 STEPS)
                ======================================================== */
                <MotionView
                  key="signup"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.95, ease: EASE_CINEMATIC }}
                  style={[styles.viewBlock, { flex: 1 }]}
                >
                  {/* Top Navigation Row: Back Button & Step Progress */}
                  <View style={styles.wizardHeaderRow}>
                    <MotionButton
                      style={styles.wizardBackBtn}
                      onPress={handleSignUpBack}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <FontAwesome name="arrow-left" size={15} color="#320034" />
                    </MotionButton>

                    <MotionView
                      style={styles.stepBadge}
                      animate={{ scale: [0.95, 1] }}
                      transition={SPRING_BOUNCY}
                    >
                      <Text style={styles.stepBadgeText}>Step {signUpStep} of 7</Text>
                    </MotionView>
                  </View>

                  {/* Visual Step Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: progressPercentage }]} />
                  </View>

                  {/* Error Banner */}
                  {!!errorMsg && (
                    <MotionView
                      style={styles.errorBanner}
                      animate={{ x: [-8, 8, -6, 6, -3, 3, 0] }}
                      transition={{ duration: 0.55 }}
                    >
                      <FontAwesome name="exclamation-circle" size={16} color="#BA1A1A" style={{ marginRight: 8 }} />
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </MotionView>
                  )}

                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <AnimatePresence initial={false} custom={stepDirection} mode="wait">
                      {/* ---------------- STEP 1: Name & Handle ---------------- */}
                      {signUpStep === 1 && (
                        <MotionView
                          key="step1"
                          custom={stepDirection}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={styles.stepContentCard}
                        >
                          <View style={styles.stepTitleBox}>
                            <Text style={styles.stepHeadline}>What's your name?</Text>
                            <Text style={styles.stepSubline}>Choose how you want other language partners to address you.</Text>
                          </View>

                          <View style={styles.inputBlock}>
                            <Text style={styles.fieldLabel}>FULL NAME</Text>
                            <View style={styles.inputWrapper}>
                              <FontAwesome name="user-o" size={16} color="#80737d" style={styles.leftIcon} />
                              <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Ken Agatha"
                                placeholderTextColor="#80737d"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                              />
                            </View>
                          </View>

                          <View style={styles.inputBlock}>
                            <Text style={styles.fieldLabel}>USERNAME (HANDLE)</Text>
                            <View style={styles.inputWrapper}>
                              <FontAwesome name="at" size={16} color="#80737d" style={styles.leftIcon} />
                              <TextInput
                                style={styles.textInput}
                                placeholder="e.g. ken_agatha"
                                placeholderTextColor="#80737d"
                                value={username}
                                onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s+/g, '_'))}
                                autoCapitalize="none"
                              />
                            </View>
                            {!!username && (
                              <MotionView
                                style={styles.handlePreview}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                              >
                                <Text style={styles.handlePreviewText}>Preview: @{username}</Text>
                              </MotionView>
                            )}
                          </View>

                          <MotionButton
                            style={styles.primaryBtn}
                            onPress={handleSignUpNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Text style={styles.primaryBtnText}>Continue to Photo</Text>
                            <FontAwesome name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 8 }} />
                          </MotionButton>
                        </MotionView>
                      )}

                      {/* ---------------- STEP 2: Profile Photo ---------------- */}
                      {signUpStep === 2 && (
                        <MotionView
                          key="step2"
                          custom={stepDirection}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={styles.stepContentCard}
                        >
                          <View style={styles.stepTitleBox}>
                            <Text style={styles.stepHeadline}>Choose Your Photo</Text>
                            <Text style={styles.stepSubline}>Add a profile picture so partners can recognize you.</Text>
                          </View>

                          <View style={styles.photoDedicatedContainer}>
                            {/* Showcase Ring with Float */}
                            <MotionView
                              style={styles.photoShowcaseRing}
                              {...FLOAT_LOOP(4, 5.5)}
                            >
                              <Image source={{ uri: selectedAvatar }} style={styles.photoShowcaseImage} />
                              <TouchableOpacity
                                style={styles.photoFloatingUploadBtn}
                                onPress={handlePickCustomImage}
                                activeOpacity={0.8}
                              >
                                <FontAwesome name="camera" size={13} color="#FFFFFF" />
                              </TouchableOpacity>
                            </MotionView>

                            {/* Camera & Gallery Action Buttons */}
                            <View style={styles.photoActionButtonsRow}>
                              <MotionButton
                                style={styles.photoUploadPill}
                                onPress={handlePickCustomImage}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <FontAwesome name="image" size={13} color="#4B1A56" style={{ marginRight: 6 }} />
                                <Text style={styles.photoUploadPillText}>Choose Library</Text>
                              </MotionButton>

                              <MotionButton
                                style={styles.photoCameraPill}
                                onPress={handleTakePhoto}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <FontAwesome name="camera" size={13} color="#4B1A56" style={{ marginRight: 6 }} />
                                <Text style={styles.photoUploadPillText}>Take Selfie</Text>
                              </MotionButton>
                            </View>

                            {/* Presets Grid */}
                            <Text style={styles.presetSectionLabel}>OR SELECT A PRESET AVATAR</Text>
                            <View style={styles.presetAvatarsGrid}>
                              {PRESET_AVATARS.map((avatarUri, idx) => {
                                const isActive = selectedAvatar === avatarUri;
                                return (
                                  <MotionButton
                                    key={idx}
                                    style={[styles.presetAvatarBox, isActive && styles.presetAvatarBoxActive]}
                                    onPress={() => setSelectedAvatar(avatarUri)}
                                    whileHover={{ scale: 1.12 }}
                                    whileTap={{ scale: 0.9 }}
                                    animate={{ scale: isActive ? 1.08 : 1 }}
                                    transition={SPRING_BOUNCY}
                                  >
                                    <Image source={{ uri: avatarUri }} style={styles.presetAvatarImg} />
                                    {isActive && (
                                      <View style={styles.presetActiveCheck}>
                                        <FontAwesome name="check" size={14} color="#FFFFFF" />
                                      </View>
                                    )}
                                  </MotionButton>
                                );
                              })}
                            </View>
                          </View>

                          <MotionButton
                            style={styles.primaryBtn}
                            onPress={handleSignUpNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Text style={styles.primaryBtnText}>Continue to Voice Greeting</Text>
                            <FontAwesome name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 8 }} />
                          </MotionButton>
                        </MotionView>
                      )}

                      {/* ---------------- STEP 3: Voice Greeting ---------------- */}
                      {signUpStep === 3 && (
                        <MotionView
                          key="step3"
                          custom={stepDirection}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={styles.stepContentCard}
                        >
                          <View style={styles.stepTitleBox}>
                            <Text style={styles.stepHeadline}>Record Voice Greeting</Text>
                            <Text style={styles.stepSubline}>Say a warm hello in your native language (up to 15 seconds).</Text>
                          </View>

                          {/* Recording Studio Card */}
                          <View style={styles.recorderStudioCard}>
                            <View style={styles.micButtonContainer}>
                              {isRecording && (
                                <MotionView
                                  style={styles.micPulseRing}
                                  animate={{
                                    scale: [1, 1.45, 1.9],
                                    opacity: [0.8, 0.4, 0],
                                  }}
                                  transition={{ duration: 3.0, repeat: Infinity, ease: 'easeOut' }}
                                />
                              )}

                              <MotionButton
                                style={[
                                  styles.realMicBtn,
                                  isRecording && styles.realMicBtnRecording,
                                  recordedVoiceUri && !isRecording && styles.realMicBtnDone,
                                ]}
                                onPress={isRecording ? handleStopRecording : handleStartRecording}
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.92 }}
                                animate={{ scale: isRecording ? [1, 1.08, 1] : 1 }}
                                transition={{ duration: 1.6, repeat: isRecording ? Infinity : 0 }}
                              >
                                <FontAwesome
                                  name={isRecording ? 'stop' : recordedVoiceUri ? 'check' : 'microphone'}
                                  size={26}
                                  color="#FFFFFF"
                                />
                              </MotionButton>
                            </View>

                            <Text style={[styles.recorderStatusText, isRecording && { color: '#EF4444' }]}>
                              {isRecording
                                ? `Recording... 0:${recordSeconds.toString().padStart(2, '0')} / 0:15`
                                : recordedVoiceUri
                                ? `Voice Greeting Recorded (0:${recordSeconds.toString().padStart(2, '0')})`
                                : 'Tap the mic to start recording your voice'}
                            </Text>

                            {/* Live Waveform Bars */}
                            <View style={styles.liveWaveformRow}>
                              {[18, 30, 15, 34, 22, 16, 28].map((baseH, idx) => (
                                <MotionView
                                  key={idx}
                                  style={styles.waveBar}
                                  animate={{
                                    height: isRecording ? [baseH, baseH + 18, baseH] : recordedVoiceUri ? baseH : 6,
                                  }}
                                  transition={{
                                    duration: 1.4,
                                    repeat: isRecording ? Infinity : 0,
                                    delay: idx * 0.16,
                                  }}
                                />
                              ))}
                            </View>

                            {recordedVoiceUri && !isRecording && (
                              <View style={styles.recordingControlsRow}>
                                <MotionButton
                                  style={[styles.playRecordedBtn, isPlayingAudio && styles.playRecordedBtnActive]}
                                  onPress={handlePlayRecording}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.94 }}
                                >
                                  <FontAwesome name={isPlayingAudio ? 'pause' : 'play'} size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                                  <Text style={styles.playRecordedBtnText}>
                                    {isPlayingAudio ? 'Pause Voice' : 'Play Recording'}
                                  </Text>
                                </MotionButton>

                                <MotionButton
                                  style={styles.reRecordBtn}
                                  onPress={handleResetRecording}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.94 }}
                                >
                                  <FontAwesome name="repeat" size={13} color="#BA1A1A" style={{ marginRight: 6 }} />
                                  <Text style={styles.reRecordBtnText}>Re-record</Text>
                                </MotionButton>
                              </View>
                            )}
                          </View>

                          <View style={[styles.inputBlock, { marginTop: 12 }]}>
                            <Text style={styles.fieldLabel}>GREETING NOTE (WHAT DID YOU SAY?)</Text>
                            <View style={[styles.inputWrapper, { height: 56, alignItems: 'flex-start', paddingVertical: 8 }]}>
                              <TextInput
                                style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
                                placeholder="e.g. Hello! Looking forward to learning together!"
                                placeholderTextColor="#80737d"
                                value={voiceIntroText}
                                onChangeText={setVoiceIntroText}
                              />
                            </View>
                          </View>

                          <MotionButton
                            style={styles.primaryBtn}
                            onPress={handleSignUpNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Text style={styles.primaryBtnText}>
                              {recordedVoiceUri ? 'Continue with My Voice' : 'Skip & Continue'}
                            </Text>
                            <FontAwesome name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 8 }} />
                          </MotionButton>
                        </MotionView>
                      )}

                      {/* ---------------- STEP 4: Language DNA ---------------- */}
                      {signUpStep === 4 && (
                        <MotionView
                          key="step4"
                          custom={stepDirection}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={styles.stepContentCard}
                        >
                          <View style={styles.stepTitleBox}>
                            <Text style={styles.stepHeadline}>Your Language DNA</Text>
                            <Text style={styles.stepSubline}>Select your native tongue and the language you wish to master.</Text>
                          </View>

                          {/* Native Language */}
                          <Text style={styles.fieldLabel}>1. NATIVE LANGUAGE (YOU SPEAK)</Text>
                          <View style={styles.langMiniGrid}>
                            {AVAILABLE_LANGUAGES.map(lang => {
                              const isSelected = nativeLanguage === lang.code;
                              return (
                                <MotionButton
                                  key={`native_${lang.code}`}
                                  style={[styles.langMiniChip, isSelected && styles.langMiniChipSelected]}
                                  onPress={() => setNativeLanguage(lang.code)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Text style={styles.chipFlag}>{lang.flag}</Text>
                                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                    {lang.name}
                                  </Text>
                                </MotionButton>
                              );
                            })}
                          </View>

                          {/* Target Learning Language */}
                          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>2. TARGET LANGUAGE (YOU WANT TO LEARN)</Text>
                          <View style={styles.langMiniGrid}>
                            {AVAILABLE_LANGUAGES.map(lang => {
                              const isSelected = learningLanguage === lang.code;
                              const isSameAsNative = nativeLanguage === lang.code;
                              return (
                                <MotionButton
                                  key={`target_${lang.code}`}
                                  style={[
                                    styles.langMiniChip,
                                    isSelected && styles.langMiniChipTargetSelected,
                                    isSameAsNative && { opacity: 0.4 }
                                  ]}
                                  onPress={() => {
                                    if (!isSameAsNative) setLearningLanguage(lang.code);
                                  }}
                                  whileHover={!isSameAsNative ? { scale: 1.05 } : {}}
                                  whileTap={!isSameAsNative ? { scale: 0.95 } : {}}
                                >
                                  <Text style={styles.chipFlag}>{lang.flag}</Text>
                                  <Text style={[styles.chipText, isSelected && styles.chipTextTargetSelected]}>
                                    {lang.name}
                                  </Text>
                                </MotionButton>
                              );
                            })}
                          </View>

                          {/* Proficiency Level */}
                          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>3. CURRENT PROFICIENCY LEVEL</Text>
                          <View style={styles.levelOptionsCol}>
                            {PROFICIENCY_LEVELS.map(lvl => {
                              const isSelected = learningLevel === lvl.id;
                              return (
                                <MotionButton
                                  key={lvl.id}
                                  style={[styles.levelRow, isSelected && styles.levelRowSelected]}
                                  onPress={() => setLearningLevel(lvl.id)}
                                  whileHover={{ x: 3 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <View style={styles.levelRadio}>
                                    {isSelected && <View style={styles.levelRadioDot} />}
                                  </View>
                                  <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>{lvl.label}</Text>
                                    <Text style={styles.levelDesc}>{lvl.desc}</Text>
                                  </View>
                                </MotionButton>
                              );
                            })}
                          </View>

                          <MotionButton
                            style={[styles.primaryBtn, { marginTop: 16 }]}
                            onPress={handleSignUpNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Text style={styles.primaryBtnText}>Continue to Interests</Text>
                            <FontAwesome name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 8 }} />
                          </MotionButton>
                        </MotionView>
                      )}

                      {/* ---------------- STEP 5: Interests & Bio ---------------- */}
                      {signUpStep === 5 && (
                        <MotionView
                          key="step5"
                          custom={stepDirection}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={styles.stepContentCard}
                        >
                          <View style={styles.stepTitleBox}>
                            <Text style={styles.stepHeadline}>Interests & Bio</Text>
                            <Text style={styles.stepSubline}>Pick your favorite conversation topics so partners know what to talk about.</Text>
                          </View>

                          {/* Interests Pills */}
                          <Text style={styles.fieldLabel}>FAVORITE TOPICS TO CHAT ABOUT (SELECT AT LEAST 1)</Text>
                          <View style={styles.interestsGrid}>
                            {AVAILABLE_INTERESTS.map(item => {
                              const isSelected = selectedInterests.includes(item.id);
                              return (
                                <MotionButton
                                  key={item.id}
                                  style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                                  onPress={() => toggleInterest(item.id)}
                                  whileHover={{ scale: 1.06 }}
                                  whileTap={{ scale: 0.94 }}
                                >
                                  <Text style={[styles.interestChipText, isSelected && styles.interestChipTextSelected]}>
                                    {item.label}
                                  </Text>
                                </MotionButton>
                              );
                            })}
                          </View>

                          {/* Short Bio */}
                          <View style={[styles.inputBlock, { marginTop: 14 }]}>
                            <Text style={styles.fieldLabel}>SHORT BIO / LEARNING GOAL</Text>
                            <View style={[styles.inputWrapper, { height: 75, alignItems: 'flex-start', paddingVertical: 8 }]}>
                              <TextInput
                                style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
                                placeholder="e.g. Looking to practice conversational Japanese over coffee!"
                                placeholderTextColor="#80737d"
                                value={bio}
                                onChangeText={setBio}
                                multiline
                                numberOfLines={3}
                              />
                            </View>
                          </View>

                          <MotionButton
                            style={[styles.primaryBtn, { marginTop: 14 }]}
                            onPress={handleSignUpNext}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            <Text style={styles.primaryBtnText}>Continue to Account</Text>
                            <FontAwesome name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 8 }} />
                          </MotionButton>
                        </MotionView>
                      )}

                      {/* ---------------- STEP 6: Email & Password ---------------- */}
                      {signUpStep === 6 && (
                        <MotionView
                          key="step6"
                          custom={stepDirection}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={styles.stepContentCard}
                        >
                          <View style={styles.stepTitleBox}>
                            <Text style={styles.stepHeadline}>Create Your Credentials</Text>
                            <Text style={styles.stepSubline}>Enter your email address to receive your 6-digit verification code.</Text>
                          </View>

                          <View style={styles.inputBlock}>
                            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                            <View style={styles.inputWrapper}>
                              <FontAwesome name="envelope-o" size={16} color="#80737d" style={styles.leftIcon} />
                              <TextInput
                                style={styles.textInput}
                                placeholder="Enter your email address"
                                placeholderTextColor="#80737d"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                              />
                            </View>
                          </View>

                          <View style={styles.inputBlock}>
                            <Text style={styles.fieldLabel}>PASSWORD</Text>
                            <View style={styles.inputWrapper}>
                              <FontAwesome name="lock" size={17} color="#80737d" style={styles.leftIcon} />
                              <TextInput
                                style={styles.textInput}
                                placeholder="Choose a strong password (6+ chars)"
                                placeholderTextColor="#80737d"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                              />
                              <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.rightIconBtn}>
                                <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={16} color="#80737d" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Terms Checkbox */}
                          <TouchableOpacity
                            style={styles.termsRow}
                            onPress={() => setTermsAccepted(!termsAccepted)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.checkboxBox, termsAccepted && styles.checkboxBoxChecked]}>
                              {termsAccepted && <FontAwesome name="check" size={10} color="#FFFFFF" />}
                            </View>
                            <Text style={styles.termsText}>
                              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.
                            </Text>
                          </TouchableOpacity>

                          <MotionButton
                            style={[styles.primaryBtn, otpLoading && styles.btnDisabled]}
                            onPress={handleSignUpNext}
                            disabled={otpLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            {otpLoading ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <>
                                <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                                <FontAwesome name="paper-plane" size={14} color="#FFFFFF" style={{ marginLeft: 8 }} />
                              </>
                            )}
                          </MotionButton>
                        </MotionView>
                      )}

                      {/* ---------------- STEP 7: Email OTP Verification ---------------- */}
                      {signUpStep === 7 && (
                        <MotionView
                          key="step7"
                          custom={stepDirection}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          style={styles.stepContentCard}
                        >
                          <View style={styles.stepTitleBox}>
                            <MotionView
                              style={styles.otpIconBadge}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <FontAwesome name="envelope-open-o" size={26} color="#320034" />
                            </MotionView>
                            <Text style={styles.stepHeadline}>Verify Your Email</Text>
                            <Text style={styles.stepSubline}>
                              We sent a 6-digit code to <Text style={{ color: '#320034', fontWeight: 'bold' }}>{email}</Text> from <Text style={{ color: '#8b4482', fontWeight: 'bold' }}>contact@sayflash.id</Text>
                            </Text>
                          </View>

                          {/* 6 Discrete Digit Boxes */}
                          <View style={styles.otpBoxesRow}>
                            {otpDigits.map((digit, idx) => (
                              <TextInput
                                key={idx}
                                style={[styles.otpDigitBox, !!digit && styles.otpDigitBoxFilled]}
                                value={digit}
                                onChangeText={(val) => {
                                  const newDigits = [...otpDigits];
                                  newDigits[idx] = val.slice(-1);
                                  setOtpDigits(newDigits);
                                }}
                                keyboardType="number-pad"
                                maxLength={1}
                                textAlign="center"
                              />
                            ))}
                          </View>

                          <MotionButton
                            style={[styles.primaryBtn, loading && styles.btnDisabled]}
                            onPress={handleSignUpNext}
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            {loading ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <>
                                <Text style={styles.primaryBtnText}>Verify & Complete Setup</Text>
                                <FontAwesome name="check-circle" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                              </>
                            )}
                          </MotionButton>

                          {/* Resend Timer */}
                          <View style={styles.resendBlock}>
                            {otpTimer > 0 ? (
                              <Text style={styles.resendTimerText}>Resend code in {otpTimer}s</Text>
                            ) : (
                              <TouchableOpacity onPress={handleResendOTP} disabled={otpLoading}>
                                <Text style={styles.resendLinkText}>Resend Code</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </MotionView>
                      )}
                    </AnimatePresence>
                  </View>
                </MotionView>
              )}
            </AnimatePresence>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootBackground: {
    flex: 1,
    backgroundColor: '#FAFAF9',
    position: 'relative',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  viewBlock: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingVertical: 10,
    zIndex: 10,
  },

  // Ambient Glow
  glowOrbTop: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 215, 243, 0.4)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(216, 180, 254, 0.4)',
  },

  // Brand Header
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD7F3',
    paddingHorizontal: 14,
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
    fontWeight: '800',
    color: '#320034',
    letterSpacing: -0.3,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  displayTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#320034',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  displaySub: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDAD6',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BA1A1A',
  },
  errorText: {
    color: '#410002',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(50, 0, 52, 0.06)',
  },
  inputBlock: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 11.5,
    color: '#8B4482',
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leftIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  rightIconBtn: {
    padding: 6,
  },

  // Primary Button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#320034',
    borderRadius: 18,
    height: 50,
    marginTop: 8,
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },

  // Guest Button
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5F9',
    borderRadius: 16,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(139, 68, 130, 0.15)',
  },
  guestBtnText: {
    color: '#8B4482',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Footer Link
  footerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerPrompt: {
    fontSize: 13.5,
    color: '#6B7280',
  },
  footerLinkText: {
    color: '#320034',
    fontWeight: '800',
  },

  // --- WIZARD HEADER ---
  wizardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wizardBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepBadge: {
    backgroundColor: '#FFD7F3',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  stepBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#320034',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#F3E8FF',
    borderRadius: 2.5,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#320034',
    borderRadius: 2.5,
  },

  // Wizard Card Content
  stepContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(50, 0, 52, 0.06)',
  },
  stepTitleBox: {
    marginBottom: 14,
  },
  stepHeadline: {
    fontSize: 20,
    fontWeight: '800',
    color: '#320034',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  stepSubline: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 17,
  },

  // --- DEDICATED PHOTO SECTION STYLES ---
  photoDedicatedContainer: {
    alignItems: 'center',
    marginVertical: 6,
    paddingBottom: 10,
  },
  photoShowcaseRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3.5,
    borderColor: '#320034',
    position: 'relative',
    backgroundColor: '#E5E7EB',
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 14,
  },
  photoShowcaseImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  photoFloatingUploadBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#320034',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  photoUploadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0FA',
    borderWidth: 1,
    borderColor: '#F9A8D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  photoCameraPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  photoUploadPillText: {
    fontSize: 11.5,
    color: '#320034',
    fontWeight: '700',
  },
  presetSectionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetAvatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  presetAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  presetAvatarBoxActive: {
    borderColor: '#320034',
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  presetActiveCheck: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(50, 0, 52, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- REAL MICROPHONE RECORDING STUDIO STYLES ---
  recorderStudioCard: {
    backgroundColor: '#FFF0FA',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F9A8D4',
    marginVertical: 8,
  },
  micButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  micPulseRing: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  realMicBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#320034',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#320034',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  realMicBtnRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  realMicBtnDone: {
    backgroundColor: '#059669',
  },
  recorderStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#320034',
    marginBottom: 12,
    textAlign: 'center',
  },
  liveWaveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 6,
    marginBottom: 12,
  },
  waveBar: {
    width: 5,
    backgroundColor: '#C026D3',
    borderRadius: 2.5,
  },
  recordingControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  playRecordedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#320034',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 16,
  },
  playRecordedBtnActive: {
    backgroundColor: '#7C3AED',
  },
  playRecordedBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  reRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFDAD6',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  reRecordBtnText: {
    color: '#BA1A1A',
    fontSize: 12.5,
    fontWeight: '700',
  },

  handlePreview: {
    marginTop: 4,
    marginLeft: 4,
  },
  handlePreviewText: {
    fontSize: 11.5,
    color: '#8B4482',
    fontWeight: '600',
  },

  // Language Chips Mini Grid
  langMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  langMiniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 5,
  },
  langMiniChipSelected: {
    backgroundColor: '#FFF0FA',
    borderColor: '#320034',
  },
  langMiniChipTargetSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
  },
  chipFlag: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#320034',
    fontWeight: '700',
  },
  chipTextTargetSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },

  // Level Options
  levelOptionsCol: {
    gap: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  levelRowSelected: {
    backgroundColor: '#FFF0FA',
    borderColor: '#320034',
  },
  levelRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#320034',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#320034',
  },
  levelLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
  },
  levelLabelSelected: {
    color: '#320034',
  },
  levelDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  // Interests Grid
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  interestChip: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  interestChipSelected: {
    backgroundColor: '#FFF0FA',
    borderColor: '#320034',
  },
  interestChipText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  interestChipTextSelected: {
    color: '#320034',
    fontWeight: '700',
  },

  // Terms Row
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxBoxChecked: {
    backgroundColor: '#320034',
    borderColor: '#320034',
  },
  termsText: {
    fontSize: 11.5,
    color: '#6B7280',
    flex: 1,
    lineHeight: 16,
  },
  termsLink: {
    color: '#320034',
    fontWeight: '700',
  },

  // OTP Verification Box
  otpIconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFD7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  otpDigitBox: {
    width: 44,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    fontSize: 20,
    fontWeight: '800',
    color: '#320034',
  },
  otpDigitBoxFilled: {
    borderColor: '#320034',
    backgroundColor: '#FFF0FA',
  },
  resendBlock: {
    alignItems: 'center',
    marginTop: 14,
  },
  resendTimerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  resendLinkText: {
    fontSize: 13,
    color: '#320034',
    fontWeight: '700',
  },
});
