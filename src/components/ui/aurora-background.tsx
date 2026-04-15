'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  children?: ReactNode;
  className?: string;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  children,
  className,
  showRadialGradient = true,
}: AuroraBackgroundProps) {
  return (
    <div className={cn('relative flex flex-col min-h-screen w-full overflow-hidden bg-background', className)}>
      {/* Aurora layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Layer 1 — large warm peach blob top-left */}
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl animate-aurora-1"
          style={{ background: 'radial-gradient(circle, #ffe0c2 0%, #644a40 40%, transparent 70%)' }}
        />
        {/* Layer 2 — warm cream blob top-right */}
        <div
          className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-aurora-2"
          style={{ background: 'radial-gradient(circle, #ffdfb5 0%, #582d1d 40%, transparent 70%)' }}
        />
        {/* Layer 3 — warm mid-center */}
        <div
          className="absolute top-1/3 left-1/3 w-[600px] h-[400px] rounded-full opacity-10 blur-3xl animate-aurora-3"
          style={{ background: 'radial-gradient(circle, #ffe0c2 0%, #644a40 50%, transparent 70%)' }}
        />
        {/* Layer 4 — accent bottom */}
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full opacity-10 blur-3xl animate-aurora-1"
          style={{ background: 'radial-gradient(circle, #ffdfb5 0%, #644a40 50%, transparent 70%)', animationDelay: '3s' }}
        />
      </div>

      {/* Radial vignette to fade edges */}
      {showRadialGradient && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% -20%, transparent 40%, var(--background) 100%)',
          }}
        />
      )}

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
