// Vercel Serverless Function: POST /api/v1/ai/chat

const SYSTEM_INSTRUCTION = `You are "Kheti AI" (खेती AI), the expert digital farming assistant on the KhetiSetu platform ("Khet Se Bazaar Tak, Ek Hi Setu").
Your goal is to assist Indian farmers, consumers, and agribusinesses with clear, practical, and scientifically sound agricultural advice.

Guiding Principles:
1. LANGUAGES: You fluently understand and respond in English, Hindi (हिंदी), and Hinglish (Hindi written in Latin script). ALWAYS reply in the language the user asked in.
2. HONESTY & REAL DATA: You MUST NOT invent real-time market prices or localized live weather that are not supplied in the context. If specific live prices are unavailable, state that prices fluctuate by local mandi and refer the farmer to the KhetiSetu Market Prices dashboard.
3. CHEMICAL SAFETY: For chemical pesticide/fertilizer dosages, always emphasize cautious application, mandatory protective equipment (mask, gloves), adherence to Central Insecticides Board & Registration Committee (CIBRC) guidelines, and consultation with local Krishi Vigyan Kendra (KVK) extension officers.
4. TONALITY: Respectful, encouraging, practical, and culturally grounded for Indian agriculture.`;

const fallbackReplies = (query = '') => {
  const q = query.toLowerCase();
  if (q.includes('tomato') || q.includes('टमाटर')) {
    return 'टमाटर की फसल में प्रमुख समस्याएं फल छेदक (Fruit Borer) और झुलसा रोग (Blight) हैं। जैविक नियंत्रण के लिए नीम तेल (1500 PPM) 3-5 मिली/लीटर पानी में स्प्रे करें। सिंचाई हमेशा ड्रिप विधि से करें और फूल आते समय नमी संतुलित रखें।';
  }
  if (q.includes('wheat') || q.includes('गेहूं')) {
    return 'गेहूं की बेहतर पैदावार के लिए पहली सिंचाई सीआरआई (CRI) अवस्था पर बुवाई के 20-25 दिन बाद करें। खरपतवार नियंत्रण के लिए मेटसल्फ्यूरॉन या 2,4-D का सही मात्रा में छिड़काव करें।';
  }
  if (q.includes('fertilizer') || q.includes('खाद') || q.includes('urea') || q.includes('dap')) {
    return 'संतुलित पोषण हेतु मिट्टी परीक्षण (Soil Health Card) के आधार पर ही N:P:K (4:2:1) का प्रयोग करें। यूरिया को एक साथ डालने के बजाय 2-3 किस्तों में टॉप ड्रेसिंग के रूप में दें।';
  }
  return 'खेतीसेतु कृषि सहायक में आपका स्वागत है। आप फसल सुरक्षा, कीट व रोग उपचार, जैविक खाद, सिंचाई तकनीक, या मंडी रणनीति के बारे में कोई भी प्रश्न पूछ सकते हैं।';
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { message, conversationId } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ success: false, error: { message: 'Message text is required' } });
  }

  const userText = message.trim();
  const customKey = req.headers['x-gemini-api-key'];
  const envKey = process.env.GEMINI_API_KEY;
  const apiKey = (customKey || envKey || '').trim();

  if (apiKey && apiKey.length > 10 && !apiKey.includes('your_gemini')) {
    // Try Gemini models in priority order
    const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const model of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nFarmer Query: ${userText}` }],
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
            return res.status(200).json({
              success: true,
              data: {
                reply: replyText.trim(),
                source: `gemini (${model})`,
                conversationId: conversationId || `conv-${Date.now()}`,
              },
            });
          }
        }
      } catch (err) {
        // Continue to next model or fallback
      }
    }
  }

  // Fallback to Built-in Agronomy Knowledge Engine
  return res.status(200).json({
    success: true,
    data: {
      reply: fallbackReplies(userText),
      source: 'local-knowledge-engine',
      conversationId: conversationId || `conv-${Date.now()}`,
    },
  });
};
