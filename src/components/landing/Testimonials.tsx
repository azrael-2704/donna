import React from 'react';

export default function Testimonials() {
  const quotes = [
    {
      text: "Donna gave our compliance team something they've never had before: a full map of every decision our agents have ever made. Regulators are genuinely impressed.",
      name: "Priya Raman",
      role: "Chief Risk Officer",
      org: "Meridian Capital",
    },
    {
      text: "We went from zero visibility into agent behavior to a fully auditable system in three weeks. The Neural Decision Map is unlike anything else in the market.",
      name: "James Okafor",
      role: "VP of Engineering",
      org: "Fieldstone Health",
    },
    {
      text: "The governance layer is what makes this enterprise-grade. We run 400+ agents in production and Donna is the only platform that lets us sleep at night.",
      name: "Sofia Herrera",
      role: "Head of AI Infrastructure",
      org: "Athen Financial Group",
    },
  ];

  return (
    <section className="py-32 px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="text-xs tracking-[0.16em] uppercase mb-4 font-mono text-accent">
            From Our Customers
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em] font-display font-bold text-foreground">
            Trusted at Scale
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border">
          {quotes.map((q, i) => (
            <div key={i} className="p-10 flex flex-col gap-8 bg-background">
              <p className="text-base leading-[1.85] flex-1 font-sans font-light text-foreground">
                &ldquo;{q.text}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-sm flex items-center justify-center text-xs flex-shrink-0 bg-card border border-border font-display font-semibold text-accent">
                  {q.name[0]}
                </div>
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">
                    {q.name}
                  </p>
                  <p className="text-xs mt-0.5 font-sans text-muted-foreground">
                    {q.role} · {q.org}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
