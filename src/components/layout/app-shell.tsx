'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { AriaChatPanel } from '@/components/chat/aria-chat-panel';

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/app/dashboard': { title: 'Dashboard', subtitle: 'Financial overview' },
  '/app/simulate': { title: 'Simulate', subtitle: 'Run scenarios' },
  '/app/chat': { title: 'AI Advisor', subtitle: 'Financial intelligence' },
  '/app/history': { title: 'History', subtitle: 'Past simulations' },
  '/app/settings': { title: 'Settings', subtitle: 'Preferences' },
};

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const pageInfo = pageTitles[pathname] ?? { title: 'DebtGuard' };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <AriaChatPanel />
    </div>
  );
}
