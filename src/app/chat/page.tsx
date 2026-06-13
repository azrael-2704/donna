'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import ChatMessage from '@/components/ChatMessage';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  type: 'voice' | 'text' | 'system';
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'system',
    content: 'Chat Session Started',
    timestamp: '10:00 AM',
    type: 'system',
  },
  {
    id: '2',
    sender: 'user',
    content: 'Can you summarize my meetings for today?',
    timestamp: '10:01 AM',
    type: 'text',
  },
  {
    id: '3',
    sender: 'agent',
    content: 'You have 2 meetings today:\n1. 11:30 AM - Product Sync\n2. 3:00 PM - Design Review\n\nShould I prepare the agenda notes for the design review?',
    timestamp: '10:01 AM',
    type: 'text',
  },
  {
    id: '4',
    sender: 'user',
    content: 'Yes, please pull the latest Figma links and draft a brief.',
    timestamp: '10:05 AM',
    type: 'text',
  },
  {
    id: '5',
    sender: 'agent',
    content: 'Drafting brief... I have attached the Figma links to the meeting invite. The brief is saved in your notes.',
    timestamp: '10:06 AM',
    type: 'text',
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      type: 'text',
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    
    // Simulate agent response
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        content: 'I have received your message and am processing it. (Mock response)',
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        type: 'text',
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 1000);
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--donna-text-muted)', fontSize: '1.2rem' }}>←</Link>
          <span className={styles.title}>Chat</span>
        </div>
        <button className={styles.newChatBtn}>+ New Chat</button>
      </header>

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

      <div className={styles.inputBarWrap}>
        <div className={styles.inputBar}>
          <input
            type="text"
            className={styles.input}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className={styles.sendBtn} onClick={handleSend}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}
