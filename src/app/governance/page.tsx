'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Network, Filter, Eye, Cpu, Database, AlertTriangle, Users, Zap, Brain, CheckCircle2, ArrowUpRight, FileText } from 'lucide-react';
import NeuralFabric from '@/components/NeuralFabric';

interface DecisionNode {
  id: string;
  agent: string;
  action: string;
  confidence: number;
  toolCall: string;
  reasoning: string;
  risk: 'Low' | 'Medium' | 'High';
  status: 'Approved' | 'Flagged' | 'Blocked';
}

type GraphNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  icon: typeof Cpu;
  detail: string;
};

const GRAPH_NODES: GraphNode[] = [
  { id: "input", label: "User Input", x: 100, y: 300, icon: Users, detail: "Request initiated" },
  { id: "agent", label: "Agent", x: 300, y: 300, icon: Cpu, detail: "Agent parses intent" },
  { id: "memory", label: "Memory", x: 500, y: 150, icon: Database, detail: "Retrieves context" },
  { id: "knowledge", label: "Knowledge", x: 700, y: 150, icon: FileText, detail: "Queries data" },
  { id: "tool", label: "Tool Call", x: 500, y: 450, icon: Zap, detail: "Executes tools" },
  { id: "reason", label: "Reasoning", x: 700, y: 300, icon: Brain, detail: "Synthesizes input" },
  { id: "approval", label: "Approval", x: 900, y: 300, icon: CheckCircle2, detail: "Compliance gate" },
  { id: "outcome", label: "Outcome", x: 1100, y: 300, icon: ArrowUpRight, detail: "Action taken" },
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

export default function GovernancePage() {
  const [nodes, setNodes] = useState<DecisionNode[]>([
    {
      id: 'NODE-101',
      agent: 'Data Analyst',
      action: 'Execute SQL Query',
      confidence: 98.4,
      toolCall: 'query_db("SELECT * FROM transactions LIMIT 100")',
      reasoning: 'User requested recent transaction history. Validated permission structure before requesting data access.',
      risk: 'Low',
      status: 'Approved',
    },
    {
      id: 'NODE-102',
      agent: 'Security Auditor',
      action: 'Flag Suspicious Executable',
      confidence: 91.2,
      toolCall: 'block_execution("install_binary.sh")',
      reasoning: 'Detox script contains shell expansion commands running arbitrary payloads. Risk threshold exceeded.',
      risk: 'High',
      status: 'Blocked',
    },
    {
      id: 'NODE-103',
      agent: 'Research Assistant',
      action: 'Synthesize Competitive Landscape',
      confidence: 86.5,
      toolCall: 'search_web("top enterprise ai systems 2026")',
      reasoning: 'Synthesizing report on core features. High similarity indices detected; cross-referencing sources.',
      risk: 'Low',
      status: 'Approved',
    },
    {
      id: 'NODE-104',
      agent: 'Financial Advisor',
      action: 'Verify Margin Cap Limits',
      confidence: 78.9,
      toolCall: 'calculate_margin("portfolio_alpha")',
      reasoning: 'Calculated margin limits. System flags potential margin call if asset values drop 12% in current cycle.',
      risk: 'Medium',
      status: 'Flagged',
    },
  ]);

  const [selectedNode, setSelectedNode] = useState<DecisionNode | null>(null);
  const [filter, setFilter] = useState<'All' | 'Approved' | 'Flagged' | 'Blocked'>('All');
  const [activeGraphNode, setActiveGraphNode] = useState<string | null>(null);
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);

  const filteredNodes = nodes.filter((n) => filter === 'All' || n.status === filter);
  const nodeMap = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n]));

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/governance" />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>

        {/* Dynamic Interactive Background Fabric */}
        <div className="absolute inset-0 z-0">
          <NeuralFabric density={35} speed={0.12} connectionDistance={140} />
        </div>

        {/* Fullscreen Interactive SVG Map */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-auto">
          <svg viewBox="0 0 1200 600" className="w-full h-full overflow-visible" onClick={() => setClickedNodeId(null)}>
            {/* Edges */}
            {EDGES.map(([a, b], i) => {
              const na = nodeMap[a];
              const nb = nodeMap[b];
              const isActive =
                activeGraphNode === a ||
                activeGraphNode === b ||
                (activeGraphNode !== null &&
                  EDGES.some(
                    ([ea, eb]) =>
                      (ea === activeGraphNode || eb === activeGraphNode) &&
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
                  strokeWidth={isActive ? 2 : 1}
                  className="transition-all duration-300 ease-in-out"
                />
              );
            })}

            {/* Nodes */}
            {GRAPH_NODES.map((n, idx) => {
              const Icon = n.icon;
              const isActive = activeGraphNode === n.id;
              const isSelected = clickedNodeId === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  style={{ cursor: "pointer", pointerEvents: "auto" }}
                  onMouseEnter={() => setActiveGraphNode(n.id)}
                  onMouseLeave={() => setActiveGraphNode(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setClickedNodeId(n.id);
                    setSelectedNode(nodes[idx % nodes.length]);
                  }}
                >
                  <circle
                    r={35}
                    fill={isActive || isSelected ? "var(--accent)" : "var(--card)"}
                    stroke={isActive || isSelected ? "var(--accent)" : "var(--border)"}
                    strokeWidth={isActive || isSelected ? 2 : 1}
                    className="transition-all duration-300 ease-in-out"
                  />
                  <foreignObject x={-14} y={-14} width={28} height={28}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                      <Icon
                        size={18}
                        color={isActive || isSelected ? "var(--background)" : "var(--muted-foreground)"}
                        style={{ transition: "all 0.25s ease" }}
                      />
                    </div>
                  </foreignObject>
                  <text
                    y={55}
                    textAnchor="middle"
                    fill={isActive || isSelected ? "var(--foreground)" : "var(--muted-foreground)"}
                    fontSize={12}
                    fontFamily="'Inter', sans-serif"
                    className="transition-all duration-300 ease-in-out select-none"
                  >
                    {n.label}
                  </text>

                  {/* Dynamic Popover Card when clicked */}
                  {isSelected && selectedNode && (
                    <foreignObject x={45} y={-150} width={380} height={320}>
                      <div className="bg-card/90 backdrop-blur-xl border border-accent/40 p-5 rounded-2xl w-full h-full shadow-[0_10px_40px_rgba(var(--accent-rgb),0.15)] flex flex-col gap-3 relative cursor-default" onClick={e => e.stopPropagation()}>
                        <div className="absolute -left-2 top-36 w-4 h-4 bg-card border-l border-b border-accent/40 rotate-45 transform" />
                        
                        <div className="flex justify-between items-start border-b border-border pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Active Context</span>
                            <h3 className="font-display font-bold text-lg text-foreground mt-0.5 leading-tight">{selectedNode.action}</h3>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border
                            ${selectedNode.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              selectedNode.status === 'Blocked' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                            {selectedNode.status}
                          </span>
                        </div>

                        <div className="space-y-3 text-sm flex-1 overflow-y-auto pr-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs"><Cpu size={12} /> Agent Node</span>
                            <span className="font-medium text-xs">{selectedNode.agent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5 text-xs"><Eye size={12} /> Confidence</span>
                            <span className="font-medium text-xs text-green-500">{selectedNode.confidence}%</span>
                          </div>
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5"><Database size={10} /> Registered Tool Call</span>
                            <span className="font-mono text-[10px] bg-background border border-border p-2 rounded-lg overflow-x-auto block text-foreground break-all">
                              {selectedNode.toolCall}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 pt-1">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground flex items-center gap-1.5"><AlertTriangle size={10} className="text-amber-500" /> Explanation</span>
                            <p className="text-[11px] text-muted-foreground leading-relaxed bg-background/50 p-2 rounded-lg border border-border/50">
                              {selectedNode.reasoning}
                            </p>
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </main>
    </div>
  );
}
