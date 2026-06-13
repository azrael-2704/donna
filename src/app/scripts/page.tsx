'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

type ScriptStatus = 'Running' | 'Paused' | 'Failed' | 'Draft';

interface Script {
  id: string;
  name: string;
  status: ScriptStatus;
  schedule: string;
  lastRun: string;
  runCount: number;
}

const mockScripts: Script[] = [
  {
    id: '1',
    name: 'Calendar Sync',
    status: 'Running',
    schedule: 'Every 30 min',
    lastRun: '10 mins ago',
    runCount: 1420,
  },
  {
    id: '2',
    name: 'Water Reminder',
    status: 'Running',
    schedule: 'Hourly (9 AM - 9 PM)',
    lastRun: '45 mins ago',
    runCount: 312,
  },
  {
    id: '3',
    name: 'Flipkart Deal Scraper',
    status: 'Paused',
    schedule: 'Daily at 10 AM',
    lastRun: 'Yesterday',
    runCount: 45,
  },
  {
    id: '4',
    name: 'Email Digest',
    status: 'Failed',
    schedule: 'Daily at 8 AM',
    lastRun: '2 hours ago',
    runCount: 12,
  },
  {
    id: '5',
    name: 'Meeting Summarizer',
    status: 'Draft',
    schedule: 'On demand',
    lastRun: 'Never',
    runCount: 0,
  },
];

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>(mockScripts);

  const toggleScript = (id: string) => {
    setScripts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (s.status === 'Running') return { ...s, status: 'Paused' };
          if (s.status === 'Paused' || s.status === 'Failed') return { ...s, status: 'Running' };
        }
        return s;
      })
    );
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--donna-text-muted)', fontSize: '1.2rem' }}>←</Link>
          <span className={styles.title}>Scripts</span>
        </div>
        <button className={styles.newScriptBtn}>+ New Script</button>
      </header>

      <section className={styles.gridArea}>
        {scripts.map((script) => {
          let badgeClass = styles.badgeDraft;
          if (script.status === 'Running') badgeClass = styles.badgeRunning;
          if (script.status === 'Paused') badgeClass = styles.badgePaused;
          if (script.status === 'Failed') badgeClass = styles.badgeFailed;

          const isActive = script.status === 'Running';

          return (
            <div key={script.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{script.name}</span>
                <span className={`${styles.badge} ${badgeClass}`}>{script.status}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Schedule</span>
                  <span>{script.schedule}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Last Run</span>
                  <span>{script.lastRun}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Run Count</span>
                  <span>{script.runCount}</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div
                  className={`${styles.toggleSwitch} ${isActive ? styles.active : ''}`}
                  onClick={() => toggleScript(script.id)}
                  title={isActive ? 'Pause script' : 'Start script'}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
