'use client';

import { Menu } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { setSidebarOpen, setCommandPaletteOpen } = useUIStore();
  const { user } = useAuthStore();

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="h-14 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          {subtitle && (
            <span className="text-sm text-text-muted ml-2 hidden sm:inline">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Cmd+K hint */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center bg-surface-elevated text-text-muted text-xs px-2 py-0.5 rounded cursor-pointer hover:text-text-secondary transition-colors"
        >
          <kbd className="font-mono">&#8984;K</kbd>
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-accent text-xs font-semibold cursor-pointer">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
