import React from 'react';
import Nav from '@/components/landing/Nav';
import Hero from '@/components/landing/Hero';
import StatsStrip from '@/components/landing/StatsStrip';
import NeuralGovernance from '@/components/landing/NeuralGovernance';
import WhyDonna from '@/components/landing/WhyDonna';
import AgentLifecycle from '@/components/landing/AgentLifecycle';
import EnterpriseTrust from '@/components/landing/EnterpriseTrust';
import Testimonials from '@/components/landing/Testimonials';
import CTABanner from '@/components/landing/CTABanner';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-accent/30">
      <Nav />
      <Hero />
      <StatsStrip />
      <NeuralGovernance />
      <WhyDonna />
      <AgentLifecycle />
      <EnterpriseTrust />
      <Testimonials />
      <CTABanner />

      {/* Footer */}
      <footer className="py-12 border-t border-border px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="20" height="20" rx="3" stroke="var(--muted-foreground)" strokeWidth="1.2" />
              <circle cx="11" cy="11" r="3.5" fill="var(--muted-foreground)" />
            </svg>
            <span className="text-muted-foreground text-sm font-display font-semibold">donna</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-sans text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">System Status</a>
            <span>&copy; {new Date().getFullYear()} Donna AI Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
