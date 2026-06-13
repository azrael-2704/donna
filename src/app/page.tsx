'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import ChatMessage, { ScriptBlockProps } from '@/components/ChatMessage';
import WalkieTalkieButton from '@/components/WalkieTalkieButton';
import Link from 'next/link';
import { Home, MessageSquare, Box, Terminal, FileCode, Settings, Send, Mic, Keyboard } from 'lucide-react';

/* ============================================
   Types
   ============================================ */
interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  type: 'voice' | 'text' | 'system';
  script?: ScriptBlockProps;
}

const navItems = [
  { icon: Home, label: 'Home', href: '/', active: true },
  { icon: MessageSquare, label: 'Chat', href: '/chat', active: false },
  { icon: Box, label: 'Models', href: '/models', active: false },
  { icon: Terminal, label: 'Console', href: '/console', active: false },
  { icon: FileCode, label: 'Scripts', href: '/scripts', active: false },
  { icon: Settings, label: 'Settings', href: '/settings', active: false },
];

/* ============================================
   Home Page — Unified Interface
   ============================================ */
export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      content: 'Good morning. Donna OS is online. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      type: 'text',
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  // Responsive mode toggle (WalkieTalkie vs Chat)
  const [mode, setMode] = useState<'ptt' | 'chat'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Default to PTT on mobile, Chat on desktop
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMode('ptt');
      } else {
        setMode('chat');
      }
    };
    
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle auto-healing loop
  const executeAndHealScript = async (scriptId: string, msgId: string, attempts = 0) => {
    try {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, script: { ...m.script!, status: 'executing' } } : m
        )
      );

      const execRes = await fetch('/api/kernel/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_id: scriptId }),
      });
      
      const execData = await execRes.json();

      if (execData.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  content: 'Execution successful. Here is the output:',
                  script: { ...m.script!, status: 'completed', output: execData.output },
                }
              : m
          )
        );
      } else {
        if (attempts < 2) {
          // Auto-heal loop
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: `Execution failed. Donna OS is automatically healing the script (Attempt ${attempts + 1})...`,
                    script: { ...m.script!, status: 'auditing', error: execData.error },
                  }
                : m
            )
          );

          const healRes = await fetch('/api/kernel/heal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script_id: scriptId }),
          });

          const healData = await healRes.json();
          if (healData.success && healData.audit.approved) {
            // Re-run
            await executeAndHealScript(scriptId, msgId, attempts + 1);
          } else {
            throw new Error('Healer could not fix the script or failed audit.');
          }
        } else {
          // Max attempts reached
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: 'Script execution failed after multiple healing attempts.',
                    script: { ...m.script!, status: 'failed', error: execData.error },
                  }
                : m
            )
          );
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, script: { ...m.script!, status: 'failed', error: err.message } } : m
        )
      );
    }
  };

  const handleScriptSynthesis = async (instruction: string) => {
    const msgId = Date.now().toString();
    
    // Add pending script message
    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        sender: 'agent',
        content: 'Synthesizing the automation script...',
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        type: 'text',
        script: { status: 'synthesizing', name: 'Task Automation' },
      },
    ]);

    try {
      const res = await fetch('/api/kernel/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          user_id: 'local-user', // Mock user for MVP
          name: 'Donna Auto-Script',
        }),
      });

      const data = await res.json();

      if (data.success && data.audit.approved) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, script: { ...m.script!, status: 'auditing', code: data.script.code } } : m
          )
        );
        // Automatically execute it
        await executeAndHealScript(data.script.id, msgId);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? {
                  ...m,
                  content: 'Script failed security audit.',
                  script: { ...m.script!, status: 'failed', error: data.audit?.reason || data.error },
                }
              : m
          )
        );
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, script: { ...m.script!, status: 'failed', error: err.message } } : m
        )
      );
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;

    const userText = textInput.trim();
    setTextInput('');
    setIsProcessing(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      type: 'text',
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Mocked /api/chat equivalent for MVP. 
      // In reality, this goes to Gemini to see if it needs a script.
      // We will simulate it here to directly trigger synthesis if it sounds like an action.
      
      const isAction = userText.toLowerCase().includes('script') || userText.toLowerCase().includes('write') || userText.toLowerCase().includes('automate');
      
      if (isAction) {
        await handleScriptSynthesis(userText);
      } else {
        // Standard conversational reply
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'agent',
            content: "I've noted that. If you need me to automate a task, just ask me to write a script for it.",
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            type: 'text',
          },
        ]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: 'Transcribing voice...',
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
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
        const transcript = data.transcript || 'Voice message';

        setMessages((prev) =>
          prev.map((m) => (m.id === userMsg.id ? { ...m, content: transcript } : m))
        );
        
        // Trigger synthesis
        await handleScriptSynthesis(transcript);
      }
    } catch (err) {
      console.error('Voice processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.shell}>
      {/* ===== Side Rail (Desktop) ===== */}
      <aside className={styles.sideRail}>
        <div className={styles.railLogo}>D</div>

        <nav className={styles.railNav}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.railBtn} ${item.active ? styles.railBtnActive : ''}`}
              title={item.label}
            >
              <item.icon size={20} />
            </Link>
          ))}
        </nav>

        <div className={styles.railBottom}>
          <div className={styles.railAvatar} title="Profile">AM</div>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className={styles.main}>
        {/* --- Top Bar --- */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.mobileLogo}>D</div>
            <span className={styles.topBarTitle}>Donna OS</span>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.viewToggle}>
              <button 
                onClick={() => setMode('chat')}
                className={`${styles.toggleBtn} ${mode === 'chat' ? styles.toggleBtnActive : ''}`}
              >
                <Keyboard size={14} /> Text
              </button>
              <button 
                onClick={() => setMode('ptt')}
                className={`${styles.toggleBtn} ${mode === 'ptt' ? styles.toggleBtnActive : ''}`}
              >
                <Mic size={14} /> Voice
              </button>
            </div>
          </div>
        </header>

        {/* --- View Mode Switcher --- */}
        {mode === 'chat' ? (
          <>
            <section className={styles.chatArea}>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  sender={msg.sender}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  type={msg.type}
                  script={msg.script}
                />
              ))}
              <div ref={chatEndRef} />
            </section>
            
            <section className={styles.inputZone}>
              <form className={styles.inputWrapper} onSubmit={handleTextSubmit}>
                <button type="button" className={styles.iconBtn} onClick={() => setMode('ptt')}>
                  <Mic size={20} />
                </button>
                <textarea
                  className={styles.chatInput}
                  placeholder="Ask Donna to automate a task..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit(e as any);
                    }
                  }}
                  disabled={isProcessing}
                />
                <button type="submit" className={`${styles.iconBtn} ${styles.sendBtn}`} disabled={isProcessing || !textInput.trim()}>
                  <Send size={18} />
                </button>
              </form>
            </section>
          </>
        ) : (
          <section className={styles.pttZone}>
            <WalkieTalkieButton
              onRecordingStart={() => {}}
              onRecordingStop={() => {}}
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
            />
            <div className={styles.statusText}>
              {isProcessing ? 'Processing Intent...' : 'Hold to speak to Donna'}
            </div>
          </section>
        )}
      </main>

      {/* ===== Bottom Nav (Mobile) ===== */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`${styles.navBtn} ${item.active ? styles.navBtnActive : ''}`}
          >
            <item.icon size={20} />
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
