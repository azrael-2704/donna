'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { Activity, RefreshCw, Cpu, ShieldCheck, PlayCircle, Wrench, Trash2, MessageSquare, Terminal, Settings as SettingsIcon } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const RenderParsedJSON = ({ data }: { data: any }) => {
  if (!data || typeof data !== 'object') return <span>{String(data)}</span>;
  
  return (
    <div className={styles.parsedJson}>
      {Object.entries(data).map(([key, val], i) => (
        <div key={i} className={styles.jsonRow}>
          <span className={styles.jsonKey}>{key}:</span>
          <span className={styles.jsonValue}>
            {typeof val === 'string' && val.includes('\\n') || (typeof val === 'string' && val.length > 50) ? (
              <pre className={styles.jsonCodeBlock}>{val}</pre>
            ) : typeof val === 'object' ? (
              <RenderParsedJSON data={val} />
            ) : (
              String(val)
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DeveloperDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'trace' | 'process'>('trace');
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/dev/logs');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        if (!selectedMsgId && data.sessions.length > 0 && data.sessions[0].messages.length > 0) {
          setSelectedMsgId(data.sessions[0].messages[0].msgId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/kernel/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  };

  const killJob = async (jobId: string) => {
    try {
      const res = await fetch('/api/kernel/jobs/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) fetchJobs();
    } catch (err) {
      console.error('Failed to kill job', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchLogs();
    await fetchJobs();
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      fetchLogs();
      fetchJobs();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getActiveMessage = () => {
    for (const s of sessions) {
      for (const m of s.messages) {
        if (m.msgId === selectedMsgId) return m;
      }
    }
    return null;
  };

  const activeMessage = getActiveMessage();

  const getAgentIcon = (agent: string) => {
    switch(agent) {
      case 'CODER': return <Cpu size={24} color="#58a6ff" />;
      case 'AUDITOR': return <ShieldCheck size={24} color="#e3b341" />;
      case 'SANDBOX': return <PlayCircle size={24} color="#3fb950" />;
      case 'HEALER': return <Wrench size={24} color="#d2a8ff" />;
      default: return <Activity size={24} />;
    }
  };

  // Build the pipeline nodes
  let nodes: any[] = [];
  if (activeMessage) {
    nodes = activeMessage.events.map((ev: any) => ({
      agent: ev.agent,
      action: ev.action,
      success: ev.success,
      event: ev
    }));
    
    // Check if there's a sandbox event with cleanup true
    const sandboxEvent = activeMessage.events.find((e: any) => e.agent === 'SANDBOX' && e.metadata?.cleanedUp);
    if (sandboxEvent) {
      nodes.push({
        agent: 'CLEANUP',
        action: 'CLEANUP',
        success: true,
        event: { action: 'CLEANUP', agent: 'OS', output: 'Environment sanitized. Temp script deleted.' }
      });
    }
  }

  // Determine which logs to show
  const visibleLogs = activeNodeIndex !== null && nodes[activeNodeIndex]
    ? [nodes[activeNodeIndex].event]
    : activeMessage?.events || [];

  return (
    <div className="h-screen flex bg-background overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-40 z-0 bg-gradient-to-br from-background via-background to-accent/10" />

      <div className="flex w-full h-full relative z-10">
        <Sidebar activeHref="/dev" />
        
        <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background/80">
          <div className={styles.container} style={{ flex: 1 }}>
      <header className={styles.header}>
        <div className={styles.title}>
          <Activity size={20} color="#58a6ff" />
          Donna OS <span style={{ color: '#8b949e', fontWeight: 'normal', marginLeft: '0.5rem' }}>|</span>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'trace' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('trace')}
            >
              Neural Traceability
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'process' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('process')}
            >
              Process Manager
            </button>
          </div>
        </div>
        <button className={styles.navBtn} onClick={refreshData}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Refresh
        </button>
      </header>

      <main className={styles.main}>
        {activeTab === 'trace' ? (
          <>
            <aside className={styles.sidebar}>
              {sessions.length === 0 ? (
                <div className={styles.emptyState}>No Sessions Found</div>
              ) : (
                sessions.map((session, sIdx) => (
                  <div key={`session-${sIdx}`} className={styles.sessionGroup}>
                    <div className={styles.sessionHeader}>
                      Session {sIdx + 1} ({new Date(session.timestamp).toLocaleTimeString()})
                    </div>
                    {session.messages.map((msg: any, mIdx: number) => (
                      <div 
                        key={`msg-${msg.msgId}-${mIdx}`} 
                        className={`${styles.messageItem} ${selectedMsgId === msg.msgId ? styles.messageItemActive : ''}`}
                        onClick={() => { setSelectedMsgId(msg.msgId); setActiveNodeIndex(null); }}
                      >
                        <div>Message Flow {mIdx + 1}</div>
                        <span className={styles.messageTime}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </aside>

            <section className={styles.contentArea}>
              {activeMessage ? (
                <>
                  <div className={styles.graphSection}>
                    <div className={styles.neuralPipeline}>
                      {nodes.map((node, i) => (
                        <div key={`node-${i}`} className={styles.nodeWrapper}>
                          <div 
                            className={`
                              ${styles.neuralNode} 
                              ${node.success ? styles.nodeSuccess : styles.nodeFailed}
                              ${activeNodeIndex === i ? styles.neuralNodeActive : ''}
                            `}
                            onClick={() => setActiveNodeIndex(activeNodeIndex === i ? null : i)}
                          >
                            {node.agent === 'CLEANUP' ? <Trash2 size={24} color="#8b949e" /> : getAgentIcon(node.agent)}
                            <span className={styles.nodeLabel}>{node.action}</span>
                          </div>
                          {i < nodes.length - 1 && <div className={styles.connectionLine}></div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.detailsSection}>
                    <div className={styles.logArea}>
                      {visibleLogs.map((log: any, idx: number) => (
                        <div key={idx} className={styles.logEntry}>
                          <div className={styles.logHeader}>
                            <span className={styles.timestamp}>{new Date(log.timestamp || activeMessage.timestamp).toLocaleTimeString()}</span>
                            <span className={`${styles.badge} ${log.success ? styles.badgeSuccess : styles.badgeFailed}`}>
                              {log.success ? 'SUCCESS' : 'FAILED'}
                            </span>
                            <span className={styles.actionTag}>[{log.agent}] {log.action}</span>
                          </div>
                          
                          {log.input && (
                            <div className={styles.codeBox}>
                              <strong>Input / Thought Process:</strong>
                              <RenderParsedJSON data={log.input} />
                            </div>
                          )}
                          
                          {log.reasoning && (
                            <div className={styles.codeBox}>
                              <strong>Reasoning:</strong>
                              <p style={{ margin: '0.5rem 0' }}>{log.reasoning}</p>
                            </div>
                          )}

                          {log.output && (
                            <div className={styles.codeBox}>
                              <strong>Outcome / Output:</strong>
                              <RenderParsedJSON data={log.output} />
                            </div>
                          )}

                          {log.metadata && (
                            <div className={styles.codeBox}>
                              <strong>Environment Metadata:</strong>
                              <RenderParsedJSON data={log.metadata} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>Select a message to view the Neural Flow</div>
              )}
            </section>
          </>
        ) : (
          <section className={styles.processArea}>
            <div className={styles.processHeader}>
              <h2>Background Daemons & Cron Jobs</h2>
              <p>Managed by Donna OS Detached Worker</p>
            </div>
            
            <div className={styles.jobList}>
              {jobs.length === 0 ? (
                <div className={styles.emptyState}>No background processes running.</div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className={styles.jobCard}>
                    <div className={styles.jobInfo}>
                      <h3>{job.name} <span className={styles.jobType}>{job.type}</span></h3>
                      <p><strong>ID:</strong> {job.id}</p>
                      {job.cronSchedule && <p><strong>Schedule:</strong> {job.cronSchedule}</p>}
                      {job.pid && <p><strong>PID:</strong> {job.pid}</p>}
                      <p><strong>Status:</strong> <span className={job.status === 'running' ? styles.statusRunning : styles.statusStopped}>{job.status}</span></p>
                    </div>
                    {job.status === 'running' && (
                      <button className={styles.killBtn} onClick={() => killJob(job.id)}>
                        Force Kill
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
          </div>
        </main>
      </div>
    </div>
  );
}
