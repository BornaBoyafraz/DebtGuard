'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSimulations,
  saveSimulation,
  deleteSimulation,
  deleteAllSimulations,
  getSimulationById,
} from '@/lib/db/simulations';
import { useSimulationStore } from '@/store/simulation-store';
import { useAuthContext } from '@/contexts/auth-context';
import type { SimulationResult } from '@/lib/types';

export function useSimulations() {
  const { user } = useAuthContext();
  const { history, saveToHistory, deleteFromHistory, clearHistory } =
    useSimulationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getSimulations(user.id)
      .then((results) => {
        clearHistory();
        results.forEach((r) => saveToHistory(r));
      })
      .catch((e: unknown) => {
        const message =
          e instanceof Error ? e.message : 'Failed to load simulations';
        setError(message);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const save = useCallback(
    async (result: SimulationResult): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };
      saveToHistory(result);
      const res = await saveSimulation(user.id, result);
      if (res.error) {
        setError(res.error);
        deleteFromHistory(result.id); // rollback optimistic update
      }
      return res;
    },
    [user, saveToHistory, deleteFromHistory]
  );

  const remove = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };
      deleteFromHistory(id);
      const res = await deleteSimulation(user.id, id);
      if (res.error) setError(res.error);
      return res;
    },
    [user, deleteFromHistory]
  );

  const removeAll = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    clearHistory();
    const res = await deleteAllSimulations(user.id);
    if (res.error) setError(res.error);
    return res;
  }, [user, clearHistory]);

  const getById = useCallback(
    async (id: string): Promise<SimulationResult | null> => {
      if (!user) return null;
      return getSimulationById(user.id, id);
    },
    [user]
  );

  return { simulations: history, isLoading, error, save, remove, removeAll, getById };
}
