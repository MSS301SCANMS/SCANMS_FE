import { useCallback, useEffect, useRef, useState } from 'react';
import { authService } from '../services/auth.service';
import { getChatSocket } from '../services/chat-socket.service';
import { subscribeChatNotifications } from '../utils/chat-notification-events';

export function useChatNotifications(onChange: () => void) {
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('scanms_chat_sound') !== 'off');
  const [soundBlocked, setSoundBlocked] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const change = useRef(onChange);
  change.current = onChange;
  const enabled = useRef(soundOn);
  enabled.current = soundOn;

  const unlockSound = useCallback(async () => {
    try {
      const AudioType = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioType) return;
      const context = audio.current || new AudioType();
      audio.current = context;
      if (context.state !== 'running') await context.resume();
      setSoundBlocked(context.state !== 'running');
    } catch {
      setSoundBlocked(true);
    }
  }, []);

  const playChime = useCallback(() => {
    if (!enabled.current) return;
    const context = audio.current;
    // Never bypass browser autoplay restrictions; badge still updates normally.
    if (!context || context.state !== 'running') {
      setSoundBlocked(true);
      return;
    }
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.setValueAtTime(740, context.currentTime);
      gain.gain.setValueAtTime(0.06, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain).connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start();
      oscillator.stop(context.currentTime + 0.22);
    } catch {
      setSoundBlocked(true);
    }
  }, []);

  useEffect(() => {
    const onGesture = () => { if (enabled.current) void unlockSound(); };
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      void audio.current?.close().catch(() => undefined);
      audio.current = null;
    };
  }, [unlockSound]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let scope: string | undefined;
    const seen = new Set<string>();
    const bind = () => {
      const user = authService.getCurrentUser();
      const token = localStorage.getItem('token');
      const nextScope = user && token ? `${user.id}:${token}` : undefined;
      if (scope === nextScope) return;
      unsubscribe?.();
      seen.clear();
      scope = nextScope;
      // Refresh on account switches, but never play sound for initial history.
      change.current();
      if (nextScope && user) {
        unsubscribe = subscribeChatNotifications(getChatSocket(), user.id, () => change.current(), playChime, seen);
      }
    };
    bind();
    window.addEventListener('auth-user-updated', bind);
    return () => {
      unsubscribe?.();
      window.removeEventListener('auth-user-updated', bind);
    };
  }, [playChime]);

  const toggleSound = () => {
    const next = !soundOn;
    enabled.current = next;
    setSoundOn(next);
    localStorage.setItem('scanms_chat_sound', next ? 'on' : 'off');
    if (next) void unlockSound();
  };
  return { soundOn, soundBlocked, toggleSound, unlockSound, playChime };
}
