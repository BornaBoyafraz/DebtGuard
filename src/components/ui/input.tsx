'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string;
  helperText?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      prefix,
      suffix,
      icon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 flex items-center text-text-muted pointer-events-none">
              {icon}
            </span>
          )}
          {prefix && (
            <span
              className={cn(
                'absolute left-3 flex items-center text-sm text-text-muted pointer-events-none',
                icon && 'left-9'
              )}
            >
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full h-10 rounded-lg border bg-surface-elevated px-3 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
              error
                ? 'border-danger focus:ring-danger focus:border-danger'
                : 'border-border',
              icon && 'pl-9',
              prefix && !icon && 'pl-9',
              prefix && icon && 'pl-14',
              suffix && 'pr-10',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 flex items-center text-sm text-text-muted pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger mt-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-text-muted mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
