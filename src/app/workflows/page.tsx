'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Network, Plus, Settings2, Play, GitMerge, Cpu, Trash2, Shield, Bot, CheckCircle2, ChevronRight, GripVertical, Activity } from 'lucide-react';

interface FlowStep {
  id: string;
  agentName: string;
  action: string;
  onSuccess: string | null;
  onFailure: string | null;
  x: number;
  y: number;
}

interface Workflow {
  id: string;
  name: string;
  actionGroup: string;
  isActive: boolean;
  steps: FlowStep[];
}

const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-code-1',
    name: 'Default Coding Pipeline',
    actionGroup: 'Coding',
    isActive: true,
    steps: [
      { id: 's1', agentName: 'Donna', action: 'Parse Intent', onSuccess: 's2', onFailure: null, x: 100, y: 150 },
      { id: 's2', agentName: 'Orchestrator', action: 'Plan Architecture', onSuccess: 's3', onFailure: null, x: 250, y: 150 },
      { id: 's3', agentName: 'Executor', action: 'Write Code', onSuccess: 's4', onFailure: 's6', x: 400, y: 150 },
      { id: 's4', agentName: 'Tester', action: 'Run Tests', onSuccess: 's5', onFailure: 's6', x: 550, y: 150 },
      { id: 's5', agentName: 'Supreme Auditor', action: 'Security Scan', onSuccess: 'out', onFailure: 's6', x: 700, y: 150 },
      { id: 's6', agentName: 'Healer', action: 'Patch Errors', onSuccess: 's3', onFailure: null, x: 550, y: 280 },
    ]
  },
  {
    id: 'wf-code-2',
    name: 'Fast Execution (No Audit)',
    actionGroup: 'Coding',
    isActive: false,
    steps: [
      { id: 's1', agentName: 'Donna', action: 'Parse Intent', onSuccess: 's2', onFailure: null, x: 150, y: 150 },
      { id: 's2', agentName: 'Executor', action: 'Execute Directly', onSuccess: 'out', onFailure: null, x: 450, y: 150 },
    ]
  },
  {
    id: 'wf-search-1',
    name: 'Deep Research Synthesis',
    actionGroup: 'Searching',
    isActive: true,
    steps: [
      { id: 's1', agentName: 'Donna', action: 'Query Expansion', onSuccess: 's2', onFailure: null, x: 150, y: 150 },
      { id: 's2', agentName: 'Research Assistant', action: 'Scrape Sites', onSuccess: 's3', onFailure: null, x: 400, y: 150 },
      { id: 's3', agentName: 'Supreme Auditor', action: 'Fact Check', onSuccess: 'out', onFailure: 's2', x: 650, y: 150 },
    ]
  },
  {
    id: 'wf-conv-1',
    name: 'Normal Conversational Execution',
    actionGroup: 'Conversational',
    isActive: true,
    steps: [
      { id: 's1', agentName: 'Donna', action: 'Input Parsed', onSuccess: 's2', onFailure: null, x: 100, y: 150 },
      { id: 's2', agentName: 'Donna', action: 'Reasoning', onSuccess: 's3', onFailure: null, x: 300, y: 150 },
      { id: 's3', agentName: 'Supreme Auditor', action: 'Audit', onSuccess: 's4', onFailure: 'out', x: 500, y: 150 },
      { id: 's4', agentName: 'Executor', action: 'Execution Engine', onSuccess: 'out', onFailure: null, x: 700, y: 150 },
    ]
  }
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(INITIAL_WORKFLOWS);
  const [activeGroup, setActiveGroup] = useState<string>('Coding');
  const [selectedWfId, setSelectedWfId] = useState<string>('wf-code-1');

  const groups = Array.from(new Set(workflows.map(w => w.actionGroup)));
  const currentGroupWorkflows = workflows.filter(w => w.actionGroup === activeGroup);
  const selectedWf = workflows.find(w => w.id === selectedWfId) || currentGroupWorkflows[0];

  const handleToggleActive = (wfId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.actionGroup === activeGroup) {
        return { ...w, isActive: w.id === wfId };
      }
      return w;
    }));
  };

  const handleAddGroup = () => {
    const name = `New Domain ${Math.floor(Math.random() * 1000)}`;
    if (!groups.includes(name)) {
      const newWf: Workflow = { id: `wf-${Date.now()}`, name: 'New Flow', actionGroup: name, isActive: true, steps: [] };
      setWorkflows([...workflows, newWf]);
      setActiveGroup(name);
      setSelectedWfId(newWf.id);
    }
  };

  const handleAddWorkflow = () => {
    const name = `New Variant ${Math.floor(Math.random() * 1000)}`;
    const newWf: Workflow = { id: `wf-${Date.now()}`, name, actionGroup: activeGroup, isActive: false, steps: [] };
    setWorkflows([...workflows, newWf]);
    setSelectedWfId(newWf.id);
  };

  const handleAddNode = () => {
    if (!selectedWf) return;
    const newStep: FlowStep = {
      id: `s-${Date.now()}`,
      agentName: 'Donna',
      action: 'New Action',
      onSuccess: 'out',
      onFailure: null,
      x: 100 + selectedWf.steps.length * 150,
      y: 150
    };
    setWorkflows(workflows.map(w => w.id === selectedWf.id ? { ...w, steps: [...w.steps, newStep] } : w));
  };

  const handleDeleteNode = (stepId: string) => {
    if (!selectedWf) return;
    setWorkflows(workflows.map(w => w.id === selectedWf.id ? { ...w, steps: w.steps.filter(s => s.id !== stepId) } : w));
  };

  const handleUpdateNode = (stepId: string, field: keyof FlowStep, value: string | null) => {
    if (!selectedWf) return;
    setWorkflows(workflows.map(w => w.id === selectedWf.id ? {
      ...w,
      steps: w.steps.map(s => s.id === stepId ? { ...s, [field]: value === 'none' ? null : value } : s)
    } : w));
  };

  const getAgentIcon = (name: string) => {
    if (name === 'Donna') return Bot;
    if (name === 'Supreme Auditor') return Shield;
    if (name === 'Healer') return Plus;
    if (name === 'Tester') return Activity;
    return Cpu;
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/workflows" />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>

        {/* Top Header */}
        <div className="p-8 border-b border-border bg-card/40 backdrop-blur-md shrink-0">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Network className="text-accent" /> Orchestration Flows
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Design neural pathways and fallback loops for specific intent actions.</p>
            </div>
            <button onClick={handleAddGroup} className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
              <Plus size={18} /> Create Group
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Groups & Variants */}
          <div className="w-80 border-r border-border bg-card/20 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-5 border-b border-border/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Action Domains</h3>
              <div className="space-y-1">
                {groups.map(g => (
                  <button
                    key={g}
                    onClick={() => { setActiveGroup(g); setSelectedWfId(workflows.find(w => w.actionGroup === g)!.id); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex justify-between items-center
                      ${activeGroup === g ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50 text-foreground'}`}
                  >
                    {g}
                    {activeGroup === g && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flow Variants</h3>
                <button onClick={handleAddWorkflow} className="text-accent hover:text-accent/80 text-xs font-medium"><Plus size={14} /></button>
              </div>
              <div className="space-y-3">
                {currentGroupWorkflows.map(wf => (
                  <div 
                    key={wf.id}
                    onClick={() => setSelectedWfId(wf.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all
                      ${selectedWfId === wf.id ? 'bg-card border-accent/40 shadow-sm' : 'bg-background/50 border-border hover:border-accent/20'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-sm leading-tight pr-2">{wf.name}</span>
                      {wf.isActive && <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Active</span>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground font-mono">{wf.steps.length} Nodes</span>
                      {!wf.isActive && (
                        <div onClick={(e) => { e.stopPropagation(); handleToggleActive(wf.id); }} className="w-8 h-4 rounded-full relative cursor-pointer border bg-muted border-border transition-colors">
                          <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-muted-foreground transition-all"></div>
                        </div>
                      )}
                      {wf.isActive && (
                        <div className="w-8 h-4 rounded-full relative cursor-default border bg-green-500/20 border-green-500/50 transition-colors">
                          <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 transition-all"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Flow Visualizer & Editor */}
          <div className="flex-1 flex flex-col bg-background/50 overflow-hidden">
            {selectedWf ? (
              <>
                {/* SVG Visualizer (Top Half) */}
                <div className="flex-[3] border-b border-border relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-card/30 via-background to-background">
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-background border border-border text-xs px-3 py-1.5 rounded-lg font-mono font-bold text-muted-foreground shadow-sm">
                      {selectedWf.id}
                    </span>
                    <button className="bg-background border border-border p-1.5 rounded-lg text-muted-foreground hover:text-accent transition-colors shadow-sm">
                      <Settings2 size={16} />
                    </button>
                  </div>
                  
                  {/* The SVG Canvas */}
                  <svg className="w-full h-full">
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)" />
                      </marker>
                      <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                      </marker>
                    </defs>

                    {/* Draw Edges */}
                    {selectedWf.steps.map(step => {
                      const edges = [];
                      if (step.onSuccess && step.onSuccess !== 'out') {
                        const target = selectedWf.steps.find(s => s.id === step.onSuccess);
                        if (target) {
                          edges.push(
                            <path 
                              key={`${step.id}-succ`}
                              d={`M ${step.x} ${step.y} Q ${(step.x + target.x)/2} ${step.y - (target.x < step.x ? 80 : 0)} ${target.x} ${target.y}`}
                              fill="none" stroke="var(--accent)" strokeWidth="2" strokeOpacity="0.6" markerEnd="url(#arrowhead)"
                            />
                          );
                        }
                      }
                      if (step.onFailure) {
                        const target = selectedWf.steps.find(s => s.id === step.onFailure);
                        if (target) {
                          edges.push(
                            <path 
                              key={`${step.id}-fail`}
                              d={`M ${step.x} ${step.y} Q ${(step.x + target.x)/2} ${Math.max(step.y, target.y) + 60} ${target.x} ${target.y}`}
                              fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" strokeOpacity="0.7" markerEnd="url(#arrowhead-red)"
                            />
                          );
                        }
                      }
                      return edges;
                    })}

                    {/* Draw Nodes */}
                    {selectedWf.steps.map(step => {
                      const Icon = getAgentIcon(step.agentName);
                      return (
                        <g key={step.id} transform={`translate(${step.x}, ${step.y})`} className="cursor-pointer">
                          <circle r="22" fill="var(--card)" stroke="var(--accent)" strokeWidth="2" className="shadow-lg" />
                          <foreignObject x="-10" y="-10" width="20" height="20">
                            <div className="w-full h-full flex items-center justify-center text-accent">
                              <Icon size={14} />
                            </div>
                          </foreignObject>
                          <rect x="-50" y="28" width="100" height="40" rx="6" fill="var(--background)" stroke="var(--border)" strokeWidth="1" />
                          <text y="44" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontFamily="'Inter', sans-serif" fontWeight="bold">
                            {step.agentName}
                          </text>
                          <text y="58" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9" fontFamily="'Inter', sans-serif">
                            {step.action}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Form-Based Steps Editor (Bottom Half) */}
                <div className="flex-[2] bg-card/40 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Execution Sequence</h3>
                      <button onClick={handleAddNode} className="text-accent text-sm font-medium hover:underline flex items-center gap-1"><Plus size={14}/> Add Node</button>
                    </div>

                    <div className="space-y-3">
                      {selectedWf.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-4 bg-background border border-border p-4 rounded-xl shadow-sm group">
                          <GripVertical size={16} className="text-muted-foreground cursor-grab opacity-50 hover:opacity-100" />
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-bold border border-border/50 shrink-0">
                            {idx + 1}
                          </div>
                          <div className="grid grid-cols-4 gap-4 flex-1">
                            <div>
                              <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Agent</label>
                              <select className="w-full bg-card border border-border rounded p-2 text-xs focus:outline-none focus:border-accent" value={step.agentName} onChange={(e)=>handleUpdateNode(step.id, 'agentName', e.target.value)}>
                                <option>Donna</option>
                                <option>Supreme Auditor</option>
                                <option>Executor</option>
                                <option>Healer</option>
                                <option>Tester</option>
                                <option>Research Assistant</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block">Action</label>
                              <input type="text" className="w-full bg-card border border-border rounded p-2 text-xs focus:outline-none focus:border-accent" value={step.action} onChange={(e)=>handleUpdateNode(step.id, 'action', e.target.value)} />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase text-green-500 font-bold mb-1 block">On Success</label>
                              <select className="w-full bg-card border border-border rounded p-2 text-xs focus:outline-none focus:border-green-500" value={step.onSuccess || 'out'} onChange={(e)=>handleUpdateNode(step.id, 'onSuccess', e.target.value)}>
                                <option value="out">End Flow</option>
                                {selectedWf.steps.filter(s => s.id !== step.id).map(s => (
                                  <option key={s.id} value={s.id}>Goto Step: {s.action}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase text-red-500 font-bold mb-1 block">On Failure</label>
                              <select className="w-full bg-card border border-border rounded p-2 text-xs focus:outline-none focus:border-red-500" value={step.onFailure || 'none'} onChange={(e)=>handleUpdateNode(step.id, 'onFailure', e.target.value)}>
                                <option value="none">Halt Execution</option>
                                {selectedWf.steps.filter(s => s.id !== step.id).map(s => (
                                  <option key={s.id} value={s.id}>Goto Step: {s.action}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteNode(step.id)} className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a workflow variant to edit
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
