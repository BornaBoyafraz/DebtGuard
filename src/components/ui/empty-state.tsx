import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  return typeof icon === 'function';
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-surface-elevated p-4">
          {isLucideIcon(icon) ? (
            (() => {
              const Icon = icon;
              return <Icon className="h-6 w-6 text-text-muted" />;
            })()
          ) : (
            <span className="text-text-muted">{icon}</span>
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
