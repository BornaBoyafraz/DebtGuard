import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'Privacy Policy — DebtGuard',
  description: 'How DebtGuard collects, uses, and protects your financial data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-muted mb-10">Last updated: April 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">1. What We Collect</h2>
            <p>
              DebtGuard collects only the information you explicitly provide: your email address
              for account creation, and the financial figures you enter into the platform (income,
              expenses, savings, debt, interest rate, minimum payment). We do not collect bank
              account credentials, social security numbers, credit card numbers, or any other
              sensitive financial identifiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">2. How We Use Your Data</h2>
            <p>Your data is used exclusively to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Run financial simulations and compute risk scores within the platform</li>
              <li>Generate AI-powered narratives and insights about your scenarios</li>
              <li>Save your simulation history so you can review it later</li>
              <li>Maintain your account and provide customer support</li>
            </ul>
            <p className="mt-3">
              We do not sell your data to third parties. We do not use your financial data for
              advertising or profiling outside of DebtGuard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">3. AI Processing</h2>
            <p>
              DebtGuard uses Anthropic&apos;s Claude AI to generate narratives, risk explanations,
              and chat responses. When you run a simulation or request AI analysis, relevant
              portions of your financial data are sent to Anthropic&apos;s API for processing.
              This data is subject to{' '}
              <span className="text-text-primary">Anthropic&apos;s privacy practices</span>.
              We do not send personally identifiable information (name, email) to the AI — only
              the financial figures you have entered.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">4. Data Storage</h2>
            <p>
              Your data is stored in Supabase, a managed database platform. All data is stored
              with row-level security — you can only access your own records. Data is encrypted
              at rest and in transit. DebtGuard employees do not access individual user financial
              data except when required to investigate reported issues.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">5. Data Deletion</h2>
            <p>
              You can delete your account and all associated data at any time from the Settings
              page. Upon deletion, your financial profile, simulations, and chat history are
              permanently removed. This action is irreversible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">6. Cookies</h2>
            <p>
              DebtGuard uses session cookies to maintain your authenticated state. These are
              necessary for the platform to function and are not used for tracking or advertising.
              We do not use third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">7. Contact</h2>
            <p>
              If you have questions about this privacy policy or how your data is handled,
              please reach out via the feedback link in the application settings.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-sm text-text-muted">
          <Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          <Link href="/disclaimer" className="hover:text-text-primary transition-colors">Disclaimer</Link>
          <Link href="/" className="hover:text-text-primary transition-colors">Back to Home</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
