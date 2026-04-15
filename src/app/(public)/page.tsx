'use client';

import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { ProductPreview } from '@/components/landing/product-preview';
import { Features } from '@/components/landing/features';
import { AIDemoSection } from '@/components/landing/ai-demo-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { TrustSection } from '@/components/landing/trust-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Fixed aurora layer — persists as you scroll */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-3xl animate-aurora-1"
          style={{ background: 'radial-gradient(circle, #ffe0c2 0%, #644a40 40%, transparent 70%)', opacity: 0.15 }}
        />
        <div
          className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full blur-3xl animate-aurora-2"
          style={{ background: 'radial-gradient(circle, #ffdfb5 0%, #582d1d 40%, transparent 70%)', opacity: 0.10 }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-[600px] h-[400px] rounded-full blur-3xl animate-aurora-3"
          style={{ background: 'radial-gradient(circle, #ffe0c2 0%, #644a40 50%, transparent 70%)', opacity: 0.07 }}
        />
      </div>
      <Navbar />
      <Hero />
      <ProductPreview />
      <Features />
      <AIDemoSection />
      <HowItWorks />
      <TrustSection />
      <CTASection />
      <Footer />
    </div>
  );
}
