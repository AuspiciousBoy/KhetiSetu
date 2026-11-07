import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  RotateCcw,
  Send,
  Copy,
  Check,
  Leaf,
  Bug,
  FlaskConical,
  CloudRain,
  TrendingUp,
  User,
  X,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const PRESET_TOPICS = [
  {
    category: 'Diseases',
    Icon: Leaf,
    label: 'पत्ती झुलसा / Leaf Spot',
    prompt: 'टमाटर की फसल में पत्ती धब्बा और अगेती झुलसा (Early Blight) के लक्षण और उपचार बताएं।',
  },
  {
    category: 'Pests',
    Icon: Bug,
    label: 'सफेद मक्खी / Whitefly & Thrips',
    prompt: 'फसल में रस चूसक कीट (सफेद मक्खी और थ्रिप्स) के जैविक एवं CIBRC अनुमोदित रासायनिक उपाय बताएं।',
  },
  {
    category: 'Nutrition',
    Icon: FlaskConical,
    label: 'संतुलित खाद / Fertilizer Schedule',
    prompt: 'गेहूं और आलू की फसल के लिए वैज्ञानिक NPK और जिंक खाद तालिका बताएं।',
  },
  {
    category: 'Weather',
    Icon: CloudRain,
    label: 'बारिश बाद स्प्रे / Spray Advisory',
    prompt: 'भारी बारिश के बाद खेत में फफूंद रोगों से बचाव हेतु कीटनाशक/फफूंदनाशक छिड़काव कब और कैसे करें?',
  },
  {
    category: 'Mandi',
    Icon: TrendingUp,
    label: 'शुद्ध मुनाफा / Mandi Strategy',
    prompt: 'स्थानीय मंडी बनाम दूर की थोक मंडी: परिवहन खर्च और कमीशन काटकर शुद्ध मुनाफा कैसे निकालें?',
  },
];

const KhetiAIPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        'नमस्ते किसान भाई! मैं खेतीसेतु का डिजिटल कृषि सलाहकार "खेती AI" हूँ।\n\nआप मुझसे फसल रोग निदान, कीट नियंत्रण, संतुलित खाद (NPK/Urea), मौसम अनुसार छिड़काव और मंडी भाव बिक्री रणनीति के संबंध में हिंदी, English या Hinglish में मार्गदर्शन ले सकते हैं।',
      source: 'local-knowledge-engine',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [aiStatus, setAiStatus] = useState({
    isGeminiConfigured: false,
    engine: 'KhetiSetu Agronomy Engine',
    model: 'local-knowledge-engine',
    status: 'CHECKING',
  });
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Check AI engine status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get('/ai/status');
        if (res.data?.data) {
          setAiStatus(res.data.data);
        }
      } catch {
        // Fallback default
        setAiStatus({
          isGeminiConfigured: false,
          engine: 'KhetiSetu Agronomy Engine',
          model: 'local-knowledge-engine',
          status: 'FALLBACK_READY',
        });
      }
    };
    fetchStatus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setInputMessage('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userText, timestamp: timeNow },
    ]);
    setLoading(true);

    try {
      const payload = {
        message: userText,
        ...(conversationId ? { conversationId } : {}),
      };

      const res = await apiClient.post('/ai/chat', payload);

      if (res.data?.data?.conversationId) {
        setConversationId(res.data.data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: res.data.data.reply,
          source: res.data.data.source || 'gemini',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content:
            err.response?.data?.error?.message ||
            'खेती AI से संपर्क में समस्या आई। कृपया पुनः प्रयास करें।',
          source: 'error',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleResetSession = () => {
    setMessages([
      {
        role: 'model',
        content:
          'नया कृषि परामर्श सत्र शुरू हो चुका है। आप अपनी फसल, कीट लक्षण या खाद संबंधी कोई भी सवाल पूछ सकते हैं।',
        source: aiStatus.isGeminiConfigured ? 'gemini' : 'local-knowledge-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setConversationId(null);
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto min-h-[85vh] py-2">
      {/* Agritech Telemetry Header */}
      <div className="bg-surface rounded-[20px] p-4 border border-surface-variant soil-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <Bot className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg md:text-xl text-primary">
                खेती AI • Agricultural Intelligence Center
              </h1>
              {aiStatus.isGeminiConfigured ? (
                <Badge variant="success" className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  Google Gemini Live
                </Badge>
              ) : (
                <Badge variant="warning" className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Agronomy Engine Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              Multi-lingual Crop Doctor • Hindi (हिंदी) • English • Hinglish • CIBRC Safety Verified
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              Active Engine
            </span>
            <span className="text-xs font-semibold text-primary font-mono">
              {aiStatus.isGeminiConfigured ? 'Gemini 2.0 / 1.5 Flash' : 'KhetiSetu Precision Agronomy'}
            </span>
          </div>

          <button
            onClick={handleResetSession}
            className="px-3 py-1.5 rounded-[10px] bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold border border-surface-variant flex items-center gap-1.5 transition-colors"
            title="Start new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-secondary" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Notice Banner for Gemini API Key if not configured */}
      {!aiStatus.isGeminiConfigured && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-[14px] px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 gap-3">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Gemini AI Setup:</strong> Running on KhetiSetu's calibrated agronomy knowledge base.
              To activate live Google Gemini cloud AI, add your free key to <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-[11px]">server/.env</code> as <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-[11px]">GEMINI_API_KEY=AIzaSy...</code>
            </span>
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-amber-800 font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Get Free Key</span>
            <ExternalLink className="w-3 h-3 text-amber-800" />
          </a>
        </div>
      )}

      {/* Preset Crop Advisory Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-on-surface-variant/80 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          Quick Inquiries:
        </span>
        {PRESET_TOPICS.map((topic, idx) => {
          const Icon = topic.Icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputMessage(topic.prompt);
              }}
              className="px-3 py-1.5 rounded-full bg-surface hover:bg-surface-container text-on-surface text-xs font-medium shrink-0 border border-surface-variant transition-all hover:border-primary/40 flex items-center gap-1.5 soil-shadow"
            >
              <Icon className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span>{topic.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Conversation Stream */}
      <Card className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 bg-surface-container-low soil-shadow min-h-[460px] max-h-[56vh]">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-primary text-on-primary shadow-sm'
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-emerald-300" />
                )}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-[18px] p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-primary text-on-primary rounded-tr-none'
                    : 'bg-surface text-on-surface border border-surface-variant rounded-tl-none soil-shadow'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{msg.content}</div>

                {/* Footer metadata for AI replies */}
                <div
                  className={`mt-3 pt-2 flex items-center justify-between gap-3 text-[10px] border-t ${
                    isUser
                      ? 'border-on-primary/20 text-on-primary/70'
                      : 'border-surface-variant text-on-surface-variant/70'
                  }`}
                >
                  <span className="flex items-center gap-1 font-mono">
                    {!isUser && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        {msg.source?.includes('gemini')
                          ? `Google ${msg.source}`
                          : 'KhetiSetu Agronomy Engine'}
                      </span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </span>

                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, index)}
                      className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 p-3 bg-surface rounded-[14px] border border-surface-variant max-w-sm text-xs text-primary font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Analyzing agronomic query & synthesizing response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      {/* Input Console */}
      <div className="flex flex-col gap-2">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask in Hindi, English or Hinglish (उदा. धान में खैरा रोग का इलाज क्या है?)..."
              disabled={loading}
              className="w-full bg-surface text-on-surface placeholder:text-on-surface-variant/60 rounded-[14px] py-3.5 pl-4 pr-12 text-sm border border-surface-variant focus:border-primary focus:bg-surface-bright focus:outline-none focus:ring-1 focus:ring-primary soil-shadow transition-colors"
            />
            {inputMessage.trim() && (
              <button
                type="button"
                onClick={() => setInputMessage('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!inputMessage.trim()}
            className="rounded-[14px] px-5 py-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <span className="hidden sm:inline">Ask AI</span>
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Agricultural Safety Disclaimer */}
        <p className="text-[11px] text-on-surface-variant/75 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
          <span>
            Advice adheres to CIBRC agrochemical safety guidelines. Always consult your local Krishi Vigyan Kendra (KVK) officer before applying concentrated sprays.
          </span>
        </p>
      </div>
    </div>
  );
};

export default KhetiAIPage;
