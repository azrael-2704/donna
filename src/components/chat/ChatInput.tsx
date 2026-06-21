import React from 'react';
import { Paperclip, Send, Brain, Shield } from 'lucide-react';
import WalkieTalkieButton from '@/components/WalkieTalkieButton';

interface Props {
  input: string;
  setInput: (val: string) => void;
  handleSend: () => void;
  orbState: 'idle' | 'listening' | 'processing' | 'speaking';
  handleAudioRecordingStart: () => void;
  handleAudioRecordingStop: () => void;
  handleAudioRecordingComplete: (blob: Blob) => void;
}

export default function ChatInput({
  input,
  setInput,
  handleSend,
  orbState,
  handleAudioRecordingStart,
  handleAudioRecordingStop,
  handleAudioRecordingComplete
}: Props) {
  return (
    <div className="p-6 border-t border-border/50 bg-background/20 backdrop-blur-3xl z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.2)]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3 p-3 bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl shadow-lg transition-all focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50">
          <button className="p-3 rounded-2xl hover:bg-background/80 text-muted-foreground transition-colors">
            <Paperclip size={20} />
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Donna..."
            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground resize-none focus:outline-none py-3 min-h-[48px] max-h-[200px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          
          <div className="flex items-center shrink-0">
            <WalkieTalkieButton
              onRecordingStart={handleAudioRecordingStart}
              onRecordingStop={handleAudioRecordingStop}
              onRecordingComplete={handleAudioRecordingComplete}
              isProcessing={orbState === 'processing'}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || orbState === 'processing'}
            className="p-3 bg-accent text-accent-foreground rounded-2xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 ml-2 shadow-md shadow-accent/20"
          >
            <Send size={20} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-accent font-bold">
            <Brain size={12} /> Neural Governance Active
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="flex items-center gap-1.5 text-green-500 font-bold">
            <Shield size={12} /> End-to-End Audited
          </span>
        </div>
      </div>
    </div>
  );
}
