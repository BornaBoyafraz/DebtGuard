'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/lib/types';

const themes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useUIStore();

  return (
    <div
      className={cn(
        'inline-flex items-center bg-surface-elevated rounded-lg p-1 gap-1',
        className
      )}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {themes.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer',
              isActive
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { ThemeToggle };
