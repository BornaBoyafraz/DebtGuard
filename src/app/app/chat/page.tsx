'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Sparkles, User, ChevronRight, RefreshCw, TrendingDown, Shield, FlaskConical, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFinancialStore } from '@/store/financial-store';
import { useSimulationStore } from '@/store/simulation-store';
import { useAuthContext } from '@/contexts/auth-context';
import { useMemo } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const QUICK_PROMPTS = [
  { icon: Shield, text: 'Explain my current risk level', color: '#ffe0c2' },
  { icon: TrendingDown, text: 'How long until I\'m debt-free at current rate?', color: '#10b981' },
  { icon: FlaskConical, text: 'What scenario should I run first?', color: '#ffdfb5' },
  { icon: Sparkles, text: 'What\'s the single most impactful change I can make?', color: '#f59e0b' },
  { icon: MessageSquare, text: 'Explain my debt-to-income ratio', color: '#ffe0c2' },
  { icon: RefreshCw, text: 'Compare paying extra vs building savings', color: '#10b981' },
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser ? 'bg-accent' : 'bg-accent/10 border border-accent/20'
      )}>
        {isUser 
          ? <User className="w-4 h-4 text-accent-foreground" />
          : <Bot className="w-4 h-4 text-accent" />
        }
      </div>
      <div className={cn(
        'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-accent text-accent-foreground rounded-tr-none'
          : 'bg-surface-elevated border border-border text-text-primary rounded-tl-none'
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              code: ({ children }) => <code className="font-mono text-xs bg-black/10 rounded px-1">{children}</code>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
        <p className={cn('text-[10px] mt-1.5 opacity-60', isUser ? 'text-right' : 'text-left')}>
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

const COOKING_MESSAGES = [
  'Prepping your meal...',
  'Cooking up an answer...',
  'Seasoning the numbers...',
  'Plating your response...',
] as const;

function TypingDots() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((prev) => (prev + 1) % COOKING_MESSAGES.length), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-accent" />
      </div>
      <div className="bg-surface-elevated border border-border rounded-2xl rounded-tl-none px-4 py-3">
        <p className="text-sm text-text-muted italic">{COOKING_MESSAGES[idx]}</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  
  const { profile, riskAnalysis } = useFinancialStore();
  const { history } = useSimulationStore();
  const { user, profile: authProfile } = useAuthContext();

  const lastSimulation = history?.[0] ?? null;

  const context = useMemo(() => ({
    profile: profile ?? null,
    riskAnalysis: riskAnalysis ?? null,
    currentSimulation: lastSimulation
      ? { ...lastSimulation.summary, config: { label: lastSimulation.config.label } }
      : null,
    savedSimulationsCount: history?.length ?? 0,
  }), [profile, riskAnalysis, lastSimulation, history]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Greeting message on mount
  useEffect(() => {
    const name = authProfile?.name || user?.email?.split('@')[0] || 'there';
    const hasProfile = !!profile;
    const greeting = hasProfile
      ? `Hey ${name}! I've loaded your financial profile — I can see your income, debt, risk score, and any simulations you've run.\n\nAsk me anything. I can explain your numbers, reason through "what if" scenarios, or help you decide which simulation to run next.`
      : `Hey ${name}! I'm The Chef.\n\nTo get personalized analysis, head to the Dashboard and set up your financial profile. Once you've done that, I can analyze your specific situation, calculate your risk, and help you reason through financial decisions.\n\nFor now, I can answer general questions about debt management, budgeting, and financial planning.`;
    
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: greeting,
      createdAt: new Date(),
    }]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      createdAt: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          context,
          sessionId,
        }),
      });

      if (!res.ok) {
        let errContent = 'Something went wrong. Please try again.';
        if (res.status === 401) {
          errContent = 'Please log in to use the AI Advisor.';
        } else if (res.status === 503) {
          try {
            const errBody = await res.json() as { error?: string };
            if (errBody.error === 'ollama_not_running') {
              errContent = 'Ollama is not running. To use the AI Advisor, install Ollama at ollama.com, then run `ollama pull llama3.2` in your terminal.';
            }
          } catch { /* use default message */ }
        }
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: errContent } : m
        ));
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const finalAccumulated = accumulated;
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: finalAccumulated } : m
        ));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Something went wrong. Please try again.' }
          : m
      ));
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, context, sessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Main chat panel */}
      <div className="flex-1 flex flex-col bg-surface border border-border rounded-2xl overflow-hidden min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-surface-elevated/50">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">The Chef</h2>
            <p className="text-xs text-text-muted">Your financial decision modeling system</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-text-muted">Active</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === 'assistant' && 
           messages[messages.length - 1]?.content === '' && <TypingDots />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-surface-elevated/30">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances, risk, or scenarios…"
                rows={1}
                disabled={isStreaming}
                className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isStreaming}
              className="h-[42px] w-[42px] p-0 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[10px] text-text-muted mt-2 text-center">
            Educational tool only — not financial advice · Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-[280px] shrink-0 flex flex-col gap-4 hidden xl:flex">
        {/* Context card */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Current Context</h3>
          {profile ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Monthly income</span>
                <span className="text-text-primary font-medium">${profile.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Total debt</span>
                <span className="text-text-primary font-medium">${profile.totalDebt.toLocaleString()}</span>
              </div>
              {riskAnalysis && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Risk score</span>
                  <span className={cn('font-semibold',
                    riskAnalysis.level === 'low' ? 'text-success' :
                    riskAnalysis.level === 'medium' ? 'text-warning' : 'text-danger'
                  )}>
                    {riskAnalysis.score}/100 ({riskAnalysis.level.toUpperCase()})
                  </span>
                </div>
              )}
              {lastSimulation && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Last sim score</span>
                  <span className="text-text-primary font-medium">{lastSimulation.summary.decisionScore}/100</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-muted">No profile loaded. Set up your profile on the Dashboard to get personalized AI analysis.</p>
          )}
        </div>

        {/* Quick prompts */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex-1">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Quick Prompts</h3>
          <div className="space-y-2">
            {QUICK_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.text}
                  onClick={() => sendMessage(prompt.text)}
                  disabled={isStreaming}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: prompt.color }} />
                  <span className="flex-1 leading-snug">{prompt.text}</span>
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
