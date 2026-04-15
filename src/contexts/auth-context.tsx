'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const LOCAL_SESSION_KEY = 'dg_local_session';

interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'name'>>) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Memoize the supabase client so it's stable across renders
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data as Profile);
    },
    [supabase]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local mode: restore session from localStorage
      // Defer state updates via microtask to satisfy react-hooks/set-state-in-effect
      Promise.resolve().then(() => {
        try {
          const stored = localStorage.getItem(LOCAL_SESSION_KEY);
          if (stored) {
            const p = JSON.parse(stored) as Profile;
            setProfile(p);
            setUser({
              id: 'local',
              email: p.email,
              user_metadata: { name: p.name },
              app_metadata: {},
              aud: 'authenticated',
              created_at: p.created_at,
            } as unknown as User);
          }
        } catch { /* ignore */ }
        setIsLoading(false);
      });
      return;
    }

    // Configured mode: use real Supabase auth
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id).finally(() => setIsLoading(false));
      else setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        const existing = stored ? (JSON.parse(stored) as Profile) : null;
        const localProfile: Profile = existing ?? {
          id: 'local',
          name: email.split('@')[0],
          email,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localProfile));
        setProfile(localProfile);
        setUser({
          id: 'local',
          email: localProfile.email,
          user_metadata: { name: localProfile.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: localProfile.created_at,
        } as unknown as User);
        return { error: null };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      if (!isSupabaseConfigured) {
        const localProfile: Profile = {
          id: 'local',
          name,
          email,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localProfile));
        setProfile(localProfile);
        setUser({
          id: 'local',
          email,
          user_metadata: { name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: localProfile.created_at,
        } as unknown as User);
        return { error: null };
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const logout = useCallback(async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setUser(null);
      setProfile(null);
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  }, [supabase]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<Profile, 'name'>>) => {
      if (!user) return { error: 'Not authenticated' };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (!error) setProfile((p) => (p ? { ...p, ...updates } : p));
      return { error: error?.message ?? null };
    },
    [supabase, user]
  );

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
