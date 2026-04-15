'use client';

import { motion } from 'framer-motion';
import { Lock, Scale, Eye } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GlowCard } from '@/components/ui/spotlight-card';

interface Pillar {
  icon: LucideIcon;
  title: string;
  description: string;
  glowColor: 'blue' | 'amber' | 'green';
}

const pillars: Pillar[] = [
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'All data stays on your device. Nothing is ever sent to a server.',
    glowColor: 'blue',
  },
  {
    icon: Scale,
    title: 'Not Financial Advice',
    description: 'DebtGuard is a decision-support tool for educational purposes only.',
    glowColor: 'amber',
  },
  {
    icon: Eye,
    title: 'Built for Clarity',
    description: 'No jargon. No confusion. Just clear projections and honest analysis.',
    glowColor: 'green',
  },
];

export function TrustSection() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Built on principles you can trust
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-10">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <GlowCard glowColor={pillar.glowColor} customSize className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-surface-elevated border border-border flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-text-secondary" />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {pillar.description}
                  </p>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
