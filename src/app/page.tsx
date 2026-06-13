'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import ChatMessage from '@/components/ChatMessage';
import WalkieTalkieButton from '@/components/WalkieTalkieButton';
import Link from 'next/link';

/* ============================================
   Mock Data
   ============================================ */
interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  type: 'voice' | 'text' | 'system';
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'agent',
    content:
      'Good morning. Donna OS is online — all systems nominal. What would you like to tackle today?',
    timestamp: '9:00 AM',
    type: 'system',
  },
  {
    id: '2',
    sender: 'user',
    content:
      'Add my design team meeting tomorrow at 2 PM. Topic is the new dashboard layout.',
    timestamp: '9:01 AM',
    type: 'voice',
  },
  {
    id: '3',
    sender: 'agent',
    content:
      'Done. "Design Team — Dashboard Layout" scheduled for tomorrow at 2:00 PM. I found 3 related Figma files from last week and attached them. Want me to send invites to the frontend squad?',
    timestamp: '9:01 AM',
    type: 'text',
  },
  {
    id: '4',
    sender: 'user',
    content: 'Yes, send invites to everyone. Also remind me 30 minutes before.',
    timestamp: '9:02 AM',
    type: 'voice',
  },
  {
    id: '5',
    sender: 'agent',
    content:
      'Invites sent to 5 team members. Reminder set for 1:30 PM. I\'ll also compile a sprint metrics brief before the meeting.',
    timestamp: '9:02 AM',
    type: 'text',
  },
];

const navItems = [
  { icon: '🏠', label: 'Home', href: '/', active: true },
  { icon: '💬', label: 'Chat', href: '/chat', active: false },
  { icon: '🤖', label: 'Models', href: '/models', active: false },
  { icon: '📊', label: 'Console', href: '/console', active: false },
  { icon: '📜', label: 'Scripts', href: '/scripts', active: false },
  { icon: '⚙️', label: 'Settings', href: '/settings', active: false },
];

/* ============================================
   Home Page — Hero PTT Interface
   ============================================ */
export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPro] = useState(false); // toggle for free/pro tier
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: 'Processing voice…',
      timestamp: new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      }),
      type: 'voice',
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        // Update user message with actual transcript
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsg.id
              ? { ...m, content: data.transcript || 'Voice message' }
              : m
          )
        );

        // Add agent response
        const agentMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          }),
          type: 'text',
        };
        setMessages((prev) => [...prev, agentMsg]);
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        content: 'Connection issue. Please try again.',
        timestamp: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
        type: 'system',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.shell}>
      {/* ===== Side Rail (Desktop) ===== */}
      <aside className={styles.sideRail}>
        <div className={styles.railLogo}>A</div>

        <nav className={styles.railNav}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.railBtn} ${item.active ? styles.railBtnActive : ''}`}
              title={item.label}
            >
              <span>{item.icon}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.railAvatar} title="Profile">
            AM
          </div>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className={styles.main}>
        {/* --- Top Bar --- */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.mobileLogo}>A</div>
            <span className={styles.topBarTitle}>Donna OS</span>
          </div>
          <div className={styles.topBarRight}>
            <span className={`${styles.tierBadge} ${isPro ? styles.tierPro : styles.tierFree}`}>
              {isPro ? '✦ PRO' : 'FREE'}
            </span>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Live
            </span>
          </div>
        </header>

        {/* --- Chat Messages --- */}
        <section className={styles.chatArea}>
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              content={msg.content}
              timestamp={msg.timestamp}
              type={msg.type}
            />
          ))}
          <div ref={chatEndRef} />
        </section>

        {/* --- PTT Control Zone --- */}
        <section className={styles.controlZone}>
          <WalkieTalkieButton
            onRecordingStart={() => {}}
            onRecordingStop={() => {}}
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
          />

          <div className={styles.statusRow}>
            <div className={styles.statusPill}>
              <span className={`${styles.pillDot} ${styles.dotGreen}`} />
              Connected
            </div>
            <div className={styles.statusPill}>
              <span className={`${styles.pillDot} ${styles.dotCyan}`} />
              3 Scripts
            </div>
            <div className={styles.statusPill}>
              <span className={`${styles.pillDot} ${styles.dotPurple}`} />
              42 MB Memory
            </div>
          </div>
        </section>
      </main>

      {/* ===== Bottom Nav (Mobile) ===== */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`${styles.navBtn} ${item.active ? styles.navBtnActive : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
