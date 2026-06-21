import React from 'react';
import { Lock, FileText, Eye, Activity } from 'lucide-react';

export default function EnterpriseTrust() {
  const cards = [
    {
      icon: Lock,
      title: "Security",
      body: "End-to-end encryption, mTLS between agents, secrets vault integration, and network isolation per deployment.",
      stat: "256-bit AES",
      statLabel: "Encryption at rest",
    },
    {
      icon: FileText,
      title: "Compliance",
      body: "SOC 2 Type II, ISO 27001, HIPAA-ready, and GDPR. Automated report generation for any audit period.",
      stat: "SOC 2 T2",
      statLabel: "Continuously audited",
    },
    {
      icon: Eye,
      title: "Auditability",
      body: "Cryptographically signed decision records with immutable storage. eDiscovery-ready export in under 60 seconds.",
      stat: "100%",
      statLabel: "Decision coverage",
    },
    {
      icon: Activity,
      title: "Observability",
      body: "Full OpenTelemetry instrumentation. Wire into Datadog, Grafana, or any SIEM. Sub-10ms trace overhead.",
      stat: "< 8ms",
      statLabel: "Trace overhead",
    },
  ];

  return (
    <section className="py-32 px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 grid md:grid-cols-2 gap-10 items-end">
          <div>
            <p className="text-xs tracking-[0.16em] uppercase mb-4 font-mono text-accent">
              Enterprise Trust
            </p>
            <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em] font-display font-bold text-foreground">
              Built for Organizations
              <br />
              That Cannot Afford Surprises
            </h2>
          </div>
          <p className="text-base leading-[1.8] font-sans font-light text-muted-foreground">
            Enterprise AI governance is not a feature — it is the foundation. Donna was built from the ground up for regulated industries.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="p-8 flex flex-col gap-5 transition-colors duration-300 bg-background hover:bg-card">
                <Icon size={18} className="text-accent" />
                <div>
                  <h3 className="text-base mb-2 font-display font-semibold text-foreground">
                    {c.title}
                  </h3>
                  <p className="text-sm leading-[1.7] font-sans font-light text-muted-foreground">
                    {c.body}
                  </p>
                </div>
                <div className="mt-auto pt-5 border-t border-border">
                  <p className="text-lg mb-0.5 font-display font-semibold text-accent">
                    {c.stat}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {c.statLabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
