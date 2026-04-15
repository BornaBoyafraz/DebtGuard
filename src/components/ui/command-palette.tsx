'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  History,
  Settings2,
  Plus,
  Palette,
  LogOut,
  Search,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

interface CommandItem {
  label: string;
  icon: typeof LayoutDashboard;
  shortcut?: string;
  onSelect: () => void;
}

function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, theme, setTheme } =
    useUIStore();
  const { logout } = useAuthStore();
  const isOpenRef = useRef(commandPaletteOpen);
  // Sync ref in an effect so we don't mutate it during render
  useEffect(() => {
    isOpenRef.current = commandPaletteOpen;
  });

  const close = useCallback(
    () => setCommandPaletteOpen(false),
    [setCommandPaletteOpen]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isOpenRef.current);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  const navigationItems: CommandItem[] = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      shortcut: 'G D',
      onSelect: () => {
        router.push('/app/dashboard');
        close();
      },
    },
    {
      label: 'Simulate',
      icon: FlaskConical,
      shortcut: 'G S',
      onSelect: () => {
        router.push('/app/simulate');
        close();
      },
    },
    {
      label: 'History',
      icon: History,
      shortcut: 'G H',
      onSelect: () => {
        router.push('/app/history');
        close();
      },
    },
    {
      label: 'Settings',
      icon: Settings2,
      shortcut: 'G ,',
      onSelect: () => {
        router.push('/app/settings');
        close();
      },
    },
  ];

  const actionItems: CommandItem[] = [
    {
      label: 'New Simulation',
      icon: Plus,
      shortcut: 'N',
      onSelect: () => {
        router.push('/app/simulate');
        close();
      },
    },
    {
      label: 'Toggle Theme',
      icon: Palette,
      shortcut: 'T',
      onSelect: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        close();
      },
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      onSelect: () => {
        logout();
        router.push('/login');
        close();
      },
    },
  ];

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div className="relative max-w-lg mx-auto mt-[20vh]">
        <Command
          className={cn(
            'bg-surface border border-border rounded-xl shadow-2xl overflow-hidden'
          )}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
        >
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 text-text-muted shrink-0" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex-1 h-12 bg-transparent px-3 text-sm text-text-primary placeholder:text-text-muted outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-muted font-mono">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-text-muted">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted"
            >
              {navigationItems.map((item) => (
                <Command.Item
                  key={item.label}
                  onSelect={item.onSelect}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-text-secondary rounded-md cursor-pointer select-none data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
                >
                  <item.icon className="h-4 w-4 text-text-muted" />
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="text-[10px] text-text-muted font-mono bg-surface-elevated border border-border rounded px-1.5 py-0.5">
                      {item.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-border" />

            <Command.Group
              heading="Actions"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted"
            >
              {actionItems.map((item) => (
                <Command.Item
                  key={item.label}
                  onSelect={item.onSelect}
                  className="flex items-center gap-3 px-2 py-2.5 text-sm text-text-secondary rounded-md cursor-pointer select-none data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
                >
                  <item.icon className="h-4 w-4 text-text-muted" />
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="text-[10px] text-text-muted font-mono bg-surface-elevated border border-border rounded px-1.5 py-0.5">
                      {item.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

export { CommandPalette };
