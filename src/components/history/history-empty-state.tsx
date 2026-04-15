'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ClipboardList, FlaskConical } from 'lucide-react';

export function HistoryEmptyState() {
  return (
    <EmptyState
      icon={<ClipboardList className="w-8 h-8" />}
      title="No simulations saved yet."
      description="Run a scenario and save it to build your financial decision history."
      action={
        <Link href="/app/simulate">
          <Button className="gap-2">
            <FlaskConical className="w-4 h-4" />
            Go to Simulate
          </Button>
        </Link>
      }
    />
  );
}
