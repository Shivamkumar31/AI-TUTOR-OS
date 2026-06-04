'use client';
import { useState, useEffect, useRef } from 'react';
import { sendMessage, getChatHistory } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Brain, User } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; }

const QUICK = [
  'Can you give me an example?',
  'I still don\'t understand.',
  'Why is this important?',
  'Can you make it simpler?',
  'How does this work in real life?',
];

export default function ChatPanel({ sessionId, lessonTitle }: { sessionId: string; lessonTitle: string }) {
  const [msgs,    setMsgs]    = useState<Msg[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [init,    setInit]    = useState(true);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHistory(); }, [sessionId]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const loadHistory = async () => {
    try {
      const r = await getChatHistory(sessionId);
      if (r.data.history?.length) {
        setMsgs(r.data.history);
      } else {
        setMsgs([{
          role: 'assistant',
          content: `Hi! I'm your AI tutor for "${lessonTitle}" 😊\n\nAsk me anything about this topic. I'll explain it in whatever way works best for you. You can also say:\n• "Give me a real example"\n• "Explain it even simpler"\n• "Test me with a question"\n\nWhat would you like to know?`,
        }]);
      }
    } finally { setInit(false); }
  };

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setMsgs(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    try {
      const r = await sendMessage(sessionId, msg);
      setMsgs(prev => [...prev, { role: 'assistant', content: r.data.reply }]);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to get reply.');
      setMsgs(prev => prev.slice(0, -1));
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="card rounded-t-2xl rounded-b-none p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">AI Tutor</p>
          <p className="text-slate-500 text-xs truncate max-w-xs">{lessonTitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Online · Groq (Free)
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 card rounded-none border-x border-slate-800">
        {init ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-brand-500' : 'bg-slate-700'}`}>
                  {m.role === 'user'
                    ? <User  className="w-4 h-4 text-white" />
                    : <Brain className="w-4 h-4 text-brand-400" />}
                </div>
                <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${m.role === 'user' ? 'bubble-user text-white' : 'bubble-ai text-slate-200'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-brand-400" />
                </div>
                <div className="bubble-ai px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="dot" /><div className="dot" /><div className="dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottom} />
          </>
        )}
      </div>

      {/* Quick buttons */}
      <div className="card border-x border-slate-800 rounded-none p-3">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {QUICK.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              className="flex-shrink-0 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 transition-all disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="card rounded-t-none rounded-b-2xl p-4 border-t border-slate-800">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about the lesson…"
            rows={1}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 self-end"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-slate-600 text-xs mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
