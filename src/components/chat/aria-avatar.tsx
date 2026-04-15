'use client';

import { cn } from '@/lib/utils';

interface AriaAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  isStreaming?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

export function AriaAvatar({ size = 'md', isStreaming = false, className }: AriaAvatarProps) {
  const px = SIZE_MAP[size];
  const cx = px / 2;

  // Scale factors relative to a 48px base
  const scale = px / 48;
  const r1 = 18 * scale; // outer hex radius
  const r2 = 12 * scale; // mid circle
  const r3 = 6 * scale;  // inner circle

  // Hexagon points helper
  function hexPoints(cx: number, cy: number, r: number, rotation = 0): string {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i + (rotation * Math.PI) / 180;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  }

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'text-accent shrink-0',
        isStreaming && 'animate-glow-pulse',
        className
      )}
      aria-label="The Chef"
    >
      {/* Outer hexagon — subtle fill */}
      <polygon
        points={hexPoints(cx, cx, r1, 30)}
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth={0.8 * scale}
      />

      {/* Mid ring */}
      <circle
        cx={cx}
        cy={cx}
        r={r2}
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth={0.8 * scale}
      />

      {/* Neural flow lines — 3 paths through center */}
      <line
        x1={cx - r1 * 0.55}
        y1={cx + r1 * 0.2}
        x2={cx + r1 * 0.55}
        y2={cx - r1 * 0.2}
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth={0.9 * scale}
        strokeLinecap="round"
      />
      <line
        x1={cx - r1 * 0.3}
        y1={cx - r1 * 0.45}
        x2={cx + r1 * 0.1}
        y2={cx + r1 * 0.5}
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth={0.7 * scale}
        strokeLinecap="round"
      />
      <line
        x1={cx + r1 * 0.1}
        y1={cx - r1 * 0.5}
        x2={cx - r1 * 0.1}
        y2={cx + r1 * 0.45}
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth={0.6 * scale}
        strokeLinecap="round"
      />

      {/* Connector dots */}
      <circle cx={cx - r1 * 0.55} cy={cx + r1 * 0.2} r={1.4 * scale} fill="currentColor" fillOpacity="0.8" />
      <circle cx={cx + r1 * 0.55} cy={cx - r1 * 0.2} r={1.4 * scale} fill="currentColor" fillOpacity="0.8" />
      <circle cx={cx - r1 * 0.3} cy={cx - r1 * 0.45} r={1.2 * scale} fill="currentColor" fillOpacity="0.6" />
      <circle cx={cx + r1 * 0.1} cy={cx + r1 * 0.5} r={1.2 * scale} fill="currentColor" fillOpacity="0.6" />

      {/* Inner core */}
      <circle
        cx={cx}
        cy={cx}
        r={r3}
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  );
}
