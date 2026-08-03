/**
 * Simulated AI Friend Service ("Mei-Ling in Shanghai 🇨🇳")
 * Generates realistic responses in Chinese with translation & pinyin for testing real-time chat.
 */

import { getPinyin } from './translationService';

const MEILING_RESPONSES = [
  {
    chinese: "嗨！好久不见！你最近过得怎么样呀？",
    english: "Hi! Long time no see! How have you been doing lately?",
    culturalNote: "💡 Friendly Chinese tone: Adding '呀' (ya) or '啦' (la) at the end makes casual conversation sound warm and friendly."
  },
  {
    chinese: "上海今天天气太棒了，我正准备去安福路喝咖啡呢！☕",
    english: "The weather in Shanghai today is wonderful, I'm just heading to Anfu Road for coffee!",
    culturalNote: "📍 Shanghai Culture: Anfu Road (安福路) is a trendy, famous street in Shanghai known for stylish cafes and street fashion."
  },
  {
    chinese: "你吃了吗？我刚吃了小笼包，太美味啦！🥟",
    english: "Have you eaten yet? I just had Xiaolongbao (soup dumplings), it was so delicious!",
    culturalNote: "🥟 Food Culture: Xiaolongbao is a signature Shanghai dish!"
  },
  {
    chinese: "这个小众音乐也太绝了吧！破防了破防了～🎶",
    english: "This indie music is so good! My heart is totally melting ~",
    culturalNote: "🔥 Slang breakdown: '绝了' (Jué le) = insane/amazing. '破防了' (Pò fáng le) = deeply touched emotionally."
  },
  {
    chinese: "周末我们打算去杭州游玩，你有去过吗？",
    english: "We are planning to visit Hangzhou this weekend, have you ever been there?",
    culturalNote: "🏞️ Geography note: Hangzhou is a famous scenic city near Shanghai, known for West Lake."
  }
];

let responseIndex = 0;

export function getSimulatedFriendReply(userMessage) {
  const current = MEILING_RESPONSES[responseIndex % MEILING_RESPONSES.length];
  responseIndex++;

  return {
    id: 'msg_' + Date.now(),
    sender: 'friend',
    senderName: 'Mei-Ling (美玲)',
    originalText: current.chinese,
    translatedText: current.english,
    pinyin: getPinyin(current.chinese),
    culturalNote: current.culturalNote,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}
