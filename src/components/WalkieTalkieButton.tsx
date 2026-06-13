'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import styles from './WalkieTalkieButton.module.css';

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

  const startRecording = async () => {
    if (isProcessing) return;
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
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStop();
    }
  };

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
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      {isRecording && <div className={`${styles.ring} ${styles.ringRecording}`} />}
      <button
        className={`${styles.pttButton} ${isRecording ? styles.recording : ''} ${
          isProcessing ? styles.processing : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        disabled={isProcessing}
        aria-label="Push to talk"
      >
        {isProcessing ? (
          <Loader2 size={32} className={styles.spinner} />
        ) : isRecording ? (
          <Square size={32} fill="currentColor" />
        ) : (
          <Mic size={32} />
        )}
      </button>
    </div>
  );
}
