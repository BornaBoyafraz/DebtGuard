'use client';

import { ScenarioBuilder } from '@/components/simulation/scenario-builder';
import { SimulationResults } from '@/components/simulation/simulation-results';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useSimulation } from '@/hooks/use-simulation';
import { useSimulationStore } from '@/store/simulation-store';
import { FlaskConical } from 'lucide-react';

export default function SimulatePage() {
  const { execute, isReady } = useSimulation();
  const { currentSimulation, isRunning } = useSimulationStore();

  const handleRun = async () => {
    await execute();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-[400px_1fr] gap-8">
        <div className="lg:sticky lg:top-0 lg:self-start">
          <ScenarioBuilder
            onRun={handleRun}
            loading={isRunning}
            disabled={!isReady}
          />
        </div>
        <div className="min-w-0">
          {isRunning || currentSimulation ? (
            <ErrorBoundary label="Simulation results failed to render">
              <SimulationResults
                result={currentSimulation}
                loading={isRunning}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <EmptyState
                icon={<FlaskConical className="w-8 h-8" />}
                title="Ready to Simulate"
                description="Configure your scenario on the left and hit &ldquo;Run Simulation&rdquo; to see how your financial future changes. Or try a preset to get started quickly."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
