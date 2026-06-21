import React from 'react';
import { Layers, Network, Shield, ArrowUpRight } from 'lucide-react';

export default function WhyDonna() {
  const pillars = [
    {
      num: "01",
      title: "Deploy",
      icon: Layers,
      body: "Launch agents across any environment with zero-downtime versioning. Config-as-code for reproducible, auditable infrastructure.",
      tags: ["Multi-env", "Versioning", "Rollback"],
    },
    {
      num: "02",
      title: "Govern",
      icon: Network,
      body: "Set policies that define what agents can decide, access, and execute. Enforce compliance rules at the runtime level.",
      tags: ["Policy Engine", "Access Control", "Runtime Guardrails"],
    },
    {
      num: "03",
      title: "Trust",
      icon: Shield,
      body: "Every action is stamped, signed, and stored immutably. Build stakeholder confidence with a complete, navigable audit trail.",
      tags: ["Immutable Logs", "eDiscovery", "Compliance Export"],
    },
  ];

  return (
    <section className="py-32 px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.16em] uppercase mb-4 font-mono text-accent">
              Why Donna
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em] font-display font-bold text-foreground">
              Three Foundations of
              <br />
              Trustworthy AI
            </h2>
          </div>
          <a href="#" className="flex items-center gap-2 text-sm group self-start md:self-auto font-sans text-muted-foreground hover:text-foreground">
            Explore the platform
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.num} className="p-10 flex flex-col gap-6 transition-colors duration-300 group bg-card hover:bg-card/50">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-mono text-muted-foreground">
                    {p.num}
                  </span>
                  <Icon size={18} className="text-accent" />
                </div>
                <h3 className="text-[2rem] leading-none tracking-[-0.025em] font-display font-bold text-foreground">
                  {p.title}
                </h3>
                <p className="text-sm leading-[1.8] flex-1 font-sans font-light text-muted-foreground">
                  {p.body}
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 font-mono text-muted-foreground border border-border rounded-sm">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
