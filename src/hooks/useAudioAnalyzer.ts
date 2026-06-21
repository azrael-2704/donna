import { useEffect, useRef, useState } from 'react';

export function useAudioAnalyzer(isActive: boolean) {
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      setDataArray(null);
      return;
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 128; // Lower for performance, gives 64 bins
        analyzer.smoothingTimeConstant = 0.8;
        analyzerRef.current = analyzer;
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyzer);
        sourceRef.current = source;
        
        const bufferLength = analyzer.frequencyBinCount;
        const data = new Uint8Array(bufferLength);
        
        const updateData = () => {
          analyzer.getByteFrequencyData(data);
          // Create a new array so React state updates
          setDataArray(new Uint8Array(data));
          animationRef.current = requestAnimationFrame(updateData);
        };
        
        updateData();
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    };

    initAudio();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isActive]);

  return dataArray;
}
