import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTABanner() {
  return (
    <section className="py-36 px-8 relative overflow-hidden border-t border-border">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 80% at 50% 100%, hsla(var(--accent-hsl), 0.04) 0%, transparent 70%)",
        }}
      />
      <div className="max-w-7xl mx-auto text-center relative">
        <p className="text-xs tracking-[0.16em] uppercase mb-6 font-mono text-accent">
          Get Started
        </p>
        <h2 className="text-[clamp(2.4rem,6vw,5rem)] leading-[1.02] tracking-[-0.035em] mb-8 max-w-3xl mx-auto font-display font-bold text-foreground">
          The Operating System
          <br />
          for Autonomous Agents
        </h2>
        <p className="text-base mb-12 max-w-md mx-auto leading-[1.8] font-sans font-light text-muted-foreground">
          Join the organizations running enterprise-grade AI with complete traceability.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth"
            className="flex items-center gap-2.5 px-8 py-4 text-sm transition-all duration-200 bg-foreground text-background font-sans font-medium rounded hover:bg-accent"
          >
            Start Building Free
            <ArrowRight size={15} />
          </Link>
          <button className="flex items-center gap-2.5 px-8 py-4 text-sm transition-all duration-200 border border-border text-foreground font-sans font-normal rounded hover:border-accent">
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}
