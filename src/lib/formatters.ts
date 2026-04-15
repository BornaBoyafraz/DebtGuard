import { RiskLevel, VerdictLevel } from './types';

export function formatCurrency(value: number, compact = false): string {
  const abs = Math.abs(value);

  if (compact && abs >= 1_000_000) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(abs);
    return value < 0 ? `-${formatted}` : formatted;
  }

  if (compact && abs >= 10_000) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(abs);
    return value < 0 ? `-${formatted}` : formatted;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMonths(months: number): string {
  if (months === 1) return '1 month';
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return years === 1 ? '1 year' : `${years} years`;
  return `${years === 1 ? '1 year' : `${years} years`}, ${remaining === 1 ? '1 month' : `${remaining} months`}`;
}

export function formatDelta(value: number, type: 'currency' | 'score' | 'percent'): string {
  const sign = value > 0 ? '+' : '';
  switch (type) {
    case 'currency':
      return `${sign}${formatCurrency(value)}`;
    case 'score':
      return `${sign}${value.toFixed(1)}`;
    case 'percent':
      return `${sign}${value.toFixed(1)}%`;
  }
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#e54d2e';
    case 'critical': return '#e54d2e';
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'rgba(16, 185, 129, 0.1)';
    case 'medium': return 'rgba(245, 158, 11, 0.1)';
    case 'high': return 'rgba(229, 77, 46, 0.1)';
    case 'critical': return 'rgba(229, 77, 46, 0.1)';
  }
}

export function getRiskBorderColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'rgba(16, 185, 129, 0.3)';
    case 'medium': return 'rgba(245, 158, 11, 0.3)';
    case 'high': return 'rgba(229, 77, 46, 0.3)';
    case 'critical': return 'rgba(229, 77, 46, 0.3)';
  }
}

export function getVerdictColor(verdict: VerdictLevel | string): string {
  switch (verdict) {
    case 'significantly_better': return '#10b981';
    case 'better': return '#10b981';
    case 'neutral': return '#b4b4b4';
    case 'worse': return '#f59e0b';
    case 'significantly_worse': return '#e54d2e';
    default: return '#b4b4b4';
  }
}

export function getDecisionScoreColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 55) return '#10b981';
  if (score >= 45) return '#f59e0b';
  if (score >= 30) return '#f59e0b';
  return '#e54d2e';
}

export function formatRunway(months: number): string {
  if (!isFinite(months) || months > 999) return 'Stable';
  if (months <= 0) return '0 months';
  if (months === 1) return '1 month';
  return `${Math.round(months)} months`;
}
