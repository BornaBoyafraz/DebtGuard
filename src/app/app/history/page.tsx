'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScenarioCard } from '@/components/history/scenario-card';
import { HistoryTimeline } from '@/components/history/history-timeline';
import { HistoryEmptyState } from '@/components/history/history-empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SimulationResults } from '@/components/simulation/simulation-results';
import { Skeleton } from '@/components/ui/skeleton';
import { useSimulationStore } from '@/store/simulation-store';
import { useSimulations } from '@/hooks/use-simulations';
import { useAuthContext } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import type { SimulationResult } from '@/lib/types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export default function HistoryPage() {
  const { user } = useAuthContext();
  const { history, saveToHistory, deleteFromHistory } = useSimulationStore();
  const { isLoading, remove } = useSimulations();
  const { toast } = useToast();
  const [viewingResult, setViewingResult] = useState<SimulationResult | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await remove(id);
    if (error) {
      toast('Failed to delete simulation. Try again.', 'error');
    } else {
      toast('Simulation removed from history.', 'info');
    }
  };

  // Real-time sync: if user saves a simulation in another tab, it appears here
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const channel = supabase
      .channel('simulations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const row = payload.new as Record<string, unknown>;
            const incoming: SimulationResult = {
              id: row.id as string,
              config: row.scenario_config as SimulationResult['config'],
              profile: row.financial_profile as SimulationResult['profile'],
              baseline: row.baseline_path as SimulationResult['baseline'],
              scenario: row.scenario_path as SimulationResult['scenario'],
              summary: row.summary as SimulationResult['summary'],
              createdAt: row.created_at as string,
            };
            saveToHistory(incoming);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            deleteFromHistory((payload.old as { id: string }).id);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, saveToHistory, deleteFromHistory]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      {history.length === 0 ? (
        <HistoryEmptyState />
      ) : (
        <div>
          <HistoryTimeline history={history} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ScenarioCard
                  result={result}
                  onView={setViewingResult}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!viewingResult} onOpenChange={() => setViewingResult(null)}>
        {viewingResult && (
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingResult.config.label}</DialogTitle>
            </DialogHeader>
            <SimulationResults result={viewingResult} loading={false} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
