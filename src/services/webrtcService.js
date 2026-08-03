/**
 * ViveTalk WebRTC Pure Direct UDP Voice & Video Stream Engine
 * Instant sub-50ms latency Opus 48kHz P2P Audio & Video without HTTP file polling.
 * Includes TURN fallback servers for NAT/firewall traversal.
 */

import { Platform } from 'react-native';
import { sendRawSignal } from './translationService';

// WebRTC Cross-Platform Exports
let RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, RTCView, mediaDevices;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
  RTCSessionDescription = window.RTCSessionDescription;
  RTCIceCandidate = window.RTCIceCandidate;
  mediaDevices = window.navigator?.mediaDevices;
} else {
  try {
    const webrtc = require('react-native-webrtc');
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    RTCView = webrtc.RTCView;
    mediaDevices = webrtc.mediaDevices;
  } catch (e) {
    console.warn('[WebRTC] Native module not available (expected in Expo Go):', e.message);
  }
}

// ICE servers with Tencent TRTC Global Cloud STUN & TURN relay fallback
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:trtc-stun.tencentcloud.com:19302' },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Free TURN servers from Open Relay Project (for NAT traversal)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.onRemoteStreamCallback = null;
    this.pendingOffer = null;       // Buffered SDP offer for callee
    this.pendingOfferMeta = null;   // { myEmail, partnerEmail }
    this.isCalleeMode = false;      // True if we received an offer before modal opened
    this.connectionState = 'idle';  // idle | connecting | connected | failed
    this.onStateChangeCallback = null;
  }

  /**
   * Set a callback to monitor connection state changes
   */
  onStateChange(callback) {
    this.onStateChangeCallback = callback;
  }

  _updateState(newState) {
    this.connectionState = newState;
    console.log(`[WebRTC] Connection state: ${newState}`);
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(newState);
    }
  }

  /**
   * Acquire Microphone / Camera Local Media Stream Directly from Hardware.
   * IMPORTANT: Does NOT destroy an existing peer connection (callee auto-init safe).
   */
  async startLocalMedia(isVideo = false) {
    try {
      // Only stop existing local media tracks — preserve peer connection!
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
        this.localStream = null;
      }

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: 'user',
            }
          : false,
      };

      if (mediaDevices && mediaDevices.getUserMedia) {
        this.localStream = await mediaDevices.getUserMedia(constraints);
      } else if (Platform.OS === 'web' && window.navigator?.mediaDevices) {
        this.localStream = await window.navigator.mediaDevices.getUserMedia(constraints);
      }

      console.log('[WebRTC] Local media acquired:', {
        audioTracks: this.localStream?.getAudioTracks()?.length || 0,
        videoTracks: this.localStream?.getVideoTracks()?.length || 0,
      });

      return this.localStream;
    } catch (err) {
      console.warn('⚠️ [WebRTC] Media Device error:', err.message || err);
      throw err; // Let caller handle the error instead of swallowing
    }
  }

  /**
   * Initialize PeerConnection with ICE and Instant Track Event Handlers
   */
  initPeerConnection(myEmail, partnerEmail, onRemoteStream) {
    if (!RTCPeerConnection) {
      console.warn('⚠️ [WebRTC] PeerConnection not available in this runtime');
      this._updateState('failed');
      return null;
    }

    // Don't re-create if connection already exists (callee auto-init protection)
    if (this.peerConnection) {
      console.log('[WebRTC] PeerConnection already exists, reusing');
      return this.peerConnection;
    }

    this._updateState('connecting');
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.onRemoteStreamCallback = onRemoteStream;

    // Attach local hardware media tracks directly
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          this.peerConnection.addTrack(track, this.localStream);
          console.log(`[WebRTC] Added local ${track.kind} track`);
        } catch (e) {
          console.warn(`[WebRTC] Failed to add ${track.kind} track:`, e.message);
        }
      });
    }

    // ICE Candidate Handler — batch small candidates for efficiency
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && partnerEmail) {
        const candidateStr = JSON.stringify(event.candidate);
        sendRawSignal(myEmail, myEmail, partnerEmail, `📡 [WEBRTC_ICE:${candidateStr}]`).catch((err) => {
          console.warn('[WebRTC] Failed to send ICE candidate:', err.message);
        });
      }
    };

    // Connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log(`[WebRTC] Connection state changed: ${state}`);
      if (state === 'connected') {
        this._updateState('connected');
      } else if (state === 'failed' || state === 'disconnected') {
        this._updateState('failed');
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log(`[WebRTC] ICE connection state: ${state}`);
    };

    // On Remote Track Received (Instant UDP Stream Playback)
    this.peerConnection.ontrack = (event) => {
      console.log(`[WebRTC] Remote track received: ${event.track?.kind}`);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];

        // Attach remote audio track directly to browser audio hardware (Web)
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          let audioEl = document.getElementById('webrtc-remote-audio');
          if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = 'webrtc-remote-audio';
            audioEl.autoplay = true;
            audioEl.controls = false;
            audioEl.style.display = 'none';
            document.body.appendChild(audioEl);
          }
          audioEl.srcObject = this.remoteStream;
          audioEl.play().catch(err => console.log('[WebRTC] Audio autoplay blocked:', err.message));
        }

        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      }
    };

    return this.peerConnection;
  }

  /**
   * Create SDP Offer and Send over Signal Hub (CALLER ONLY)
   */
  async createOffer(myEmail, partnerEmail) {
    if (!this.peerConnection) return null;
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      const sdpStr = JSON.stringify(offer);
      await sendRawSignal(myEmail, myEmail, partnerEmail, `📡 [WEBRTC_OFFER:${sdpStr}]`);
      console.log('[WebRTC] Offer sent successfully');
      return offer;
    } catch (err) {
      console.warn('⚠️ [WebRTC] Create Offer error:', err.message || err);
      return null;
    }
  }

  /**
   * Receive SDP Offer. If peer connection doesn't exist yet (callee hasn't opened modal),
   * buffer it for later processing when the modal opens.
   */
  async handleOffer(sdpOfferStr, myEmail, partnerEmail) {
    // If no peer connection yet, buffer the offer for when the modal opens
    if (!this.peerConnection) {
      this.pendingOffer = sdpOfferStr;
      this.pendingOfferMeta = { myEmail, partnerEmail };
      this.isCalleeMode = true;
      console.log('[WebRTC] Buffered incoming offer (waiting for modal to open)');
      return null;
    }

    try {
      const offer = JSON.parse(sdpOfferStr);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      const answerStr = JSON.stringify(answer);
      await sendRawSignal(myEmail, myEmail, partnerEmail, `📡 [WEBRTC_ANSWER:${answerStr}]`);
      console.log('[WebRTC] Processed offer and sent answer');
      return answer;
    } catch (err) {
      console.warn('⚠️ [WebRTC] Handle Offer error:', err.message || err);
      return null;
    }
  }

  /**
   * Process any buffered pending offer (called by callee modal after init)
   */
  async processPendingOffer() {
    if (this.pendingOffer && this.peerConnection && this.pendingOfferMeta) {
      const { myEmail, partnerEmail } = this.pendingOfferMeta;
      const sdpStr = this.pendingOffer;
      this.pendingOffer = null;
      this.pendingOfferMeta = null;
      console.log('[WebRTC] Processing buffered pending offer');
      return await this.handleOffer(sdpStr, myEmail, partnerEmail);
    }
    return null;
  }

  /**
   * Handle Remote SDP Answer (CALLER receives this)
   */
  async handleAnswer(sdpAnswerStr) {
    if (!this.peerConnection) return;
    try {
      const answer = JSON.parse(sdpAnswerStr);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Received answer, connection establishing...');
    } catch (err) {
      console.warn('⚠️ [WebRTC] Handle Answer error:', err.message || err);
    }
  }

  /**
   * Add Incoming Remote ICE Candidate
   */
  async addIceCandidate(candidateStr) {
    if (!this.peerConnection) return;
    try {
      const candidateObj = JSON.parse(candidateStr);
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidateObj));
    } catch (err) {
      console.warn('⚠️ [WebRTC] Add ICE error:', err.message || err);
    }
  }

  /**
   * Close & Tear Down Connection & Hardware Tracks
   */
  close() {
    console.log('[WebRTC] Closing connection and releasing resources');

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const audioEl = document.getElementById('webrtc-remote-audio');
      if (audioEl) {
        try {
          audioEl.pause();
          audioEl.srcObject = null;
          audioEl.remove();
        } catch (e) {}
      }
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.enabled = false;
          track.stop();
        } catch (e) {}
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.enabled = false;
          track.stop();
        } catch (e) {}
      });
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      try {
        const senders = this.peerConnection.getSenders();
        if (senders) {
          senders.forEach(sender => {
            try {
              if (sender.track) {
                sender.track.enabled = false;
                sender.track.stop();
              }
            } catch (e) {}
          });
        }
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    this.onRemoteStreamCallback = null;
    this.onStateChangeCallback = null;
    this.pendingOffer = null;
    this.pendingOfferMeta = null;
    this.isCalleeMode = false;
    this._updateState('idle');
  }
}

export const webrtcService = new WebRTCService();
export { RTCView };
