import React from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { ChatSession } from '@/lib/types';

interface Props {
  historyOpen: boolean;
  chats: ChatSession[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  handleNewChat: () => void;
  deleteChat: (e: React.MouseEvent, chatId: string) => void;
}

export default function ChatHistorySidebar({
  historyOpen,
  chats,
  activeChatId,
  setActiveChatId,
  handleNewChat,
  deleteChat,
}: Props) {
  return (
    <div className={`transition-all duration-300 ease-in-out border-r border-border bg-card/40 backdrop-blur-xl flex flex-col shrink-0 z-20 overflow-hidden
      ${historyOpen ? 'w-64' : 'w-0 border-r-0'}`}
    >
      <div className="p-4 border-b border-border/50">
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 justify-center bg-foreground text-background hover:bg-accent hover:text-accent-foreground py-2.5 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {chats.map(chat => (
          <div 
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors text-sm
              ${activeChatId === chat.id ? 'bg-accent/20 text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <MessageSquare size={14} className="shrink-0 opacity-70" />
              <span className="truncate">{chat.title}</span>
            </div>
            <button 
              onClick={(e) => deleteChat(e, chat.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all shrink-0 p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {chats.length === 0 && (
          <p className="text-xs text-muted-foreground text-center p-4">No recent chats.</p>
        )}
      </div>
    </div>
  );
}
