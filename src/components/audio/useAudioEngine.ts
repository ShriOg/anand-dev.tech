"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Web Audio API procedural sound engine
export function useAudioEngine() {
  const [isMuted, setIsMuted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Synthesizers/nodes
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // Create a low background engine hum
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 55; // Low A hum
    gain.gain.value = 0.05; // Quiet

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    humOscRef.current = osc;
    humGainRef.current = gain;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      initAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (humGainRef.current && audioCtxRef.current) {
        humGainRef.current.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
      }
      setIsMuted(false);
    } else {
      if (humGainRef.current && audioCtxRef.current) {
        humGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      setIsMuted(true);
    }
  }, [isMuted, initAudio]);

  // Clean up hum oscillator on unmount
  useEffect(() => {
    return () => {
      if (humOscRef.current) {
        try {
          humOscRef.current.stop();
          humOscRef.current.disconnect();
        } catch (e) {}
      }
      if (humGainRef.current) {
        try {
          humGainRef.current.disconnect();
        } catch (e) {}
      }
    };
  }, []);

  // Procedural SFX generators
  const playTick = useCallback(() => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, [isMuted]);

  const playClick = useCallback(() => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, [isMuted]);

  const playTransition = useCallback(() => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, [isMuted]);

  return {
    isMuted,
    toggleMute,
    playTick,
    playClick,
    playTransition,
  };
}
