import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'Terms of Service — DebtGuard',
  description: 'Terms and conditions for using the DebtGuard financial simulation platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-text-muted mb-10">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">1. Acceptance</h2>
            <p>
              By creating an account or using DebtGuard, you agree to these Terms of Service.
              If you do not agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">2. Description of Service</h2>
            <p>
              DebtGuard is an educational financial decision-support tool. It allows you to input
              financial data and simulate how different decisions might affect your financial
              trajectory over time. DebtGuard is not a financial advisor, broker, bank, or
              licensed financial services provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">3. Not Financial Advice</h2>
            <p>
              Nothing produced by DebtGuard — including risk scores, simulations, narratives,
              AI responses, or recommendations — constitutes financial advice, investment advice,
              or any form of professional financial guidance. All outputs are estimates and
              projections based on the numbers you enter. They may be inaccurate. Do not make
              significant financial decisions based solely on DebtGuard outputs.
            </p>
            <p className="mt-3">
              Always consult a qualified financial professional before making major financial
              decisions such as refinancing, taking on new debt, or changing your repayment
              strategy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">4. Your Account</h2>
            <p>
              You are responsible for maintaining the security of your account credentials.
              You must provide accurate information when creating your account. You may not
              share your account with others or use the platform to process financial data
              for third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Attempt to reverse-engineer, scrape, or exploit the platform</li>
              <li>Submit malicious inputs designed to manipulate AI outputs</li>
              <li>Use the platform for any illegal purpose</li>
              <li>Misrepresent DebtGuard&apos;s outputs as professional financial advice to others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">6. Limitation of Liability</h2>
            <p>
              DebtGuard is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable
              for any financial losses, damages, or consequences arising from your use of the
              platform or reliance on its outputs. Your use of DebtGuard is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">7. Modifications</h2>
            <p>
              We may update these terms at any time. Continued use of the platform after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">8. Termination</h2>
            <p>
              You may delete your account at any time via Settings. We reserve the right to
              suspend or terminate accounts that violate these terms.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-sm text-text-muted">
          <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
          <Link href="/disclaimer" className="hover:text-text-primary transition-colors">Disclaimer</Link>
          <Link href="/" className="hover:text-text-primary transition-colors">Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
