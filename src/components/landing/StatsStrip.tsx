import React from 'react';

export default function StatsStrip() {
  const stats = [
    { value: "10B+", label: "Decisions Governed" },
    { value: "99.97%", label: "Audit Coverage" },
    { value: "< 8ms", label: "Trace Latency" },
    { value: "SOC 2", label: "Type II Certified" },
    { value: "ISO 27001", label: "Compliant" },
  ];

  return (
    <section className="py-6 border-y border-border">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-4">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-base font-medium font-display text-accent">
                {s.value}
              </span>
              <span className="text-xs font-sans text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
