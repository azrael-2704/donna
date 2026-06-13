'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './WalkieTalkieButton.module.css';

interface WalkieTalkieButtonProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingComplete?: (audioBlob: Blob) => void;
  isProcessing?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'processing';

export default function WalkieTalkieButton({
  onRecordingStart,
  onRecordingStop,
  onRecordingComplete,
  isProcessing = false,
}: WalkieTalkieButtonProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync external processing state
  useEffect(() => {
    if (isProcessing) {
      setState('processing');
    } else if (state === 'processing') {
      setState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = useCallback(async () => {
    if (state !== 'idle') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete?.(audioBlob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setState('recording');
      setDuration(0);
      onRecordingStart?.();

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [state, onRecordingStart, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (state !== 'recording') return;

    mediaRecorderRef.current?.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState('processing');
    onRecordingStop?.();
  }, [state, onRecordingStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Determine CSS classes
  const btnClass = [
    styles.btn,
    state === 'idle' && styles.idle,
    state === 'recording' && styles.recording,
    state === 'processing' && styles.processing,
  ]
    .filter(Boolean)
    .join(' ');

  const labelClass = [
    styles.label,
    state === 'recording' && styles.labelRecording,
    state === 'processing' && styles.labelProcessing,
  ]
    .filter(Boolean)
    .join(' ');

  const icon =
    state === 'recording' ? '🔴' : state === 'processing' ? '⟳' : '🎤';

  const label =
    state === 'recording'
      ? 'Listening…'
      : state === 'processing'
        ? 'Processing…'
        : 'Hold to Talk';

  return (
    <div className={styles.wrap}>
      {/* Pulse rings — recording */}
      {state === 'recording' && (
        <div className={styles.rings}>
          <div className={styles.ring} />
          <div className={styles.ring} />
          <div className={styles.ring} />
        </div>
      )}

      {/* Orbit dot — processing */}
      {state === 'processing' && (
        <div className={styles.orbitWrap}>
          <div className={styles.orbitDot} />
        </div>
      )}

      <button
        className={btnClass}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={state === 'recording' ? stopRecording : undefined}
        onTouchStart={(e) => {
          e.preventDefault();
          startRecording();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopRecording();
        }}
        aria-label={label}
      >
        <span
          className={`${styles.icon} ${state === 'processing' ? styles.iconSpin : ''}`}
        >
          {icon}
        </span>
      </button>

      <span className={labelClass}>{label}</span>

      {state === 'recording' && (
        <span className={styles.timer}>{formatTime(duration)}</span>
      )}
    </div>
  );
}
