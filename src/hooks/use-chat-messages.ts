'use client';

import { useCallback } from 'react';
import {
  saveChatMessage,
  clearChatSession,
  getChatHistory,
  type ChatMessage,
  type ChatSession,
} from '@/lib/db/chat-messages';
import { useAuthContext } from '@/contexts/auth-context';

export function useChatMessages() {
  const { user } = useAuthContext();

  const save = useCallback(
    async (
      sessionId: string,
      message: ChatMessage,
      contextSnapshot?: Record<string, unknown>
    ): Promise<void> => {
      if (!user) return;
      await saveChatMessage(user.id, sessionId, message, contextSnapshot);
    },
    [user]
  );

  const clear = useCallback(
    async (sessionId: string): Promise<void> => {
      if (!user) return;
      await clearChatSession(user.id, sessionId);
    },
    [user]
  );

  const getHistory = useCallback(async (): Promise<ChatSession[]> => {
    if (!user) return [];
    return getChatHistory(user.id);
  }, [user]);

  return { save, clear, getHistory };
}
