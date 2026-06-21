'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Database, FileText, Search, RefreshCw, Plus, CheckCircle, Clock, Cpu, Network } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface KnowledgeSource {
  id: string;
  name: string;
  type: string;
  status: 'Synced' | 'Syncing' | 'Failed';
  docs: number;
  lastUpdated: string;
  size: string;
}

export default function KnowledgePage() {
  const { user } = useAuth();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'knowledge'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
          status: data.status,
          docs: data.docs,
          lastUpdated: data.lastUpdated || 'Just now',
          size: data.size,
        } as KnowledgeSource;
      });
      if (loaded.length === 0) {
        // Fallback to updated mock data if empty
        setSources([
          { id: '1', name: 'Global Vector Script Library', type: 'Pinecone / DDF', status: 'Synced', docs: 10420, lastUpdated: 'Just now', size: '1.2 GB' },
          { id: '2', name: 'GitHub MCP Registry', type: 'Auditable MCP', status: 'Synced', docs: 45, lastUpdated: '2 mins ago', size: '4 MB' },
          { id: '3', name: 'Web Search Tool Index', type: 'Auditable MCP', status: 'Synced', docs: 890, lastUpdated: '1 hr ago', size: '12 MB' },
          { id: '4', name: 'System Rule Layer (YAML)', type: 'Governance', status: 'Synced', docs: 12, lastUpdated: '5 hrs ago', size: '2 KB' },
        ]);
      } else {
        setSources(loaded);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddSource = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'knowledge'), {
        name: `Dataset_${Math.floor(Math.random() * 1000)}`,
        type: ['Confluence', 'Zendesk', 'GitHub', 'Google Drive'][Math.floor(Math.random() * 4)],
        status: 'Synced',
        docs: Math.floor(Math.random() * 5000),
        size: `${Math.floor(Math.random() * 500)} MB`,
        lastUpdated: new Date().toLocaleTimeString(),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding source", e);
    }
  };

  const startSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
    }, 3000);
  };

  const filteredSources = sources.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  // Generate node coordinates dynamically for the graph
  const centerX = 400;
  const centerY = 150;
  const radius = 120;
  
  const nodes = [
    { id: 'core', label: 'Neural Core', x: centerX, y: centerY, icon: Brain },
    ...filteredSources.map((s, i) => {
      const angle = (i / Math.max(1, filteredSources.length)) * Math.PI * 2 - Math.PI / 2;
      return {
        id: s.id,
        label: s.name,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        icon: Database,
        status: s.status
      };
    })
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/knowledge" />
      <main className="flex-1 flex flex-col relative overflow-y-auto p-12">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>
        
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-4">
                <Network className="text-accent" /> Knowledge Graph
              </h1>
              <p className="text-muted-foreground mt-2">Map and manage verified datasets your agents can access.</p>
            </div>
            <button 
              onClick={handleAddSource}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={18} /> Add Source
            </button>
          </div>

          {/* Interactive SVG Graph */}
          <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden shadow-sm">
            <h3 className="text-lg font-semibold font-display mb-4">Neural Data Lineage</h3>
            <div className="flex justify-center items-center h-[300px] w-full">
              {loading ? (
                <div className="text-muted-foreground text-sm">Loading graph...</div>
              ) : sources.length === 0 ? (
                <div className="text-muted-foreground text-sm">No knowledge sources. Add one to see the graph.</div>
              ) : (
                <svg viewBox="0 0 800 300" className="w-full h-full max-w-3xl overflow-visible">
                  {/* Edges from core to sources */}
                  {nodes.slice(1).map((n) => {
                    const isActive = activeNode === 'core' || activeNode === n.id;
                    const isSyncing = syncingId === n.id;
                    return (
                      <line
                        key={`edge-${n.id}`}
                        x1={centerX}
                        y1={centerY}
                        x2={n.x}
                        y2={n.y}
                        stroke={isActive ? "var(--accent)" : "var(--border)"}
                        strokeWidth={isActive ? 1.5 : 1}
                        strokeDasharray={isSyncing ? "4 4" : "none"}
                        className={isSyncing ? "animate-[dash_1s_linear_infinite]" : ""}
                        style={{ transition: "all 0.3s ease" }}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((n) => {
                    const Icon = n.icon;
                    const isActive = activeNode === n.id;
                    const isCore = n.id === 'core';
                    return (
                      <g
                        key={n.id}
                        transform={`translate(${n.x}, ${n.y})`}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setActiveNode(n.id)}
                        onMouseLeave={() => setActiveNode(null)}
                      >
                        <circle
                          r={isCore ? 32 : 24}
                          fill={isActive ? "var(--accent)" : "var(--card)"}
                          stroke={isActive ? "var(--accent)" : "var(--border)"}
                          strokeWidth={1.5}
                          style={{ transition: "all 0.3s ease" }}
                        />
                        <foreignObject x={isCore ? -14 : -10} y={isCore ? -14 : -10} width={isCore ? 28 : 20} height={isCore ? 28 : 20}>
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon size={isCore ? 18 : 14} style={{ color: isActive ? "var(--background)" : "var(--muted-foreground)" }} />
                          </div>
                        </foreignObject>
                        <text
                          y={isCore ? 48 : 38}
                          textAnchor="middle"
                          fill={isActive ? "var(--foreground)" : "var(--muted-foreground)"}
                          fontSize={10}
                          fontFamily="'Inter', sans-serif"
                          style={{ transition: "all 0.3s ease" }}
                        >
                          {n.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
            
            <style jsx>{`
              @keyframes dash {
                to { stroke-dashoffset: -8; }
              }
            `}</style>
          </div>

          <div className="flex items-center gap-4 bg-card border border-border p-3 rounded-2xl max-w-md shadow-sm">
            <Search className="text-muted-foreground ml-2" size={18} />
            <input
              type="text"
              placeholder="Search knowledge sources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold font-display">Indexed Sources</h3>
            </div>
            <div className="divide-y divide-border">
              {filteredSources.map((source) => (
                <div 
                  key={source.id} 
                  className={`flex flex-col md:flex-row md:items-center justify-between p-6 transition-colors gap-4
                    ${activeNode === source.id ? 'bg-muted/30' : 'hover:bg-muted/10'}
                  `}
                  onMouseEnter={() => setActiveNode(source.id)}
                  onMouseLeave={() => setActiveNode(null)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent border border-accent/10">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base text-foreground">{source.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {source.type} • <span className="font-mono">{source.size}</span> • <span className="font-mono">{source.docs.toLocaleString()} docs</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end text-xs text-muted-foreground gap-1">
                      <span className="flex items-center gap-1"><Clock size={12} /> Updated {source.lastUpdated}</span>
                    </div>

                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                      ${source.status === 'Synced' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        source.status === 'Syncing' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse' : 
                        'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {source.status === 'Syncing' && <RefreshCw size={12} className="mr-1.5 animate-spin" />}
                      {source.status === 'Synced' && <CheckCircle size={12} className="mr-1.5" />}
                      {source.status}
                    </span>

                    <button 
                      onClick={() => startSync(source.id)}
                      disabled={source.status === 'Syncing'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={syncingId === source.id ? 'animate-spin' : ''} />
                      Sync
                    </button>
                  </div>
                </div>
              ))}
              {filteredSources.length === 0 && !loading && (
                <div className="p-8 text-center text-muted-foreground">
                  No sources found.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
// ── Component Placeholder for Icon ──
function Brain(props: any) {
  return <Cpu {...props} /> // Fallback or could use actual Brain from lucide-react if imported
}
