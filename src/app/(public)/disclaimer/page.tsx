import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'Disclaimer — DebtGuard',
  description: 'Important disclaimers about DebtGuard projections and AI-generated content.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Disclaimer</h1>
        <p className="text-sm text-text-muted mb-10">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-text-secondary leading-relaxed">

          <section className="p-4 border border-warning/30 bg-warning/5 rounded-lg">
            <p className="text-sm font-semibold text-text-primary">
              DebtGuard is an educational tool. It does not provide financial, legal, tax,
              or investment advice. All projections are estimates.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Projections Are Estimates</h2>
            <p>
              All simulations, risk scores, decision scores, and trajectories produced by
              DebtGuard are mathematical projections based on the inputs you provide. They
              assume static conditions: that your income, expenses, interest rates, and debt
              levels remain as entered for the entire simulation horizon.
            </p>
            <p className="mt-3">
              Real financial outcomes are affected by variables DebtGuard cannot model: job loss,
              medical expenses, interest rate changes, inflation, changes in minimum payment
              requirements, and many other life events. Actual results will differ from
              projections.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">AI-Generated Content</h2>
            <p>
              DebtGuard uses AI language models to generate narratives, insights, and chat
              responses. AI-generated content may contain errors, oversimplifications, or
              inaccuracies. It is generated from patterns in training data and from the specific
              numbers you provide — not from a comprehensive understanding of your full financial
              situation.
            </p>
            <p className="mt-3">
              Do not treat AI-generated recommendations as professional advice. Treat them as
              one input in your decision-making process, to be verified and supplemented by your
              own judgment and, where appropriate, by a licensed financial professional.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">No Professional Relationship</h2>
            <p>
              Using DebtGuard does not create a financial advisor-client, attorney-client,
              or any other professional relationship. DebtGuard is not a registered investment
              advisor, broker-dealer, bank, or licensed financial services provider under any
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Decision Responsibility</h2>
            <p>
              You are solely responsible for all financial decisions you make. DebtGuard
              provides decision support — it augments your thinking, it does not replace it.
              Before making significant financial decisions (refinancing, taking on new debt,
              changing repayment strategies, or altering your emergency savings), consult a
              qualified financial professional.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">Simulation Limitations</h2>
            <p>The simulation engine makes the following simplifying assumptions:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Income and expenses are constant month-to-month (no seasonal variation)</li>
              <li>Interest rates do not change unless you explicitly model a refinance</li>
              <li>New loans are modeled as single-rate instruments with proportional payment allocation</li>
              <li>Minimum payments are recalculated as 2% of remaining balance (simplified heuristic)</li>
              <li>Projections do not account for inflation or cost-of-living changes</li>
              <li>Tax implications of debt payoff, savings, or refinancing are not modeled</li>
            </ul>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-sm text-text-muted">
          <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-text-primary transition-colors">Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
