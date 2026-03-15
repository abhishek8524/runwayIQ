import { ChatBubble } from '../components/ChatBubble';
import { Pill } from '../components/Pill';
import { Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { api, ChatMessage, MetricsResponse } from '../../lib/api';
import { fmtMoney, fmtRunway } from '../../lib/format';

const suggestedQuestions = [
  'What is my current burn rate?',
  'How can I extend runway?',
  'Show me biggest expenses',
  'Forecast next quarter',
  'Compare to last month',
];

export function Chat() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat history and financial context in parallel
    Promise.all([
      api.chat.history().catch(() => [] as ChatMessage[]),
      api.metrics.get().catch(() => null),
    ]).then(([hist, m]) => {
      setHistory(hist);
      setMetrics(m);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  async function sendMessage() {
    const msg = message.trim();
    if (!msg || loading) return;
    setMessage('');
    const userMsg: ChatMessage = { role: 'user', content: msg };
    const updatedHistory = [...history, userMsg];
    setHistory(updatedHistory);
    setLoading(true);
    try {
      const res = await api.chat.send(msg, history);
      setHistory(res.conversationHistory);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Request failed';
      setHistory([...updatedHistory, { role: 'assistant', content: `Sorry, I encountered an error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  }

  const latest = metrics?.latest;

  return (
    <div className="p-6 max-w-[1440px] mx-auto h-[calc(100vh-44px)]">
      <div className="grid grid-cols-[220px_1fr] gap-4 h-full">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Financial Context */}
          <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
            <div className="mb-3">
              <div className="text-[12px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>Financial Context</div>
              <div className="text-[10px]" style={{ color: '#9CA3AF' }}>Live snapshot</div>
            </div>
            <div
              className="space-y-3 p-3 rounded-md"
              style={{ backgroundColor: latest && latest.runway < 3 ? '#FFF5F5' : '#F9FAFB' }}
            >
              {latest ? (
                <>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: '#9CA3AF' }}>Runway</span>
                    <span style={{ color: latest.runway < 3 ? '#E24B4A' : '#374151', fontWeight: 500 }}>{fmtRunway(latest.runway)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: '#9CA3AF' }}>Burn</span>
                    <span style={{ color: '#E24B4A', fontWeight: 500 }}>{fmtMoney(latest.burnRate)}/mo</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: '#9CA3AF' }}>Revenue</span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{fmtMoney(latest.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span style={{ color: '#9CA3AF' }}>Margin</span>
                    <span style={{ color: latest.grossMargin < 30 ? '#D97706' : '#059669', fontWeight: 500 }}>
                      {latest.grossMargin.toFixed(1)}%
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-[10px]" style={{ color: '#9CA3AF' }}>No financial data available</div>
              )}
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] p-[14px]">
            <div className="mb-3">
              <div className="text-[12px] mb-1" style={{ color: '#374151', fontWeight: 500 }}>Suggested Questions</div>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  className="w-full text-left px-3 py-2 border border-[#E5E7EB] rounded-md text-[10px] hover:bg-[#F9FAFB] transition-colors"
                  style={{ color: '#374151' }}
                  onClick={() => setMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[10px] flex flex-col">
          {/* Header */}
          <div className="border-b border-[#E5E7EB] p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#059669]" />
              <div>
                <div className="text-[12px]" style={{ color: '#374151', fontWeight: 500 }}>CFO Agent</div>
                <div className="text-[9px]" style={{ color: '#9CA3AF' }}>AI-powered financial assistant · Claude</div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F9FAFB' }}>
            {/* Welcome message */}
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                style={{ backgroundColor: '#EBF0FF', color: '#1A56DB', fontWeight: 600 }}
              >
                AI
              </div>
              <ChatBubble type="ai">
                Hi! I'm your CFO agent. I can help you understand your financials, run scenarios,
                and provide strategic guidance grounded in your live data. What would you like to know?
              </ChatBubble>
            </div>

            {/* Conversation history */}
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                    style={{ backgroundColor: '#EBF0FF', color: '#1A56DB', fontWeight: 600 }}
                  >
                    AI
                  </div>
                )}
                <ChatBubble type={msg.role === 'user' ? 'user' : 'ai'}>{msg.content}</ChatBubble>
                {msg.role === 'user' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white flex-shrink-0"
                    style={{ backgroundColor: '#1A56DB', fontWeight: 600 }}
                  >
                    U
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{ backgroundColor: '#EBF0FF', color: '#1A56DB', fontWeight: 600 }}
                >
                  AI
                </div>
                <ChatBubble type="ai">
                  <span className="animate-pulse">Thinking…</span>
                </ChatBubble>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#E5E7EB] p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ask about your financials..."
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1A56DB]"
                style={{ color: '#374151' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
              />
              <button
                className="px-4 h-[34px] rounded-md text-white flex items-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#1A56DB' }}
                onClick={sendMessage}
                disabled={loading}
              >
                <Send size={14} />
              </button>
            </div>
            <div className="mt-2 text-center text-[8px]" style={{ color: '#9CA3AF' }}>
              Powered by RAG + Claude · All responses grounded in your data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
