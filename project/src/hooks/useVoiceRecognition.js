/**
 * useVoiceRecognition.js
 *
 * Responsibility: Speech → text only
 * No validation, no game logic
 */

import { useRef, useCallback, useEffect } from 'react';

const MIC_OFF_TEXT = 'Mic Off';
const LISTENING_TEXT = 'Listening...';

export const useVoiceRecognition = ({
  battlingSkillId,
  setIsListening,
  setSpokenText,
  setFinalSpokenText
}) => {
  const recognitionRef = useRef(null);
  const hadErrorRef = useRef(false);
  const lastTextRef = useRef('');

  // ------------------------------------------------------------------
  // CLEAN STOP (single source of truth)
  // ------------------------------------------------------------------
  const stopVoiceRecognition = useCallback(() => {
    const rec = recognitionRef.current;

    if (rec) {
      try {
        rec.onend = null; // prevent auto-restart
        rec.stop();
      } catch (err) {
        console.warn('[Speech] Stop error:', err);
      }
    }

    recognitionRef.current = null;
    hadErrorRef.current = false;

    setIsListening(false);
    setSpokenText(MIC_OFF_TEXT);
  }, [setIsListening, setSpokenText]);

  // ------------------------------------------------------------------
  // START
  // ------------------------------------------------------------------
  const startVoiceListener = useCallback((targetId) => {
    if (!window.webkitSpeechRecognition) {
      console.warn('[Speech] API not available');
      setSpokenText('Mic not available');
      return;
    }

    if (recognitionRef.current) return; // prevent duplicates

    const rec = new window.webkitSpeechRecognition();

    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    recognitionRef.current = rec;

    // ---------------- START
    rec.onstart = () => {
      hadErrorRef.current = false;
      setIsListening(true);
      setSpokenText(LISTENING_TEXT);
    };

    // ---------------- RESULT (PURE INPUT)
    rec.onresult = (e) => {
      const raw = e.results[e.results.length - 1][0].transcript;

      const cleaned = raw
        .toUpperCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .trim();

      // 🚫 prevent duplicate spam
      if (!cleaned || cleaned === lastTextRef.current) return;

      lastTextRef.current = cleaned;

      setSpokenText(cleaned);
      setFinalSpokenText?.(cleaned);
    };

    // ---------------- ERROR
    rec.onerror = (event) => {
      console.error('[Speech] Error:', event.error);
      hadErrorRef.current = true;

      if (event.error === 'not-allowed') {
        setSpokenText('Mic permission denied');
        stopVoiceRecognition();
      }
    };

    // ---------------- END (controlled restart)
    rec.onend = () => {
      setIsListening(false);

      if (hadErrorRef.current) {
        recognitionRef.current = null;
        setSpokenText(MIC_OFF_TEXT);
        return;
      }

      // restart only if still in same battle
      if (recognitionRef.current && battlingSkillId === targetId) {
        try {
          rec.start();
        } catch {
          recognitionRef.current = null;
        }
      } else {
        recognitionRef.current = null;
        setSpokenText(MIC_OFF_TEXT);
      }
    };

    // ---------------- START ENGINE
    try {
      rec.start();
    } catch (err) {
      console.error('[Speech] Start failed:', err);
      recognitionRef.current = null;
    }

  }, [
    battlingSkillId,
    setIsListening,
    setSpokenText,
    setFinalSpokenText,
    stopVoiceRecognition
  ]);

  // ------------------------------------------------------------------
  // TOGGLE
  // ------------------------------------------------------------------
  const toggleMicListener = useCallback((targetId) => {
    if (!window.webkitSpeechRecognition) {
      setSpokenText('Mic not available');
      return;
    }

    if (recognitionRef.current) {
      stopVoiceRecognition();
    } else {
      startVoiceListener(targetId);
    }
  }, [startVoiceListener, stopVoiceRecognition, setSpokenText]);

  // ------------------------------------------------------------------
  // CLEANUP (CRITICAL)
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopVoiceRecognition();
    };
  }, [stopVoiceRecognition]);

  return {
    recognitionRef,
    startVoiceListener,
    stopVoiceRecognition,
    toggleMicListener,
  };
};