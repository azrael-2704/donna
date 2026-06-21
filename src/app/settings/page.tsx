'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Settings, SlidersHorizontal, Shield, Bot, Database, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [maxCycles, setMaxCycles] = useState<number>(3);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Here we'd save to Firestore or local context
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/settings" />

      <main className="flex-1 flex flex-col relative overflow-y-auto p-12">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>

        <div className="max-w-4xl mx-auto w-full space-y-12">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-3">
                <Settings className="text-accent" /> System Preferences
              </h1>
              <p className="text-muted-foreground mt-2">Configure core behavior, limits, and integration parameters.</p>
            </div>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {saved ? 'Saved' : 'Save Changes'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            
            {/* Orchestration Settings */}
            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                  <SlidersHorizontal size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Orchestration Limits</h2>
                  <p className="text-sm text-muted-foreground">Manage recursion and cycle caps for autonomous agents.</p>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-foreground">Standard Max Cycles</label>
                    <span className="text-sm font-mono font-bold text-accent">{maxCycles} Cycles</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Allow the Orchestrator to loop up to a defined limit if it determines a workable solution is achievable within that bound. Max allowed is 5.
                  </p>
                  <input 
                    type="range" 
                    min="1" max="5" step="1"
                    value={maxCycles}
                    onChange={(e) => setMaxCycles(parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono uppercase">
                    <span>1 Cycle</span>
                    <span>5 Cycles</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-foreground">Extended Cycles (Complex Tasks)</label>
                    <span className="text-sm font-mono font-bold text-accent">15 Cycles</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    If an agent determines the task is exceptionally complex, it can request an extension up to this hard limit.
                  </p>
                  <input 
                    type="range" 
                    min="5" max="20" step="1"
                    defaultValue="15"
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono uppercase">
                    <span>5 Cycles</span>
                    <span>20 Cycles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <Shield size={20} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">Security & Compliance</h2>
                  <p className="text-sm text-muted-foreground">Global override switches for sandbox behavior.</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-center justify-between p-4 bg-background border border-border rounded-xl cursor-pointer hover:border-accent/30 transition-colors">
                  <div>
                    <h4 className="font-semibold text-sm">Strict Sandbox Mode</h4>
                    <p className="text-xs text-muted-foreground mt-1">Force all file execution inside the virtual container.</p>
                  </div>
                  <div className="w-12 h-6 bg-accent rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full" />
                  </div>
                </label>
                <label className="flex items-center justify-between p-4 bg-background border border-border rounded-xl cursor-pointer hover:border-accent/30 transition-colors">
                  <div>
                    <h4 className="font-semibold text-sm">Require Human Approval (High Risk)</h4>
                    <p className="text-xs text-muted-foreground mt-1">Halt workflows and request approval for 'High' risk actions.</p>
                  </div>
                  <div className="w-12 h-6 bg-accent rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full" />
                  </div>
                </label>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
