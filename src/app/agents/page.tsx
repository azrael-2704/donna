'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Bot, Shield, Zap, Plus, Activity, Cpu, X, Settings2, SlidersHorizontal, Server, Save, Trash2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

interface Agent {
  id: string;
  name: string;
  status: 'Active' | 'Sleeping' | 'Error';
  load: string;
  confidence: number;
  isSystem?: boolean;
  prompt?: string;
  model?: string;
  tools?: string[];
  maxSteps?: number;
}

const SYSTEM_AGENTS: Agent[] = [
  { id: 'sys-1', name: 'Donna', status: 'Sleeping', load: '0.4%', confidence: 100, isSystem: true, prompt: 'Primary orchestrator and user interface proxy.', model: 'Gemini 1.5 Pro', tools: ['all'], maxSteps: 100 },
  { id: 'sys-2', name: 'Supreme Auditor', status: 'Sleeping', load: '1.2%', confidence: 99, isSystem: true, prompt: 'Evaluate all actions for security, compliance, and hallucination.', model: 'Claude 3.5 Sonnet', tools: ['audit_log', 'policy_engine'], maxSteps: 10 },
  { id: 'sys-3', name: 'Orchestrator', status: 'Sleeping', load: '0%', confidence: 98, isSystem: true, prompt: 'Break down complex tasks into sub-tasks and route to specialized agents.', model: 'GPT-4o', tools: ['planner', 'routing'], maxSteps: 50 },
  { id: 'sys-4', name: 'Executor', status: 'Sleeping', load: '4.5%', confidence: 95, isSystem: true, prompt: 'Execute bash commands, write files, and run code securely.', model: 'Gemini 1.5 Pro', tools: ['bash', 'fs_write', 'fs_read'], maxSteps: 30 },
  { id: 'sys-5', name: 'Healer', status: 'Sleeping', load: '0%', confidence: 92, isSystem: true, prompt: 'Analyze execution errors and propose patches to Executor.', model: 'Claude 3.5 Sonnet', tools: ['bash', 'fs_read', 'linter'], maxSteps: 20 },
  { id: 'sys-6', name: 'Tester', status: 'Sleeping', load: '0%', confidence: 96, isSystem: true, prompt: 'Generate and execute test cases for code to ensure stability and correctness before deployment.', model: 'Claude 3.5 Sonnet', tools: ['bash', 'fs_read', 'linter', 'test_runner'], maxSteps: 30 },
];

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Provider status
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/models/status')
      .then(res => res.json())
      .then(data => {
        if (data.providers) setProviderStatus(data.providers);
      })
      .catch(err => console.error('Failed to fetch provider status:', err));
  }, []);

  useEffect(() => {
    if (!user) {
      setAgents([...SYSTEM_AGENTS]);
      setLoading(false);
      return;
    }
    
    const q = query(collection(db, 'users', user.uid, 'agents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAgents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Agent[];
      
      // Merge system agents with user agents
      setAgents([...SYSTEM_AGENTS, ...loadedAgents]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent({ ...agent });
    } else {
      setEditingAgent({
        id: '',
        name: `Custom Agent ${Math.floor(Math.random() * 1000)}`,
        status: 'Active',
        load: '0%',
        confidence: 100,
        isSystem: false,
        prompt: 'You are a helpful assistant.',
        model: 'Gemini 1.5 Pro',
        tools: ['web_search'],
        maxSteps: 15,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveAgent = async () => {
    if (!user || !editingAgent) return;
    
    try {
      if (editingAgent.isSystem) {
        // Mock save for system agents
        console.log('System agent config updated temporarily in UI state.');
      } else if (editingAgent.id) {
        // Update existing custom agent
        const agentRef = doc(db, 'users', user.uid, 'agents', editingAgent.id);
        const { id, isSystem, ...dataToSave } = editingAgent;
        await updateDoc(agentRef, dataToSave as any);
      } else {
        // Create new custom agent
        const { id, isSystem, ...dataToSave } = editingAgent;
        await addDoc(collection(db, 'users', user.uid, 'agents'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving agent: ", error);
    }
  };

  const handleDeleteAgent = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm('Are you sure you want to delete this agent?')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'agents', agentId));
      } catch (error) {
        console.error("Error deleting agent: ", error);
      }
    }
  };

  const toggleTool = (tool: string) => {
    if (!editingAgent) return;
    const tools = editingAgent.tools || [];
    if (tools.includes(tool)) {
      setEditingAgent({ ...editingAgent, tools: tools.filter(t => t !== tool) });
    } else {
      setEditingAgent({ ...editingAgent, tools: [...tools, tool] });
    }
  };

  const activeCount = agents.filter(a => a.status === 'Active').length;
  const avgConf = agents.length > 0 
    ? (agents.reduce((acc, curr) => acc + curr.confidence, 0) / agents.length).toFixed(1)
    : '0';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/agents" />

      <main className="flex-1 flex flex-col relative overflow-y-auto p-12">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>

        <div className="max-w-6xl mx-auto w-full space-y-12">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold">Agent Fleet</h1>
              <p className="text-muted-foreground mt-2">Manage and configure your autonomous persona workers.</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} /> New Agent
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 text-muted-foreground mb-4">
                <Bot size={20} /> Total Agents
              </div>
              <p className="text-4xl font-display font-bold">{agents.length}</p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 text-muted-foreground mb-4">
                <Activity size={20} /> Active Count
              </div>
              <p className="text-4xl font-display font-bold">{activeCount}</p>
            </div>
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 text-muted-foreground mb-4">
                <Shield size={20} /> Avg Confidence
              </div>
              <p className="text-4xl font-display font-bold text-green-500">{avgConf}%</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
                <tr>
                  <th className="p-4 font-medium">Agent Node</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">LLM Engine</th>
                  <th className="p-4 font-medium">System Load</th>
                  <th className="p-4 font-medium">Confidence</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading fleet...</td>
                  </tr>
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">No agents deployed. Click 'New Agent' to begin.</td>
                  </tr>
                ) : agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border
                          ${agent.isSystem ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-secondary/50 border-border text-foreground'}`}>
                          {agent.isSystem ? <Shield size={14} /> : <Cpu size={14} />}
                        </div>
                        <span className="font-medium text-sm">{agent.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider border
                        ${agent.isSystem ? 'bg-accent/10 text-accent border-accent/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        {agent.isSystem ? 'SYSTEM_CORE' : 'CUSTOM_NODE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                        ${agent.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          agent.status === 'Error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                          'bg-muted text-muted-foreground border-border'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-muted-foreground bg-background border border-border px-2 py-1 rounded">
                        {agent.model || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm">{agent.load || '0%'}</td>
                    <td className="p-4 font-mono text-sm text-green-500">{agent.confidence}%</td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(agent)}
                        className="p-2 bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors inline-flex items-center gap-2 text-xs font-medium"
                      >
                        <Settings2 size={14} /> Configure
                      </button>
                      {!agent.isSystem && (
                        <button 
                          onClick={(e) => handleDeleteAgent(e, agent.id)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Delete Agent"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Configuration Modal */}
      {isModalOpen && editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
                  ${editingAgent.isSystem ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-secondary border-border text-foreground'}`}>
                  {editingAgent.isSystem ? <Shield size={18} /> : <Cpu size={18} />}
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">
                    {editingAgent.id ? 'Configure Agent' : 'Create Custom Agent'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Define persona, limits, and capabilities.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Name & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Name</label>
                  <input 
                    type="text" 
                    value={editingAgent.name}
                    onChange={e => setEditingAgent({...editingAgent, name: e.target.value})}
                    disabled={editingAgent.isSystem}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Server size={12}/> LLM Engine</label>
                  <select 
                    value={editingAgent.model}
                    onChange={e => setEditingAgent({...editingAgent, model: e.target.value})}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent transition-colors appearance-none"
                  >
                    {[
                      { name: 'Gemini 2.5 Flash', provider: 'Google AI' },
                      { name: 'Gemini 2.5 Pro', provider: 'Google AI' },
                      { name: 'Gemini 2.0 Flash (Exp)', provider: 'Google AI' },
                      { name: 'Gemini 1.5 Flash', provider: 'Google AI' },
                      { name: 'Gemini 1.5 Flash-8B', provider: 'Google AI' },
                      { name: 'Gemini 1.5 Pro', provider: 'Google AI' },
                      { name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
                      { name: 'GPT-4o', provider: 'OpenAI' }
                    ].map(model => {
                      const isAvailable = providerStatus[model.provider] !== false;
                      return (
                        <option 
                          key={model.name} 
                          value={model.name} 
                          disabled={!isAvailable}
                        >
                          {model.name} {!isAvailable ? '(Missing Key)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Bot size={12}/> System Prompt / Persona</label>
                <textarea 
                  value={editingAgent.prompt}
                  onChange={e => setEditingAgent({...editingAgent, prompt: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent transition-colors min-h-[120px] font-mono text-muted-foreground leading-relaxed"
                  placeholder="You are an expert orchestrator that analyzes user intents and..."
                />
              </div>

              {/* Tools Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Zap size={12}/> Permitted Tools</label>
                <div className="grid grid-cols-3 gap-2">
                  {['web_search', 'bash', 'fs_read', 'fs_write', 'linter', 'audit_log', 'policy_engine', 'planner'].map(tool => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`p-2 text-xs font-mono rounded-lg border text-left transition-colors flex items-center justify-between
                        ${editingAgent.tools?.includes(tool) || editingAgent.tools?.includes('all')
                          ? 'bg-accent/10 border-accent/40 text-accent' 
                          : 'bg-background border-border text-muted-foreground hover:border-accent/20'}`}
                    >
                      {tool}
                      {(editingAgent.tools?.includes(tool) || editingAgent.tools?.includes('all')) && <CheckCircle2 size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><SlidersHorizontal size={12}/> Max Execution Steps: <span className="text-foreground font-mono ml-2">{editingAgent.maxSteps}</span></label>
                <input 
                  type="range" 
                  min="1" max="100" 
                  value={editingAgent.maxSteps}
                  onChange={e => setEditingAgent({...editingAgent, maxSteps: parseInt(e.target.value)})}
                  className="w-full accent-accent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3 shrink-0 bg-muted/20">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAgent}
                className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm"
              >
                <Save size={16} /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Fallback Icon (if CheckCircle2 from lucide-react isn't already imported properly elsewhere, but we did import it)
function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
}
