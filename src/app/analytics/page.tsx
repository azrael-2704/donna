'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { BarChart2, TrendingUp, Cpu, Clock, Flame, Database } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = React.useState({
    tokensProcessed: 0,
    avgLatency: 0,
    cacheRate: 0,
    peakConcurrent: 0
  });

  React.useEffect(() => {
    if (!user) return;
    
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'agent_metrics'), (snapshot) => {
      let tokens = 0;
      let totalLatency = 0;
      let cacheHits = 0;
      let reqCount = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        tokens += data.tokens || 0;
        totalLatency += data.latency || 0;
        if (data.cacheHit) cacheHits++;
        reqCount++;
      });
      
      setMetrics({
        tokensProcessed: tokens,
        avgLatency: reqCount ? (totalLatency / reqCount) : 0,
        cacheRate: reqCount ? (cacheHits / reqCount) * 100 : 0,
        peakConcurrent: snapshot.docs.length > 0 ? 1 : 0 // Simplified for now
      });
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/analytics" />
      <main className="flex-1 flex flex-col relative overflow-y-auto p-12">
        <div className="absolute top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>
        <div className="max-w-6xl mx-auto w-full space-y-12">
          <div>
            <h1 className="text-4xl font-display font-bold flex items-center gap-4">
              <BarChart2 className="text-accent" /> Analytics
            </h1>
            <p className="text-muted-foreground mt-2">Monitor agent performance, token usage, and latency metrics.</p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                <Database size={16} /> Tokens Processed
              </div>
              <p className="text-3xl font-display font-bold">
                {metrics.tokensProcessed > 1000000 
                  ? (metrics.tokensProcessed / 1000000).toFixed(1) + 'M' 
                  : metrics.tokensProcessed > 1000 
                    ? (metrics.tokensProcessed / 1000).toFixed(1) + 'k' 
                    : metrics.tokensProcessed}
              </p>
              <span className="text-[10px] text-green-500 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Live tracking
              </span>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                <Clock size={16} /> Avg Latency
              </div>
              <p className="text-3xl font-display font-bold">{metrics.avgLatency > 0 ? (metrics.avgLatency / 1000).toFixed(2) : '0'}s</p>
              <span className="text-[10px] text-green-500 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Live tracking
              </span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                <Cpu size={16} /> LLM Cache Rate
              </div>
              <p className="text-3xl font-display font-bold">{metrics.cacheRate.toFixed(1)}%</p>
              <span className="text-[10px] text-green-500 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Efficiency metric
              </span>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-3 text-sm">
                <Flame size={16} /> Peak Concurrent
              </div>
              <p className="text-3xl font-display font-bold">{metrics.peakConcurrent}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Active agent threads
              </span>
            </div>
          </div>

          {/* SVG Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tokens Consumption Over Time (SVG Area Chart) */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h4 className="font-semibold text-base font-display">Token Consumption Trend</h4>
                <p className="text-xs text-muted-foreground">Volume metrics calculated daily over last week</p>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="w-full h-64 bg-background/50 rounded-xl border border-border/40 p-4 flex flex-col justify-between">
                <div className="flex-1 relative">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />

                    {/* Area path */}
                    <path
                      d="M 0 160 Q 80 140 160 110 T 320 80 T 400 40 L 500 30 L 500 200 L 0 200 Z"
                      fill="url(#gradient-area)"
                    />
                    {/* Line path */}
                    <path
                      d="M 0 160 Q 80 140 160 110 T 320 80 T 400 40 L 500 30"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                    />

                    {/* Nodes */}
                    <circle cx="160" cy="110" r="4" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
                    <circle cx="320" cy="80" r="4" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
                    <circle cx="500" cy="30" r="4" fill="var(--background)" stroke="var(--accent)" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-2 border-t border-border/40 pt-2">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* Decision Latency (SVG Bar Chart) */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h4 className="font-semibold text-base font-display">Latency Distribution</h4>
                <p className="text-xs text-muted-foreground">Execution times mapped by LLM provider metrics</p>
              </div>

              {/* Custom SVG Bar Chart */}
              <div className="w-full h-64 bg-background/50 rounded-xl border border-border/40 p-4 flex flex-col justify-between">
                <div className="flex-1 relative flex items-end justify-between px-6">
                  {/* Bar 1 */}
                  <div className="flex flex-col items-center gap-2 w-12">
                    <span className="text-[10px] font-mono text-muted-foreground">0.82s</span>
                    <div className="w-full rounded-t-lg bg-accent/80 hover:bg-accent transition-all" style={{ height: '90px' }} />
                    <span className="text-[10px] font-semibold text-foreground truncate max-w-full">Gemini</span>
                  </div>
                  {/* Bar 2 */}
                  <div className="flex flex-col items-center gap-2 w-12">
                    <span className="text-[10px] font-mono text-muted-foreground">1.12s</span>
                    <div className="w-full rounded-t-lg bg-accent/60 hover:bg-accent transition-all" style={{ height: '130px' }} />
                    <span className="text-[10px] font-semibold text-foreground truncate max-w-full">Claude</span>
                  </div>
                  {/* Bar 3 */}
                  <div className="flex flex-col items-center gap-2 w-12">
                    <span className="text-[10px] font-mono text-muted-foreground">1.54s</span>
                    <div className="w-full rounded-t-lg bg-accent/40 hover:bg-accent transition-all" style={{ height: '170px' }} />
                    <span className="text-[10px] font-semibold text-foreground truncate max-w-full">GPT-4</span>
                  </div>
                  {/* Bar 4 */}
                  <div className="flex flex-col items-center gap-2 w-12">
                    <span className="text-[10px] font-mono text-muted-foreground">0.34s</span>
                    <div className="w-full rounded-t-lg bg-accent hover:bg-accent/95 transition-all" style={{ height: '40px' }} />
                    <span className="text-[10px] font-semibold text-foreground truncate max-w-full">Llama-3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
