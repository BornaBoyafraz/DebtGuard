'use client';

import { useCallback } from 'react';
import { useSimulationStore } from '@/store/simulation-store';
import { useFinancialStore } from '@/store/financial-store';
import { runSimulation } from '@/lib/simulation-engine';
import { useToast } from '@/components/ui/toast';

export function useSimulation() {
  const { setCurrentSimulation, setIsRunning, isRunning, currentSimulation } = useSimulationStore();
  const hasProfile = useFinancialStore((s) => !!s.profile);
  const { toast } = useToast();

  const execute = useCallback(async () => {
    // Read fresh state at call time to prevent stale-closure bugs.
    // This is critical for cases like horizon-button auto-rerun, where
    // the store is updated and execute() is called in the same event handler
    // before React re-renders (which would normally refresh the closure).
    const { scenarioConfig, stackedScenarios } = useSimulationStore.getState();
    const { profile } = useFinancialStore.getState();

    if (!profile) {
      toast('Set up your financial profile on the Dashboard first.', 'error');
      return null;
    }

    if (!scenarioConfig.label.trim()) {
      toast('Give your scenario a name before running.', 'error');
      return null;
    }

    setIsRunning(true);

    // UX delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const result = runSimulation(
      profile,
      scenarioConfig,
      stackedScenarios.length > 0 ? stackedScenarios : undefined
    );
    setCurrentSimulation(result);
    setIsRunning(false);
    toast('Simulation complete!', 'success');
    return result;
  }, [setCurrentSimulation, setIsRunning, toast]);

  return {
    runSimulation: execute,
    execute,
    isRunning,
    result: currentSimulation,
    isReady: hasProfile,
  };
}
