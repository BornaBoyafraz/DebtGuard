import type { FinancialProfile } from '@/lib/types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function sanitizeString(input: unknown, maxLength = 255): string {
  if (typeof input !== 'string') throw new ValidationError('Expected string');
  const trimmed = input.trim();
  if (trimmed.length === 0) throw new ValidationError('Input is empty');
  if (trimmed.length > maxLength) throw new ValidationError(`Input too long (max ${maxLength})`);
  // Remove null bytes and control characters
  return trimmed.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

export function sanitizeEmail(input: unknown): string {
  const s = sanitizeString(input, 254);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(s)) throw new ValidationError('Invalid email format');
  return s.toLowerCase();
}

export function sanitizeFinancialNumber(
  input: unknown,
  min = 0,
  max = 10_000_000
): number {
  const n = Number(input);
  if (!isFinite(n)) throw new ValidationError('Invalid number');
  if (n < min) throw new ValidationError(`Value below minimum (${min})`);
  if (n > max) throw new ValidationError(`Value above maximum (${max})`);
  return Math.round(n * 100) / 100;
}

export function sanitizeFinancialProfile(input: unknown): FinancialProfile {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Invalid financial profile');
  }
  const p = input as Record<string, unknown>;
  return {
    income: sanitizeFinancialNumber(p.income, 0, 1_000_000),
    expenses: sanitizeFinancialNumber(p.expenses, 0, 1_000_000),
    savings: sanitizeFinancialNumber(p.savings, 0, 10_000_000),
    totalDebt: sanitizeFinancialNumber(p.totalDebt, 0, 10_000_000),
    interestRate: sanitizeFinancialNumber(p.interestRate, 0, 100),
    minimumPayment: sanitizeFinancialNumber(p.minimumPayment, 0, 100_000),
  };
}

export function sanitizeChatMessage(input: unknown): string {
  const s = sanitizeString(input, 500);
  // Remove any HTML tags
  return s.replace(/<[^>]*>/g, '').trim();
}

export function checkBodySize(contentLength: string | null, maxBytes = 10_000): void {
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxBytes) throw new ValidationError(`Request too large (max ${maxBytes} bytes)`);
  }
}
