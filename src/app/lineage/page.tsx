'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { GitBranch, Database, Cpu, FileText, Server, Compass, CheckCircle, Info } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'Source' | 'Processor' | 'Vector DB' | 'Model Ingestion' | 'Audit Sink';
  x: number;
  y: number;
  status: 'Healthy' | 'Active' | 'Idle';
  details: {
    format: string;
    throughput: string;
    encryption: string;
    description: string;
  };
}

interface GraphLink {
  from: string;
  to: string;
}

export default function LineagePage() {
  const nodes: GraphNode[] = [
    {
      id: 'n1',
      label: 'Confluence Knowledge Wiki',
      type: 'Source',
      x: 80,
      y: 100,
      status: 'Healthy',
      details: {
        format: 'Markdown / HTML API',
        throughput: '12 docs/min',
        encryption: 'AES-256',
        description: 'Primary customer support guides and policy documentation.',
      },
    },
    {
      id: 'n2',
      label: 'Zendesk Ticket Ingestion',
      type: 'Source',
      x: 80,
      y: 300,
      status: 'Healthy',
      details: {
        format: 'JSON / REST API',
        throughput: '240 tickets/hr',
        encryption: 'TLS 1.3',
        description: 'Live sync of customer problem statements and resolution threads.',
      },
    },
    {
      id: 'n3',
      label: 'Text Chunking Processor',
      type: 'Processor',
      x: 280,
      y: 200,
      status: 'Active',
      details: {
        format: 'Recursive character chunks',
        throughput: '4k tokens/sec',
        encryption: 'In-Memory',
        description: 'Splits raw textual outputs into overlapping blocks of 512 tokens.',
      },
    },
    {
      id: 'n4',
      label: 'embedding-ada-002 model',
      type: 'Processor',
      x: 480,
      y: 200,
      status: 'Active',
      details: {
        format: '1536 float arrays',
        throughput: '1.2s inference lat',
        encryption: 'SSL/TLS',
        description: 'Produces high-dimensional vector embeddings of chunked resources.',
      },
    },
    {
      id: 'n5',
      label: 'Pinecone Similarity Store',
      type: 'Vector DB',
      x: 680,
      y: 200,
      status: 'Healthy',
      details: {
        format: 'Pinecone Index (Cosine)',
        throughput: '2.4M items synced',
        encryption: 'At-Rest KMS',
        description: 'Hosts high-dimensional vectors to allow semantic similarity queries.',
      },
    },
    {
      id: 'n6',
      label: 'Donna Reasoning Core',
      type: 'Model Ingestion',
      x: 880,
      y: 100,
      status: 'Active',
      details: {
        format: 'Gemini 1.5 Pro Context',
        throughput: '14 ms query lookup',
        encryption: 'Enterprise Shield',
        description: 'The core agent logic orchestrating retrieval and policy execution.',
      },
    },
    {
      id: 'n7',
      label: 'Compliance Audit Sink',
      type: 'Audit Sink',
      x: 880,
      y: 300,
      status: 'Active',
      details: {
        format: 'Append-Only Ledger',
        throughput: '100% write rate',
        encryption: 'Immutable SHA-256',
        description: 'Cryptographic ledger registering all context usages and decodings.',
      },
    },
  ];

  const links: GraphLink[] = [
    { from: 'n1', to: 'n3' },
    { from: 'n2', to: 'n3' },
    { from: 'n3', to: 'n4' },
    { from: 'n4', to: 'n5' },
    { from: 'n5', to: 'n6' },
    { from: 'n6', to: 'n7' },
  ];

  const [selectedNode, setSelectedNode] = useState<GraphNode>(nodes[4]);

  // Construct SVG Bezier Curve path between coordinates
  const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.5;
    const cy1 = y1;
    const cx2 = x1 + dx * 0.5;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/lineage" />
      <main className="flex-1 flex flex-col relative overflow-y-auto p-12">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes lineFlow {
            from { stroke-dashoffset: 20; }
            to { stroke-dashoffset: 0; }
          }
          .animate-flow {
            stroke-dasharray: 6, 4;
            animation: lineFlow 1.2s linear infinite;
          }
        `}} />

        <div className="max-w-6xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-4xl font-display font-bold flex items-center gap-4">
              <GitBranch className="text-accent" /> Data Lineage
            </h1>
            <p className="text-muted-foreground mt-2 font-sans">
              Trace origin, transformations, vector index updates, and compliance paths across the system.
            </p>
          </div>

          {/* Interactive SVG graph container */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-x-auto">
            <div className="min-w-[1000px] h-[400px] relative bg-background/30 rounded-xl border border-border/40">
              <svg className="absolute inset-0 w-full h-full">
                {/* Connections (Links) */}
                {links.map((link, idx) => {
                  const fromNode = nodes.find((n) => n.id === link.from)!;
                  const toNode = nodes.find((n) => n.id === link.to)!;
                  const isHighlighted = selectedNode.id === fromNode.id || selectedNode.id === toNode.id;

                  return (
                    <g key={idx}>
                      {/* Background Link Glow */}
                      <path
                        d={getBezierPath(fromNode.x + 10, fromNode.y, toNode.x - 10, toNode.y)}
                        fill="none"
                        stroke={isHighlighted ? 'var(--accent)' : 'var(--border)'}
                        strokeWidth={isHighlighted ? 4 : 2}
                        className="transition-all duration-300 opacity-30"
                      />
                      {/* Animated Flow Pulse */}
                      <path
                        d={getBezierPath(fromNode.x + 10, fromNode.y, toNode.x - 10, toNode.y)}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth={1.5}
                        className="animate-flow opacity-60"
                      />
                    </g>
                  );
                })}

                {/* Nodes rendering */}
                {nodes.map((node) => {
                  const isSelected = selectedNode.id === node.id;
                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      {/* Outer Ring */}
                      <circle
                        cx="0"
                        cy="0"
                        r="24"
                        fill="var(--card)"
                        stroke={isSelected ? 'var(--accent)' : 'var(--border)'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="transition-all duration-300 shadow-sm group-hover:scale-105"
                      />

                      {/* Animated Inner Status Pulse */}
                      {node.status === 'Active' && (
                        <circle
                          cx="0"
                          cy="0"
                          r="28"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="1"
                          className="opacity-40 animate-ping"
                        />
                      )}

                      {/* Icon Centered */}
                      <g transform="translate(-8, -8)" className={isSelected ? 'text-accent' : 'text-muted-foreground'}>
                        {node.type === 'Source' && <FileText size={16} />}
                        {node.type === 'Processor' && <Cpu size={16} />}
                        {node.type === 'Vector DB' && <Database size={16} />}
                        {node.type === 'Model Ingestion' && <Compass size={16} />}
                        {node.type === 'Audit Sink' && <Server size={16} />}
                      </g>

                      {/* Text details */}
                      <text
                        x="0"
                        y="40"
                        textAnchor="middle"
                        className={`text-[11px] font-semibold transition-colors
                          ${isSelected ? 'fill-accent' : 'fill-foreground'}`}
                      >
                        {node.label}
                      </text>
                      
                      <text
                        x="0"
                        y="52"
                        textAnchor="middle"
                        className="text-[9px] fill-muted-foreground font-mono"
                      >
                        {node.type}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Node detail inspector panel */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center text-accent shrink-0">
              <Info size={22} />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-semibold text-lg">{selectedNode.label}</h3>
                <span className="text-xs font-mono bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground uppercase">{selectedNode.type}</span>
                <span className="flex items-center gap-1 text-[10px] text-green-500 font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/15">
                  <CheckCircle size={10} /> {selectedNode.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedNode.details.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-xs shrink-0">
              <div>
                <span className="text-muted-foreground block mb-0.5">Throughput</span>
                <span className="font-semibold font-mono">{selectedNode.details.throughput}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Security</span>
                <span className="font-semibold font-mono">{selectedNode.details.encryption}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Format</span>
                <span className="font-semibold">{selectedNode.details.format}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
