/**
 * useVoiceRecognition.js
 *
 * Responsibility: Speech → text only
 * No game logic, no validation
 */

import { useRef, useCallback } from 'react';

const MIC_OFF_TEXT = 'Mic Off';
const LISTENING_TEXT = 'Listening...';

export const useVoiceRecognition = ({
  battlingSkillId,
  setIsListening,
  setSpokenText,
}) => {
  const recognitionRef = useRef(null);

  // ------------------------------------------------------------------
  // Stop
  // ------------------------------------------------------------------
  const stopVoiceRecognition = useCallback(() => {
    const rec = recognitionRef.current;

    if (rec) {
      try {
        rec.stop();
        console.log('[Speech] Stopped');
      } catch (err) {
        console.warn('[Speech] Stop error:', err);
      }
    }

    recognitionRef.current = null;
    setIsListening(false);
    setSpokenText(MIC_OFF_TEXT);
  }, [setIsListening, setSpokenText]);

  // ------------------------------------------------------------------
  // Start
  // ------------------------------------------------------------------
  const startVoiceListener = useCallback((targetId) => {
    if (!window.webkitSpeechRecognition) {
      console.warn('[Speech] Web Speech API not available');
      setSpokenText('Mic not available');
      return;
    }

    if (recognitionRef.current) {
      console.log('[Speech] Already running');
      return;
    }

    console.log('[Speech] Initialising for:', targetId);

    const rec = new window.webkitSpeechRecognition();

    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    recognitionRef.current = rec;

    // ---------------- START
    rec.onstart = () => {
      console.log('[Speech] Listening');
      setIsListening(true);
      setSpokenText(LISTENING_TEXT);
    };

    // ---------------- END
    rec.onend = () => {
      console.log('[Speech] Ended');
      setIsListening(false);

      // Prevent restart if battle ended
      if (battlingSkillId !== 'reading' && targetId !== 'reading') {
        setSpokenText(MIC_OFF_TEXT);
        return;
      }

      // Auto-restart (smooth UX)
      setTimeout(() => {
        if (battlingSkillId === 'reading') {
          console.log('[Speech] Restarting...');
          recognitionRef.current = null;
          startVoiceListener(targetId);
        }
      }, 100);
    };

    // ---------------- ERROR
    rec.onerror = (event) => {
      console.error('[Speech] Error:', event.error);

      if (event.error === 'not-allowed') {
        setSpokenText('Mic permission denied');
        setIsListening(false);
        return;
      }

      if (event.error === 'no-speech') {
        console.log('[Speech] No speech...');
        return;
      }
    };

    // ---------------- RESULT (PURE INPUT)
    rec.onresult = (e) => {
      const raw = e.results[e.results.length - 1][0].transcript;

      const cleaned = raw
        .toUpperCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .trim();

      console.log('[Speech] Heard:', cleaned);

      setSpokenText(cleaned);
    };

    // ---------------- START ENGINE
    try {
      rec.start();
    } catch (err) {
      console.error('[Speech] Start failed:', err);
    }

  }, [battlingSkillId, setIsListening, setSpokenText]);

  // ------------------------------------------------------------------
  // Toggle
  // ------------------------------------------------------------------
  const toggleMicListener = useCallback((targetId) => {
    if (!window.webkitSpeechRecognition) {
      console.warn('[Mic] Not supported');
      setSpokenText('Mic not available');
      return;
    }

    if (recognitionRef.current) {
      stopVoiceRecognition();
    } else {
      startVoiceListener(targetId);
    }
  }, [startVoiceListener, stopVoiceRecognition, setSpokenText]);

  return {
    recognitionRef,
    startVoiceListener,
    stopVoiceRecognition,
    toggleMicListener,
  };
};