'use client';

import React, { useState } from 'react';
import { Cpu, Brain, Layers, Activity, FileText, BarChart3 } from 'lucide-react';

export default function AgentLifecycle() {
  const [active, setActive] = useState(0);
  const steps = [
    { label: "Create", icon: Cpu, detail: "Define agent identity, purpose, capabilities, and initial policy constraints from a structured template or API." },
    { label: "Train", icon: Brain, detail: "Fine-tune reasoning with curated examples, configure memory retrieval strategies, and test edge case behavior." },
    { label: "Deploy", icon: Layers, detail: "Ship to staging or production with config-as-code. Versioned releases with instant rollback capability." },
    { label: "Observe", icon: Activity, detail: "Real-time stream of decisions, tool calls, memory accesses, and latency. Full telemetry with zero sampling." },
    { label: "Audit", icon: FileText, detail: "Navigate the Neural Decision Map for any session. Export compliance reports in SOC 2, ISO, or custom formats." },
    { label: "Optimize", icon: BarChart3, detail: "Use audit insights to refine prompts, adjust policies, retrain weak paths, and drive measurable accuracy gains." },
  ];

  return (
    <section className="py-32 px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="text-xs tracking-[0.16em] uppercase mb-4 font-mono text-accent">
            Agent Lifecycle
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] tracking-[-0.03em] font-display font-bold text-foreground">
            From Creation to Optimization
          </h2>
        </div>

        <div className="grid md:grid-cols-6 gap-px mb-px bg-border">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                className="flex flex-col items-start gap-3 p-6 text-left transition-colors duration-200"
                style={{
                  background: active === i ? "var(--card)" : "var(--background)",
                  borderBottom: active === i ? "1px solid var(--accent)" : "1px solid transparent",
                }}
                onClick={() => setActive(i)}
              >
                <Icon size={16} className={active === i ? "text-accent" : "text-muted-foreground"} />
                <span
                  className="text-sm font-sans font-medium"
                  style={{ color: active === i ? "var(--foreground)" : "var(--muted-foreground)" }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-10 md:p-14 bg-card border border-border border-t-0">
          <div className="flex items-start gap-6">
            {(() => {
              const Icon = steps[active].icon;
              return (
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-accent rounded-sm">
                  <Icon size={16} className="text-accent" />
                </div>
              );
            })()}
            <div>
              <h3 className="text-xl mb-3 tracking-[-0.02em] font-display font-semibold text-foreground">
                {steps[active].label}
              </h3>
              <p className="text-base leading-[1.8] max-w-2xl font-sans font-light text-muted-foreground">
                {steps[active].detail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
