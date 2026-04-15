'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { CommandPalette } from '@/components/ui/command-palette';
import { FloatingChatPanel } from '@/components/chat/floating-chat-panel';
import { useAuthContext } from '@/contexts/auth-context';
import { useAuthStore } from '@/store/auth-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthContext();
  const { setUser } = useAuthStore();
  const router = useRouter();

  // Sync Supabase user into Zustand store for legacy component compat
  useEffect(() => {
    if (user && profile) {
      setUser({ id: user.id, name: profile.name, email: profile.email });
    } else if (!user && !isLoading) {
      setUser(null);
    }
  }, [user, profile, isLoading, setUser]);

  // Redirect unauthenticated users (belt-and-suspenders with middleware)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      {children}
      <CommandPalette />
      <FloatingChatPanel />
    </AppShell>
  );
}
