'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@/lib/types';

interface UIStore {
  theme: ThemeMode;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  ariaChatOpen: boolean;
  ariaChatUnread: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAriaChatOpen: (open: boolean) => void;
  toggleAriaChat: () => void;
  setAriaChatUnread: (unread: boolean) => void;
}

function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(systemDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

// UI store keeps theme in localStorage (intentional — UX preference, not user data)
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: false,
      commandPaletteOpen: false,
      ariaChatOpen: false,
      ariaChatUnread: false,

      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setAriaChatOpen: (open) => set({ ariaChatOpen: open }),
      toggleAriaChat: () => set((state) => ({ ariaChatOpen: !state.ariaChatOpen })),
      setAriaChatUnread: (unread) => set({ ariaChatUnread: unread }),
    }),
    {
      name: 'debtguard-ui',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyThemeClass(state.theme);
      },
    }
  )
);
