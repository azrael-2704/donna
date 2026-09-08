'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, Paperclip, Brain, Shield, Plus, MessageSquare, Menu, Trash2, Network } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ParticleOrb from '@/components/ParticleOrb';
import WalkieTalkieButton from '@/components/WalkieTalkieButton';
import ChatHistorySidebar from '@/components/chat/ChatHistorySidebar';
import DecisionTraceSidebar from '@/components/chat/DecisionTraceSidebar';
import ApprovalModal from '@/components/chat/ApprovalModal';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: string;
  confidence?: number;
  trace?: any;
}

import { ChatSession } from '@/lib/types';

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [auditOpen, setAuditOpen] = useState(false);
  const [selectedAuditNode, setSelectedAuditNode] = useState<number | null>(1);
  const [selectedTrace, setSelectedTrace] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history list
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'New Chat',
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : new Date(),
      }));
      setChats(loaded);
    });
    return () => unsubscribe();
  }, [user]);

  // Load messages for active chat
  useEffect(() => {
    if (!user) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Please sign in to access your secure Neural Workspace.',
        timestamp: new Date(),
        agent: 'System Core',
        confidence: 100,
      }]);
      return;
    }

    if (!activeChatId) {
      setMessages([
        {
          id: 'msg-user-1',
          role: 'user',
          content: 'Scrape the top 5 phones to buy for productivity under 30k and mail it to me.',
          timestamp: new Date(Date.now() - 60000),
        },
        {
          id: 'msg-assistant-1',
          role: 'assistant',
          content: `I have executed the sandboxed research scraper across the Indian smartphone market and dispatched the comprehensive executive report to your email (archived at .donna/outbox/dispatch_phones_under_30k.md).

Here is the executive productivity breakdown:

| Rank | Model | Price | Key Specs | Productivity Superpower |
| :--- | :--- | :--- | :--- | :--- |
| **1. OnePlus Nord CE 4** | ₹24,999 | Snapdragon 7 Gen 3, 8GB/256GB, 5500mAh (100W) | 1TB microSD expansion, clean OxygenOS, 2-day battery life |
| **2. iQOO Z9s Pro** | ₹24,999 | Snapdragon 7 Gen 3, 8GB/256GB, 5500mAh (80W) | 4500 nits curved display, class-leading thermal efficiency |
| **3. Nothing Phone (2a)** | ₹23,999 | Dimensity 7200 Pro, 8GB/128GB, 5000mAh (45W) | Distraction-free Nothing OS, Glyph visual priority timers |
| **4. POCO X6 Pro** | ₹26,999 | Dimensity 8300-Ultra, 12GB/512GB, 5000mAh (67W) | 1.4M+ AnTuTu speed & massive 512GB storage for datasets |
| **5. Realme GT 6T** | ₹29,999 | Snapdragon 7+ Gen 3, 8GB/256GB, 5500mAh (120W) | 8T LTPO 1-120Hz display, 120W ultra-rapid top-up |

✅ Full report dispatched to operator@donna-os.local and permanently archived in .donna/outbox/dispatch_phones_under_30k.md.`,
          timestamp: new Date(),
          agent: 'Donna',
          confidence: 99,
        }
      ]);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'chats', activeChatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        return {
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          agent: data.agent,
          confidence: data.confidence,
          trace: data.trace,
        } as Message;
      });
      setMessages(loadedMessages);
    });

    return () => unsubscribe();
  }, [user, activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput('');
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'chats', chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input;
    setInput('');
    setIsTyping(true);
    setOrbState('processing');

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const activeUser = user || { uid: 'donna-operator-001', displayName: 'Amartya (Operator)' };
      let currentChatId = activeChatId;

      // Try firestore sync non-blockingly
      try {
        if (!currentChatId) {
          const newChatRef = await addDoc(collection(db, 'users', activeUser.uid, 'chats'), {
            title: userInput.substring(0, 30) + (userInput.length > 30 ? '...' : ''),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          currentChatId = newChatRef.id;
          setActiveChatId(currentChatId);
        } else {
          await setDoc(doc(db, 'users', activeUser.uid, 'chats', currentChatId), {
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        await addDoc(collection(db, 'users', activeUser.uid, 'chats', currentChatId, 'messages'), {
          role: 'user',
          content: userInput,
          timestamp: serverTimestamp(),
        });
      } catch (dbErr) {
        console.warn('[Chat] Firestore sync skipped/offline:', dbErr);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          history: messages.slice(1).map(m => ({ role: m.role, content: m.content })),
          userId: activeUser.uid,
          userDisplayName: activeUser.displayName || 'Operator'
        })
      });
      const data = await res.json();

      if (data.pendingApprovals && data.pendingApprovals.length > 0) {
        setPendingApprovals(data.pendingApprovals);
      }

      setOrbState('speaking');

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Task executed successfully.',
        timestamp: new Date(),
        agent: 'Donna',
        confidence: 98,
        trace: data.trace || null,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Try firestore sync assistant message non-blockingly
      try {
        if (currentChatId) {
          await addDoc(collection(db, 'users', activeUser.uid, 'chats', currentChatId, 'messages'), {
            role: 'assistant',
            content: assistantMessage.content,
            timestamp: serverTimestamp(),
            agent: 'Donna',
            confidence: 98,
            trace: data.trace || null,
          });
        }
      } catch (dbErr) {
        // Safe to ignore in offline/guest mode
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an issue processing your request. Please check server logs.',
        timestamp: new Date(),
        agent: 'System Core',
        confidence: 0,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setOrbState('idle');
    }
  };

  const handleApproveAction = async (approval: any) => {
    try {
      // Optimistic remove
      setPendingApprovals(prev => prev.filter(p => p !== approval));
      
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: approval.action, userId: user?.uid }),
      });
      const result = await res.json();
      
      let outputMsg = `**Execution Result:**\n\`\`\`\n${result.stdout || 'Success (no output)'}\n\`\`\``;
      if (result.stderr) outputMsg += `\n\n**Warning/Error:**\n\`\`\`\n${result.stderr}\n\`\`\``;
      if (result.error) outputMsg = `**Execution Failed:**\n\`\`\`\n${result.error}\n\`\`\``;
      
      if (activeChatId && user) {
        await addDoc(collection(db, 'users', user.uid, 'chats', activeChatId, 'messages'), {
          role: 'assistant',
          content: outputMsg,
          timestamp: serverTimestamp(),
          agent: 'Executor',
          confidence: 100
        });
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleAudioRecordingStart = () => {
    setOrbState('listening');
  };

  const handleAudioRecordingStop = () => {
    setOrbState('processing');
  };

  const handleAudioRecordingComplete = async (blob: Blob) => {
    setOrbState('processing');
    setIsTyping(true);

    try {
      if (!user) throw new Error("Unauthenticated");
      
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('userId', user.uid);

      const res = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Voice processing failed');
      
      const data = await res.json();
      const transcript = data.transcript || '(Audio unintelligible)';
      
      let currentChatId = activeChatId;
      if (!currentChatId) {
        const newChatRef = await addDoc(collection(db, 'users', user.uid, 'chats'), {
          title: transcript.substring(0, 30) + (transcript.length > 30 ? '...' : ''),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        currentChatId = newChatRef.id;
        setActiveChatId(currentChatId);
      } else {
        await setDoc(doc(db, 'users', user.uid, 'chats', currentChatId), {
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'user',
        content: transcript,
        timestamp: serverTimestamp(),
      });

      setOrbState('speaking');
      await addDoc(collection(db, 'users', user.uid, 'chats', currentChatId, 'messages'), {
        role: 'assistant',
        content: data.response || 'I am sorry, I did not understand that.',
        timestamp: serverTimestamp(),
        agent: 'Donna',
        confidence: 98,
      });
    } catch (error) {
      console.error('Voice error:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error connecting to the Voice Core. Please try again.',
        timestamp: new Date(),
        agent: 'Donna',
        confidence: 0,
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setOrbState('idle'), 3000);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar activeHref="/chat" />

      {/* Chat History Bolt-style Sidebar */}
      <ChatHistorySidebar 
        historyOpen={historyOpen}
        chats={chats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        handleNewChat={handleNewChat}
        deleteChat={deleteChat}
      />

      {/* Main Chat Content */}
      <main className="flex-1 flex flex-col relative bg-background overflow-hidden">
        
        {/* Header / Top Left Controls */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button 
            onClick={() => setHistoryOpen(!historyOpen)}
            className="p-2 bg-card/80 backdrop-blur-md border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Header / Top Right Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2 items-center">
          <ThemeSwitcher />
          <button 
            onClick={() => setAuditOpen(!auditOpen)}
            className={`p-2 backdrop-blur-md border border-border rounded-lg transition-colors shadow-sm
              ${auditOpen ? 'bg-accent/20 text-accent border-accent/50' : 'bg-card/80 text-muted-foreground hover:text-foreground'}`}
            title="Toggle Decision Trace"
          >
            <Network size={18} />
          </button>
        </div>

        {/* Central Particle Orb Visualizer */}
        <div className={`absolute inset-0 z-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ease-in-out
          ${orbState === 'idle' ? 'opacity-30 scale-90' : 'opacity-70 scale-100'}`}
        >
          <div className="w-[600px] h-[600px]">
            <ParticleOrb state={orbState} />
          </div>
        </div>

        {/* Chat Area */}
        <MessageList 
          messages={messages as any}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
          setAuditOpen={setAuditOpen}
          setSelectedTrace={setSelectedTrace}
          setSelectedAuditNode={setSelectedAuditNode}
        />

        {/* Input Area */}
        <ChatInput 
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          orbState={orbState}
          handleAudioRecordingStart={handleAudioRecordingStart}
          handleAudioRecordingStop={handleAudioRecordingStop}
          handleAudioRecordingComplete={handleAudioRecordingComplete}
        />
      </main>

      {/* Right Sidebar: Dynamic Decision Graph / Audit Trace per message */}
      <DecisionTraceSidebar 
        auditOpen={auditOpen}
        selectedAuditNode={selectedAuditNode}
        setSelectedAuditNode={setSelectedAuditNode}
        selectedTrace={selectedTrace}
      />

      <ApprovalModal 
        pendingApprovals={pendingApprovals}
        setPendingApprovals={setPendingApprovals}
        handleApproveAction={handleApproveAction}
      />
    </div>
  );
}
