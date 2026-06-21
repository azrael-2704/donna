'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface WalkieTalkieButtonProps {
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

export default function WalkieTalkieButton({
  onRecordingStart,
  onRecordingStop,
  onRecordingComplete,
  isProcessing,
}: WalkieTalkieButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = useCallback(async () => {
    if (isProcessing) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStart();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [isProcessing, onRecordingComplete, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStop();
    }
  }, [onRecordingStop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startRecording, stopRecording]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    e.preventDefault();
    stopRecording();
  };

  return (
    <div className="relative flex items-center justify-center group" title="Hold Spacebar to talk">
      <button
        className={`
          flex items-center gap-2 relative z-10 px-4 py-3 rounded-xl transition-all duration-300
          ${isProcessing 
            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
            : isRecording 
              ? 'bg-accent text-accent-foreground shadow-lg scale-105 ring-4 ring-accent/20 border-accent' 
              : 'bg-background hover:bg-muted text-foreground border border-border hover:border-border/80'
          }
        `}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isRecording ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-sm font-medium pr-1">Recording...</span>
          </>
        ) : (
          <>
            <Mic size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <div className="hidden sm:flex items-center gap-1.5 border-l border-border pl-3 ml-1">
              <span className="text-xs font-medium text-muted-foreground">Hold</span>
              <kbd className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold border border-border bg-card rounded text-muted-foreground shadow-sm">Space</kbd>
            </div>
          </>
        )}
      </button>
    </div>
  );
}
