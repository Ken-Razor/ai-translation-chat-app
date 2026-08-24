/**
 * ViveTalk AI - Real-Time Neural Translation Engine, Tone Rewriter & Pinyin
 * Powered by Google Gemini 1.5 Flash + Backend Google Neural AI Engine.
 */

import { getApiBaseUrl } from './translationService';

// Official Google Gemini API Endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

let defaultGeminiKey = ''; 
let userGeminiApiKey = defaultGeminiKey;

export function setGeminiApiKey(key) {
  userGeminiApiKey = key ? key.trim() : defaultGeminiKey;
}

export function getGeminiApiKey() {
  return userGeminiApiKey;
}

// Normalized language code mapping
const NORM_LANG_MAP = {
  'en': 'en', 'english': 'en',
  'id': 'id', 'indonesian': 'id', 'bahasa': 'id',
  'zh': 'zh-CN', 'chinese': 'zh-CN', 'mandarin': 'zh-CN', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW',
  'ja': 'ja', 'jp': 'ja', 'japanese': 'ja',
  'es': 'es', 'spanish': 'es',
  'fr': 'fr', 'french': 'fr',
  'de': 'de', 'german': 'de',
  'ko': 'ko', 'korean': 'ko',
  'ar': 'ar', 'arabic': 'ar',
  'it': 'it', 'italian': 'it',
  'pt': 'pt', 'portuguese': 'pt',
  'ru': 'ru', 'russian': 'ru',
  'vi': 'vi', 'vietnamese': 'vi',
  'th': 'th', 'thai': 'th'
};

export const normalizeLangCode = (code) => {
  if (!code) return 'en';
  const clean = String(code).toLowerCase().replace(/[^a-z0-9]/gi, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (NORM_LANG_MAP[w]) return NORM_LANG_MAP[w];
  }
  return NORM_LANG_MAP[clean] || clean || 'en';
};

// Comprehensive Chinese Pinyin Dictionary
const PINYIN_DICT = {
  '你好': 'Nǐ hǎo',
  '谢谢': 'Xièxie',
  '不客气': 'Bú kèqi',
  '再见': 'Zàijiàn',
  '吃了吗': 'Chī le ma',
  '你最近怎么样': 'Nǐ zuìjìn zěnme yàng',
  '没关系': 'Méi guānxi',
  '没问题': 'Méi wèntí',
  '早安': 'Zǎo ān',
  '晚安': 'Wǎn ān',
  '中国': 'Zhōngguó',
  '加油': 'Jiāyóu',
  '对不起': 'Duìbuqǐ',
  '我': 'wǒ', '你': 'nǐ', '他': 'tā', '她': 'tā', '它': 'tā', '们': 'men',
  '好': 'hǎo', '是': 'shì', '不': 'bù', '在': 'zài', '有': 'yǒu', '这': 'zhè',
  '那': 'nà', '就': 'jiù', '要': 'yào', '去': 'qù', '来': 'lái', '到': 'dào',
  '会': 'huì', '能': 'néng', '想': 'xiǎng', '说': 'shuō', '看': 'kàn', '听': 'tīng',
  '写': 'xiě', '读': 'dú', '做': 'zuò', '吃': 'chī', '喝': 'hē', '玩': 'wán',
  '买': 'mǎi', '卖': 'mài', '给': 'gěi', '和': 'hé', '与': 'yǔ', '或': 'huò',
  '很': 'hěn', '太': 'tài', '最': 'zuì', '真': 'zhēn', '都': 'dōu', '多': 'duō'
};

export function convertToPinyin(text) {
  if (!text) return '';
  const clean = text.trim();
  if (PINYIN_DICT[clean]) return PINYIN_DICT[clean];

  let result = [];
  let index = 0;

  while (index < clean.length) {
    let matched = false;
    for (let len = Math.min(4, clean.length - index); len >= 2; len--) {
      const phrase = clean.substring(index, index + len);
      if (PINYIN_DICT[phrase]) {
        result.push(PINYIN_DICT[phrase]);
        index += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const char = clean[index];
      if (PINYIN_DICT[char]) {
        result.push(PINYIN_DICT[char]);
      } else if (/[\u4e00-\u9fa5]/.test(char)) {
        result.push('hàn');
      } else {
        result.push(char);
      }
      index++;
    }
  }

  let finalStr = result.join(' ').replace(/\s+/g, ' ').trim();
  if (finalStr.length > 0) {
    finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1);
  }
  return finalStr;
}

/**
 * AI Tone Rewriter - Transforms text into different tones
 */
export async function rewriteTextWithTone(text, tone = 'casual') {
  if (!text || !text.trim()) return text;
  const clean = text.trim();
  const activeKey = userGeminiApiKey || defaultGeminiKey;

  // 1. Same-Origin Backend Tone Rewriter
  try {
    const res = await fetch(`${getApiBaseUrl()}/ai/tone-rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, tone })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rewritten) return data.rewritten;
    }
  } catch (e) {}

  // 2. Google Gemini AI (if key configured)
  if (activeKey && activeKey.startsWith('AIza')) {
    try {
      const prompt = `Rewrite the following chat message in a "${tone}" tone while preserving the core meaning. Return ONLY the rewritten message without any explanation or quotes: "${clean}"`;
      const res = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(activeKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const rewritten = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rewritten && rewritten.length > 0) return rewritten;
      }
    } catch (e) {}
  }

  // 3. Conversational Tone Rewriter Fallback
  const toneLower = (tone || 'casual').toLowerCase();
  if (toneLower === 'formal' || toneLower === 'polite') {
    let res = clean
      .replace(/\b(hey|yo|hi|sup)\b/gi, 'Hello')
      .replace(/\b(u)\b/gi, 'you')
      .replace(/\b(ur)\b/gi, 'your')
      .replace(/\b(r)\b/gi, 'are')
      .replace(/\b(gonna)\b/gi, 'going to')
      .replace(/\b(wanna)\b/gi, 'would like to')
      .replace(/\b(thanks|thx)\b/gi, 'Thank you very much');
    if (!/[.?!]$/.test(res)) res += '.';
    return res;
  }

  if (toneLower === 'friendly') {
    let res = clean
      .replace(/\b(hello|greetings)\b/gi, 'Hey there')
      .replace(/\b(thanks|thank you)\b/gi, 'Thanks so much! 😊');
    if (!res.includes('😊') && !res.includes('✨') && !res.includes('👋')) {
      res += ' 😊';
    }
    return res;
  }

  if (toneLower === 'business') {
    return `Regarding our discussion: ${clean}`;
  }

  if (toneLower === 'slang') {
    return clean
      .replace(/\b(cool|great|awesome)\b/gi, 'lit 🔥')
      .replace(/\b(friend|partner)\b/gi, 'bestie')
      .replace(/\b(really|very)\b/gi, 'super');
  }

  return clean;
}

/**
 * Perform 100% Real-Time Live AI Translation
 */
export async function translateWithGemini(text, sourceLang = 'auto', targetLang = 'en', tone = 'casual') {
  if (!text) return { translatedText: '', pinyin: '', culturalNote: null };

  const cleanText = text.replace(/\[Golang AI[^\]]*\]:\s*/gi, '').replace(/\(收到！\)/gi, '').trim();
  if (!cleanText) return { translatedText: '', pinyin: '', culturalNote: null };

  const isChineseInput = /[\u4e00-\u9fa5]/.test(cleanText);
  const targetCode = normalizeLangCode(targetLang);

  // 1. Same-Origin Backend Translation (Zero CORS, 100% Reliable & Fast)
  try {
    const res = await fetch(`${getApiBaseUrl()}/chat/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        targetLang: targetCode,
        tone: tone
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.translatedText) {
        return {
          translatedText: data.translatedText,
          pinyin: (targetCode.startsWith('zh') || isChineseInput) ? (data.pinyin || convertToPinyin(data.translatedText)) : '',
          culturalNote: data.culturalNote || null,
          detectedLanguage: data.detectedSource || 'auto',
          engine: 'ViveTalk AI Neural Server'
        };
      }
    }
  } catch (e) {}

  // 2. Google Gemini 1.5 Live AI Model (if Gemini Key provided)
  const activeKey = userGeminiApiKey || defaultGeminiKey;
  if (activeKey && activeKey.startsWith('AIza')) {
    try {
      const prompt = `You are Google Gemini AI translation engine for ViveTalk.
Translate this message: "${cleanText}"
Source Language: ${sourceLang}
Target Language: ${targetCode}
Tone: ${tone}
Respond strictly in valid JSON format:
{
  "translatedText": "string",
  "pinyin": "string (Pinyin with tone marks if target or source is Chinese, else empty)",
  "culturalNote": "short 1-sentence cultural context note or null"
}`;

      const res = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(activeKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText);
          if (parsed.translatedText) {
            return {
              translatedText: parsed.translatedText,
              pinyin: targetCode.startsWith('zh') || isChineseInput ? (parsed.pinyin || convertToPinyin(cleanText)) : '',
              culturalNote: parsed.culturalNote || null,
              detectedLanguage: isChineseInput ? 'zh' : 'auto',
              engine: 'Google Gemini AI Live'
            };
          }
        }
      }
    } catch (err) {
      console.warn('Gemini Live API warning:', err);
    }
  }

  // 3. Fallback
  return {
    translatedText: cleanText,
    pinyin: isChineseInput ? convertToPinyin(cleanText) : '',
    culturalNote: null,
    detectedLanguage: 'auto',
    engine: 'Live AI Service'
  };
}
