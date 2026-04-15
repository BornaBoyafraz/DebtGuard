'use client';

import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  // Setters — called by AuthProvider to keep store in sync with Supabase session
  setUser: (user: User | null) => void;
  // Legacy compatibility — components can still call these but they no-op; auth goes through Supabase
  login: (name: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: user !== null }),

  login: (name, email) =>
    set({
      user: { id: crypto.randomUUID(), name, email },
      isAuthenticated: true,
    }),

  logout: () => set({ user: null, isAuthenticated: false }),
}));
