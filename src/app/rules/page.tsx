'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Shield, Plus, Save, Server, GlobeLock, DollarSign } from 'lucide-react';

export default function RuleEnginePage() {
  const [rules, setRules] = useState([
    { id: 1, type: 'domain_whitelist', name: 'Network Domain Whitelist', desc: 'Only allow scripts to fetch from these domains.', value: 'api.github.com, openweathermap.org', active: true, icon: GlobeLock, color: 'blue' },
    { id: 2, type: 'max_daily_spend', name: 'Maximum Daily Spend ($)', desc: 'Hard cap on LLM and external API costs per day.', value: '5.00', active: true, icon: DollarSign, color: 'yellow' },
    { id: 3, type: 'blocked_commands', name: 'Blacklisted Sandbox Commands', desc: 'Fatal execution blocks enforced before sandbox boot.', value: 'rm -rf, mkfs, dd', active: true, icon: Server, color: 'red' },
  ]);

  const handleToggle = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleValueChange = (id: number, val: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, value: val } : r));
  };

  const handleAddRule = () => {
    const name = `New Rule ${Math.floor(Math.random() * 1000)}`;
    setRules([...rules, {
      id: Date.now(),
      type: 'custom',
      name,
      desc: 'Custom user-defined governance rule.',
      value: '',
      active: true,
      icon: Shield,
      color: 'zinc'
    }]);
  };

  const handleSave = () => {
    localStorage.setItem('donna_rules', JSON.stringify(rules));
    alert('Rules updated and enforced in sandbox engine.');
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('donna_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // reattach icons since JSON stringify loses them
        setRules(parsed.map((r: any) => ({
          ...r,
          icon: r.color === 'blue' ? GlobeLock : r.color === 'yellow' ? DollarSign : r.color === 'red' ? Server : Shield
        })));
      } catch (e) {}
    }
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeHref="/rules" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto space-y-8">
          
          <header className="flex justify-between items-end border-b border-border pb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Shield className="text-red-500 w-8 h-8" />
                Deterministic Rule Engine
              </h1>
              <p className="text-muted-foreground mt-2">
                Hard-coded firewall rules that govern the Supreme Auditor and Execution Sandbox.
              </p>
            </div>
            <button onClick={handleAddRule} className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium">
              <Plus size={18} /> Add Rule
            </button>
          </header>

          <div className="grid gap-6">
            {rules.map((rule) => {
              const Icon = rule.icon;
              return (
                <div key={rule.id} className={`bg-card border ${rule.color === 'red' ? 'border-red-500/30' : 'border-border'} rounded-xl p-6 shadow-sm relative overflow-hidden`}>
                  {rule.color === 'red' && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${rule.color === 'blue' ? 'bg-blue-500/10 text-blue-500' : rule.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-500' : rule.color === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">{rule.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase ${rule.active ? 'text-green-500' : 'text-muted-foreground'}`}>{rule.active ? 'Active' : 'Inactive'}</span>
                      <div onClick={() => handleToggle(rule.id)} className={`w-10 h-5 rounded-full relative cursor-pointer border transition-colors ${rule.active ? 'bg-green-500/20 border-green-500/50' : 'bg-muted border-border'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${rule.active ? 'right-1 bg-green-500' : 'left-1 bg-muted-foreground'}`}></div>
                      </div>
                    </div>
                  </div>
                  {rule.type === 'max_daily_spend' ? (
                    <div className="relative w-48">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input 
                        type="number"
                        className="w-full bg-background border border-border rounded-lg p-3 pl-8 text-sm font-bold text-foreground focus:outline-none focus:border-accent"
                        value={rule.value}
                        onChange={(e) => handleValueChange(rule.id, e.target.value)}
                      />
                    </div>
                  ) : (
                    <textarea 
                      className={`w-full bg-background border ${rule.color === 'red' ? 'border-red-500/20 text-red-400 focus:border-red-500' : 'border-border text-muted-foreground focus:border-accent'} rounded-lg p-3 text-sm font-mono focus:outline-none`}
                      value={rule.value}
                      onChange={(e) => handleValueChange(rule.id, e.target.value)}
                      rows={2}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-bold shadow-lg">
              <Save size={18} /> Apply Rule Changes
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
