import React from 'react';
import { Network, MessageSquare, Brain, Shield, Send } from 'lucide-react';

interface Props {
  auditOpen: boolean;
  selectedAuditNode: number | null;
  setSelectedAuditNode: (node: number | null) => void;
  selectedTrace: any;
}

export default function DecisionTraceSidebar({
  auditOpen,
  selectedAuditNode,
  setSelectedAuditNode,
  selectedTrace
}: Props) {
  const tryParseJSON = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const formatPayload = (payload: any) => {
    if (typeof payload === 'object' && payload !== null) {
      const formatted: any = {};
      for (const key in payload) {
        if (typeof payload[key] === 'string') {
          formatted[key] = tryParseJSON(payload[key]);
        } else {
          formatted[key] = payload[key];
        }
      }
      return JSON.stringify(formatted, null, 2);
    }
    return JSON.stringify(payload, null, 2);
  };
  return (
    <div className={`transition-all duration-300 ease-in-out border-l border-border bg-card/60 backdrop-blur-2xl flex flex-col shrink-0 z-20 shadow-2xl relative
      ${auditOpen ? 'w-[520px]' : 'w-0 border-l-0 overflow-hidden'}`}
    >
      <div className="p-6 border-b border-border/50 flex items-center justify-between min-w-[520px]">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Network size={16} className="text-accent"/> Decision Trace</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Live Action Audit</p>
        </div>
        <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Audited</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 min-w-[520px]">
        
        {/* Detailed SVG Flow */}
        <div className="bg-background/50 border border-border/50 rounded-2xl h-[240px] relative overflow-hidden flex items-center justify-center shadow-inner group">
          <svg viewBox="0 0 500 300" className="w-full h-full opacity-90 transition-transform group-hover:scale-105">
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="14" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="var(--accent)" />
              </marker>
            </defs>
            <line x1="100" y1="150" x2="200" y2="150" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
            <line x1="200" y1="150" x2="300" y2="150" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow)" />
            <line x1="300" y1="150" x2="400" y2="150" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#arrow)" />
            
            {/* Nodes */}
            <g transform="translate(100, 150)" onClick={() => setSelectedAuditNode(1)} className="cursor-pointer transition-all hover:scale-110 origin-center" style={{transformOrigin: "100px 150px"}}>
              <circle r="20" fill={selectedAuditNode === 1 ? "var(--accent)" : "var(--card)"} stroke="var(--accent)" strokeWidth="2" />
              <foreignObject x="-10" y="-10" width="20" height="20">
                <MessageSquare size={20} color={selectedAuditNode === 1 ? "var(--background)" : "var(--accent)"} />
              </foreignObject>
              <text y="40" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="bold">Input Parsed</text>
            </g>

            <g transform="translate(200, 150)" onClick={() => setSelectedAuditNode(2)} className="cursor-pointer transition-all hover:scale-110 origin-center" style={{transformOrigin: "200px 150px"}}>
              <circle r="24" fill={selectedAuditNode === 2 ? "var(--accent)" : "var(--card)"} stroke="var(--accent)" strokeWidth="2" className={selectedAuditNode === 2 ? "animate-pulse" : ""} />
              <foreignObject x="-12" y="-12" width="24" height="24">
                <Brain size={24} color={selectedAuditNode === 2 ? "var(--background)" : "var(--accent)"} />
              </foreignObject>
              <text y="44" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="bold">Reasoning</text>
              <text y="58" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">Donna</text>
            </g>

            <g transform="translate(300, 150)" onClick={() => setSelectedAuditNode(3)} className="cursor-pointer transition-all hover:scale-110 origin-center" style={{transformOrigin: "300px 150px"}}>
              <circle r="20" fill={selectedAuditNode === 3 ? "#22c55e" : "var(--card)"} stroke="#22c55e" strokeWidth="2" />
              <foreignObject x="-10" y="-10" width="20" height="20">
                <Shield size={20} color={selectedAuditNode === 3 ? "var(--background)" : "#22c55e"} />
              </foreignObject>
              <text y="40" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="bold">Audit</text>
              <text y="54" textAnchor="middle" fill="#22c55e" fontSize="10">Cleared</text>
            </g>

            <g transform="translate(400, 150)" onClick={() => setSelectedAuditNode(4)} className="cursor-pointer transition-all hover:scale-110 origin-center" style={{transformOrigin: "400px 150px"}}>
              <circle r="20" fill={selectedAuditNode === 4 ? "var(--accent)" : "var(--card)"} stroke="var(--accent)" strokeWidth="2" />
              <foreignObject x="-10" y="-10" width="20" height="20">
                <Send size={20} color={selectedAuditNode === 4 ? "var(--background)" : "var(--accent)"} />
              </foreignObject>
              <text y="40" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="bold">Execution</text>
            </g>
          </svg>
        </div>

        <div className="space-y-6">
          
          {/* Reasoning Log & Metadata */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 flex items-center gap-2">
              <Brain size={14} className="text-accent" /> Node Metadata
            </h4>
            
            {!selectedTrace && (
              <div className="text-sm text-muted-foreground text-center py-10">
                No trace data available for this decision.
              </div>
            )}

            {selectedTrace && selectedAuditNode && selectedTrace.steps && selectedTrace.steps[selectedAuditNode - 1] && (() => {
              const step = selectedTrace.steps[selectedAuditNode - 1];
              return (
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 shadow space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-foreground text-sm">
                      {selectedAuditNode === 1 ? 'Input Parsed' : selectedAuditNode === 2 ? 'Reasoning' : selectedAuditNode === 3 ? 'Audit' : 'Execution'}
                    </div>
                    <div className="text-xs font-medium text-accent">
                      {step.agentName || 'Unknown Agent'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reasoning</div>
                    <div className="text-sm text-foreground leading-relaxed">
                      {step.reasoning || 'No reasoning provided.'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Response Output</div>
                    <div className="text-sm text-muted-foreground bg-card p-2 rounded border border-border/50 font-mono text-xs break-all">
                      {step.output?.data || step.output?.result || JSON.stringify(step.output) || 'No output.'}
                    </div>
                  </div>

                  {step.input && Object.keys(step.input).length > 0 && (
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Payload Input</div>
                      <div className="bg-card border border-border/50 p-2 rounded font-mono text-xs text-green-700 dark:text-green-400 overflow-x-auto shadow-inner relative">
                        <pre>
{formatPayload(step.input)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-border/50">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost</div>
                      <div className="text-sm font-bold text-foreground">${step.cost || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Latency</div>
                      <div className="text-sm font-bold text-foreground">{step.latency || 0}ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</div>
                      <div className="text-sm font-bold text-green-500">{step.confidence || 0}%</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          
        </div>
      </div>
    </div>
  );
}
