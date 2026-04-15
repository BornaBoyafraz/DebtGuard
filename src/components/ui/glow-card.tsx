'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({
  children,
  className,
  glowColor = '#ffe0c2',
}: GlowCardProps) {
  return (
    <motion.div
      className={cn('relative group rounded-xl', className)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${glowColor}40, transparent 50%, ${glowColor}30)`,
          borderRadius: 'inherit',
        }}
      />
      {/* Glow shadow */}
      <div
        className="absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500 pointer-events-none"
        style={{ background: glowColor }}
      />
      {/* Content */}
      <div className="relative z-10 h-full rounded-[inherit]">{children}</div>
    </motion.div>
  );
}
