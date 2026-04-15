'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_MESSAGES: DemoMessage[] = [
  {
    role: 'assistant',
    content: "Hi! I'm DebtGuard's AI Advisor. Ask me anything about debt, budgeting, or financial planning — I'll show you how I think about money.",
  },
];

const DEMO_PROMPTS = [
  "How does the debt avalanche method work?",
  "Should I pay off debt or build savings first?",
  "What is a good debt-to-income ratio?",
  "How do I know if my interest rate is too high?",
];

export function AIDemoSection() {
  const [messages, setMessages] = useState<DemoMessage[]>(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_DEMO_MSGS = 3;

  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || msgCount >= MAX_DEMO_MSGS) return;

    const userMsg: DemoMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setMsgCount(prev => prev + 1);

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error();
      const reader = res.body?.getReader();
      if (!reader) throw new Error();

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const text = accumulated;
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: text };
          return copy;
        });
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: 'Unable to connect. Sign up to use the full AI Advisor.' };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const isAtLimit = msgCount >= MAX_DEMO_MSGS;

  return (
    <section id="ai-demo" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-4"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Try the AI Advisor</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Ask anything about your finances.
          </h2>
          <p className="mt-4 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            DebtGuard&apos;s AI is trained specifically on debt management, risk analysis, and financial simulation — not generic advice.
          </p>
        </div>

        {/* Chat demo */}
        <div className="rounded-2xl border overflow-hidden shadow-2xl"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: '0 25px 50px -12px rgba(255,224,194,0.15)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,224,194,0.1)', border: '1px solid rgba(255,224,194,0.2)' }}>
              <Bot className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>DebtGuard AI Advisor</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Financial intelligence · Demo mode</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live</span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-5 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  msg.role === 'user' ? 'bg-accent' : '')}
                  style={msg.role === 'assistant' ? { background: 'rgba(255,224,194,0.1)', border: '1px solid rgba(255,224,194,0.2)' } : {}}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-accent-foreground" />
                    : <Bot className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  }
                </div>
                <div className={cn('max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm',
                  msg.role === 'user' ? 'bg-accent text-accent-foreground rounded-tr-none' : 'rounded-tl-none border')}
                  style={msg.role === 'assistant' ? { background: 'var(--surface-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' } : {}}>
                  {msg.content || (
                    <div className="flex gap-1 items-center h-4">
                      {[0,1,2].map(j => (
                        <span key={j} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                          style={{ animationDelay: `${j*150}ms`, animationDuration: '900ms' }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {!isAtLimit && msgCount === 0 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {DEMO_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-accent/40 hover:text-accent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-elevated)' }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
            {isAtLimit ? (
              <div className="text-center py-2">
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                  Want the full AI Advisor with your personal data?
                </p>
                <a href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-accent-foreground transition-all"
                  style={{ background: 'var(--accent)' }}>
                  <Sparkles className="w-4 h-4" />
                  Get Full Access — Free
                </a>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2.5">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a financial question…"
                  disabled={isStreaming}
                  className="flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 transition-all"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                />
                <button type="submit" disabled={!input.trim() || isStreaming}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-accent-foreground transition-all disabled:opacity-40 shrink-0"
                  style={{ background: 'var(--accent)' }}>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
            {!isAtLimit && (
              <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
                {MAX_DEMO_MSGS - msgCount} demo message{MAX_DEMO_MSGS - msgCount !== 1 ? 's' : ''} remaining · Sign up for unlimited access
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
