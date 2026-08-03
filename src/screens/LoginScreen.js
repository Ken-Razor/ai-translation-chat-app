import React, { useState, useEffect } from 'react';
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
  Modal
} from 'react-native';

import { authService } from '../services/authService';

export default function LoginScreen({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 6-Digit OTP Verification State
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sentOTPCode, setSentOTPCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Pre-configured IAM accounts for quick testing
  const quickAccounts = [
    { label: '💻 Laptop User', email: 'ken.test2@test.com', pass: 'password123', name: 'Ken (Laptop)', lang: 'en' },
    { label: '📱 Mobile User', email: 'ken.sanio@test.com', pass: 'password123', name: 'Ken (Mobile)', lang: 'zh' },
  ];

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  const handleQuickSelect = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    if (isSignUp) {
      setDisplayName(acc.name);
      setNativeLanguage(acc.lang);
    }
    setErrorMsg('');
  };

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    if (password.length < 6) return { label: 'Weak Password', color: '#EF4444', width: '33%' };
    if (password.length < 10) return { label: 'Medium Security', color: '#F59E0B', width: '66%' };
    return { label: 'Strong IAM Password 🔒', color: '#10B981', width: '100%' };
  };

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (isSignUp && !isOtpVerified) {
      setErrorMsg('Please verify your email with the 6-digit OTP code before registering.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      let user;
      if (isSignUp) {
        user = await authService.register(email, password, displayName || email.split('@')[0], nativeLanguage);
      } else {
        user = await authService.login(email, password);
      }
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  const handleRequestOTP = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address first.');
      return;
    }
    setErrorMsg('');
    setOtpLoading(true);
    try {
      const data = await authService.sendOTP(email);
      setSentOTPCode(data.otpCode || '');
      setOtpCode(data.otpCode || ''); // Auto-fill for seamless testing
      setShowOTPModal(true);
      setOtpTimer(60);
      setOtpLoading(false);
    } catch (err) {
      setOtpLoading(false);
      setErrorMsg(err.message || 'Failed to send verification code');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setOtpLoading(true);
    try {
      await authService.verifyOTP(email, otpCode);
      setOtpLoading(false);
      setShowOTPModal(false);
      setIsOtpVerified(true);
      setErrorMsg('');
    } catch (err) {
      setOtpLoading(false);
      setErrorMsg(err.message || 'Invalid verification code');
    }
  };

  const handleGuestLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await authService.loginAsGuest();
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setLoading(false);
      setErrorMsg('Guest login failed');
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.centerWrapper}>
          {/* Brand Glassmorphism Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoGlowRing}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>⚡</Text>
              </View>
            </View>
            <Text style={styles.brandTitle}>ViveTalk</Text>
            <Text style={styles.brandSub}>Powered by Sayflash AI</Text>
          </View>

          {/* Quick Demo Account Selector */}
          <View style={styles.quickBox}>
            <Text style={styles.quickBoxTitle}>⚡ ONE-TAP IAM DEMO LOGIN</Text>
            <View style={styles.quickChipsRow}>
              {quickAccounts.map((acc, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.quickChip,
                    email.toLowerCase() === acc.email.toLowerCase() && styles.quickChipActive
                  ]}
                  onPress={() => handleQuickSelect(acc)}
                >
                  <Text style={[
                    styles.quickChipText,
                    email.toLowerCase() === acc.email.toLowerCase() && styles.quickChipTextActive
                  ]}>
                    {acc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* IAM Auth Card */}
          <View style={styles.authCard}>
            {/* Tab Selector: Login vs Register */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, !isSignUp && styles.tabBtnActive]}
                onPress={() => { setIsSignUp(false); setErrorMsg(''); }}
              >
                <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, isSignUp && styles.tabBtnActive]}
                onPress={() => { setIsSignUp(true); setErrorMsg(''); }}
              >
                <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Form Error Banner */}
            {!!errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setIsOtpVerified(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Sign Up Additional Fields */}
            {isSignUp && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DISPLAY NAME</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ken"
                      placeholderTextColor="#475569"
                      value={displayName}
                      onChangeText={setDisplayName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PRIMARY LANGUAGE</Text>
                  <View style={styles.langGrid}>
                    {[
                      { id: 'en', name: 'English 🇺🇸' },
                      { id: 'zh', name: 'Chinese 🇨🇳' },
                      { id: 'es', name: 'Spanish 🇪🇸' },
                      { id: 'ja', name: 'Japanese 🇯🇵' },
                    ].map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.langChip, nativeLanguage === item.id && styles.langChipSelected]}
                        onPress={() => setNativeLanguage(item.id)}
                      >
                        <Text style={[styles.langChipText, nativeLanguage === item.id && styles.langChipTextSelected]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {!!password && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View style={[styles.strengthBarFill, { backgroundColor: passwordStrength.color, width: passwordStrength.width }]} />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                </View>
              )}
            </View>

            {/* OTP Section (ONLY in Create Account mode, placed BEFORE Register Button) */}
            {isSignUp && (
              <View style={styles.otpSectionCard}>
                <View style={styles.otpHeaderRow}>
                  <Text style={styles.otpHeaderTitle}>
                    {isOtpVerified ? '✅ EMAIL OTP VERIFIED' : '📩 STEP 1: VERIFY EMAIL OTP'}
                  </Text>
                  {isOtpVerified && <Text style={styles.otpVerifiedBadge}>Verified 🔒</Text>}
                </View>

                {!isOtpVerified ? (
                  <View>
                    <Text style={styles.otpNoticeSub}>
                      Verify account ownership with a 6-digit OTP code sent to your email to enable registration.
                    </Text>
                    <TouchableOpacity
                      style={styles.otpRequestBtn}
                      onPress={handleRequestOTP}
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.otpRequestBtnText}>
                          📩 Send 6-Digit Email Verification Code
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.otpSuccessNote}>
                    Email <Text style={{ color: '#38BDF8', fontWeight: '700' }}>{email}</Text> verified! Tap Register below to finish.
                  </Text>
                )}
              </View>
            )}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (isSignUp && !isOtpVerified) && styles.submitBtnDisabled
              ]}
              onPress={handleAuthSubmit}
              disabled={loading || (isSignUp && !isOtpVerified)}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isSignUp
                    ? isOtpVerified
                      ? 'REGISTER & ENTER SAYFLASH 🚀'
                      : '🔒 VERIFY OTP TO REGISTER'
                    : 'AUTHENTICATE & ENTER'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK PASS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest Access Button */}
            <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin} disabled={loading}>
              <Text style={styles.guestBtnText}>⚡ Continue as Guest (IAM Demo Mode)</Text>
            </TouchableOpacity>
          </View>

          {/* Footer info */}
          <View style={styles.footerBadge}>
            <Text style={styles.footerBadgeText}>🔒 End-to-End Encrypted Session • Golang REST Engine</Text>
          </View>
        </View>
      </ScrollView>

      {/* 6-DIGIT EMAIL OTP VERIFICATION MODAL */}
      <Modal visible={showOTPModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalCard}>
            <Text style={styles.otpModalIcon}>📩</Text>
            <Text style={styles.otpModalTitle}>Verify Your Email</Text>
            <Text style={styles.otpModalSub}>
              Enter the 6-digit verification code sent to{'\n'}
              <Text style={styles.otpEmailHighlight}>{email}</Text>
            </Text>

            {/* OTP Preview Badge for Demo */}
            {!!sentOTPCode && (
              <View style={styles.otpCodeBadge}>
                <Text style={styles.otpCodeBadgeTitle}>⚡ Instant Demo Code:</Text>
                <Text style={styles.otpCodeBadgeText}>{sentOTPCode}</Text>
              </View>
            )}

            {/* 6-Digit Input */}
            <TextInput
              style={styles.otpInput}
              placeholder="123456"
              placeholderTextColor="#475569"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.otpModalActions}>
              <TouchableOpacity
                style={styles.otpCancelBtn}
                onPress={() => setShowOTPModal(false)}
              >
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.otpVerifyBtn}
                onPress={handleVerifyOTP}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.otpVerifyText}>Verify Code</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Resend Timer */}
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleRequestOTP}
              disabled={otpTimer > 0 || otpLoading}
            >
              <Text style={styles.resendText}>
                {otpTimer > 0 ? `Resend code in ${otpTimer}s` : "Didn't receive code? Resend"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerWrapper: {
    width: '100%',
    maxWidth: 440,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoGlowRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 12,
    color: '#818CF8',
    fontWeight: '600',
    marginTop: 2,
  },
  quickBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  quickBoxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickChipActive: {
    backgroundColor: '#3730A3',
    borderColor: '#6366F1',
  },
  quickChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  authCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    color: '#F87171',
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  eyeText: {
    fontSize: 16,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '700',
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  langChip: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langChipSelected: {
    backgroundColor: '#3730A3',
    borderColor: '#6366F1',
  },
  langChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  langChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  otpSectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  otpHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  otpVerifiedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  otpNoticeSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
    lineHeight: 15,
  },
  otpRequestBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  otpRequestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  otpSuccessNote: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  guestBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  guestBtnText: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '700',
  },
  footerBadge: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerBadgeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  otpModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  otpModalIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  otpModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  otpModalSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  otpEmailHighlight: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  otpCodeBadge: {
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpCodeBadgeTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  otpCodeBadgeText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  otpInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 18,
  },
  otpModalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  otpCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  otpCancelText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  otpVerifyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  otpVerifyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 14,
  },
  resendText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
});
