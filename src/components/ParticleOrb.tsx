'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

interface ParticleOrbProps {
  state?: 'idle' | 'listening' | 'processing' | 'speaking';
  className?: string;
}

function ParticleSphere({ state = 'idle' }: { state: 'idle' | 'listening' | 'processing' | 'speaking' }) {
  const pointsRef = useRef<THREE.Points>(null);
  const { resolvedTheme } = useTheme();
  const timeRef = useRef(0);
  
  // Audio visualization
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;

    if (state === 'listening') {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
        stream = s;
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }).catch(err => {
        console.error('Error accessing microphone for visualizer:', err);
      });
    }

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioCtx) audioCtx.close();
      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, [state]);

  const particleCount = 2800;
  
  // Compute initial positions and colors
  const [positions, colors, originalPositions] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      
      const radius = 2.0;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
      
      color.setRGB(0.5, 0.5, 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return [positions, colors, originalPositions];
  }, [particleCount]);

  const originalPosRef = useRef(originalPositions);

  useFrame((stateObj, delta) => {
    if (!pointsRef.current) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    
    const posAttrib = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colAttrib = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const originals = originalPosRef.current;
    
    // Smooth target rotation based on state
    let targetRotY = pointsRef.current.rotation.y;
    let targetRotX = pointsRef.current.rotation.x;

    if (state === 'idle') {
      targetRotY += delta * 0.05;
      targetRotX = Math.sin(time * 0.02) * 0.1;
    } else if (state === 'listening') {
      targetRotY += delta * 0.15;
    } else if (state === 'processing') {
      targetRotY += delta * 0.35;
      targetRotX += delta * 0.08;
    } else if (state === 'speaking') {
      targetRotY += delta * 0.12;
    }

    pointsRef.current.rotation.y += (targetRotY - pointsRef.current.rotation.y) * 0.1;
    pointsRef.current.rotation.x += (targetRotX - pointsRef.current.rotation.x) * 0.1;

    const isDark = resolvedTheme === 'dark';
    const targetColor = new THREE.Color();
    if (isDark) {
      if (state === 'idle') targetColor.setHex(0xa1a1aa);
      else if (state === 'listening') targetColor.setHex(0xf4f4f5);
      else if (state === 'processing') targetColor.setHex(0x71717a);
      else if (state === 'speaking') targetColor.setHex(0xffffff);
    } else {
      if (state === 'idle') targetColor.setHex(0x52525b);
      else if (state === 'listening') targetColor.setHex(0x09090b);
      else if (state === 'processing') targetColor.setHex(0x71717a);
      else if (state === 'speaking') targetColor.setHex(0x18181b);
    }

    // Audio volume analysis for listening state
    let volume = 0;
    if (state === 'listening' && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      volume = sum / dataArrayRef.current.length;
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ox = originals[i3];
      const oy = originals[i3 + 1];
      const oz = originals[i3 + 2];
      
      const dist = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / dist;
      const ny = oy / dist;
      const nz = oz / dist;

      let targetR = dist;

      if (state === 'idle') {
        const wave = Math.sin(time * 0.3 + oy * 0.4) * 0.03;
        targetR = dist + wave;
      } 
      else if (state === 'listening') {
        // Use real microphone volume to drive the orb's visualizer (scaled 0-255)
        const micImpact = (volume / 255.0) * 0.4;
        const wave = Math.sin(time * 5.0 - oy * 2.0) * 0.05 + micImpact;
        targetR = dist + wave;
      } 
      else if (state === 'processing') {
        const wave = Math.sin(time * 4.0 + ox * 1.8) * Math.cos(time * 3.0 + oz * 1.8) * 0.22;
        targetR = dist + wave;
      } 
      else if (state === 'speaking') {
        const wave = Math.sin(time * 6.5 - dist * 1.5) * 0.14 + Math.sin(time * 15.0 + oy * 3.0) * 0.03;
        targetR = dist + wave;
      }

      // Smooth coordinate interpolation (lerp) to prevent teleportation
      const targetX = nx * targetR;
      const targetY = ny * targetR;
      const targetZ = nz * targetR;

      posAttrib[i3] += (targetX - posAttrib[i3]) * 0.1;
      posAttrib[i3 + 1] += (targetY - posAttrib[i3 + 1]) * 0.1;
      posAttrib[i3 + 2] += (targetZ - posAttrib[i3 + 2]) * 0.1;

      colAttrib[i3] += (targetColor.r - colAttrib[i3]) * 0.08;
      colAttrib[i3 + 1] += (targetColor.g - colAttrib[i3 + 1]) * 0.08;
      colAttrib[i3 + 2] += (targetColor.b - colAttrib[i3 + 2]) * 0.08;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function ParticleOrb({ state = 'idle', className = '' }: ParticleOrbProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <ParticleSphere state={state} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
      </Canvas>
    </div>
  );
}
