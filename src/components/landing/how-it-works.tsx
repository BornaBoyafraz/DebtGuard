'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: 1,
    title: 'Enter your financial profile',
    description: 'Income, expenses, savings, debt, and interest rate.',
  },
  {
    number: 2,
    title: 'Analyze your current risk',
    description: 'Receive a risk score, classification, and explanation.',
  },
  {
    number: 3,
    title: 'Build a scenario',
    description: 'Define what you might change and simulate the outcome.',
  },
  {
    number: 4,
    title: 'Compare and decide',
    description: 'See both futures and understand the consequences before you act.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Four steps to financial clarity
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            From uncertainty to informed decision in minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 relative">
          {/* Connecting dashed line — desktop only */}
          <div className="hidden lg:block absolute top-5 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-border z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center text-center px-4"
            >
              {/* Numbered circle */}
              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center mb-5 shadow-lg shadow-accent/20">
                {step.number}
              </div>

              <h3 className="text-base font-semibold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed max-w-[220px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
