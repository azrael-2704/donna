'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Database,
  Brain,
  Wrench,
  CheckCircle,
  LogOut,
  AlertTriangle,
  Clock,
  Cpu,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { DecisionTrace, TraceStep, Session } from '@/lib/types';
import NeuralFabric from '@/components/NeuralFabric';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

type StepType = TraceStep['type'];

const stepConfig: Record<StepType, { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; color: string; glow: string; border: string }> = {
  input: {
    icon: MessageSquare,
    label: 'INPUT',
    color: 'text-zinc-400 dark:text-zinc-300',
    glow: 'rgba(161, 161, 170, 0.35)',
    border: 'rgba(161, 161, 170, 0.6)',
  },
  retrieve: {
    icon: Database,
    label: 'RETRIEVE',
    color: 'text-amber-500',
    glow: 'rgba(245,158,11,0.35)',
    border: 'rgba(245,158,11,0.7)',
  },
  reason: {
    icon: Brain,
    label: 'REASON',
    color: 'text-blue-500',
    glow: 'rgba(59,130,246,0.35)',
    border: 'rgba(59,130,246,0.7)',
  },
  tool: {
    icon: Wrench,
    label: 'TOOL',
    color: 'text-purple-500',
    glow: 'rgba(168,85,247,0.35)',
    border: 'rgba(168,85,247,0.7)',
  },
  audit: {
    icon: Shield,
    label: 'AUDIT',
    color: 'text-green-500',
    glow: 'rgba(34,197,94,0.35)',
    border: 'rgba(34,197,94,0.7)',
  },
  output: {
    icon: LogOut,
    label: 'OUTPUT',
    color: 'text-zinc-400 dark:text-zinc-300',
    glow: 'rgba(161, 161, 170, 0.35)',
    border: 'rgba(161, 161, 170, 0.6)',
  },
};

const statusStyle: Record<TraceStep['status'], { badge: string }> = {
  success: { badge: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30' },
  flagged: { badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  error: { badge: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  pending: { badge: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30' },
};

function PipelineNode({ step, isSelected, onClick }: { step: TraceStep; isSelected: boolean; onClick: () => void }) {
  const cfg = stepConfig[step.type];
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-background/80 backdrop-blur-md"
        style={{
          border: `2px solid ${cfg.border}`,
          boxShadow: isSelected
            ? `0 0 0 3px ${cfg.glow}, 0 0 20px ${cfg.glow}`
            : `0 0 8px ${cfg.glow}`,
          transform: isSelected ? 'scale(1.12)' : 'scale(1)',
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <Icon size={22} className={`${cfg.color} transition-colors`} />
          <span className={`text-[9px] font-bold tracking-widest ${cfg.color}`}>{cfg.label}</span>
        </div>

        {step.status === 'flagged' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <AlertTriangle size={10} className="text-white" />
          </div>
        )}
        {step.status === 'success' && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle size={10} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="flex items-center mx-1">
      <div className={`h-px w-12 transition-colors duration-300 ${active ? 'bg-accent/50' : 'bg-border'}`} />
      <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
        <path
          d="M0 5 L8 5 M5 2 L8 5 L5 8"
          stroke={active ? 'currentColor' : 'var(--border)'}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={active ? 'text-accent/50' : 'text-border'}
        />
      </svg>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-card border border-border rounded-lg p-4 text-xs font-mono text-foreground leading-relaxed overflow-x-auto whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function StepDetail({ step }: { step: TraceStep }) {
  const cfg = stepConfig[step.type];
  const Icon = cfg.icon;
  const ss = statusStyle[step.status];
  const hasInputCode = step.input.code;
  const hasOutputCode = step.output.code;

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <span className="font-mono text-sm text-muted-foreground">{step.timestamp}</span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${ss.badge}`}>
          {step.status.toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <Icon size={16} className={cfg.color} />
          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
            [{step.agentName.split(' ')[0].toUpperCase()}] {cfg.label}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock size={12} />{step.latency}ms</span>
          <span className="flex items-center gap-1.5"><DollarSign size={12} />${step.cost.toFixed(3)}</span>
          <span className="flex items-center gap-1.5"><Cpu size={12} />{step.confidence}% conf</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Input / Thought Process</h4>
        <div className="bg-card/50 border border-border rounded-xl p-4 space-y-3 shadow-sm backdrop-blur-sm">
          {step.input.instruction && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Instruction</p>
              <p className="text-sm text-foreground leading-relaxed">{step.input.instruction}</p>
            </div>
          )}
          {step.input.query && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Query</p>
              <p className="text-sm text-foreground font-mono leading-relaxed">{step.input.query}</p>
            </div>
          )}
          {step.input.context && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Context</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.input.context}</p>
            </div>
          )}
          {hasInputCode && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Code</p>
              <CodeBlock>{step.input.code!}</CodeBlock>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Reasoning</h4>
        <div className="bg-card/50 border border-border rounded-xl p-4 shadow-sm backdrop-blur-sm">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.reasoning}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Outcome / Output</h4>
        <div className="bg-card/50 border border-border rounded-xl p-4 space-y-3 shadow-sm backdrop-blur-sm">
          {step.output.result && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Result</p>
              <CodeBlock>{step.output.result}</CodeBlock>
            </div>
          )}
          {step.output.data && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Data</p>
              <CodeBlock>{step.output.data}</CodeBlock>
            </div>
          )}
          {hasOutputCode && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Code</p>
              <CodeBlock>{step.output.code!}</CodeBlock>
            </div>
          )}
          {step.output.error && (
            <div>
              <p className="text-xs font-semibold text-red-500 mb-1.5 uppercase tracking-wider">Error</p>
              <CodeBlock>{step.output.error}</CodeBlock>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TraceItem({ trace, isSelected, onClick }: { trace: DecisionTrace; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 transition-all duration-200 border-l-2
        ${isSelected
          ? 'bg-accent/5 border-accent text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }
      `}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-sm font-medium truncate">{trace.agentName}</span>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            trace.status === 'success' ? 'bg-green-500' :
            trace.status === 'flagged' ? 'bg-amber-500' :
            'bg-red-500'
          }`}
        />
      </div>
      <p className="text-xs text-muted-foreground truncate leading-relaxed">{trace.trigger}</p>
      <p className="text-xs text-muted-foreground mt-1 font-mono">{trace.startTime}</p>
    </button>
  );
}

function SessionGroup({ session, selectedTraceId, onSelectTrace }: { session: Session; selectedTraceId: string | null; onSelectTrace: (trace: DecisionTrace) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-xs font-semibold text-foreground">{session.label}</span>
        <span className="text-xs text-muted-foreground">({session.timestamp})</span>
        <ChevronDown
          size={14}
          className={`ml-auto text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {open && session.traces.map((trace) => (
        <TraceItem
          key={trace.id}
          trace={trace}
          isSelected={selectedTraceId === trace.id}
          onClick={() => onSelectTrace(trace)}
        />
      ))}
    </div>
  );
}

export default function AuditPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<DecisionTrace | null>(null);
  const [selectedStep, setSelectedStep] = useState<TraceStep | null>(null);
  const [loading, setLoading] = useState(true);
  const detailRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'decision_logs'),
      orderBy('startTime', 'desc'),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Group logs by session/date for now
      const sessionMap = new Map<string, Session>();
      
      snapshot.docs.forEach(doc => {
        const trace = { ...doc.data(), id: doc.id } as DecisionTrace;
        const dateLabel = new Date(trace.startTime).toLocaleDateString();
        
        if (!sessionMap.has(dateLabel)) {
          sessionMap.set(dateLabel, {
            id: `session-${dateLabel}`,
            label: `Session ${dateLabel}`,
            timestamp: dateLabel,
            traces: []
          });
        }
        sessionMap.get(dateLabel)!.traces.push(trace);
      });
      
      const loadedSessions = Array.from(sessionMap.values());
      setSessions(loadedSessions);
      setLoading(false);
      
      if (loadedSessions.length > 0 && !selectedTrace) {
        const firstTrace = loadedSessions[0].traces[0];
        setSelectedTrace(firstTrace);
        setSelectedStep(firstTrace.steps?.[0] || null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSelectTrace = (trace: DecisionTrace) => {
    setSelectedTrace(trace);
    setSelectedStep(trace.steps?.[0] || null);
  };

  const handleSelectStep = (step: TraceStep) => {
    setSelectedStep(step);
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const traceTotalCost = selectedTrace?.steps?.reduce((s, st) => s + (st.cost || 0), 0) || 0;
  const traceTotalLatency = selectedTrace?.steps?.reduce((s, st) => s + (st.latency || 0), 0) || 0;
  const traceAvgConf = selectedTrace?.steps?.length 
    ? Math.round(selectedTrace.steps.reduce((s, st) => s + (st.confidence || 0), 0) / selectedTrace.steps.length)
    : 0;

  return (
    <div className="h-full flex bg-background overflow-hidden relative">
      <Sidebar activeHref="/audit" />
      
      {/* Absolute Header with ThemeSwitcher */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      {/* Left sidebar */}
      <aside className="w-72 shrink-0 border-r border-border flex flex-col bg-card/40 backdrop-blur-xl z-20">
        <div className="px-5 py-5 border-b border-border bg-background/50">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-accent" />
            <h1 className="text-base font-semibold text-foreground">Audit Trail</h1>
          </div>
          <p className="text-xs text-muted-foreground">Neural Decision Lineage</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading audit logs...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No decisions logged yet.</div>
          ) : (
            sessions.map((session) => (
              <SessionGroup
                key={session.id}
                session={session}
                selectedTraceId={selectedTrace?.id ?? null}
                onSelectTrace={handleSelectTrace}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background/80">
        
        {/* Background Fabric representing the data lineage/neural map */}
        <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
           <NeuralFabric density={40} connectionDistance={140} speed={0.2} />
        </div>

        {/* Trace header */}
        {selectedTrace ? (
          <>
            <div className="px-8 py-5 border-b border-border flex items-center justify-between shrink-0 bg-background/60 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{selectedTrace.agentName}</span>
                <ChevronRight size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate max-w-sm">{selectedTrace.trigger}</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground pr-10">
                <span className="flex items-center gap-1.5"><Clock size={12} />{(traceTotalLatency / 1000).toFixed(2)}s</span>
                <span className="flex items-center gap-1.5"><DollarSign size={12} />${traceTotalCost.toFixed(3)}</span>
                <span className="flex items-center gap-1.5"><Cpu size={12} />{traceAvgConf}% avg conf</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground border border-border">
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Pipeline visualization */}
            <div className="px-8 py-10 border-b border-border bg-card/30 backdrop-blur-md shrink-0 relative z-10 shadow-sm">
              <div className="flex items-center justify-center">
                {selectedTrace.steps?.map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    <PipelineNode
                      step={step}
                      isSelected={selectedStep?.id === step.id}
                      onClick={() => handleSelectStep(step)}
                    />
                    {i < selectedTrace.steps.length - 1 && (
                      <Connector active={i < (selectedTrace.steps.findIndex(s => s.id === selectedStep?.id) ?? 0)} />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center mt-4 gap-0">
                {selectedTrace.steps?.map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className="w-20 text-center cursor-pointer"
                      onClick={() => handleSelectStep(step)}
                    >
                      <p className={`text-xs font-medium transition-colors ${
                        selectedStep?.id === step.id ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.agentName?.split(' ')[0] || 'Unknown'}
                      </p>
                    </div>
                    {i < selectedTrace.steps.length - 1 && <div className="w-[52px]" />}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 z-10">
            <div className="text-center bg-card/50 p-12 rounded-2xl border border-border backdrop-blur-md">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a trace to view decision lineage</p>
            </div>
          </div>
        )}

        {/* Step detail */}
        <div ref={detailRef} className="flex-1 overflow-y-auto px-8 py-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {selectedStep ? (
              <StepDetail step={selectedStep} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center bg-card/50 p-12 rounded-2xl border border-border backdrop-blur-md">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a step in the pipeline to inspect</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
