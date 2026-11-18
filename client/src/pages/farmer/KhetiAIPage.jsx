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
  TrendingUp,
  User,
  X,
  ShieldCheck,
  Loader2,
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import {
  getStoredGeminiKey,
  setStoredGeminiKey,
  testGeminiKey,
  askKhetiAI,
} from '../../services/aiClient';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useTranslation } from '../../i18n/LanguageContext';

const KhetiAIPage = () => {
  const { t } = useTranslation();

  const PRESET_TOPICS = [
    {
      category: 'Diseases',
      Icon: Leaf,
      label: t('khetiAiPage.topics.leafSpot'),
      prompt: t('khetiAiPage.topics.leafSpotPrompt'),
    },
    {
      category: 'Pests',
      Icon: Bug,
      label: t('khetiAiPage.topics.pestControl'),
      prompt: t('khetiAiPage.topics.pestControlPrompt'),
    },
    {
      category: 'Nutrition',
      Icon: FlaskConical,
      label: t('khetiAiPage.topics.fertilizer'),
      prompt: t('khetiAiPage.topics.fertilizerPrompt'),
    },
    {
      category: 'Mandi',
      Icon: TrendingUp,
      label: t('khetiAiPage.topics.mandiStrategy'),
      prompt: t('khetiAiPage.topics.mandiStrategyPrompt'),
    },
  ];

  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: t('khetiAiPage.welcomeBotMsg'),
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

  // Gemini API Key Modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [keyError, setKeyError] = useState(null);
  const [keySuccess, setKeySuccess] = useState(null);

  // Check AI engine status on mount
  useEffect(() => {
    const localKey = getStoredGeminiKey();
    if (localKey) {
      setKeyInput(localKey);
      setAiStatus({
        isGeminiConfigured: true,
        engine: 'Google Gemini AI',
        model: 'gemini-1.5-flash',
        status: 'ONLINE',
      });
    }

    const fetchStatus = async () => {
      try {
        const headers = localKey ? { 'x-gemini-api-key': localKey } : {};
        const res = await apiClient.get('/ai/status', { headers });
        if (res.data?.data) {
          if (localKey) {
            setAiStatus({
              ...res.data.data,
              isGeminiConfigured: true,
              engine: 'Google Gemini AI',
              model: 'gemini-1.5-flash',
            });
          } else {
            setAiStatus(res.data.data);
          }
        }
      } catch {
        if (!localKey) {
          setAiStatus({
            isGeminiConfigured: false,
            engine: 'KhetiSetu Agronomy Engine',
            model: 'local-knowledge-engine',
            status: 'FALLBACK_READY',
          });
        }
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
      const data = await askKhetiAI({
        userMessage: userText,
        conversationHistory: messages,
      });

      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: data.reply,
          source: data.source || (aiStatus.isGeminiConfigured ? 'gemini' : 'local-knowledge-engine'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: err.response?.data?.error?.message || err.message || t('khetiAiPage.contactError'),
          source: 'error',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    setKeyError(null);
    setKeySuccess(null);

    if (!cleanKey) {
      setStoredGeminiKey('');
      setAiStatus({
        isGeminiConfigured: false,
        engine: 'KhetiSetu Agronomy Engine',
        model: 'local-knowledge-engine',
        status: 'FALLBACK_READY',
      });
      setKeySuccess('Gemini API key cleared. Using local agronomy engine.');
      return;
    }

    try {
      setTestingKey(true);
      await testGeminiKey(cleanKey);
      setStoredGeminiKey(cleanKey);
      setAiStatus({
        isGeminiConfigured: true,
        engine: 'Google Gemini AI',
        model: 'gemini-1.5-flash',
        status: 'ONLINE',
      });
      setKeySuccess('Gemini API key verified and saved successfully! Gemini AI is now live.');
      setTimeout(() => {
        setIsKeyModalOpen(false);
        setKeySuccess(null);
      }, 1500);
    } catch (err) {
      setKeyError(`Verification failed: ${err.message}`);
    } finally {
      setTestingKey(false);
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
        content: t('khetiAiPage.newSessionNotice'),
        source: aiStatus.isGeminiConfigured ? 'gemini' : 'local-knowledge-engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setConversationId(null);
  };

  const hasGeminiActive = aiStatus.isGeminiConfigured || !!getStoredGeminiKey();

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
                {t('khetiAiPage.centerTitle')}
              </h1>
              {hasGeminiActive ? (
                <Badge variant="success" className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  {t('khetiAiPage.geminiLiveBadge')}
                </Badge>
              ) : (
                <Badge variant="warning" className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  {t('khetiAiPage.fallbackReady')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              {t('khetiAiPage.multiLingualCropDoctor')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col items-end text-right mr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              {t('khetiAiPage.activeEngine')}
            </span>
            <span className="text-xs font-semibold text-primary font-mono">
              {hasGeminiActive ? t('khetiAiPage.geminiModel') : t('khetiAiPage.precisionModel')}
            </span>
          </div>

          {/* Gemini API Key Configuration Button */}
          <button
            onClick={() => {
              setKeyInput(getStoredGeminiKey());
              setKeyError(null);
              setKeySuccess(null);
              setIsKeyModalOpen(true);
            }}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              hasGeminiActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-secondary" />
            <span>{hasGeminiActive ? 'Gemini Key Configured' : 'Setup Gemini Key'}</span>
          </button>

          <button
            onClick={handleResetSession}
            className="px-3 py-1.5 rounded-[10px] bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold border border-surface-variant flex items-center gap-1.5 transition-colors"
            title="Start new conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-secondary" />
            <span>{t('khetiAiPage.newSessionBtn')}</span>
          </button>
        </div>
      </div>

      {/* Preset Crop Advisory Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-on-surface-variant/80 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-secondary" />
          {t('khetiAiPage.quickInquiries')}
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

      {/* Chat Display Canvas */}
      <Card className="flex-1 min-h-[500px] max-h-[60vh] overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 rounded-[24px]">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-primary text-on-primary soil-shadow'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-300" />}
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
                        {msg.source?.toLowerCase().includes('gemini')
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
            <span>{t('khetiAiPage.thinking')}</span>
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
              placeholder={t('khetiAiPage.chatPlaceholder')}
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
            <span className="hidden sm:inline">{t('khetiAiPage.sendBtn')}</span>
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Agricultural Safety Disclaimer */}
        <p className="text-[11px] text-on-surface-variant/75 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
          <span>
            {t('khetiAiPage.disclaimer')}
          </span>
        </p>
      </div>

      {/* Gemini API Key Configuration Modal */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="Google Gemini API Key Setup"
        subtitle="Activate Google Gemini 1.5 Flash for real-time agricultural intelligence"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveKey} className="p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-primary">
              Gemini API Key (Google AI Studio)
            </label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="bg-surface text-on-surface rounded-[12px] p-3 text-xs border border-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
            <p className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
              <span>Don't have a key?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:underline inline-flex items-center gap-0.5 font-semibold"
              >
                Get a free API key at Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {keyError && (
            <div className="bg-error-container/20 border border-error/30 rounded-[12px] p-3 flex items-start gap-2 text-xs text-error">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{keyError}</span>
            </div>
          )}

          {keySuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[12px] p-3 flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{keySuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-variant/50">
            <button
              type="button"
              onClick={() => {
                setKeyInput('');
                setStoredGeminiKey('');
                setKeySuccess('API key cleared.');
              }}
              className="text-xs text-error hover:underline font-semibold"
            >
              Clear Key
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 rounded-[12px] bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-variant transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                loading={testingKey}
                className="rounded-[12px] px-4 py-2 text-xs font-semibold"
              >
                Test & Save Key
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KhetiAIPage;
