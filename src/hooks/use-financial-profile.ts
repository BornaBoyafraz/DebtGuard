'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFinancialProfile, upsertFinancialProfile } from '@/lib/db/financial-profiles';
import { useFinancialStore } from '@/store/financial-store';
import { useAuthContext } from '@/contexts/auth-context';
import type { FinancialProfile } from '@/lib/types';

export function useFinancialProfile() {
  const { user } = useAuthContext();
  const { profile, setProfile } = useFinancialStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase on mount — cleanup prevents state update on unmounted component
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    // Start loading via microtask to avoid synchronous setState-in-effect
    Promise.resolve().then(() => { if (mounted) setIsLoading(true); });
    getFinancialProfile(user.id)
      .then((p) => {
        if (mounted && p) setProfile(p);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        const message = e instanceof Error ? e.message : 'Failed to load profile';
        setError(message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [user, setProfile]);

  const save = useCallback(
    async (fp: FinancialProfile): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };
      setProfile(fp);
      const result = await upsertFinancialProfile(user.id, fp);
      if (result.error) setError(result.error);
      return result;
    },
    [user, setProfile]
  );

  const update = useCallback(
    async (partial: Partial<FinancialProfile>): Promise<{ error: string | null }> => {
      if (!user || !profile) return { error: 'No profile to update' };
      const updated = { ...profile, ...partial };
      return save(updated);
    },
    [user, profile, save]
  );

  return { profile, isLoading, error, save, update };
}
