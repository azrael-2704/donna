'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

type LogStatus = 'SUCCESS' | 'WARNING' | 'ERROR';

interface LogEntry {
  id: string;
  timestamp: string;
  status: LogStatus;
  message: string;
  script?: string;
}

const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '10:05:22.104',
    status: 'SUCCESS',
    message: 'calendar_sync.py executed — 3 events synced',
    script: 'calendar_sync.py',
  },
  {
    id: '2',
    timestamp: '09:30:00.012',
    status: 'SUCCESS',
    message: 'water_reminder.py triggered — notification sent',
    script: 'water_reminder.py',
  },
  {
    id: '3',
    timestamp: '09:15:45.881',
    status: 'WARNING',
    message: 'flipkart_scraper.py — rate limit approaching',
    script: 'flipkart_scraper.py',
  },
  {
    id: '4',
    timestamp: '08:00:12.302',
    status: 'ERROR',
    message: 'email_digest.py — SMTP connection timeout (auto-retry in 30s)',
    script: 'email_digest.py',
  },
  {
    id: '5',
    timestamp: '08:00:45.111',
    status: 'SUCCESS',
    message: 'Self-heal: email_digest.py patched and redeployed',
    script: 'self_heal_daemon',
  },
  {
    id: '6',
    timestamp: '07:30:00.000',
    status: 'SUCCESS',
    message: 'morning_brief.py — daily brief generated',
    script: 'morning_brief.py',
  },
];

export default function ConsolePage() {
  const [filter, setFilter] = useState('ALL');

  const filteredLogs = mockLogs.filter(
    (log) => filter === 'ALL' || log.status === filter
  );

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--donna-text-muted)', fontSize: '1.2rem' }}>←</Link>
          <span className={styles.title}>Console</span>
        </div>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All Events</option>
          <option value="SUCCESS">Success</option>
          <option value="WARNING">Warnings</option>
          <option value="ERROR">Errors</option>
        </select>
      </header>

      <section className={styles.listArea}>
        {filteredLogs.map((log) => {
          let styleClass = styles.logSuccess;
          let textClass = styles.textSuccess;
          if (log.status === 'WARNING') {
            styleClass = styles.logWarning;
            textClass = styles.textWarning;
          } else if (log.status === 'ERROR') {
            styleClass = styles.logError;
            textClass = styles.textError;
          }

          return (
            <div key={log.id} className={`${styles.logEntry} ${styleClass}`}>
              <div className={styles.logHeader}>
                <span>[{log.timestamp}]</span>
                <span className={`${styles.logStatus} ${textClass}`}>
                  {log.status}
                </span>
              </div>
              <div className={styles.logMessage}>{log.message}</div>
              {log.script && <div className={styles.scriptTag}>{log.script}</div>}
            </div>
          );
        })}
      </section>
    </div>
  );
}
