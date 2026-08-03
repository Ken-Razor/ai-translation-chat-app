/**
 * BridgeTalk AI - Frontend Translation & Peer Chat Service Client
 * Integrated with Google Gemini 1.5 / 2.5 Flash AI Engine for instant translation & cultural analysis.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { translateWithGemini } from './geminiService';

const BACKEND_TUNNEL_URL = 'https://channels-possibilities-chamber-hidden.trycloudflare.com';

export const getApiBaseUrl = () => {
  return `${BACKEND_TUNNEL_URL}/api`;
};

/**
 * Pinyin helper function export
 */
export function getPinyin(text) {
  if (!text) return '';
  const dict = {
    '你好': 'Nǐ hǎo',
    '嗨': 'Hāi',
    '吃了吗': 'Chī le ma',
    '你最近怎么样': 'Nǐ zuìjìn zěnme yàng',
    '上海': 'Shànghǎi'
  };
  return dict[text] || text;
}

/**
 * Perform real-time AI Translation using Google Gemini AI Model
 */
export async function translateMessage(text, sourceLang = 'en', targetLang = 'zh', tone = 'casual') {
  return await translateWithGemini(text, sourceLang, targetLang, tone);
}

/**
 * Fetch registered users from Golang IAM backend
 */
export async function fetchUserList() {
  try {
    const res = await fetch(`${getApiBaseUrl()}/users`);
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.warn('Failed to fetch user list:', err);
    return [];
  }
}

/**
 * Search users by User ID, Email, or Display Name
 */
export async function searchUsers(query, requesterEmail = '') {
  try {
    const url = `${getApiBaseUrl()}/users/search?q=${encodeURIComponent(query)}&requesterEmail=${encodeURIComponent(requesterEmail)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Failed to search users:', err);
    return [];
  }
}

/**
 * Add a friend by User ID or Email
 */
export async function addFriend(requesterEmail, friendQuery) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/friends/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterEmail, friendQuery }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add friend');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(requesterEmail, targetQuery) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterEmail, targetQuery }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send friend request');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(userEmail, senderEmail) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/friends/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, senderEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to accept friend request');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(userEmail, senderEmail) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/friends/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, senderEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to decline friend request');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Fetch pending friend requests
 */
export async function fetchFriendRequests(userEmail) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/friends/requests?email=${encodeURIComponent(userEmail)}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to fetch friend requests:', err);
    return { received: [], sent: [] };
  }
}

/**
 * Update custom User ID (Handle)
 */
export async function updateCustomUserId(email, newUid) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/user/update-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newUid }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update User ID');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Update User Profile (Display Name, Avatar Color, Avatar Image)
 */
export async function updateUserProfile(email, displayName, avatarColor = '', avatarUrl = '') {
  try {
    const res = await fetch(`${getApiBaseUrl()}/user/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName, avatarColor, avatarUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Send a raw signal message (no AI translation) - used for call signaling protocol
 */
export async function sendRawSignal(senderEmail, senderName, recipientEmail, text) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderEmail,
        senderName,
        recipientEmail,
        text,
        tone: 'casual',
        translatedText: '',
        pinyin: '',
        culturalNote: '',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send signal');
    }
    return data.message || { id: `sig-${Date.now()}`, originalText: text };
  } catch (err) {
    console.warn('Failed to send raw signal message:', err);
    return { id: `sig-${Date.now()}`, originalText: text };
  }
}

/**
 * Send peer-to-peer message with real-time AI translation
 */
export async function sendPeerMessage(senderEmail, senderName, recipientEmail, text, tone = 'casual') {
  try {
    const res = await fetch(`${getApiBaseUrl()}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderEmail,
        senderName,
        recipientEmail,
        text,
        tone,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send message');
    }
    return data.message;
  } catch (err) {
    console.warn('Failed to send peer message to Golang backend:', err);
    throw err;
  }
}

export const sendMessageToPeer = sendPeerMessage;

export async function fetchPeerMessages(user1, user2) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/chat/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.warn('Failed to fetch peer messages from Golang backend:', err);
    return [];
  }
}

/**
 * Mark messages from partner as read
 */
export async function markPeerMessagesRead(userEmail, partnerEmail) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/chat/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, partnerEmail }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to mark messages as read:', err);
  }
}
