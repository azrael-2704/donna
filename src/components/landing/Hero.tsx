'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import NeuralFabricCanvas from './NeuralFabricCanvas';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <NeuralFabricCanvas className="absolute inset-0 w-full h-full" />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, var(--background) 70%, var(--background) 100%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
        <div
          className="inline-flex items-center gap-2 mb-10 px-4 py-1.5 text-xs tracking-widest uppercase border border-border text-accent rounded-sm font-mono"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]"
          />
          Neural Governance Platform
        </div>

        <h1
          className="text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.02] tracking-[-0.035em] mb-8 font-display font-bold text-foreground"
        >
          Govern AI Agents
          <br />
          <span className="text-accent">with Complete</span>
          <br />
          Visibility
        </h1>

        <p
          className="text-lg max-w-xl mx-auto mb-12 leading-[1.7] font-sans font-light text-muted-foreground"
        >
          Deploy, monitor, audit, and improve autonomous agents from a single intelligent operating system. Every decision. Fully traceable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/chat"
            className="flex items-center gap-2.5 px-7 py-3.5 text-sm transition-all duration-200 group bg-foreground text-background font-sans font-medium rounded"
          >
            Start Building
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button
            className="flex items-center gap-2.5 px-7 py-3.5 text-sm transition-all duration-200 border border-border text-foreground font-sans font-normal rounded hover:border-accent"
          >
            Request Demo
          </button>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs tracking-widest uppercase font-mono text-muted-foreground">
          scroll
        </span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </div>
    </section>
  );
}
