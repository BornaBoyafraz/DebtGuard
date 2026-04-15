import { createClient } from '@/lib/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatSession {
  sessionId: string;
  firstMessage: string;
  messageCount: number;
  createdAt: string;
}

interface DbChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  context_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export async function getChatSession(
  userId: string,
  sessionId: string
): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as DbChatMessage[]).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function saveChatMessage(
  userId: string,
  sessionId: string,
  message: ChatMessage,
  contextSnapshot?: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();
  await supabase.from('chat_messages').insert({
    id: message.id,
    user_id: userId,
    session_id: sessionId,
    role: message.role,
    content: message.content,
    context_snapshot: contextSnapshot ?? null,
    created_at: message.createdAt,
  });
}

export async function clearChatSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId);
}

export async function getChatHistory(userId: string): Promise<ChatSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('session_id, content, created_at, role')
    .eq('user_id', userId)
    .eq('role', 'user')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Group by session_id
  const sessions = new Map<
    string,
    { firstMessage: string; messageCount: number; createdAt: string }
  >();

  for (const row of data as Array<{
    session_id: string;
    content: string;
    created_at: string;
    role: string;
  }>) {
    const existing = sessions.get(row.session_id);
    if (!existing) {
      sessions.set(row.session_id, {
        firstMessage: row.content,
        messageCount: 1,
        createdAt: row.created_at,
      });
    } else {
      sessions.set(row.session_id, {
        ...existing,
        messageCount: existing.messageCount + 1,
      });
    }
  }

  return Array.from(sessions.entries()).map(([sessionId, val]) => ({
    sessionId,
    ...val,
  }));
}
