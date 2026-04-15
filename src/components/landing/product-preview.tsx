'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function BrowserFrame() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xl shadow-black/20">
      {/* Browser top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-elevated border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 bg-surface rounded-md border border-border-subtle px-3 py-1 max-w-sm w-full">
            <svg className="w-3 h-3 text-text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[11px] text-text-muted truncate">app.debtguard.com/simulate</span>
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* App content */}
      <div className="p-4 sm:p-6 bg-background">
        <div className="grid sm:grid-cols-5 gap-4 sm:gap-6">
          {/* Left panel — scenario builder form */}
          <div className="sm:col-span-2 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-text-primary">Scenario Builder</span>
            </div>

            {/* Scenario Name */}
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <label className="text-[10px] font-medium text-text-muted block mb-1.5">Scenario Name</label>
              <div className="h-8 rounded-md bg-surface-elevated border border-border px-2.5 flex items-center">
                <span className="text-xs text-text-secondary">Extra $200/mo on debt</span>
              </div>
            </div>

            {/* Extra Payment slider */}
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-medium text-text-muted">Extra Monthly Payment</label>
                <span className="text-[11px] font-semibold text-accent">$200</span>
              </div>
              <div className="relative h-2 rounded-full bg-surface-elevated overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-3/5 rounded-full bg-accent" />
                <div className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent border-2 border-background shadow" />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-text-muted">$0</span>
                <span className="text-[8px] text-text-muted">$500</span>
              </div>
            </div>

            {/* Expense Change */}
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-medium text-text-muted">Monthly Expense Change</label>
                <span className="text-[11px] font-semibold text-success">-$150</span>
              </div>
              <div className="relative h-2 rounded-full bg-surface-elevated overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-2/5 rounded-full bg-success" />
                <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-success border-2 border-background shadow" />
              </div>
            </div>

            {/* Horizon selector */}
            <div className="rounded-lg bg-surface p-3 border border-border-subtle">
              <label className="text-[10px] font-medium text-text-muted block mb-2">Forecast Horizon</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['12 mo', '24 mo', '36 mo'].map((h, i) => (
                  <div
                    key={h}
                    className={`text-center py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                      i === 1
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-surface-elevated text-text-muted border border-border-subtle'
                    }`}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Run button */}
            <div className="h-9 rounded-lg bg-accent flex items-center justify-center gap-2 cursor-default">
              <svg className="w-3.5 h-3.5 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span className="text-xs text-accent-foreground font-semibold">Run Simulation</span>
            </div>
          </div>

          {/* Right panel — results */}
          <div className="sm:col-span-3 space-y-4">
            {/* Fork chart */}
            <div className="rounded-lg bg-surface border border-border-subtle p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-primary">Debt Projection</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-[2px] rounded-full bg-text-muted/40" />
                    <span className="text-[9px] text-text-muted">Baseline</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-[2px] rounded-full bg-accent" />
                    <span className="text-[9px] text-text-muted">Scenario</span>
                  </div>
                </div>
              </div>
              <svg className="w-full h-24" viewBox="0 0 300 90" preserveAspectRatio="none">
                {/* Grid */}
                {[18, 36, 54, 72].map((y) => (
                  <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="2 4" />
                ))}
                {/* Baseline — stays elevated, slight dip */}
                <path
                  d="M0,15 C40,16 80,18 120,21 C160,24 200,28 240,33 C270,37 290,40 300,43"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.3"
                />
                {/* Scenario — drops to near zero */}
                <path
                  d="M0,15 C40,20 80,30 120,42 C160,55 200,68 240,78 C270,83 290,86 300,88"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
                {/* Area fill */}
                <path
                  d="M0,15 C40,20 80,30 120,42 C160,55 200,68 240,78 C270,83 290,86 300,88 L300,90 L0,90 Z"
                  fill="url(#previewGrad)"
                  opacity="0.1"
                />
                <defs>
                  <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Y-axis labels */}
                <text x="4" y="14" fill="var(--text-muted)" fontSize="7" opacity="0.5">$15k</text>
                <text x="4" y="50" fill="var(--text-muted)" fontSize="7" opacity="0.5">$10k</text>
                <text x="4" y="86" fill="var(--text-muted)" fontSize="7" opacity="0.5">$0</text>
              </svg>
              <div className="flex justify-between mt-1.5 px-1">
                <span className="text-[8px] text-text-muted">Month 0</span>
                <span className="text-[8px] text-text-muted">Month 12</span>
                <span className="text-[8px] text-text-muted">Month 24</span>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Debt Reduction', value: '-$8,400', sub: 'vs baseline', color: 'text-success' },
                { label: 'Net Savings', value: '+$3,200', sub: 'additional', color: 'text-success' },
                { label: 'Risk Score', value: '-18 pts', sub: 'improvement', color: 'text-success' },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-surface border border-border-subtle p-3">
                  <p className="text-[9px] text-text-muted">{m.label}</p>
                  <p className={`text-sm font-bold ${m.color} mt-0.5`}>{m.value}</p>
                  <p className="text-[8px] text-text-muted mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Narrative text block */}
            <div className="rounded-lg bg-surface border border-border-subtle p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-accent/15 flex items-center justify-center">
                  <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-text-primary">Narrative Analysis</span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                By adding $200/mo toward your debt and cutting $150/mo in expenses, you would eliminate your remaining balance 14 months earlier than the baseline. Your savings trajectory improves by $3,200, and your overall risk classification drops from &quot;Moderate&quot; to &quot;Low.&quot; This scenario is <span className="text-success font-medium">significantly better</span> than your current path.
              </p>
            </div>

            {/* Verdict */}
            <div className="rounded-lg bg-success-subtle border border-success/15 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-success">Significantly Better</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Decision Score: 78/100</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="product" className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            A Financial Decision Lab
          </h2>
          <p className="mt-3 text-text-secondary max-w-lg mx-auto">
            Not a dashboard. A workspace for reasoning about money.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
        >
          <BrowserFrame />
        </motion.div>
      </div>
    </section>
  );
}
