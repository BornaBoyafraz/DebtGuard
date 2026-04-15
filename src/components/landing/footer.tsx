import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'Simulation', href: '/#how-it-works' },
    { label: 'Dashboard', href: '/#features' },
    { label: 'Risk Analysis', href: '/#features' },
  ],
  Resources: [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Get Started', href: '/signup' },
    { label: 'Sign In', href: '/login' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-10">
          {/* Logo + tagline */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <svg
                className="w-7 h-7 text-accent"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 2L4 8v8c0 7.18 5.12 13.88 12 16 6.88-2.12 12-8.82 12-16V8L16 2z"
                  fill="currentColor"
                  fillOpacity="0.15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16l3 3 5-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-base font-bold text-text-primary">DebtGuard</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Financial clarity through simulation.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                          href={link.href}
                          className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer + copyright */}
        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs text-text-muted leading-relaxed max-w-3xl">
            DebtGuard is an educational decision-support tool. It does not constitute financial
            advice. All projections are estimates based on inputs you provide.
          </p>
          <p className="text-xs text-text-muted mt-3">
            &copy; 2026 DebtGuard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
