import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  useColorScheme,
  Alert,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import Header from './src/components/Header';
import TonePicker from './src/components/TonePicker';
import MessageBubble from './src/components/MessageBubble';
import QuickReplies from './src/components/QuickReplies';
import VocabularyModal from './src/components/VocabularyModal';
import ProfileModal from './src/components/ProfileModal';
import LanguagePickerModal from './src/components/LanguagePickerModal';
import VoiceCallModal from './src/components/VoiceCallModal';
import VideoCallModal from './src/components/VideoCallModal';
import IncomingCallModal from './src/components/IncomingCallModal';
import MediaPickerSheet from './src/components/MediaPickerSheet';
import ImageViewerModal from './src/components/ImageViewerModal';

import SplashScreen from './src/screens/SplashScreen';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FriendProfileScreen from './src/screens/FriendProfileScreen';
import TestCallScreen from './src/screens/TestCallScreen';
import HomeScreen from './src/screens/HomeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomNavBar from './src/components/BottomNavBar';
import { MotionView, AnimatePresence, EASE_CINEMATIC } from './src/components/motion/Motion';

import { authService } from './src/services/authService';
import { storageService } from './src/services/storageService';
import {
  sendMessageToPeer,
  fetchPeerMessages,
  fetchUserList,
  clearPeerMessages,
  markPeerMessagesRead,
  getApiBaseUrl
} from './src/services/translationService';
import { translateWithGemini, rewriteTextWithTone } from './src/services/geminiService';
import {
  initiateCall,
  acceptCall,
  declineCall,
  endCall,
  startRingtoneLoop,
  stopRingtoneLoop
} from './src/services/callService';
import { voiceService } from './src/services/voiceService';
import { playAudioChunk, stopAudioStream } from './src/services/audioStreamService';
import { webrtcService } from './src/services/webrtcService';
import { getTheme } from './src/theme/colors';

// Global caches for local voice note audio URIs & image URIs across polling cycles
const localAudioCache = new Map();
const localImageCache = new Map();
const messageTranslationCache = new Map();
const clearedCutoffMap = new Map();

export default function App() {
  const systemColorScheme = useColorScheme() || 'dark';
  const [themePreference, setThemePreference] = useState('dark');
  const activeTheme = getTheme(themePreference, systemColorScheme);

  // Navigation Flow: 'splash' -> 'landing' -> (autoLogin restore or LoginScreen) -> 'home'
  const [showSplash, setShowSplash] = useState(true);
  const [appStage, setAppStage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'chats' | 'matches' | 'profile'
  const [activeView, setActiveView] = useState('chatList'); // 'chatList' | 'chatRoom'
  const [partnerEmail, setPartnerEmail] = useState('');
  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState('');
  const [selectedTone, setSelectedTone] = useState('casual');
  const [targetLang, setTargetLang] = useState('en');

  // Live Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordingTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(0);

  // Smart Auto-Scroll Control Refs (prevents polling from breaking user scroll-up)
  const isAtBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  // Modals & Real-time Calling state
  const [isLangPickerVisible, setIsLangPickerVisible] = useState(false);
  const [isVoiceCallVisible, setIsVoiceCallVisible] = useState(false);
  const [isVideoCallVisible, setIsVideoCallVisible] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [remoteVideoFrameUri, setRemoteVideoFrameUri] = useState(null);
  const activeCallIdRef = useRef(null);
  const handledCallSignalsRef = useRef(new Set());
  const isFirstCallPollRef = useRef(true);
  const callRingingTimerRef = useRef(null);
  const incomingCallTimerRef = useRef(null);

  const [isFriendProfileVisible, setIsFriendProfileVisible] = useState(false);
  const [isTestCallVisible, setIsTestCallVisible] = useState(false);
  const [isMediaPickerVisible, setIsMediaPickerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const [vocabList, setVocabList] = useState([
    {
      original: '吃了吗',
      pinyin: 'Chī le ma',
      translation: 'Have you eaten yet? (Common Chinese greeting)'
    }
  ]);
  const [isVocabVisible, setIsVocabVisible] = useState(false);
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const flatListRef = useRef(null);
  const chatSlideAnim = useRef(new Animated.Value(0)).current;
  const tabAnim = useRef(new Animated.Value(1)).current;

  // Smooth navbar tab switch animation effect with slower, silky bezier curve
  useEffect(() => {
    tabAnim.setValue(0);
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // Subscribe to IAM auth state changes and restore session on app startup
  useEffect(() => {
    const unsubscribe = authService.subscribe(user => {
      setCurrentUser(user);
      if (user) {
        setAppStage('home');
      } else {
        isFirstCallPollRef.current = true;
        setAppStage('landing');
      }
    });

    const initSession = async () => {
      try {
        const user = await authService.autoLogin();
        if (user) {
          setCurrentUser(user);
          setAppStage('home');
        } else {
          setAppStage('landing');
        }
      } catch (err) {
        console.warn('[App] Session init error:', err);
        setAppStage('landing');
      } finally {
        setIsAuthInitializing(false);
      }
    };

    initSession();
    return unsubscribe;
  }, []);

  // ⚡ Live Real-Time WebSocket Connection (<10ms push, 0 polling)
  useEffect(() => {
    if (!currentUser?.email) return;

    let ws = null;
    let isSubscribed = true;
    let pingInterval = null;

    const connectWs = () => {
      try {
        const baseUrl = getApiBaseUrl();
        const wsBase = baseUrl.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
        const wsUrl = `${wsBase}?email=${encodeURIComponent(currentUser.email)}`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === 1) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = async (e) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'new_message' && data.message) {
              const m = data.message;
              const sender = (m.sender || m.senderEmail || '').toLowerCase();
              const recipient = (m.recipient || m.recipientEmail || '').toLowerCase();
              const currentEmail = currentUser.email.toLowerCase();
              const activePartner = (partnerEmail || '').toLowerCase();
              const origText = m.originalText || m.text || '';

              // Global incoming call detection (runs on all screens!)
              if (sender !== currentEmail && (origText.includes('[CALL_SIGNAL:') || origText.includes('[CALL_START:'))) {
                const match = origText.match(/\[CALL_(?:SIGNAL|START):(voice|video):([^\]]+)\]/);
                if (match) {
                  const [, callType, callId] = match;
                  webrtcService.isCalleeMode = true;
                  activeCallIdRef.current = callId;
                  setIncomingCallData({
                    callId,
                    callerEmail: m.senderEmail || sender,
                    callerName: m.senderName || sender,
                    callType: callType || 'voice',
                  });
                  startRingtoneLoop('incoming');
                  if (incomingCallTimerRef.current) clearTimeout(incomingCallTimerRef.current);
                  incomingCallTimerRef.current = setTimeout(() => {
                    stopRingtoneLoop();
                    setIncomingCallData(null);
                  }, 30000);
                }
              }

              // Call accept signal
              if (sender !== currentEmail && origText.includes('[CALL_ACCEPT:')) {
                stopRingtoneLoop();
                setIsCallConnected(true);
                if (callRingingTimerRef.current) {
                  clearTimeout(callRingingTimerRef.current);
                  callRingingTimerRef.current = null;
                }
              }

              // Call end/decline signal
              if (sender !== currentEmail && (origText.includes('[CALL_DECLINE:') || origText.includes('[CALL_END:'))) {
                stopRingtoneLoop();
                stopAudioStream();
                webrtcService.close();
                setIsCallConnected(false);
                setIncomingCallData(null);
                setIsVoiceCallVisible(false);
                setIsVideoCallVisible(false);
                activeCallIdRef.current = null;
                if (callRingingTimerRef.current) clearTimeout(callRingingTimerRef.current);
                if (incomingCallTimerRef.current) clearTimeout(incomingCallTimerRef.current);
              }

              // WebRTC SDP Offer
              if (sender !== currentEmail && origText.includes('[WEBRTC_OFFER:')) {
                const sdpStr = origText.substring(origText.indexOf('[WEBRTC_OFFER:') + '[WEBRTC_OFFER:'.length, origText.lastIndexOf(']'));
                if (sdpStr) {
                  webrtcService.handleOffer(sdpStr, currentUser.email, m.senderEmail || sender);
                }
              }

              // WebRTC SDP Answer
              if (sender !== currentEmail && origText.includes('[WEBRTC_ANSWER:')) {
                const sdpStr = origText.substring(origText.indexOf('[WEBRTC_ANSWER:') + '[WEBRTC_ANSWER:'.length, origText.lastIndexOf(']'));
                if (sdpStr) {
                  webrtcService.handleAnswer(sdpStr);
                }
              }

              // WebRTC ICE Candidate
              if (sender !== currentEmail && origText.includes('[WEBRTC_ICE:')) {
                const candStr = origText.substring(origText.indexOf('[WEBRTC_ICE:') + '[WEBRTC_ICE:'.length, origText.lastIndexOf(']'));
                if (candStr) {
                  webrtcService.handleCandidate(candStr);
                }
              }

              const isSignal = origText.includes('[CALL_') ||
                              origText.includes('[WEBRTC_') ||
                              origText.includes('[AUDIO_CHUNK:') ||
                              origText.includes('[VIDEO_FRAME:');

              if (
                !isSignal &&
                activePartner &&
                ((sender === currentEmail && recipient === activePartner) ||
                 (sender === activePartner && recipient === currentEmail))
              ) {
                const isFriend = sender !== currentEmail;
                const newMsgObj = {
                  id: m.id || `msg_${Date.now()}`,
                  sender: isFriend ? 'friend' : 'user',
                  senderName: m.senderName || (isFriend ? partnerEmail : (currentUser.displayName || 'Me')),
                  originalText: origText,
                  translatedText: m.translatedText || origText,
                  pinyin: m.pinyin || '',
                  culturalNote: m.culturalNote || null,
                  timestamp: m.timestamp || new Date().toISOString(),
                  status: 'read',
                  isVoiceNote: !!m.audioUri || origText.includes('Voice Note'),
                  audioUri: m.audioUri || null,
                  imageUri: m.imageUri || null,
                  durationSecs: m.durationSecs || 3,
                };

                setMessages(prev => {
                  if (prev.some(existing => existing.id === newMsgObj.id)) return prev;
                  return [...prev, newMsgObj];
                });
              }
            }
          } catch (err) {}
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          if (isSubscribed) {
            setTimeout(connectWs, 3000);
          }
        };
      } catch (err) {}
    };

    connectWs();

    return () => {
      isSubscribed = false;
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, [currentUser?.email, partnerEmail]);

  const [allUsers, setAllUsers] = useState([]);
  const userListCacheRef = useRef([]);

  // Fetch users once on login/mount
  useEffect(() => {
    if (!currentUser) return;
    fetchUserList().then(freshUsers => {
      if (freshUsers && freshUsers.length > 0) {
        userListCacheRef.current = freshUsers;
        setAllUsers(freshUsers);
      }
    }).catch(() => {});
  }, [currentUser, activeTab]);

  // ============================================
  // Call Signal Polling Engine (Global background check)
  // ============================================
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const pollCallSignals = async () => {
      try {
        const users = userListCacheRef.current;
        const otherUsers = users.filter(u => u.email.toLowerCase() !== currentUser.email.toLowerCase());

        if (handledCallSignalsRef.current.size > 150) {
          handledCallSignalsRef.current.clear();
        }

        for (const otherUser of otherUsers) {
          const peerMsgs = await fetchPeerMessages(currentUser.email, otherUser.email);
          if (!peerMsgs || peerMsgs.length === 0) continue;
          if (!peerMsgs || peerMsgs.length === 0) continue;

          // Filter to messages sent BY THE PARTNER to ensure we never miss incoming audio chunks
          const partnerMsgs = peerMsgs.filter(m => m.senderEmail && m.senderEmail.toLowerCase() !== currentUser.email.toLowerCase());
          if (partnerMsgs.length === 0) continue;

          // Process the last 25 messages sent by partner
          const recentMsgs = partnerMsgs.length > 25 ? partnerMsgs.slice(-25) : partnerMsgs;

          for (const m of recentMsgs) {
            if (!m.originalText) continue;

            const signalKey = m.id || `${m.timestamp}_${m.originalText.length}`;

            // ON INITIAL LOGIN / LOAD: Seed ALL existing signals so stale calls NEVER trigger ringtones!
            if (isFirstCallPollRef.current) {
              handledCallSignalsRef.current.add(signalKey);
              continue;
            }

            // Handle incoming live video frame snapshots for 2-way Video Call
            if (m.originalText.includes('[VIDEO_FRAME:')) {
              const frameKey = m.id ? `frame_${m.id}` : `frame_${m.timestamp}`;
              if (!handledCallSignalsRef.current.has(frameKey)) {
                handledCallSignalsRef.current.add(frameKey);
                const startIdx = m.originalText.indexOf('[VIDEO_FRAME:') + '[VIDEO_FRAME:'.length;
                const endIdx = m.originalText.lastIndexOf(']');
                if (startIdx > 0 && endIdx > startIdx) {
                  const frameData = m.originalText.substring(startIdx, endIdx);
                  if (frameData.length > 50) {
                    setRemoteVideoFrameUri(`data:image/jpeg;base64,${frameData}`);
                  }
                }
              }
              continue;
            }

            // Ignore any signal sent by OURSELVES to prevent infinite speaker/mic feedback loops!
            if (m.senderEmail && m.senderEmail.toLowerCase() === currentUser.email.toLowerCase()) {
              continue;
            }

            // Handle incoming live speech audio stream chunks (ONLY during active call & from partner!)
            if ((isVoiceCallVisible || isVideoCallVisible) && m.originalText.includes('[AUDIO_CHUNK:')) {
              const chunkKey = m.id ? `chunk_${m.id}` : `chunk_${m.timestamp}_${m.originalText.length}`;
              if (!handledCallSignalsRef.current.has(chunkKey)) {
                handledCallSignalsRef.current.add(chunkKey);
                const startIdx = m.originalText.indexOf('[AUDIO_CHUNK:') + '[AUDIO_CHUNK:'.length;
                const endIdx = m.originalText.lastIndexOf(']');
                if (startIdx > 0 && endIdx > startIdx) {
                  const audioData = m.originalText.substring(startIdx, endIdx);
                  if (audioData.length > 50) {
                    playAudioChunk(audioData);
                  }
                }
              }
              continue;
            }

            // Handle WebRTC SDP Offer
            if (m.originalText.includes('[WEBRTC_OFFER:')) {
              const offerKey = m.id ? `offer_${m.id}` : `offer_${m.timestamp}`;
              if (!handledCallSignalsRef.current.has(offerKey)) {
                handledCallSignalsRef.current.add(offerKey);
                const sdpStr = m.originalText.substring(m.originalText.indexOf('[WEBRTC_OFFER:') + '[WEBRTC_OFFER:'.length, m.originalText.lastIndexOf(']'));
                if (sdpStr) {
                  webrtcService.handleOffer(sdpStr, currentUser.email, m.senderEmail);
                }
              }
            }

            // Handle WebRTC SDP Answer
            if (m.originalText.includes('[WEBRTC_ANSWER:')) {
              const answerKey = m.id ? `answer_${m.id}` : `answer_${m.timestamp}`;
              if (!handledCallSignalsRef.current.has(answerKey)) {
                handledCallSignalsRef.current.add(answerKey);
                const sdpStr = m.originalText.substring(m.originalText.indexOf('[WEBRTC_ANSWER:') + '[WEBRTC_ANSWER:'.length, m.originalText.lastIndexOf(']'));
                if (sdpStr) {
                  webrtcService.handleAnswer(sdpStr);
                }
              }
            }

            // Handle WebRTC ICE Candidate
            if (m.originalText.includes('[WEBRTC_ICE:')) {
              const iceKey = m.id ? `ice_${m.id}` : `ice_${m.timestamp}`;
              if (!handledCallSignalsRef.current.has(iceKey)) {
                handledCallSignalsRef.current.add(iceKey);
                const candidateStr = m.originalText.substring(m.originalText.indexOf('[WEBRTC_ICE:') + '[WEBRTC_ICE:'.length, m.originalText.lastIndexOf(']'));
                if (candidateStr) {
                  webrtcService.addIceCandidate(candidateStr);
                }
              }
            }

            if (!m.originalText.includes('[CALL_')) continue;

            // Only process recent call signals (< 60 seconds old)
            const signalTime = new Date(m.timestamp).getTime();
            const now = Date.now();
            if (isNaN(signalTime) || now - signalTime > 60000) continue;

            if (handledCallSignalsRef.current.has(signalKey)) continue;

            // INCOMING CALL SIGNAL
            if (m.originalText.includes('[CALL_SIGNAL:')) {
              const match = m.originalText.match(/\[CALL_SIGNAL:(voice|video):([^\]]+)\]/);
              if (match) {
                const [, callType, callId] = match;
                handledCallSignalsRef.current.add(signalKey);
                activeCallIdRef.current = callId;
                // Mark as callee so modals don't create a new SDP offer
                webrtcService.isCalleeMode = true;
                setIncomingCallData({
                  callId,
                  callerEmail: m.senderEmail,
                  callerName: m.senderName || m.senderEmail,
                  callType,
                });
                startRingtoneLoop('incoming');
                // 30-second incoming call timeout
                if (incomingCallTimerRef.current) clearTimeout(incomingCallTimerRef.current);
                incomingCallTimerRef.current = setTimeout(() => {
                  stopRingtoneLoop();
                  setIncomingCallData(null);
                }, 30000);
              }
            }

            // CALL ACCEPTED by the other side — only if it matches our active call
            if (m.originalText.includes('[CALL_ACCEPT:')) {
              const acceptMatch = m.originalText.match(/\[CALL_ACCEPT:([^\]]+)\]/);
              if (acceptMatch && activeCallIdRef.current && acceptMatch[1] === activeCallIdRef.current) {
                handledCallSignalsRef.current.add(signalKey);
                stopRingtoneLoop();
                setIsCallConnected(true);
                if (callRingingTimerRef.current) {
                  clearTimeout(callRingingTimerRef.current);
                  callRingingTimerRef.current = null;
                }
              }
            }

            // DECLINED / ENDED by the other side — only if it matches our active call
            if (m.originalText.includes('[CALL_DECLINE:') || m.originalText.includes('[CALL_END:')) {
              const endMatch = m.originalText.match(/\[CALL_(?:DECLINE|END):([^\]]+)\]/);
              if (endMatch && activeCallIdRef.current && endMatch[1] === activeCallIdRef.current) {
                handledCallSignalsRef.current.add(signalKey);
                stopRingtoneLoop();
                stopAudioStream();
                webrtcService.close();
                setIsCallConnected(false);
                setIncomingCallData(null);
                setIsVoiceCallVisible(false);
                setIsVideoCallVisible(false);
                activeCallIdRef.current = null;
                if (callRingingTimerRef.current) clearTimeout(callRingingTimerRef.current);
                if (incomingCallTimerRef.current) clearTimeout(incomingCallTimerRef.current);
              }
            }
          }
        }
        isFirstCallPollRef.current = false;
      } catch (err) {
        // Silent fail for call signal polling
      }
    };

    pollCallSignals();
    const callPollInterval = setInterval(pollCallSignals, 1000);
    return () => clearInterval(callPollInterval);
  }, [currentUser, isVoiceCallVisible, isVideoCallVisible]);

  // ============================================
  // Chat Room Message Polling (only when inside a chat room)
  // ============================================
  useEffect(() => {
    if (!currentUser || !partnerEmail || activeView !== 'chatRoom') return;

    // ⚡ Instant 0ms Offline Local Storage Load
    storageService.getLocalChatMessages(currentUser.email, partnerEmail).then(localMsgs => {
      if (localMsgs && localMsgs.length > 0) {
        setMessages(localMsgs);
      }
    });

    const loadMessages = async () => {
      await markPeerMessagesRead(currentUser.email, partnerEmail);
      const peerMsgs = await fetchPeerMessages(currentUser.email, partnerEmail);
      if (!peerMsgs) return;

      const cutoff = clearedCutoffMap.get(partnerEmail.toLowerCase()) || 0;

      // Format Normal Chat Messages for UI (Filter out Call Signal & Audio/Video Protocol messages)
      const chatOnlyMsgs = peerMsgs.filter(m => {
        const isSignal = m.originalText && (
          m.originalText.includes('[CALL_') ||
          m.originalText.includes('[AUDIO_CHUNK:') ||
          m.originalText.includes('[VIDEO_FRAME:') ||
          m.originalText.includes('[WEBRTC_')
        );
        const msgTime = new Date(m.timestamp).getTime();
        return !isSignal && (isNaN(msgTime) || msgTime > cutoff);
      });

      if (chatOnlyMsgs.length === 0) {
        setMessages([]);
        return;
      }

      const formatted = await Promise.all(
        chatOnlyMsgs.map(async m => {
          const cacheKey = `${m.id}_${targetLang}_${selectedTone}`;
          if (messageTranslationCache.has(cacheKey)) {
            return messageTranslationCache.get(cacheKey);
          }

          const cachedAudio = localAudioCache.get(m.id);
          const cachedImg = localImageCache.get(m.id);
          const isFriend = m.senderEmail.toLowerCase() !== currentUser.email.toLowerCase();

          let rawOrig = (m.originalText || '')
            .replace(/\[Golang AI[^\]]*\]:\s*/gi, '')
            .replace(/\(收到！\)/gi, '')
            .trim();

          let rawTrans = (m.translatedText || '')
            .replace(/\[Golang AI[^\]]*\]:\s*/gi, '')
            .replace(/\(收到！\)/gi, '')
            .trim();

          // Extract embedded voice note audio data if present (check both rawOrig and rawTrans)
          let voiceDataUri = cachedAudio || m.audioUri || null;
          const fullVoiceText = rawOrig + ' ' + rawTrans;
          const voiceStart = fullVoiceText.indexOf('[VOICE_DATA:');
          if (voiceStart >= 0) {
            const voiceEnd = fullVoiceText.indexOf(']', voiceStart);
            if (voiceEnd > voiceStart) {
              const base64Audio = fullVoiceText.substring(voiceStart + '[VOICE_DATA:'.length, voiceEnd);
              if (base64Audio.length > 50) {
                voiceDataUri = `data:audio/mp4;base64,${base64Audio}`;
                if (m.id) localAudioCache.set(m.id, voiceDataUri);
              }
            }
          }
          // Clean VOICE_DATA tags out of text strings completely
          rawOrig = rawOrig.replace(/\[VOICE_DATA:[^\]]*\]?/gi, '').trim();
          rawTrans = rawTrans.replace(/\[VOICE_DATA:[^\]]*\]?/gi, '').trim();

          // Extract embedded image data if present (check both rawOrig and rawTrans)
          let imageDataUri = cachedImg || m.imageUri || null;
          const fullImgText = rawOrig + ' ' + rawTrans;
          const imgStart = fullImgText.indexOf('[IMAGE_DATA:');
          if (imgStart >= 0) {
            const imgEnd = fullImgText.indexOf(']', imgStart);
            if (imgEnd > imgStart) {
              const base64Img = fullImgText.substring(imgStart + '[IMAGE_DATA:'.length, imgEnd);
              if (base64Img.length > 50) {
                imageDataUri = `data:image/jpeg;base64,${base64Img}`;
                if (m.id) localImageCache.set(m.id, imageDataUri);
              }
            }
          }
          // Clean IMAGE_DATA tags out of text strings completely
          rawOrig = rawOrig.replace(/\[IMAGE_DATA:[^\]]*\]?/gi, '').trim();
          rawTrans = rawTrans.replace(/\[IMAGE_DATA:[^\]]*\]?/gi, '').trim();

          const isVoiceMsg = !!voiceDataUri || rawOrig.includes('Voice Note');
          const isImageMsg = !!imageDataUri || rawOrig.includes('Photo') || rawOrig.includes('Gallery');

          // FOR PHOTO AND VOICE MESSAGES: NO AI TRANSLATION, NO PINYIN, NO CULTURAL NOTES!
          if (isVoiceMsg || isImageMsg) {
            const voiceOrImgMsg = {
              id: m.id,
              sender: isFriend ? 'friend' : 'user',
              senderName: m.senderName || m.senderEmail,
              originalText: isImageMsg ? (imageDataUri ? '' : rawOrig) : '🎵 Voice Note',
              translatedText: '',  // BLANK so AI translation box will NOT be shown for photos!
              pinyin: '',          // BLANK so Pinyin box will NOT be shown for photos!
              culturalNote: null,   // NULL so Cultural note will NOT be shown for photos!
              timestamp: m.timestamp,
              status: m.status || 'read',
              isVoiceNote: isVoiceMsg,
              audioUri: voiceDataUri,
              imageUri: imageDataUri,
              durationSecs: m.durationSecs || 3,
            };
            if (m.id) messageTranslationCache.set(cacheKey, voiceOrImgMsg);
            return voiceOrImgMsg;
          }

          let finalTranslation = rawTrans;
          let finalPinyin = m.pinyin;
          let finalNote = m.culturalNote;

          // Always translate using Google Gemini AI Engine to match chosen targetLang!
          if (rawOrig) {
            const aiRes = await translateWithGemini(rawOrig, 'auto', targetLang, selectedTone);
            if (aiRes && aiRes.translatedText) {
              finalTranslation = aiRes.translatedText;
              finalPinyin = aiRes.pinyin;
              finalNote = aiRes.culturalNote;
            }
          }

          const parsedMsg = {
            id: m.id,
            sender: isFriend ? 'friend' : 'user',
            senderName: m.senderName || m.senderEmail,
            originalText: rawOrig,
            translatedText: finalTranslation,
            pinyin: finalPinyin,
            culturalNote: finalNote,
            timestamp: m.timestamp,
            status: m.status || 'read',
            isVoiceNote: false,
            audioUri: null,
            imageUri: null,
            durationSecs: 3,
          };
          if (m.id) messageTranslationCache.set(cacheKey, parsedMsg);
          return parsedMsg;
        })
      );

      // Deduplicate formatted messages by ID to guarantee unique React keys
      const seenIds = new Set();
      const uniqueFormatted = [];
      for (const msg of formatted) {
        const uniqueKey = msg.id || `${msg.timestamp}_${msg.originalText}`;
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey);
          uniqueFormatted.push(msg);
        }
      }

      // Only update state if message IDs or statuses changed to prevent re-render thrashing
      setMessages(prevMsgs => {
        if (prevMsgs.length !== uniqueFormatted.length) {
          return uniqueFormatted;
        }
        const hasDiff = uniqueFormatted.some((msg, idx) => {
          const prev = prevMsgs[idx];
          return !prev || prev.id !== msg.id || prev.status !== msg.status || prev.translatedText !== msg.translatedText;
        });
        return hasDiff ? uniqueFormatted : prevMsgs;
      });

      // 💾 Persist to local device storage asynchronously for instant future loading
      storageService.saveLocalChatMessages(currentUser.email, partnerEmail, uniqueFormatted);
    };

    loadMessages();
  }, [currentUser, activeView, partnerEmail, targetLang, selectedTone]);

  // Smart Auto-Scroll Effect: Only scroll to end if user is at bottom or initial load!
  useEffect(() => {
    if (currentUser && activeView === 'chatRoom') {
      if (isInitialLoadRef.current) {
        flatListRef.current?.scrollToEnd({ animated: false });
        isInitialLoadRef.current = false;
      } else if (isAtBottomRef.current) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }
  }, [messages, currentUser, activeView]);



  const handleSelectChat = (email) => {
    isInitialLoadRef.current = true;
    isAtBottomRef.current = true;
    setPartnerEmail(email);

    // ⚡ Instant 0ms Preload from Local Storage before slide animation
    if (currentUser?.email && email) {
      storageService.getLocalChatMessages(currentUser.email, email).then(localMsgs => {
        if (Array.isArray(localMsgs) && localMsgs.length > 0) {
          setMessages(localMsgs);
        }
      });
    }

    // Dynamically set target translation language to partner's native or learning language
    const partner = (allUsers || []).find(u => u.email && email && u.email.toLowerCase() === email.toLowerCase()) ||
                    (userListCacheRef.current || []).find(u => u.email && email && u.email.toLowerCase() === email.toLowerCase());
    if (partner) {
      const rawLang = partner.nativeLanguage || partner.learningLanguage || 'en';
      const clean = String(rawLang).toLowerCase().replace(/[^a-z0-9]/gi, ' ').trim();
      const words = clean.split(/\s+/).filter(Boolean);
      let matchedCode = 'en';
      const map = {
        'zh': 'zh', 'chinese': 'zh', 'mandarin': 'zh', 'zhongwen': 'zh',
        'id': 'id', 'indonesian': 'id', 'indonesia': 'id', 'bahasa': 'id',
        'ja': 'ja', 'jp': 'ja', 'japanese': 'ja', 'nihongo': 'ja',
        'es': 'es', 'spanish': 'es',
        'en': 'en', 'english': 'en',
        'fr': 'fr', 'french': 'fr',
        'de': 'de', 'german': 'de',
        'ko': 'ko', 'korean': 'ko',
        'ar': 'ar', 'arabic': 'ar',
        'it': 'it', 'italian': 'it',
        'pt': 'pt', 'portuguese': 'pt',
        'ru': 'ru', 'russian': 'ru',
      };
      for (const w of words) {
        if (map[w]) { matchedCode = map[w]; break; }
      }
      setTargetLang(matchedCode);
    }

    setActiveView('chatRoom');
    chatSlideAnim.setValue(0);
    Animated.timing(chatSlideAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        flatListRef.current?.scrollToEnd({ animated: false });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 80);
      }
    });
  };

  const handleBackToChatList = () => {
    Animated.timing(chatSlideAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActiveView('chatList');
      }
    });
  };

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const distanceToBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    isAtBottomRef.current = distanceToBottom < 100;
  };

  const handleClearHistory = async () => {
    if (!partnerEmail) return;
    clearedCutoffMap.set(partnerEmail.toLowerCase(), Date.now());
    setMessages([]);
    await clearPeerMessages(currentUser.email, partnerEmail);
  };

  // Real Voice & Video Call Action Handlers (Instant UI response with async network dispatch)
  const handleStartVoiceCall = () => {
    setIsVoiceCallVisible(true);
    setIsCallConnected(false);
    const recipient = partnerEmail || (currentUser.email === 'ken.sanio@test.com' ? 'ken.test2@test.com' : 'ken.sanio@test.com');
    initiateCall(
      currentUser.email,
      currentUser.displayName || currentUser.email,
      recipient,
      'voice'
    ).then(callSignal => {
      if (callSignal && callSignal.callId) {
        activeCallIdRef.current = callSignal.callId;
      }
    }).catch(err => console.log('initiateCall voice error:', err));

    // 30-second ringing timeout — auto cancel if unanswered
    if (callRingingTimerRef.current) clearTimeout(callRingingTimerRef.current);
    callRingingTimerRef.current = setTimeout(() => {
      Alert.alert('Call Unanswered', 'Contact did not answer the call.');
      handleCloseCall();
    }, 30000);
  };

  const handleStartVideoCall = () => {
    setIsVideoCallVisible(true);
    setIsCallConnected(false);
    const recipient = partnerEmail || (currentUser.email === 'ken.sanio@test.com' ? 'ken.test2@test.com' : 'ken.sanio@test.com');
    initiateCall(
      currentUser.email,
      currentUser.displayName || currentUser.email,
      recipient,
      'video'
    ).then(callSignal => {
      if (callSignal && callSignal.callId) {
        activeCallIdRef.current = callSignal.callId;
      }
    }).catch(err => console.log('initiateCall video error:', err));

    // 30-second ringing timeout — auto cancel if unanswered
    if (callRingingTimerRef.current) clearTimeout(callRingingTimerRef.current);
    callRingingTimerRef.current = setTimeout(() => {
      Alert.alert('Call Unanswered', 'Contact did not answer the call.');
      handleCloseCall();
    }, 30000);
  };

  const handleAcceptIncomingCall = () => {
    if (incomingCallTimerRef.current) {
      clearTimeout(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    if (incomingCallData) {
      setPartnerEmail(incomingCallData.callerEmail);
      setActiveView('chatRoom');
      setIsCallConnected(true);
      if (incomingCallData.callType === 'video') {
        setIsVideoCallVisible(true);
      } else {
        setIsVoiceCallVisible(true);
      }
      activeCallIdRef.current = incomingCallData.callId;
      const data = incomingCallData;
      setIncomingCallData(null);
      acceptCall(
        data.callId,
        currentUser.email,
        currentUser.displayName || currentUser.email,
        data.callerEmail
      ).catch(err => console.log('acceptCall error:', err));
    }
  };

  const handleDeclineIncomingCall = async () => {
    if (incomingCallTimerRef.current) {
      clearTimeout(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    stopRingtoneLoop();
    if (incomingCallData) {
      await declineCall(
        incomingCallData.callId,
        currentUser.email,
        currentUser.displayName || currentUser.email,
        incomingCallData.callerEmail
      );
      setIncomingCallData(null);
    }
  };

  const handleCloseCall = async () => {
    if (callRingingTimerRef.current) {
      clearTimeout(callRingingTimerRef.current);
      callRingingTimerRef.current = null;
    }
    if (incomingCallTimerRef.current) {
      clearTimeout(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    if (activeCallIdRef.current && partnerEmail) {
      await endCall(
        activeCallIdRef.current,
        currentUser.email,
        currentUser.displayName || currentUser.email,
        partnerEmail
      );
      activeCallIdRef.current = null;
    }
    stopRingtoneLoop();
    stopAudioStream();
    webrtcService.close();
    setIsCallConnected(false);
    setIsVoiceCallVisible(false);
    setIsVideoCallVisible(false);
    setRemoteVideoFrameUri(null);
  };

  // Helper to convert image URI to base64 string for cross-device transmission
  const convertImageUriToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result || '';
          const commaIdx = dataUrl.indexOf(',');
          resolve(commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.log('Image base64 conversion error:', err);
      return null;
    }
  };

  // Launch Real Live Native Camera Hardware
  const handleLaunchRealCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const base64Img = await convertImageUriToBase64(photoUri);
        const textToSend = base64Img ? `📷 Photo Message [IMAGE_DATA:${base64Img}]` : '📷 Photo Message';
        handleSend(textToSend, { imageUri: photoUri });
      }
    } catch (err) {
      console.log('Camera error:', err);
    }
  };

  // Pick Photo/Video from Device Gallery
  const handlePickFromLibrary = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Photo library permission is required to select media.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.6,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        const base64Img = await convertImageUriToBase64(selectedUri);
        const textToSend = base64Img ? `🖼️ Gallery Photo [IMAGE_DATA:${base64Img}]` : '🖼️ Gallery Photo';
        handleSend(textToSend, { imageUri: selectedUri });
      }
    } catch (err) {
      console.log('Library error:', err);
    }
  };

  // Pick Real Native Document from Device Files
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const selectedDoc = result.assets[0];
        handleSend(`📄 Document: ${selectedDoc.name}`);
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  // Send Message with WhatsApp Status Ticks Progression (Zero-Delay Instant Dispatch)
  const handleSend = async (textToSend = null, options = {}) => {
    const text = textToSend || inputText;
    if (!text.trim() || !partnerEmail) return;

    setInputText('');
    isAtBottomRef.current = true;

    const isVoiceOrImage = !!options.audioUri || !!options.imageUri || text.includes('[VOICE_DATA:') || text.includes('[IMAGE_DATA:') || text.includes('Voice Note');

    const tempId = `msg-${Date.now()}`;
    const initialMsg = {
      id: tempId,
      sender: 'user',
      senderName: currentUser.displayName || 'You',
      originalText: text,
      translatedText: isVoiceOrImage ? '' : 'Translating...',
      pinyin: '',
      culturalNote: null,
      timestamp: new Date().toISOString(),
      status: 'pending',
      isVoiceNote: options.isVoiceNote || !!options.audioUri || text.includes('Voice Note'),
      audioUri: options.audioUri || null,
      imageUri: options.imageUri || null,
      durationSecs: options.durationSecs || 3,
    };

    setMessages(prev => [...prev, initialMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const sentMsg = await sendMessageToPeer(
        currentUser.email,
        currentUser.displayName || currentUser.email,
        partnerEmail,
        text,
        selectedTone,
        targetLang,
        '',
        '',
        null
      );

      if (options.audioUri && sentMsg?.id) {
        localAudioCache.set(sentMsg.id, options.audioUri);
      }
      if (options.imageUri && sentMsg?.id) {
        localImageCache.set(sentMsg.id, options.imageUri);
      }

      if (sentMsg) {
        setMessages(prev =>
          prev.map(m =>
            m.id === tempId
              ? {
                  ...m,
                  id: sentMsg.id,
                  translatedText: sentMsg.translatedText || (isVoiceOrImage ? '' : text),
                  pinyin: sentMsg.pinyin || '',
                  culturalNote: sentMsg.culturalNote || null,
                  status: 'sent',
                }
              : m
          )
        );
      }

      setTimeout(() => {
        if (sentMsg?.id) {
          setMessages(prev =>
            prev.map(m => (m.id === sentMsg.id ? { ...m, status: 'read' } : m))
          );
        }
      }, 1200);
    } catch (err) {
      console.error('Failed to send peer message:', err);
    }
  };

  // AI Tone Rewriter Handler
  const handleRewriteDraft = async (tone) => {
    if (!inputText || !inputText.trim()) {
      Alert.alert('AI Tone Rewriter', 'Please type a message in the input box first!');
      return;
    }
    try {
      const rewritten = await rewriteTextWithTone(inputText, tone);
      if (rewritten) {
        setInputText(rewritten);
      }
    } catch (e) {}
  };

  // Press-and-Hold Real Voice Recording Handlers
  const handleMicPressIn = async () => {
    recordingStartTimeRef.current = Date.now();
    setIsRecordingVoice(true);
    setRecordSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordSeconds(prev => prev + 1);
    }, 1000);

    await voiceService.startRecording();
  };

  const handleMicPressOut = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecordingVoice(false);

    const durationMs = Date.now() - recordingStartTimeRef.current;
    const computedSecs = Math.max(1, Math.round(durationMs / 1000));

    if (durationMs < 600) {
      await voiceService.cancelRecording();
      return;
    }

    const audioUri = await voiceService.stopRecording();
    if (audioUri) {
      // Convert the audio file to base64 so it can be sent to the other device
      try {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        const base64Audio = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result || '';
            const commaIdx = dataUrl.indexOf(',');
            resolve(commaIdx >= 0 ? dataUrl.substring(commaIdx + 1) : '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        if (base64Audio && base64Audio.length > 50) {
          // Send the voice note with embedded audio data
          handleSend(`🎵 [Voice Note] [VOICE_DATA:${base64Audio}]`, {
            isVoiceNote: true,
            audioUri,
            durationSecs: computedSecs
          });
        } else {
          // Fallback: send without audio data
          handleSend('🎵 [Voice Note]', {
            isVoiceNote: true,
            audioUri,
            durationSecs: computedSecs
          });
        }
      } catch (err) {
        console.log('Voice note base64 conversion error:', err);
        handleSend('🎵 [Voice Note]', {
          isVoiceNote: true,
          audioUri,
          durationSecs: computedSecs
        });
      }
    }
  };

  const handleSaveVocab = (item) => {
    if (!vocabList.some(v => v.original === item.original)) {
      setVocabList(prev => [...prev, item]);
    }
  };

  const handleDeleteVocab = (index) => {
    setVocabList(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    console.log('🔴 [App] handleLogout called — forcing appStage to landing NOW');
    // Set state IMMEDIATELY (synchronous) so React renders LandingScreen
    setIsProfileVisible(false);
    setCurrentUser(null);
    setActiveTab('home');
    setAppStage('landing');
    // Then clean up auth session asynchronously (non-blocking)
    authService.logout().then(() => {
      console.log('🔴 [App] authService.logout completed');
    }).catch(() => {});
  };

  const handleToggleTheme = () => {
    setThemePreference(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'));
  };

  const isInputEmpty = inputText.trim().length === 0;

  console.log('🟢 [App] RENDER — appStage:', appStage, '| currentUser:', currentUser?.email || 'NULL');

  const stageKey = (showSplash || isAuthInitializing)
    ? 'splash'
    : appStage === 'landing'
    ? 'landing'
    : (!currentUser || appStage === 'login')
    ? 'login'
    : 'home';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={stageKey === 'home' && activeTheme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={stageKey === 'home' ? activeTheme.bg : 'transparent'}
        translucent={stageKey !== 'home'}
      />
      <AnimatePresence mode="wait">
        {stageKey === 'splash' && (
          <MotionView
            key="splash-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.85, ease: EASE_CINEMATIC }}
            style={{ flex: 1 }}
          >
            <SplashScreen
              onFinish={() => {
                setShowSplash(false);
              }}
            />
          </MotionView>
        )}

        {stageKey === 'landing' && (
          <MotionView
            key="landing-stage"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
            style={{ flex: 1 }}
          >
            <LandingScreen
              onFinishLoading={() => {
                setAppStage('login');
              }}
              onDirectSignIn={() => {
                setAppStage('login');
              }}
            />
          </MotionView>
        )}

        {stageKey === 'login' && (
          <MotionView
            key="login-stage"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
            style={{ flex: 1 }}
          >
            <LoginScreen
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setAppStage('home');
              }}
              onBackToLanding={() => setAppStage('landing')}
            />
          </MotionView>
        )}

        {stageKey === 'home' && (
          <MotionView
            key="home-stage"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE_CINEMATIC }}
            style={{ flex: 1 }}
          >
            <View style={[styles.safeArea, { backgroundColor: activeTheme.bg }]}>

        {/* Tab Navigation State Switcher with Smooth Fluid Transition */}
        <Animated.View
          style={{
            flex: 1,
            opacity: tabAnim,
            transform: [
              {
                translateY: tabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                })
              }
            ]
          }}
        >
          {isTestCallVisible ? (
            <TestCallScreen
              currentUser={currentUser}
              onBack={() => setIsTestCallVisible(false)}
            />
          ) : activeTab === 'settings' ? (
          <SettingsScreen
            currentUser={currentUser}
            onUpdateUser={setCurrentUser}
            theme={activeTheme}
            themePreference={themePreference}
            onSelectThemePreference={setThemePreference}
            onLogout={handleLogout}
          />
        ) : isFriendProfileVisible ? (
          /* Full Friend Profile Details Screen */
          <FriendProfileScreen
            partnerEmail={partnerEmail}
            partnerUser={allUsers.find(u => u.email && partnerEmail && u.email.toLowerCase() === partnerEmail.toLowerCase()) || userListCacheRef.current.find(u => u.email && partnerEmail && u.email.toLowerCase() === partnerEmail.toLowerCase())}
            messages={messages}
            targetLang={targetLang}
            onOpenLangPicker={() => setIsLangPickerVisible(true)}
            onStartVoiceCall={handleStartVoiceCall}
            onStartVideoCall={handleStartVideoCall}
            onClearHistory={handleClearHistory}
            onClose={() => setIsFriendProfileVisible(false)}
            onViewImage={uri => setSelectedImageUri(uri)}
            theme={activeTheme}
          />
        ) : activeView === 'chatList' ? (
          activeTab === 'home' ? (
            <HomeScreen
              user={currentUser}
              onNavigateToTab={setActiveTab}
              onStartChatWithUser={partner => {
                const email = partner.email || (partner.displayName ? `${partner.displayName.toLowerCase().replace(/\s+/g, '')}@test.com` : 'elena.smith@test.com');
                handleSelectChat(email);
              }}
            />
          ) : activeTab === 'matches' ? (
            <MatchesScreen
              onStartChatWithPartner={partner => {
                const email = partner.email || (partner.displayName ? `${partner.displayName.toLowerCase().replace(/\s+/g, '')}@test.com` : 'elena.smith@test.com');
                handleSelectChat(email);
              }}
            />
          ) : activeTab === 'profile' ? (
            <ProfileScreen
              user={currentUser}
              onLogout={handleLogout}
            />
          ) : (
            <ChatListScreen
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              currentUser={currentUser}
              onSelectChat={handleSelectChat}
              onOpenProfile={() => setIsProfileVisible(true)}
              onOpenVocab={() => setIsVocabVisible(true)}
              theme={activeTheme}
              themePreference={themePreference}
              onToggleTheme={handleToggleTheme}
            />
          )
        ) : (
          <Animated.View
            style={[
              styles.chatRoomContainer,
              {
                backgroundColor: activeTheme.bg,
                opacity: chatSlideAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 1] }),
                transform: [
                  { translateX: chatSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [Dimensions.get('window').width || 360, 0] }) },
                  { scale: chatSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }
                ]
              }
            ]}
          >
            <Header
              partnerName={partnerEmail || "devicea@test.com"}
              partnerUser={allUsers.find(u => u.email && partnerEmail && u.email.toLowerCase() === partnerEmail.toLowerCase()) || userListCacheRef.current.find(u => u.email && partnerEmail && u.email.toLowerCase() === partnerEmail.toLowerCase())}
              status="Active now"
              currentUser={currentUser}
              targetLang={targetLang}
              onOpenLangPicker={() => setIsLangPickerVisible(true)}
              onStartVoiceCall={handleStartVoiceCall}
              onStartVideoCall={handleStartVideoCall}
              onOpenFriendProfile={() => setIsFriendProfileVisible(true)}
              onBackToChatList={handleBackToChatList}
              onOpenTestCall={() => setIsTestCallVisible(true)}
              theme={activeTheme}
            />

            <KeyboardAvoidingView
              style={[styles.keyboardContainer, { backgroundColor: '#FFFFFF' }]}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              {/* Message Thread List */}
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => item.id ? `${item.id}_${index}` : `msg_${index}`}
                contentContainerStyle={styles.messageList}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onContentSizeChange={() => {
                  if (isInitialLoadRef.current) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  } else if (isAtBottomRef.current) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }}
                onLayout={() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }}
                ListHeaderComponent={
                  <View style={styles.dateHeaderPill}>
                    <Text style={styles.dateHeaderText}>Today, 10:24 AM</Text>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyChatBox}>
                    <View style={styles.emptyChatIconCircle}>
                      <FontAwesome name="comments-o" size={28} color="#4B1A56" />
                    </View>
                    <Text style={styles.emptyChatTitle}>Start a Conversation!</Text>
                    <Text style={styles.emptyChatSub}>
                      Say hello in your native language. Sayflash AI will translate your message in real-time.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    currentUser={currentUser}
                    partnerUser={allUsers.find(u => u.email && partnerEmail && u.email.toLowerCase() === partnerEmail.toLowerCase()) || userListCacheRef.current.find(u => u.email && partnerEmail && u.email.toLowerCase() === partnerEmail.toLowerCase())}
                    targetLang={targetLang}
                    onSaveVocab={handleSaveVocab}
                    onViewImage={uri => setSelectedImageUri(uri)}
                    theme={activeTheme}
                  />
                )}
              />

              {/* AI Smart Replies Bar */}
              <QuickReplies
                onSelectReply={replyText => {
                  setInputText(replyText);
                }}
                theme={activeTheme}
              />

              {/* AI Tone Rewriter Bar */}
              <TonePicker
                selectedTone={selectedTone}
                onSelectTone={setSelectedTone}
                onRewriteDraft={handleRewriteDraft}
                isVisible={true}
                theme={activeTheme}
              />

              {/* Press-and-Hold Live Voice Recording Banner */}
              {isRecordingVoice && (
                <View style={styles.recordingBanner}>
                  <View style={styles.recRedDot} />
                  <Text style={styles.recBannerText}>
                    Recording Live Microphone Voice... 0:0{recordSeconds}
                  </Text>
                  <Text style={styles.recSubText}>• Release to Send</Text>
                </View>
              )}

              {/* Inline Attachment Sheet (+) Rendered Inline Above Input */}
              <MediaPickerSheet
                visible={isMediaPickerVisible}
                onClose={() => setIsMediaPickerVisible(false)}
                onLaunchCamera={handleLaunchRealCamera}
                onPickLibrary={handlePickFromLibrary}
                onPickDocument={handlePickDocument}
                theme={activeTheme}
              />

              {/* Floating Capsule Input Toolbar from Reference Design */}
              <View style={styles.floatingInputArea}>
                <View style={styles.floatingInputRow}>
                  {/* Left Attachment (+) Button */}
                  <TouchableOpacity
                    style={[
                      styles.floatingPlusBtn,
                      isMediaPickerVisible && styles.floatingPlusBtnActive
                    ]}
                    onPress={() => setIsMediaPickerVisible(prev => !prev)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome
                      name={isMediaPickerVisible ? "times" : "plus"}
                      size={18}
                      color="#111827"
                    />
                  </TouchableOpacity>

                  {/* Center Capsule Container */}
                  <View style={styles.floatingInputCapsule}>
                    <TextInput
                      style={styles.floatingTextInput}
                      placeholder={isRecordingVoice ? "Recording audio note..." : "Type a message to translate..."}
                      placeholderTextColor="#80737d"
                      value={inputText}
                      onChangeText={setInputText}
                      multiline={true}
                      textAlignVertical="center"
                    />
                    <View style={styles.capsuleRightActions}>
                      <TouchableOpacity style={styles.capsuleActionBtn} onPress={handleLaunchRealCamera} activeOpacity={0.7}>
                        <FontAwesome name="camera" size={16} color="#80737d" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.capsuleActionBtn, isRecordingVoice && styles.micBtnActive]}
                        onPressIn={handleMicPressIn}
                        onPressOut={handleMicPressOut}
                        delayLongPress={100}
                        activeOpacity={0.7}
                      >
                        <FontAwesome
                          name="microphone"
                          size={17}
                          color={isRecordingVoice ? "#EF4444" : "#80737d"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Right Floating Send Button in Deep Purple */}
                  <TouchableOpacity
                    style={styles.floatingSendBtn}
                    onPress={() => handleSend()}
                    activeOpacity={0.85}
                  >
                    <FontAwesome name="paper-plane" size={16} color="#FFFFFF" style={{ marginLeft: -2 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        )}
        </Animated.View>

        {/* Bottom Navigation Bar for Mobile */}
        {activeView === 'chatList' && !isFriendProfileVisible && (
          <BottomNavBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            theme={activeTheme}
          />
        )}

        {/* Incoming Inter-Device Call Notification Modal */}
        <IncomingCallModal
          visible={!!incomingCallData}
          callData={incomingCallData}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
          theme={activeTheme}
        />

        {/* Target Language Selector Modal */}
        <LanguagePickerModal
          visible={isLangPickerVisible}
          onClose={() => setIsLangPickerVisible(false)}
          selectedLang={targetLang}
          onSelectLang={setTargetLang}
        />

        {/* Full Image Viewer & Save to Gallery Modal */}
        <ImageViewerModal
          visible={!!selectedImageUri}
          imageUri={selectedImageUri}
          onClose={() => setSelectedImageUri(null)}
        />

        {/* Voice Call Modal */}
        <VoiceCallModal
          visible={isVoiceCallVisible}
          onClose={handleCloseCall}
          partnerName={partnerEmail || 'ken.test2@test.com'}
          userEmail={currentUser?.email}
          userName={currentUser?.displayName || currentUser?.email}
          partnerEmail={partnerEmail || 'ken.test2@test.com'}
          isConnected={isCallConnected}
        />

        {/* Video Call Modal */}
        <VideoCallModal
          visible={isVideoCallVisible}
          onClose={handleCloseCall}
          partnerName={partnerEmail || 'ken.test2@test.com'}
          userEmail={currentUser?.email}
          userName={currentUser?.displayName || currentUser?.email}
          partnerEmail={partnerEmail || 'ken.test2@test.com'}
          remoteVideoFrameUri={remoteVideoFrameUri}
          isConnected={isCallConnected}
        />

        {/* Vocabulary Modal */}
        <VocabularyModal
          visible={isVocabVisible}
          onClose={() => setIsVocabVisible(false)}
          vocabList={vocabList}
          onDeleteItem={handleDeleteVocab}
        />

        {/* Profile & IAM Modal */}
        <ProfileModal
          visible={isProfileVisible}
          onClose={() => setIsProfileVisible(false)}
          user={currentUser}
          onLogout={handleLogout}
        />
            </View>
          </MotionView>
        )}
      </AnimatePresence>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  chatRoomContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 10,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyStateSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#EF4444',
  },
  recRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recBannerText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  recSubText: {
    color: '#FCA5A5',
    fontSize: 11,
    marginLeft: 6,
  },
  dateHeaderPill: {
    alignSelf: 'center',
    backgroundColor: '#E5E7EB', // Light grey pill from reference
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: 14,
  },
  dateHeaderText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyChatBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyChatIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyChatTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#320034',
    marginBottom: 6,
  },
  emptyChatSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1F1F1',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 16,
    marginTop: 6,
    marginBottom: 8,
    gap: 5,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4B5563',
    opacity: 0.6,
  },
  floatingInputArea: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3E8FF',
  },
  floatingInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  floatingPlusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF5FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3E8FF',
    marginBottom: 2,
  },
  floatingPlusBtnActive: {
    backgroundColor: '#FFF0FA',
    borderColor: '#4B1A56',
  },
  floatingInputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FAF5FA',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  floatingTextInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#320034',
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingRight: 6,
    maxHeight: 105,
    lineHeight: 20,
  },
  capsuleRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 7,
  },
  capsuleActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: '#FEE2E2',
    borderRadius: 15,
  },
  floatingSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4B1A56',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    shadowColor: '#4B1A56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
});
