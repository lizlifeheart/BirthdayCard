import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Provides a playPageTurn() function that plays either:
 *  - a layered, synthesized "paper" sound (default), or
 *  - a user-uploaded audio file, if one has been set via handleCustomSound()
 */
export default function usePageTurnSound() {
  const [muted, setMuted] = useState(false);
  const [customSoundUrl, setCustomSoundUrl] = useState(null);
  const [customSoundName, setCustomSoundName] = useState("");

  const audioCtxRef = useRef(null);
  const customAudioRef = useRef(null);

  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  // Layered synthesized paper sound: a soft low "thump" of the sheet lifting,
  // a brighter high sweep of the edge dragging past, and a tiny settle tick.
  const playSynthTurn = useCallback((ctx) => {
    const now = ctx.currentTime;

    const mkNoise = (dur) => {
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      return src;
    };

    // Layer 1: quick low-mid "lift"
    const lift = mkNoise(0.14);
    const liftFilter = ctx.createBiquadFilter();
    liftFilter.type = "bandpass";
    liftFilter.frequency.value = 500;
    liftFilter.Q.value = 0.6;
    const liftGain = ctx.createGain();
    liftGain.gain.setValueAtTime(0.0001, now);
    liftGain.gain.linearRampToValueAtTime(0.35, now + 0.01);
    liftGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    lift.connect(liftFilter).connect(liftGain).connect(ctx.destination);

    // Layer 2: the sweeping edge drag, slightly delayed, longer
    const drag = mkNoise(0.4);
    const dragFilter = ctx.createBiquadFilter();
    dragFilter.type = "bandpass";
    dragFilter.frequency.setValueAtTime(1400, now + 0.05);
    dragFilter.frequency.linearRampToValueAtTime(3200, now + 0.42);
    dragFilter.Q.value = 0.9;
    const dragGain = ctx.createGain();
    dragGain.gain.setValueAtTime(0.0001, now + 0.05);
    dragGain.gain.linearRampToValueAtTime(0.3, now + 0.09);
    dragGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    drag.connect(dragFilter).connect(dragGain).connect(ctx.destination);

    // Layer 3: tiny high-frequency "settle" tick at the end
    const settle = mkNoise(0.08);
    const settleFilter = ctx.createBiquadFilter();
    settleFilter.type = "highpass";
    settleFilter.frequency.value = 4000;
    const settleGain = ctx.createGain();
    settleGain.gain.setValueAtTime(0.0001, now + 0.42);
    settleGain.gain.linearRampToValueAtTime(0.12, now + 0.44);
    settleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    settle.connect(settleFilter).connect(settleGain).connect(ctx.destination);

    lift.start(now);
    lift.stop(now + 0.16);
    drag.start(now + 0.05);
    drag.stop(now + 0.47);
    settle.start(now + 0.42);
    settle.stop(now + 0.53);
  }, []);

  const playPageTurn = useCallback(() => {
    if (muted) return;
    if (customSoundUrl && customAudioRef.current) {
      try {
        customAudioRef.current.currentTime = 0;
        customAudioRef.current.play();
        return;
      } catch (e) {
        /* fall through to synth */
      }
    }
    try {
      const ctx = ensureCtx();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      playSynthTurn(ctx);
    } catch (e) {
      /* ignore audio errors */
    }
  }, [muted, customSoundUrl, playSynthTurn]);

  const handleCustomSound = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomSoundUrl(url);
    setCustomSoundName(file.name);
  };

  const clearCustomSound = () => {
    setCustomSoundUrl(null);
    setCustomSoundName("");
  };

  useEffect(() => {
    return () => {
      if (customSoundUrl) URL.revokeObjectURL(customSoundUrl);
    };
  }, [customSoundUrl]);

  return {
    muted,
    setMuted,
    customSoundUrl,
    customSoundName,
    customAudioRef,
    playPageTurn,
    handleCustomSound,
    clearCustomSound,
  };
}
