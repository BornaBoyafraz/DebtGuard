'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 pointer-events-none animate-gradient"
        style={{
          background: 'linear-gradient(135deg, #1a1410, #2a1f14, #1e1208, #2a1f14, #1a1410)',
          backgroundSize: '300% 300%',
        }}
      />
      {/* Floating glow orbs */}
      <div
        className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none animate-aurora-1"
        style={{ background: '#ffe0c2' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none animate-aurora-2"
        style={{ background: '#ffdfb5' }}
      />
      {/* Border lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center relative z-10"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Start your first simulation in under 2 minutes.
        </h2>
        <p className="mt-4 text-lg" style={{ color: '#ffdfb5' }}>
          No accounts required to explore. No financial data ever leaves your device.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup">
            <Button
              size="lg"
              className="gap-2 font-semibold animate-glow-pulse"
              style={{
                background: 'white',
                color: '#644a40',
                boxShadow: '0 10px 30px rgba(255,224,194,0.4)',
              }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-xs" style={{ color: 'rgba(255,223,181,0.5)' }}>
          Free forever · No credit card required · Open source
        </p>
      </motion.div>
    </section>
  );
}
