/**
 * BridgeTalk / Sayflash AI - Real-Time IAM & Auth Client
 * Connects to Golang REST API Backend with OTP Verification & Session Persistence
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storageService } from './storageService';

const BACKEND_TUNNEL_URL = 'https://channels-possibilities-chamber-hidden.trycloudflare.com';

const getApiBaseUrl = () => {
  return `${BACKEND_TUNNEL_URL}/api/auth`;
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.refreshToken = null;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token;
  }

  // Restore stored session on app startup across restarts
  async autoLogin() {
    try {
      const { user, token, refreshToken } = await storageService.loadSession();
      if (!user || !user.email) return null;

      // Optimistically set current user from storage immediately
      this.token = token;
      this.refreshToken = refreshToken;
      this.currentUser = user;
      this.notify();

      // Validate/refresh session with Golang REST API
      try {
        const res = await fetch(`${getApiBaseUrl()}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, token: token || '' }),
        });

        if (res.ok) {
          const data = await res.json();
          this.token = data.token || token;
          this.currentUser = data.user || user;
          await storageService.saveSession(this.currentUser, this.token, this.refreshToken);
          this.notify();
        }
      } catch (netErr) {
        console.warn('[AuthService] Refresh fetch skipped (using cached session):', netErr.message);
      }

      return this.currentUser;
    } catch (err) {
      console.warn('[AuthService] Auto-login error:', err);
      return null;
    }
  }

  // Send 6-digit OTP verification code to user email
  async sendOTP(email) {
    const res = await fetch(`${getApiBaseUrl()}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send OTP verification code');
    }
    return data;
  }

  // Verify 6-digit OTP verification code
  async verifyOTP(email, code) {
    const res = await fetch(`${getApiBaseUrl()}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid verification code');
    }

    this.token = data.token;
    this.refreshToken = data.refreshToken;
    this.currentUser = data.user;
    await storageService.saveSession(this.currentUser, this.token, this.refreshToken);
    this.notify();
    return this.currentUser;
  }

  // Login via Independent Backend API
  async login(email, password) {
    const res = await fetch(`${getApiBaseUrl()}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    this.token = data.token;
    this.currentUser = data.user;
    await storageService.saveSession(this.currentUser, this.token);
    this.notify();
    return this.currentUser;
  }

  // Register via Independent Backend API
  async register(email, password, displayName, nativeLanguage = 'en') {
    const res = await fetch(`${getApiBaseUrl()}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, nativeLanguage }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    this.token = data.token;
    this.currentUser = data.user;
    await storageService.saveSession(this.currentUser, this.token);
    this.notify();
    return this.currentUser;
  }

  // Guest Demo Login
  async loginAsGuest() {
    const res = await fetch(`${getApiBaseUrl()}/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Guest login failed');
    }

    this.token = data.token;
    this.currentUser = data.user;
    await storageService.saveSession(this.currentUser, this.token);
    this.notify();
    return this.currentUser;
  }

  // Logout
  async logout() {
    this.token = null;
    this.refreshToken = null;
    this.currentUser = null;
    await storageService.clearSession();
    this.notify();
  }

  // Update User Session & Persist
  async updateUserSession(user) {
    this.currentUser = user;
    await storageService.saveSession(this.currentUser, this.token, this.refreshToken);
    this.notify();
  }
}

export const authService = new AuthService();
