'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useId,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, X, Send, Bot, Clock, Trash2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFinancialStore } from '@/store/financial-store';
import { useSimulationStore } from '@/store/simulation-store';
import { useAuthContext } from '@/contexts/auth-context';
import { useChatMessages } from '@/hooks/use-chat-messages';
import type { ChatSession } from '@/lib/db/chat-messages';
import type { FinancialProfile, RiskAnalysis, SimulationSummary, ScenarioConfig } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface FinancialContext {
  profile: FinancialProfile | null;
  riskAnalysis: RiskAnalysis | null;
  currentSimulation: (SimulationSummary & { config?: Pick<ScenarioConfig, 'label'> }) | null;
  savedSimulationsCount: number;
  userName: string;
}

const COOKING_MESSAGES = [
  'Prepping your meal...',
  'Cooking up an answer...',
  'Seasoning the numbers...',
  'Plating your response...',
] as const;

function TypingIndicator() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((prev) => (prev + 1) % COOKING_MESSAGES.length), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-accent" />
      </div>
      <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-none px-4 py-3">
        <p className="text-sm text-text-muted italic">{COOKING_MESSAGES[idx]}</p>
      </div>
    </div>
  );
}

function ContextPill({ context }: { context: FinancialContext }) {
  if (!context.profile && !context.riskAnalysis) return null;

  const riskColorClass =
    context.riskAnalysis?.level === 'critical'
      ? 'text-danger'
      : context.riskAnalysis?.level === 'high'
        ? 'text-warning'
        : 'text-text-muted';

  return (
    <div className="px-4 py-1.5 border-b border-border bg-surface/60 flex items-center gap-1.5 overflow-hidden">
      {context.profile && (
        <span className="text-[11px] text-text-muted shrink-0">Profile loaded</span>
      )}
      {context.riskAnalysis && (
        <>
          {context.profile && <span className="text-[11px] text-border">·</span>}
          <span className={`text-[11px] font-medium shrink-0 ${riskColorClass}`}>
            Risk: {context.riskAnalysis.level.toUpperCase()} {context.riskAnalysis.score}
          </span>
        </>
      )}
      {context.currentSimulation?.config?.label && (
        <>
          <span className="text-[11px] text-border">·</span>
          <span className="text-[11px] text-text-muted truncate">
            Last sim: {context.currentSimulation.config.label}
          </span>
        </>
      )}
    </div>
  );
}

const QUICK_SIMULATIONS: readonly string[] = [
  'What if I pay $200 extra per month?',
  'Show me a refinance at 8% APR',
  'What happens if I lose $500/mo in income?',
] as const;

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-text-primary">{children}</strong>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>
        ),
        li: ({ children }) => <li className="text-sm">{children}</li>,
        code: ({ children }) => (
          <code className="font-mono text-xs bg-black/10 rounded px-1">{children}</code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function getContextQuickPrompts(ctx: FinancialContext): string[] {
  const prompts: string[] = [];
  if (ctx.riskAnalysis && (ctx.riskAnalysis.level === 'high' || ctx.riskAnalysis.level === 'critical')) {
    prompts.push(`Why is my risk score ${ctx.riskAnalysis.score}?`);
  }
  if (ctx.profile && ctx.profile.totalDebt > 0) {
    prompts.push('How long until I\'m debt-free?');
  }
  if (ctx.profile) {
    const cashflow = ctx.profile.income - ctx.profile.expenses - ctx.profile.minimumPayment;
    if (cashflow < 0) prompts.push('My cashflow is negative. What should I do?');
  }
  if (ctx.currentSimulation) {
    prompts.push('Was my last simulation a good decision?');
  }
  prompts.push('What should I simulate first?', 'Explain my payment burden');
  return prompts.slice(0, 5);
}

function EmptyState({ context, onQuickPrompt }: { context: FinancialContext; onQuickPrompt: (p: string) => void }) {
  const prompts = useMemo(() => getContextQuickPrompts(context), [context]);

  let subtitle = 'Start by setting up your financial profile in the dashboard, then I can analyze your specific situation.';
  if (context.profile && !context.currentSimulation) {
    subtitle = `I have your financial profile loaded. I can see your risk level is ${context.riskAnalysis?.level ?? 'unknown'}. What would you like to understand?`;
  } else if (context.currentSimulation) {
    subtitle = `I can see your last simulation scored ${context.currentSimulation.decisionScore}/100. Want me to explain what this means or suggest what to try next?`;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
          <Bot className="w-5 h-5 text-accent" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1.5">
          Hi {context.userName}. I&apos;m The Chef.
        </p>
        <p className="text-xs text-text-muted leading-relaxed max-w-[280px]">{subtitle}</p>
      </div>
      <div className="space-y-3 pb-2">
        <div className="space-y-1.5">
          <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider px-1">
            Quick prompts
          </p>
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onQuickPrompt(prompt)}
              className="w-full text-left text-xs text-text-secondary hover:text-text-primary bg-surface hover:bg-surface-elevated border border-border rounded-lg px-3 py-2 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
        {context.profile && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-wider px-1">
              Quick simulations
            </p>
            {QUICK_SIMULATIONS.map((sim) => (
              <button
                key={sim}
                onClick={() => onQuickPrompt(sim)}
                className="w-full text-left text-xs text-text-secondary hover:text-text-primary bg-surface hover:bg-surface-elevated border border-border rounded-lg px-3 py-2 transition-colors cursor-pointer"
              >
                {sim}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryView({
  sessions,
  onSelectSession,
  onBack,
}: {
  sessions: ChatSession[];
  onSelectSession: (sessionId: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <button onClick={onBack} className="text-text-muted hover:text-text-secondary cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">Chat History</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-text-muted">No previous sessions</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map((s) => (
              <button
                key={s.sessionId}
                onClick={() => onSelectSession(s.sessionId)}
                className="w-full text-left px-4 py-3 hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                <p className="text-xs text-text-primary truncate">{s.firstMessage}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-text-muted" />
                  <span className="text-[10px] text-text-muted">
                    {new Date(s.createdAt).toLocaleDateString()} · {s.messageCount} messages
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FloatingChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const sessionId = useId();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { profile, riskAnalysis } = useFinancialStore();
  const { currentSimulation, history } = useSimulationStore();
  const { profile: authProfile } = useAuthContext();
  const chatPersist = useChatMessages();

  const context: FinancialContext = useMemo(
    () => ({
      profile,
      riskAnalysis,
      currentSimulation: currentSimulation
        ? {
            ...currentSimulation.summary,
            config: { label: currentSimulation.config.label },
          }
        : null,
      savedSimulationsCount: history.length,
      userName: authProfile?.name ?? 'there',
    }),
    [profile, riskAnalysis, currentSimulation, history, authProfile]
  );

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [input]);

  const loadHistory = useCallback(async () => {
    const sessions = await chatPersist.getHistory();
    setChatSessions(sessions);
  }, [chatPersist]);

  const handleOpenHistory = useCallback(async () => {
    await loadHistory();
    setShowHistory(true);
  }, [loadHistory]);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isStreaming) return;

      setInput('');

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent('');

      abortRef.current = new AbortController();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context,
            sessionId,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent(null);

        // Persist in background
        void chatPersist.save(sessionId, userMsg);
        void chatPersist.save(sessionId, assistantMsg);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setStreamingContent(null);
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [input, isStreaming, messages, context, sessionId, chatPersist]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent(null);
    setIsStreaming(false);
    void chatPersist.clear(sessionId);
  }, [chatPersist, sessionId]);

  const handleSelectSession = useCallback((_sessionId: string) => {
    // Could load the session messages here; for now just close history
    setShowHistory(false);
  }, []);

  const canSend = input.trim().length > 0 && !isStreaming;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer',
          isOpen
            ? 'bg-surface-elevated border border-border text-text-secondary'
            : 'bg-accent text-accent-foreground'
        )}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 32, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 32, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className={cn(
              'fixed z-50 bg-background border border-border shadow-2xl flex flex-col',
              'bottom-20 right-5 w-[420px] h-[580px] rounded-2xl',
              'max-sm:inset-0 max-sm:bottom-0 max-sm:right-0 max-sm:w-full max-sm:h-full max-sm:rounded-none'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-accent" />
                  {isStreaming && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary leading-none">
                    The Chef
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-none">
                    {profile ? 'Profile loaded' : 'No profile configured'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="p-1.5 text-text-muted hover:text-danger transition-colors cursor-pointer rounded"
                    title="Clear chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={handleOpenHistory}
                  className="p-1.5 text-text-muted hover:text-text-secondary transition-colors cursor-pointer rounded"
                  title="Chat history"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-secondary transition-colors cursor-pointer rounded"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Context indicator */}
            {!showHistory && <ContextPill context={context} />}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              {showHistory ? (
                <HistoryView
                  sessions={chatSessions}
                  onSelectSession={handleSelectSession}
                  onBack={() => setShowHistory(false)}
                />
              ) : messages.length === 0 && !streamingContent ? (
                <EmptyState context={context} onQuickPrompt={(p) => void handleSend(p)} />
              ) : (
                <div className="space-y-1">
                  {messages.map((message) => {
                    const isUser = message.role === 'user';
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex items-end gap-2 mb-3',
                          isUser ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mb-0.5">
                            <Bot className="w-3.5 h-3.5 text-accent" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                            isUser
                              ? 'bg-accent text-accent-foreground rounded-br-none'
                              : 'bg-surface-elevated border border-border text-text-primary rounded-bl-none'
                          )}
                        >
                          {isUser ? (
                            message.content.split('\n').map((line, i, arr) => (
                              <span key={i}>
                                {line}
                                {i < arr.length - 1 && <br />}
                              </span>
                            ))
                          ) : (
                            <MarkdownMessage content={message.content} />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isStreaming && streamingContent === '' && <TypingIndicator />}

                  {streamingContent !== null && streamingContent !== '' && (
                    <div className="flex items-end gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mb-0.5">
                        <Bot className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div className="max-w-[78%] rounded-2xl rounded-bl-none px-3.5 py-2.5 text-sm leading-relaxed bg-surface-elevated border border-border text-text-primary">
                        <MarkdownMessage content={streamingContent} />
                        <span className="inline-block w-1.5 h-3.5 bg-accent ml-0.5 animate-pulse rounded-sm" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            {!showHistory && (
              <div className="shrink-0 px-3 pb-3 pt-2 border-t border-border">
                <div className="flex items-end gap-2 bg-surface rounded-xl border border-border px-3 py-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isStreaming}
                    placeholder="Ask about your finances..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted resize-none outline-none leading-relaxed disabled:opacity-50 max-h-[120px] overflow-y-auto"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!canSend}
                    className="w-7 h-7 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted/50 mt-1 text-center">
                  Powered by The Chef
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 text-center">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
