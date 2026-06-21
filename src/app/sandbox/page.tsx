'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Lock, ShieldAlert, Activity, FileJson, Cpu } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function SandboxMonitor() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen to real background action_queue for sandbox monitoring
    const q = query(
      collection(db, 'action_queue'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(loaded);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'donnasworld') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('ACCESS DENIED: Invalid Kernel Authorization.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-green-500">
        <div className="max-w-md w-full p-8 border border-green-900/50 bg-black/50 backdrop-blur-sm rounded-lg shadow-2xl">
          <div className="flex justify-center mb-6">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-center text-xl font-bold mb-2 uppercase tracking-widest text-red-500">Restricted Area</h1>
          <p className="text-center text-sm text-green-700 mb-8">Donna Sandbox Execution Monitor</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-green-600 mb-2">Kernel Auth Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-700" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-green-900 rounded p-3 pl-10 focus:outline-none focus:border-green-500 text-green-500 placeholder-green-900 transition-colors"
                  placeholder="Enter Passcode..."
                  autoFocus
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs text-center animate-pulse">{error}</p>}
            <button
              type="submit"
              className="w-full bg-green-900/30 hover:bg-green-800/40 border border-green-800 text-green-500 py-3 rounded uppercase tracking-widest text-sm font-bold transition-all"
            >
              Initialize Connection
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-green-500 font-mono flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b border-green-900/50 bg-black/80 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="text-green-500" />
          <div>
            <h1 className="text-lg font-bold uppercase tracking-widest">Sandbox Monitor</h1>
            <p className="text-xs text-green-700">donna-worker.js Execution Environment</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Daemon Active
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <Cpu size={16} /> 0.4% Load
          </div>
          <ThemeSwitcher />
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Log Stream */}
        <div className="flex-1 border-r border-green-900/50 p-4 flex flex-col bg-black/40">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest border-b border-green-900/50 pb-2">
            <Activity size={14} /> Live Action Queue
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {logs.length === 0 ? (
              <p className="text-green-900 text-sm">Listening for sandbox execution events...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="text-sm p-3 border border-green-900/30 bg-black/60 rounded flex flex-col gap-1 hover:border-green-700 transition-colors">
                  <div className="flex justify-between">
                    <span className="text-blue-400 font-bold">[{log.type || 'EXECUTION'}]</span>
                    <span className="text-green-700 text-xs">
                      {log.createdAt?.toDate ? log.createdAt.toDate().toISOString() : 'Pending...'}
                    </span>
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap">{log.instruction}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded border 
                      ${log.status === 'completed' ? 'border-green-500 text-green-500 bg-green-500/10' : 
                        log.status === 'failed' ? 'border-red-500 text-red-500 bg-red-500/10' : 
                        'border-yellow-500 text-yellow-500 bg-yellow-500/10'}`}>
                      {log.status?.toUpperCase() || 'QUEUED'}
                    </span>
                    <span className="text-green-800">ID: {log.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* File Monitor */}
        <div className="w-96 p-4 flex flex-col bg-black/60">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest border-b border-green-900/50 pb-2">
            <FileJson size={14} /> Sandbox Files
          </div>
          <div className="flex-1 space-y-4">
            <div className="border border-green-900/50 rounded p-3">
              <h3 className="text-xs font-bold text-green-700 mb-2">/workspace/temp_script.py</h3>
              <p className="text-xs text-green-900 italic">No active script</p>
            </div>
            <div className="border border-green-900/50 rounded p-3">
              <h3 className="text-xs font-bold text-green-700 mb-2">/workspace/output.log</h3>
              <p className="text-xs text-green-900 italic">No output</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
