import React from 'react';
import { Bot, Network } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: string;
  confidence?: number;
  trace?: any;
}

interface Props {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setAuditOpen: (open: boolean) => void;
  setSelectedTrace: (trace: any) => void;
  setSelectedAuditNode: (node: number | null) => void;
}

export default function MessageList({
  messages,
  isTyping,
  messagesEndRef,
  setAuditOpen,
  setSelectedTrace,
  setSelectedAuditNode
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 z-10 scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-8 pb-32 pt-10">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 cursor-pointer group ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            onClick={() => {
              if (message.role === 'assistant') {
                setAuditOpen(true);
                setSelectedTrace(message.trace || null);
                setSelectedAuditNode(1);
              }
            }}
          >
            {message.role !== 'user' && (
              <div className="w-10 h-10 rounded-xl bg-accent/20 backdrop-blur-xl flex items-center justify-center border border-accent/30 shrink-0 shadow-lg">
                <Bot className="w-5 h-5 text-accent" />
              </div>
            )}

            <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
              {message.agent && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">{message.agent}</span>
                  {message.confidence !== undefined && (
                    <span className="px-2 py-0.5 text-[10px] rounded border border-accent/30 bg-accent/10 text-accent font-mono">
                      {message.confidence}% conf
                    </span>
                  )}
                </div>
              )}
              <div
                className={`
                  p-4 rounded-3xl shadow-xl transition-all
                  ${message.role === 'user'
                    ? 'bg-accent/20 backdrop-blur-3xl text-foreground border border-accent/30'
                    : 'bg-card/20 backdrop-blur-[32px] border border-border/40 text-foreground hover:border-accent/50'
                  }
                `}
              >
                <p className="text-[15px] whitespace-pre-wrap leading-relaxed font-sans">{message.content}</p>
              </div>
              <div className={`flex items-center gap-2 mt-2 text-xs text-muted-foreground ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-accent uppercase tracking-wider font-bold">
                    <Network size={10} /> View Decision Trace
                  </span>
                )}
                <span suppressHydrationWarning>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 backdrop-blur-xl flex items-center justify-center border border-accent/30 shrink-0 shadow-lg">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div className="p-4 bg-card/20 backdrop-blur-[32px] border border-border/40 rounded-3xl flex items-center justify-center shadow-xl">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-accent/80 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-accent/80 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-accent/80 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
