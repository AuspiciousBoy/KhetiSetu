import apiClient from './apiClient';

const STORAGE_KEY = 'khetisetu_gemini_api_key';

const SYSTEM_INSTRUCTION = `You are "Kheti AI" (खेती AI), the expert digital farming assistant on the KhetiSetu platform ("Khet Se Bazaar Tak, Ek Hi Setu").
Your goal is to assist Indian farmers, consumers, and agribusinesses with clear, practical, and scientifically sound agricultural advice.

Guiding Principles:
1. LANGUAGES: You fluently understand and respond in English, Hindi (हिंदी), and Hinglish (Hindi written in Latin script). ALWAYS reply in the language the user asked in.
2. HONESTY & REAL DATA: You MUST NOT invent real-time market prices or localized live weather that are not supplied in the context. If specific live prices are unavailable, state that prices fluctuate by local mandi and refer the farmer to the KhetiSetu Market Prices dashboard.
3. CHEMICAL SAFETY: For chemical pesticide/fertilizer dosages, always emphasize cautious application, mandatory protective equipment (mask, gloves), adherence to Central Insecticides Board & Registration Committee (CIBRC) guidelines, and consultation with local Krishi Vigyan Kendra (KVK) extension officers.
4. TONALITY: Respectful, encouraging, practical, and culturally grounded for Indian agriculture.`;

export const getStoredGeminiKey = () => {
  if (typeof window === 'undefined') return '';
  const local = localStorage.getItem(STORAGE_KEY);
  if (local && local.trim().length > 10) return local.trim();
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 10 && !envKey.includes('your_gemini')) {
    return envKey.trim();
  }
  return '';
};

export const setStoredGeminiKey = (key) => {
  if (typeof window === 'undefined') return;
  if (key && key.trim().length > 10) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

/**
 * Verify a Gemini API key against Google's API
 */
export const testGeminiKey = async (key) => {
  if (!key || key.trim().length < 10) {
    throw new Error('API key must be at least 10 characters');
  }
  const cleanKey = key.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
      generationConfig: { maxOutputTokens: 5 },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google API returned status ${res.status}`);
  }

  return true;
};

/**
 * Send query to Kheti AI.
 * 1. Tries backend /ai/chat endpoint (passes x-gemini-api-key header).
 * 2. If backend is unavailable or not using Gemini, directly calls Google Gemini REST API.
 */
export const askKhetiAI = async ({ userMessage, conversationHistory = [] }) => {
  const activeKey = getStoredGeminiKey();

  // 1. Try backend endpoint
  try {
    const headers = activeKey ? { 'x-gemini-api-key': activeKey } : {};
    const res = await apiClient.post(
      '/ai/chat',
      { message: userMessage },
      { headers }
    );
    if (res.data?.success && res.data?.data) {
      // If backend successfully used Gemini, return it
      if (res.data.data.source && !res.data.data.source.includes('local-knowledge')) {
        return res.data.data;
      }
      // If backend fell back to local engine BUT client has a valid Gemini key, use direct Gemini call
      if (!activeKey) {
        return res.data.data;
      }
    }
  } catch (backendErr) {
    // If no active key, rethrow error
    if (!activeKey) throw backendErr;
  }

  // 2. Direct Google Gemini REST API call
  if (activeKey) {
    const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const model of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nFarmer Query: ${userMessage}` }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.4,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return {
              reply: replyText.trim(),
              source: `Google Gemini (${model})`,
              conversationId: `conv-${Date.now()}`,
            };
          }
        }
      } catch (err) {
        // Try next model
      }
    }
  }

  throw new Error('Unable to contact Gemini AI. Please check your API key.');
};

export default {
  getStoredGeminiKey,
  setStoredGeminiKey,
  testGeminiKey,
  askKhetiAI,
};
