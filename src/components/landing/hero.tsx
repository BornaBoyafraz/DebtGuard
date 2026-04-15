'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FloatingPaths } from '@/components/ui/background-paths';
import { TiltCard } from '@/components/ui/tilt-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { ArrowRight, Sparkles } from 'lucide-react';

const metrics = [
  { label: 'Final Debt', value: '$0', color: 'text-success' },
  { label: 'Savings', value: '$12,400', color: 'text-success' },
  { label: 'Risk', value: 'Low', color: 'text-success' },
];

const stats = [
  { value: 0.3, prefix: '$', suffix: 'M+', label: 'analyzed', decimals: 1 },
  { value: 423, prefix: '', suffix: '+', label: 'simulations', decimals: 0 },
  { value: 12, prefix: '', suffix: '%', label: 'accuracy', decimals: 0 },
];

function MockSimulationCard() {
  return (
    <div className="animate-float rotate-1" style={{ minWidth: 320, maxWidth: 360 }}>
      <div
        className="rounded-2xl border shadow-2xl p-6 relative overflow-hidden"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 25px 50px -12px rgba(255,224,194,0.15)',
        }}
      >
        {/* Glow blobs */}
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{ background: 'rgba(255,224,194,0.15)' }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(255,224,194,0.08)' }} />

        {/* Decision Score */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Decision Score
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold" style={{ color: 'var(--success)' }}>78</span>
              <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>/100</span>
            </div>
          </div>
          <div
            className="w-14 h-14 rounded-xl border flex items-center justify-center animate-glow-pulse"
            style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }}
          >
            <svg className="w-7 h-7" style={{ color: 'var(--success)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
        </div>

        {/* Mini chart */}
        <div
          className="rounded-xl p-4 mb-4 relative z-10 border"
          style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>24-Month Projection</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-[2px] rounded-full" style={{ background: 'rgba(161,161,170,0.4)' }} />
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Baseline</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-[2px] rounded-full" style={{ background: '#ffe0c2' }} />
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Scenario</span>
              </div>
            </div>
          </div>
          <svg className="w-full h-16" viewBox="0 0 240 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe0c2" />
                <stop offset="100%" stopColor="#ffe0c2" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,20 C30,22 60,25 90,28 C120,31 150,34 180,38 C200,41 220,44 240,48"
              fill="none" stroke="rgba(161,161,170,0.35)" strokeWidth="2" strokeDasharray="4 3" />
            <path d="M0,20 C30,18 60,16 90,14 C120,12 150,8 180,6 C200,4 220,3 240,2"
              fill="none" stroke="#ffe0c2" strokeWidth="2.5" />
            <path d="M0,20 C30,18 60,16 90,14 C120,12 150,8 180,6 C200,4 220,3 240,2 L240,60 L0,60 Z"
              fill="url(#heroFill)" opacity="0.15" />
          </svg>
        </div>

        {/* Metric row */}
        <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
          {metrics.map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-lg p-2.5 text-center border"
              style={{ background: 'var(--surface-elevated)', borderColor: 'var(--border-subtle)' }}
            >
              <p className="text-[9px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className={`text-sm font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Verdict badge */}
        <div
          className="rounded-lg border px-4 py-2.5 flex items-center gap-2.5 relative z-10"
          style={{ background: 'rgba(5,46,22,0.5)', borderColor: 'rgba(16,185,129,0.15)' }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.2)' }}>
            <svg className="w-3 h-3" style={{ color: 'var(--success)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Significantly Better</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pb-28 px-4 sm:px-6 overflow-hidden">
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left column */}
          <div>
            {/* AI badge */}
            <div className="anim-fade-up anim-delay-0 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-6"
              style={{ borderColor: 'rgba(255,224,194,0.3)', background: 'rgba(255,224,194,0.1)' }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                AI-Powered Financial Intelligence
              </span>
            </div>

            {/* Headline */}
            <h1 className="anim-fade-up anim-delay-1 text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight"
              style={{ color: 'var(--text-primary)' }}>
              Understand your financial future{' '}
              <span
                className="animate-gradient"
                style={{
                  background: 'linear-gradient(135deg, #ffe0c2, #ffdfb5, #f59e0b, #ffe0c2)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                before it arrives.
              </span>
            </h1>

            <p className="anim-fade-up anim-delay-2 text-lg mt-6 max-w-xl leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}>
              DebtGuard simulates the consequences of financial decisions before you make them.
              Detect risk early, compare scenarios, and choose your path with clarity.
            </p>

            {/* CTAs */}
            <div className="anim-fade-up anim-delay-3 mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" className="gap-2 w-full sm:w-auto relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Simulating
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12 pointer-events-none" />
                </Button>
              </Link>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Button variant="ghost" size="lg" className="gap-2 w-full sm:w-auto">
                  See how it works
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="anim-fade-in anim-delay-5 mt-10 flex items-center gap-8 flex-wrap">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold flex items-baseline gap-0.5" style={{ color: 'var(--text-primary)' }}>
                    <AnimatedCounter
                      value={stat.value}
                      prefix={stat.prefix}
                      decimals={stat.decimals}
                      duration={1800}
                    />
                    <span>{stat.suffix}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — 3D tilt card */}
          <div className="anim-fade-right anim-delay-3 hidden lg:flex justify-center lg:justify-end">
            <TiltCard maxTilt={10} glare>
              <MockSimulationCard />
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}
