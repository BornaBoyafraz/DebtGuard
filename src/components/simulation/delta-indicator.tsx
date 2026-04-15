import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeltaIndicatorProps {
  value: number;
  label: string;
  format: (v: number) => string;
  invertColors?: boolean;
}

export function DeltaIndicator({ value, label, format, invertColors }: DeltaIndicatorProps) {
  const isPositive = invertColors ? value < 0 : value > 0;
  const isNegative = invertColors ? value > 0 : value < 0;
  const isNeutral = value === 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center',
          isPositive && 'bg-success-subtle',
          isNegative && 'bg-danger-subtle',
          isNeutral && 'bg-surface-elevated'
        )}
      >
        {isPositive && <TrendingUp className="w-3.5 h-3.5 text-success" />}
        {isNegative && <TrendingDown className="w-3.5 h-3.5 text-danger" />}
        {isNeutral && <Minus className="w-3.5 h-3.5 text-text-muted" />}
      </div>
      <div>
        <p
          className={cn(
            'text-sm font-semibold',
            isPositive && 'text-success',
            isNegative && 'text-danger',
            isNeutral && 'text-text-muted'
          )}
        >
          {format(value)}
        </p>
        <p className="text-[10px] text-text-muted">{label}</p>
      </div>
    </div>
  );
}
