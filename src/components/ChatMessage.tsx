'use client';

import styles from './ChatMessage.module.css';
import { Mic, Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export interface ScriptBlockProps {
  status: 'synthesizing' | 'auditing' | 'executing' | 'completed' | 'failed';
  code?: string;
  output?: string;
  error?: string;
  name?: string;
}

interface ChatMessageProps {
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  type: 'voice' | 'text' | 'system';
  script?: ScriptBlockProps;
}

export default function ChatMessage({ sender, content, timestamp, type, script }: ChatMessageProps) {
  const isAgent = sender === 'agent';
  const isSystem = sender === 'system';

  return (
    <div className={`${styles.messageWrapper} ${styles[sender]}`}>
      <div className={styles.bubble}>
        {isAgent && !isSystem && (
          <div className={styles.agentHeader}>
            <div className={styles.avatar}>D</div>
            <span>Donna OS</span>
          </div>
        )}

        <div className={styles.content}>
          {type === 'voice' && (
            <span className={styles.voiceIcon}>
              <Mic size={14} />
            </span>
          )}
          {content}
        </div>

        {script && (
          <div className={styles.scriptBlock}>
            <div className={styles.scriptHeader}>
              {script.status === 'completed' ? (
                <CheckCircle size={14} color="var(--text-primary)" />
              ) : script.status === 'failed' ? (
                <XCircle size={14} color="#ef4444" />
              ) : (
                <Loader2 size={14} className="animate-pulse-slow" />
              )}
              <span className={styles.scriptTitle}>
                {script.name || 'Automation Script'}
                {' • '}
                {script.status.charAt(0).toUpperCase() + script.status.slice(1)}
              </span>
            </div>
            {script.code && script.status === 'auditing' && (
              <pre className={styles.scriptContent}>
                <code>{script.code}</code>
              </pre>
            )}
            {script.output && script.status === 'completed' && (
              <pre className={styles.scriptContent}>
                <code>Output:\n{script.output}</code>
              </pre>
            )}
            {script.error && (
              <pre className={styles.scriptContent} style={{ color: '#ef4444' }}>
                <code>Error:\n{script.error}</code>
              </pre>
            )}
          </div>
        )}

        {!isSystem && <span className={styles.timestamp}>{timestamp}</span>}
      </div>
    </div>
  );
}
