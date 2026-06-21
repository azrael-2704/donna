'use client';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Mic, X } from 'lucide-react';
import ParticleSphere from './ParticleSphere';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import styles from './VoiceModeOverlay.module.css';

interface VoiceModeOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

export default function VoiceModeOverlay({ isActive, onClose }: VoiceModeOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const audioData = useAudioAnalyzer(isActive);

  useEffect(() => {
    if (isActive) setMounted(true);
    else setTimeout(() => setMounted(false), 500); // Wait for fade out
  }, [isActive]);

  if (!mounted) return null;

  return (
    <div className={`${styles.overlay} ${isActive ? styles.active : styles.closing}`}>
      <div className={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <ParticleSphere audioData={audioData} />
        </Canvas>
      </div>

      <div className={styles.controls}>
        <button className={styles.closeBtn} onClick={onClose} title="Exit Voice Mode">
          <X size={24} />
        </button>
      </div>

      <div className={styles.statusBox}>
        <div className={styles.micIconWrap}>
          <Mic size={32} className={styles.micIcon} />
          <div className={styles.micRipples} />
        </div>
        <h2 className={styles.listeningText}>Listening...</h2>
        <p className={styles.hintText}>Speak to see the neural sphere react</p>
      </div>
    </div>
  );
}
