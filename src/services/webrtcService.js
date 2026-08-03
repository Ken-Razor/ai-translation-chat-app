/**
 * ViveTalk WebRTC Pure Direct UDP Voice & Video Stream Engine
 * Instant sub-50ms latency Opus 48kHz P2P Audio & Video without HTTP file polling.
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
    console.warn('Native WebRTC module fallback:', e.message);
  }
}

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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

      return this.localStream;
    } catch (err) {
      console.warn('⚠️ [WebRTC] Media Device error:', err);
      return null;
    }
  }

  /**
   * Initialize PeerConnection with ICE and Instant Track Event Handlers
   */
  initPeerConnection(myEmail, partnerEmail, onRemoteStream) {
    if (!RTCPeerConnection) {
      console.warn('⚠️ WebRTC PeerConnection not supported in this runtime environment');
      return null;
    }

    // Don't re-create if connection already exists (callee auto-init protection)
    if (this.peerConnection) {
      console.log('[WebRTC] PeerConnection already exists, reusing');
      return this.peerConnection;
    }

    this.peerConnection = new RTCPeerConnection(STUN_SERVERS);
    this.onRemoteStreamCallback = onRemoteStream;

    // Attach local hardware media tracks directly
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          this.peerConnection.addTrack(track, this.localStream);
        } catch (e) {}
      });
    }

    // ICE Candidate Handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && partnerEmail) {
        const candidateStr = JSON.stringify(event.candidate);
        sendRawSignal(myEmail, myEmail, partnerEmail, `📡 [WEBRTC_ICE:${candidateStr}]`).catch(() => {});
      }
    };

    // On Remote Track Received (Instant UDP Stream Playback)
    this.peerConnection.ontrack = (event) => {
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
          audioEl.play().catch(err => console.log('WebRTC audio autoplay:', err));
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
      return offer;
    } catch (err) {
      console.warn('⚠️ [WebRTC] Create Offer error:', err);
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
      console.warn('⚠️ [WebRTC] Handle Offer error:', err);
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
      console.warn('⚠️ [WebRTC] Handle Answer error:', err);
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
      console.warn('⚠️ [WebRTC] Add ICE error:', err);
    }
  }

  /**
   * Close & Tear Down Connection & Hardware Tracks
   */
  close() {
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
    this.pendingOffer = null;
    this.pendingOfferMeta = null;
    this.isCalleeMode = false;
  }
}

export const webrtcService = new WebRTCService();
export { RTCView };
