'use client';

import { motion } from 'framer-motion';
import { Shield, FlaskConical, GitBranch, TrendingUp, Target, MessageSquare } from 'lucide-react';
import { GlowCard } from '@/components/ui/glow-card';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: Shield,
    title: 'Risk Detection',
    description: 'Analyze your current financial state and identify where you stand before you decide anything.',
    gradient: '#ffe0c2',
  },
  {
    icon: FlaskConical,
    title: 'Scenario Simulation',
    description: 'Build any financial scenario and see exactly what happens month by month, up to 3 years out.',
    gradient: '#f59e0b',
  },
  {
    icon: GitBranch,
    title: 'Baseline vs Scenario',
    description: "Every simulation compares two futures side by side: the path you're on, and the path you're considering.",
    gradient: '#10b981',
  },
  {
    icon: TrendingUp,
    title: 'Debt & Savings Forecast',
    description: 'See your debt balance, savings, and cashflow projected 12, 24, or 36 months into the future.',
    gradient: '#ffe0c2',
  },
  {
    icon: Target,
    title: 'Decision Score',
    description: 'Every scenario receives a proprietary Decision Score from 0–100, measuring the total impact of your choices.',
    gradient: '#f59e0b',
  },
  {
    icon: MessageSquare,
    title: 'Narrative Intelligence',
    description: 'DebtGuard explains what your simulation means in plain language — not just numbers.',
    gradient: '#10b981',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 relative">
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.3,
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 mb-4">
            <span className="text-xs font-medium text-text-muted">Six Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Everything you need to decide with clarity
          </h2>
          <p className="mt-4 text-text-secondary max-w-2xl mx-auto">
            Six core capabilities that turn financial uncertainty into actionable insight.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants} className="h-full">
                <GlowCard glowColor={feature.gradient} className="h-full">
                  <div className="bg-surface border border-border rounded-xl p-6 h-full transition-colors duration-300 group-hover:border-transparent">
                    <div
                      className="rounded-lg p-2.5 w-10 h-10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `${feature.gradient}20`,
                        border: `1px solid ${feature.gradient}30`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: feature.gradient }} />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
