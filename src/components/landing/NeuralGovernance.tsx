'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Database,
  FileText,
  Zap,
  Brain,
  CheckCircle2,
  ArrowUpRight,
  Users,
} from 'lucide-react';

type DecisionNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  icon: typeof Cpu;
  detail: string;
};

const DECISION_NODES: DecisionNode[] = [
  { id: "input", label: "User Input", x: 55, y: 155, icon: Users, detail: "Request initiated by human or system trigger" },
  { id: "agent", label: "Agent", x: 200, y: 155, icon: Cpu, detail: "Autonomous agent receives and parses intent" },
  { id: "memory", label: "Memory", x: 350, y: 75, icon: Database, detail: "Retrieves relevant prior context and state" },
  { id: "knowledge", label: "Knowledge", x: 490, y: 75, icon: FileText, detail: "Queries verified knowledge sources" },
  { id: "tool", label: "Tool Call", x: 350, y: 235, icon: Zap, detail: "Executes external tools with full audit trail" },
  { id: "reason", label: "Reasoning", x: 490, y: 155, icon: Brain, detail: "Synthesizes inputs into structured decision" },
  { id: "approval", label: "Approval", x: 630, y: 155, icon: CheckCircle2, detail: "Compliance gate with configurable policy" },
  { id: "outcome", label: "Outcome", x: 770, y: 155, icon: ArrowUpRight, detail: "Action taken with full lineage preserved" },
];

const EDGES: [string, string][] = [
  ["input", "agent"],
  ["agent", "memory"],
  ["agent", "tool"],
  ["memory", "knowledge"],
  ["tool", "reason"],
  ["knowledge", "reason"],
  ["reason", "approval"],
  ["approval", "outcome"],
];

export default function NeuralGovernance() {
  const [active, setActive] = useState<string | null>(null);
  const nodeMap = Object.fromEntries(DECISION_NODES.map((n) => [n.id, n]));

  return (
    <section className="py-32 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <p className="text-xs tracking-[0.16em] uppercase mb-4 font-mono text-accent">
            Neural Governance
          </p>
          <h2 className="text-[clamp(2rem,4.5vw,3.6rem)] leading-[1.05] tracking-[-0.03em] max-w-2xl font-display font-bold text-foreground">
            Every Decision Has a Trail.
          </h2>
          <p className="mt-5 text-base max-w-lg leading-[1.8] font-sans font-light text-muted-foreground">
            Donna maps every agent decision as a navigable graph. Click any node to inspect its full context, confidence score, and compliance status.
          </p>
        </div>

        <div className="rounded relative overflow-hidden border border-border bg-card">
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-accent" />
            <span className="text-xs font-mono text-muted-foreground">
              live trace
            </span>
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: 860, padding: "48px 40px" }}>
              <svg viewBox="0 0 830 310" style={{ width: "100%", height: "auto", display: "block" }}>
                {/* Edges */}
                {EDGES.map(([a, b], i) => {
                  const na = nodeMap[a];
                  const nb = nodeMap[b];
                  const isActive =
                    active === a ||
                    active === b ||
                    (active !== null &&
                      EDGES.some(
                        ([ea, eb]) =>
                          (ea === active || eb === active) &&
                          ((ea === a && eb === b) || (ea === b && eb === a))
                      ));
                  return (
                    <line
                      key={i}
                      x1={na.x}
                      y1={na.y}
                      x2={nb.x}
                      y2={nb.y}
                      stroke={isActive ? "var(--accent)" : "var(--border)"}
                      strokeWidth={isActive ? 1 : 0.8}
                      style={{ transition: "all 0.25s ease" }}
                    />
                  );
                })}

                {/* Nodes */}
                {DECISION_NODES.map((n) => {
                  const Icon = n.icon;
                  const isActive = active === n.id;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x}, ${n.y})`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setActive(active === n.id ? null : n.id)}
                    >
                      <circle
                        r={28}
                        fill={isActive ? "var(--accent)" : "var(--card)"}
                        stroke={isActive ? "var(--accent)" : "var(--border)"}
                        strokeWidth={isActive ? 1.2 : 0.8}
                        style={{ transition: "all 0.25s ease" }}
                      />
                      <foreignObject x={-11} y={-11} width={22} height={22}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                          <Icon
                            size={14}
                            color={isActive ? "var(--background)" : "var(--muted-foreground)"}
                            style={{ transition: "all 0.25s ease" }}
                          />
                        </div>
                      </foreignObject>
                      <text
                        y={44}
                        textAnchor="middle"
                        fill={isActive ? "var(--foreground)" : "var(--muted-foreground)"}
                        fontSize={10}
                        fontFamily="'Inter', sans-serif"
                        style={{ transition: "all 0.25s ease", userSelect: "none" }}
                      >
                        {n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {active && (() => {
            const n = nodeMap[active];
            const Icon = n.icon;
            return (
              <div className="border-t border-border px-8 py-5 flex items-start gap-5 bg-card/50">
                <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 border border-accent bg-background">
                  <Icon size={14} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium font-sans text-foreground">
                      {n.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 font-mono text-accent border border-border rounded-sm">
                      node:{n.id}
                    </span>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground">
                    {n.detail}
                  </p>
                </div>
                <div className="hidden md:grid grid-cols-3 gap-6 text-right">
                  {[["Confidence", "98.4%"], ["Risk Score", "0.02"], ["Latency", "4.1ms"]].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs mb-0.5 font-mono text-muted-foreground">{k}</p>
                      <p className="text-sm font-display font-medium text-accent">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
