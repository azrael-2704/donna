'use client';

import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  type: 'voice' | 'text' | 'system';
}

export default function ChatMessage({
  sender,
  content,
  timestamp,
  type,
}: ChatMessageProps) {
  // System messages
  if (type === 'system') {
    return (
      <div className={`${styles.wrap} ${styles.wrapSystem}`}>
        <div className={`${styles.bubble} ${styles.bubbleSystem}`}>
          {content}
        </div>
      </div>
    );
  }

  const isUser = sender === 'user';

  return (
    <div
      className={`${styles.wrap} ${isUser ? styles.wrapUser : styles.wrapAgent}`}
    >
      {/* Agent avatar */}
      {!isUser && <div className={styles.avatar}>A</div>}

      <div>
        {/* Voice tag */}
        {type === 'voice' && (
          <div className={styles.voiceTag}>🎤 Voice</div>
        )}

        {/* Message bubble */}
        <div
          className={`${styles.bubble} ${
            isUser ? styles.bubbleUser : styles.bubbleAgent
          }`}
        >
          {content}
        </div>

        {/* Timestamp */}
        <div
          className={`${styles.time} ${isUser ? styles.timeRight : styles.timeLeft}`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  );
}
