'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Send, ChevronLeft, Clock, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAriaContext } from '@/hooks/use-aria-context';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { generateFollowUps } from '@/lib/generate-followups';
import { AriaAvatar } from '@/components/chat/aria-avatar';
import type { AriaChatMessage, DebtGuardContext } from '@/lib/types';
import type { ChatSession } from '@/lib/db/chat-messages';

// ── Intro message generator ────────────────────────────────────────────────

function generateIntroMessage(ctx: DebtGuardContext): string {
  const name = ctx.userName;

  if (ctx.currentSimulation) {
    const { label, decisionScore, verdict } = ctx.currentSimulation;
    const isPositive = verdict === 'better' || verdict === 'significantly_better';
    return `Hi ${name}. I can see you've been running scenarios. Your last one — "${label}" — scored ${decisionScore}/100. ${isPositive ? "That's a solid improvement worth understanding." : "There may be a stronger approach worth exploring."} Want to dig into it or try a different angle?`;
  }

  if (!ctx.profile) {
    return `Hi ${name}. I'm The Chef — I'm here to help you understand your financial situation and think through decisions before you make them. To get started, I'll need your financial profile. Head to the Dashboard and fill in your details — it takes about 2 minutes. Once that's done, I can give you a real analysis of where you stand.`;
  }

  if (!ctx.riskAnalysis) {
    return `Hi ${name}. Your profile is set up. Run a risk analysis on the Dashboard and I'll be able to tell you exactly what's happening with your finances and what to watch.`;
  }

  const { score, level, drivers } = ctx.riskAnalysis;
  const topDriver = drivers[0]?.name ?? 'your key metrics';

  if (level === 'low') {
    return `Hi ${name}. Your finances look healthy right now — risk score ${score}/100. That's a good position to be in. The most valuable thing we can do from here is use the Simulator to stress-test your situation. Want to try a scenario?`;
  }
  if (level === 'medium') {
    return `Hi ${name}. Your current risk score is ${score}/100 — Medium territory. The biggest driver right now is your ${topDriver}. I can walk you through what that means and what would move the needle. Where do you want to start?`;
  }
  // high or critical
  return `Hi ${name}. Your risk score is ${score}/100 — that's ${level}. I want to be direct with you: ${topDriver} is the primary issue, and it's worth understanding before it compounds. Let's start there — want me to break down what's driving this?`;
}

// ── Context-aware quick prompt chips ──────────────────────────────────────

function generateContextChips(ctx: DebtGuardContext): string[] {
  const chips: string[] = [];

  if (ctx.riskAnalysis) {
    const { score, level } = ctx.riskAnalysis;
    if (level === 'high' || level === 'critical') {
      chips.push(`Why is my risk score ${score}?`);
      chips.push("What's the most urgent thing to fix?");
      if (ctx.indicators && ctx.indicators.savingsRunway < 12) {
        chips.push('How long until my savings run out?');
      }
    } else if (level === 'medium') {
      chips.push(`Why is my risk score ${score}?`);
    }
  }

  if (ctx.currentSimulation) {
    if (chips.length < 3) chips.push('Was my last simulation a good idea?');
    if (chips.length < 3) chips.push('What should I try next?');
  }

  if (ctx.indicators && ctx.indicators.cashflow < 0 && chips.length < 3) {
    chips.push('My cashflow is negative. What can I do?');
  }

  if (ctx.profile && !ctx.riskAnalysis && chips.length < 3) {
    chips.push('How long until my debt is paid off?');
  }

  // Always include this one
  if (!chips.includes('Walk me through my financial situation')) {
    chips.unshift('Walk me through my financial situation');
  }

  return chips.slice(0, 4);
}

// ── Relative timestamp ─────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

// ── Typing indicator ───────────────────────────────────────────────────────

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
      <AriaAvatar size="sm" className="mb-1 shrink-0" />
      <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-none px-4 py-3">
        <p className="text-sm text-text-muted italic">{COOKING_MESSAGES[idx]}</p>
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────

function AriaBubble({
  message,
  followUps,
  onFollowUp,
  isLast,
}: {
  message: AriaChatMessage;
  followUps?: string[];
  onFollowUp: (text: string) => void;
  isLast: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex mb-3', isUser ? 'flex-row-reverse' : 'flex-row', 'items-end gap-2')}>
      {!isUser && <AriaAvatar size="sm" className="mb-1 shrink-0" />}
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[85%]')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-accent text-accent-foreground rounded-br-none'
              : 'bg-surface-elevated border border-border text-text-primary rounded-bl-none'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-surface px-1 py-0.5 rounded text-xs font-mono text-accent">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <span className="text-[10px] text-text-muted mt-1 px-1">
          {formatRelativeTime(message.timestamp)}
        </span>
        {/* Follow-up chips below last Aria message */}
        {!isUser && isLast && followUps && followUps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {followUps.map((chip) => (
              <button
                key={chip}
                onClick={() => onFollowUp(chip)}
                className="text-[11px] px-3 py-1 rounded-full border border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Streaming bubble ───────────────────────────────────────────────────────

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      <AriaAvatar size="sm" isStreaming className="mb-1 shrink-0" />
      <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-none px-4 py-2.5 text-sm leading-relaxed text-text-primary max-w-[85%]">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          }}
        >
          {content}
        </ReactMarkdown>
        <span className="inline-block w-0.5 h-3.5 bg-text-secondary ml-0.5 animate-pulse align-middle" />
      </div>
    </div>
  );
}

// ── Context bar ────────────────────────────────────────────────────────────

function AriaContextBar({ ctx }: { ctx: DebtGuardContext }) {
  const hasProfile = !!ctx.profile;
  const risk = ctx.riskAnalysis;
  const sim = ctx.currentSimulation;

  const riskColorClass = risk
    ? risk.level === 'critical' || risk.level === 'high'
      ? 'text-danger'
      : risk.level === 'medium'
      ? 'text-warning'
      : 'text-success'
    : '';

  return (
    <div className="px-4 py-1.5 border-b border-border bg-surface/50 flex items-center gap-1.5 overflow-hidden shrink-0">
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          hasProfile ? 'bg-success' : 'bg-warning'
        )}
      />
      {hasProfile ? (
        <span className="text-[11px] text-text-muted truncate">
          Profile loaded
          {risk && (
            <>
              <span className="mx-1 text-border">·</span>
              <span className={cn('font-medium', riskColorClass)}>
                Risk: {risk.level.toUpperCase()} {risk.score}/100
              </span>
            </>
          )}
          {sim && (
            <>
              <span className="mx-1 text-border">·</span>
              <span className="text-text-muted">Last sim: {sim.label}</span>
            </>
          )}
        </span>
      ) : (
        <span className="text-[11px] text-warning truncate">
          No profile loaded — set up your profile first
        </span>
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({
  ctx,
  onChipClick,
}: {
  ctx: DebtGuardContext;
  onChipClick: (text: string) => void;
}) {
  const chips = generateContextChips(ctx);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
      <AriaAvatar size="lg" />
      <div className="space-y-1">
        <p className="text-base font-medium text-text-primary">Hi {ctx.userName}.</p>
        <p className="text-sm text-text-secondary leading-relaxed max-w-[280px]">
          {!ctx.profile
            ? "Before I can help, you'll need a financial profile. Head to the Dashboard and complete your setup — it takes about 2 minutes."
            : !ctx.riskAnalysis
            ? 'I have your profile. Run a risk analysis on the Dashboard and I\'ll tell you exactly where you stand.'
            : ctx.riskAnalysis.level === 'low'
            ? "Your finances look stable right now. Want to explore what scenarios could improve your position further?"
            : ctx.riskAnalysis.level === 'medium'
            ? `Your risk score is ${ctx.riskAnalysis.score}. There are a few specific things driving it. Want me to walk you through them?`
            : `Your risk score is ${ctx.riskAnalysis.score} — that's ${ctx.riskAnalysis.level}. Let's talk about what's causing it and what you can do.`}
        </p>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History view ───────────────────────────────────────────────────────────

function HistoryView({
  sessions,
  onBack,
  onSelectSession,
}: {
  sessions: ChatSession[];
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">Past conversations</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <Clock className="w-8 h-8 text-text-muted" />
            <p className="text-sm text-text-muted">Your past conversations with The Chef will appear here.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.sessionId}
              onClick={() => onSelectSession(session.sessionId)}
              className="w-full text-left p-3 rounded-lg border border-border hover:bg-surface-elevated transition-colors"
            >
              <p className="text-sm text-text-primary truncate">{session.firstMessage}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-text-muted">
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
                <span className="text-[11px] text-border">·</span>
                <span className="text-[11px] text-text-muted">
                  {session.messageCount} message{session.messageCount === 1 ? '' : 's'}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Neural trigger icon ────────────────────────────────────────────────────

function NeuralIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="11" cy="11" r="4" fill="white" fillOpacity="0.9" />
      <circle cx="11" cy="4" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="11" cy="18" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="4.5" cy="7.5" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="17.5" cy="7.5" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="4.5" cy="14.5" r="2" fill="white" fillOpacity="0.7" />
      <circle cx="17.5" cy="14.5" r="2" fill="white" fillOpacity="0.7" />
      <line x1="11" y1="6" x2="11" y2="7" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="11" y1="15" x2="11" y2="16" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="6.2" y1="8.3" x2="7.1" y2="9.2" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="14.9" y1="8.3" x2="14" y2="9.2" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="6.2" y1="13.7" x2="7.1" y2="12.8" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="14.9" y1="13.7" x2="14" y2="12.8" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function AriaChatPanel() {
  const { ariaChatOpen, setAriaChatOpen, ariaChatUnread, setAriaChatUnread } = useUIStore();
  const ctx = useAriaContext();
  const chatPersist = useChatMessages();

  const [messages, setMessages] = useState<AriaChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const [introSent, setIntroSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef('');

  // Cmd+J / Ctrl+J toggle
  const togglePanel = useCallback(() => {
    setAriaChatOpen(!ariaChatOpen);
  }, [ariaChatOpen, setAriaChatOpen]);

  useKeyboardShortcut('j', togglePanel, { meta: true });
  useKeyboardShortcut('j', togglePanel, { ctrl: true });

  // Send intro message on first open
  useEffect(() => {
    if (ariaChatOpen && !introSent && messages.length === 0) {
      setIntroSent(true);
      const intro: AriaChatMessage = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        role: 'assistant',
        content: generateIntroMessage(ctx),
        timestamp: new Date(),
      };
      setMessages([intro]);
    }
  }, [ariaChatOpen, introSent, messages.length, ctx]);

  // Mark unread as read when panel opens
  useEffect(() => {
    if (ariaChatOpen && ariaChatUnread) {
      setAriaChatUnread(false);
    }
  }, [ariaChatOpen, ariaChatUnread, setAriaChatUnread]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, isStreaming]);

  // Focus input when panel opens
  useEffect(() => {
    if (ariaChatOpen && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [ariaChatOpen, showHistory]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isStreaming) return;

      setInput('');
      setError(null);

      const safeId = () =>
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

      const userMsg: AriaChatMessage = {
        id: safeId(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingContent('');
      streamingContentRef.current = '';

      abortRef.current = new AbortController();

      const historyForApi = [...messages, userMsg]
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        // Brief "thinking" pause before response appears (feels more natural)
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 300);
          // Allow abort to cancel the delay
          abortRef.current?.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
          });
        });

        if (abortRef.current?.signal.aborted) {
          setIsStreaming(false);
          setStreamingContent('');
          return;
        }

        const res = await fetch('/api/aria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            context: ctx,
            conversationHistory: historyForApi,
            sessionId,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          throw new Error(res.status === 429 ? 'rate_limited' : 'error');
        }

        const data = await res.json() as { content: string; suggestedFollowUps?: string[] };
        const fullContent = data.content ?? '';

        // Typewriter effect — append one character every 15ms
        for (let i = 0; i <= fullContent.length; i++) {
          if (abortRef.current?.signal.aborted) break;
          streamingContentRef.current = fullContent.slice(0, i);
          setStreamingContent(streamingContentRef.current);
          if (i < fullContent.length) {
            await new Promise<void>((resolve) => setTimeout(resolve, 15));
          }
        }

        if (abortRef.current?.signal.aborted) {
          setIsStreaming(false);
          setStreamingContent('');
          return;
        }

        const assistantMsg: AriaChatMessage = {
          id: safeId(),
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');
        setIsStreaming(false);

        // Mark unread if panel is closed
        if (!ariaChatOpen) {
          setAriaChatUnread(true);
        }

        // Persist in background
        void chatPersist.save(sessionId, {
          id: userMsg.id,
          role: 'user',
          content: userMsg.content,
          createdAt: userMsg.timestamp.toISOString(),
        });
        void chatPersist.save(sessionId, {
          id: assistantMsg.id,
          role: 'assistant',
          content: assistantMsg.content,
          createdAt: assistantMsg.timestamp.toISOString(),
        });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setIsStreaming(false);
          setStreamingContent('');
          return;
        }
        setIsStreaming(false);
        setStreamingContent('');
        const isRateLimited = err instanceof Error && err.message === 'rate_limited';
        setError(
          isRateLimited
            ? 'You are sending messages too quickly. Please wait a moment and try again.'
            : 'Something went wrong. Please try again.'
        );
      }
    },
    [input, isStreaming, messages, ctx, sessionId, chatPersist, ariaChatOpen, setAriaChatUnread]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  const handleOpenHistory = useCallback(async () => {
    const history = await chatPersist.getHistory();
    setSessions(history);
    setShowHistory(true);
  }, [chatPersist]);

  const handleSelectSession = useCallback((_sid: string) => {
    // In a future iteration: load the selected session's messages
    setShowHistory(false);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      void sendMessage(lastUser.content);
    }
  }, [messages, sendMessage]);

  // Compute follow-ups for the last assistant message
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const followUps =
    lastAssistantMessage && !isStreaming
      ? generateFollowUps(lastAssistantMessage.content, ctx)
      : [];

  const hasMessages = messages.length > 0;
  const isMinimized = !ariaChatOpen;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setAriaChatOpen(true)}
        title="Talk to The Chef"
        className={cn(
          'fixed bottom-5 right-5 z-40 w-[52px] h-[52px] rounded-full bg-accent flex items-center justify-center shadow-lg transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
          ariaChatOpen && 'opacity-0 pointer-events-none',
          !ariaChatOpen && 'animate-ring-pulse'
        )}
        aria-label="Open The Chef"
      >
        <NeuralIcon />
        {ariaChatUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-danger rounded-full border-2 border-background" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {ariaChatOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setAriaChatOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300, duration: 0.35 }}
              className={cn(
                'fixed z-50 flex flex-col bg-surface border-l border-border shadow-2xl',
                // Mobile: full screen
                'inset-0',
                // Desktop: right panel
                'md:inset-auto md:top-14 md:bottom-0 md:right-0 md:w-[420px]'
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-elevated shrink-0">
                <AriaAvatar size="md" isStreaming={isStreaming} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary leading-none">The Chef</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Your Personal Finance Chef</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleOpenHistory}
                    title="History"
                    className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAriaChatOpen(false)}
                    title="Minimize"
                    className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      abortRef.current?.abort();
                      setAriaChatOpen(false);
                    }}
                    title="Close"
                    className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Context bar */}
              {!showHistory && <AriaContextBar ctx={ctx} />}

              {/* Body */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {showHistory ? (
                  <HistoryView
                    sessions={sessions}
                    onBack={() => setShowHistory(false)}
                    onSelectSession={handleSelectSession}
                  />
                ) : !hasMessages ? (
                  <EmptyState ctx={ctx} onChipClick={(t) => void sendMessage(t)} />
                ) : (
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {messages.map((msg, i) => {
                      const isLastAssistant =
                        msg.role === 'assistant' && i === messages.length - 1 && !isStreaming;
                      return (
                        <AriaBubble
                          key={msg.id}
                          message={msg}
                          followUps={isLastAssistant ? followUps : undefined}
                          onFollowUp={(t) => void sendMessage(t)}
                          isLast={isLastAssistant}
                        />
                      );
                    })}

                    {/* Streaming bubble */}
                    {isStreaming && streamingContent && (
                      <StreamingBubble content={streamingContent} />
                    )}

                    {/* Typing indicator (before first token) */}
                    {isStreaming && !streamingContent && <TypingIndicator />}

                    {/* Error state */}
                    {error && (
                      <div className="flex items-end gap-2 mb-3">
                        <AriaAvatar size="sm" className="mb-1 shrink-0" />
                        <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-none px-4 py-3 max-w-[85%]">
                          <p className="text-sm text-text-secondary">{error}</p>
                          <button
                            onClick={handleRetry}
                            className="mt-2 text-xs text-accent hover:text-accent-hover underline"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input area */}
              {!showHistory && (
                <div className="border-t border-border px-4 py-3 bg-surface-elevated shrink-0">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => {
                          if (e.target.value.length <= 500) {
                            setInput(e.target.value);
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask The Chef anything about your finances..."
                        disabled={isStreaming}
                        rows={1}
                        className={cn(
                          'w-full resize-none bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent transition-colors',
                          'min-h-[40px] max-h-[96px] overflow-y-auto',
                          isStreaming && 'opacity-50 cursor-not-allowed'
                        )}
                        style={{
                          height: 'auto',
                          lineHeight: '1.5',
                        }}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                        }}
                      />
                      {input.length > 450 && (
                        <span className="absolute bottom-1 right-2 text-[10px] text-text-muted">
                          {500 - input.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => void sendMessage()}
                      disabled={isStreaming || !input.trim()}
                      className={cn(
                        'w-9 h-9 rounded-full bg-accent flex items-center justify-center transition-all shrink-0',
                        'hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-surface-elevated',
                        (isStreaming || !input.trim()) && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <Send className="w-4 h-4 text-accent-foreground" />
                    </button>
                  </div>
                  {!isStreaming && (
                    <p className="text-[10px] text-text-muted mt-1.5 text-center">
                      Press Enter to send · Shift+Enter for new line · ⌘J to toggle
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}

// Re-export for sidebar unread indicator
export { type AriaChatMessage };
