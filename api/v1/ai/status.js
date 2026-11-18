// Vercel Serverless Function: GET /api/v1/ai/status

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customKey = req.headers['x-gemini-api-key'];
  const envKey = process.env.GEMINI_API_KEY;
  const key = (customKey || envKey || '').trim();
  const isConfigured = key.length > 10 && !key.includes('your_gemini');

  return res.status(200).json({
    success: true,
    data: {
      isGeminiConfigured: isConfigured,
      engine: isConfigured ? 'Google Gemini AI' : 'KhetiSetu Agronomy Knowledge Engine',
      model: isConfigured ? 'gemini-1.5-flash' : 'local-knowledge-engine',
      provider: isConfigured ? 'Google AI Cloud' : 'Built-in Agronomy Engine',
      status: isConfigured ? 'ONLINE' : 'FALLBACK_READY',
      message: isConfigured
        ? 'Connected to Google Gemini AI. Real-time multi-modal agronomic intelligence active.'
        : 'GEMINI_API_KEY not configured. Using comprehensive Indian Agronomy Knowledge Engine.',
    },
  });
};
