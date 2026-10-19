import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const KhetiAIPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        'नमस्ते किसान भाई! मैं खेतीसेतु का डिजिटल सहायक "खेती AI" हूँ। आप मुझसे फसल पोषण, कीट रोकथाम, खाद प्रबंधन और मौसम संबंधी सलाह हिंदी, English या Hinglish में पूछ सकते हैं। मैं आपकी क्या सहायता करूँ?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const payload = {
        message: userText,
        ...(conversationId ? { conversationId } : {}),
      };

      const res = await apiClient.post('/ai/chat', payload);

      setConversationId(res.data.data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: res.data.data.reply,
          source: res.data.data.source,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content:
            err.response?.data?.error?.message ||
            'खेती AI सर्वर से संपर्क नहीं हो पाया। कृपया कुछ क्षणों बाद पुनः प्रयास करें।',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (promptText) => {
    setInputMessage(promptText);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto h-[82vh]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[22px]">psychiatry</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-primary flex items-center gap-2">
              खेती AI • Farming Assistant
              <Badge variant="success">Online</Badge>
            </h1>
            <p className="text-xs text-on-surface-variant">
              English • हिंदी • Hinglish • Multi-lingual Agronomy Guidance
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                role: 'model',
                content:
                  'नमस्ते! नया सत्र शुरू हो चुका है। आप मुझसे अपनी फसल, खाद या कीट नियंत्रण के संबंध में कोई भी सवाल पूछ सकते हैं।',
              },
            ]);
            setConversationId(null);
          }}
          className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          New Session
        </button>
      </div>

      {/* Chat Messages Box */}
      <Card className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-surface-container-low soil-shadow">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.role === 'user'
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-primary text-on-primary'
              }`}
            >
              {msg.role === 'user' ? 'Me' : 'AI'}
            </div>

            <div
              className={`max-w-[80%] rounded-[16px] px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-primary text-on-primary rounded-tr-none'
                  : 'bg-surface text-on-surface border border-surface-variant rounded-tl-none soil-shadow'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-secondary italic">
            <span className="material-symbols-outlined animate-spin text-[16px]">
              progress_activity
            </span>
            Kheti AI is synthesizing agronomy response...
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-on-surface-variant shrink-0">Try asking:</span>
        <button
          type="button"
          onClick={() => handleSuggestedPrompt('टमाटर की फसल में पत्ती धब्बा (Leaf Spot) का जैविक उपचार बताएं')}
          className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs shrink-0 border border-surface-variant"
        >
          🍃 टमाटर में पत्ती धब्बा रोग
        </button>
        <button
          type="button"
          onClick={() => handleSuggestedPrompt('बारिश के बाद प्याज की फसल में फफूंदनाशक कब छिड़कना चाहिए?')}
          className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs shrink-0 border border-surface-variant"
        >
          🌧️ बारिश बाद प्याज में स्प्रे
        </button>
        <button
          type="button"
          onClick={() => handleSuggestedPrompt('What is the recommended NPK fertilizer schedule for wheat?')}
          className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant text-on-surface text-xs shrink-0 border border-surface-variant"
        >
          🌾 Wheat NPK dosage
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask in Hindi, English or Hinglish (e.g. फसल में यूरिया कब डालें?)..."
          className="flex-1 bg-surface-container text-on-surface placeholder:text-on-surface-variant/70 rounded-[12px] py-3.5 px-4 text-sm border border-transparent focus:border-primary focus:bg-surface-bright focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!inputMessage.trim()}>
          <span className="material-symbols-outlined text-[20px]">send</span>
        </Button>
      </form>
    </div>
  );
};

export default KhetiAIPage;
