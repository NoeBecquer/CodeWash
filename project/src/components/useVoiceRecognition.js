/**
 * useVoiceRecognition.js
 *
 * Encapsulates all Web Speech API wiring.
 * Maximum nesting depth: 3  (hook body → handler → inner if / named callback)
 */

import { useRef, useCallback } from 'react';
import { HOMOPHONES } from '../constants/gameData';

const MIN_SPOKEN_TEXT_LENGTH = 2;
const MIC_OFF_TEXT           = 'Mic Off';

/**
 * @param {object} params
 *   challengeDataRef  – ref always holding the latest challengeData
 *   battlingSkillId   – current state value (closure — intentional)
 *   onCorrect(id)     – fired when spoken answer matches
 *   onWrong(id)       – fired when spoken answer is wrong
 *   setIsListening    – state setter
 *   setSpokenText     – state setter
 *
 * @returns {{ recognitionRef, startVoiceListener, stopVoiceRecognition, toggleMicListener }}
 */
export const useVoiceRecognition = ({
    challengeDataRef,
    battlingSkillId,
    onCorrect,
    onWrong,
    setIsListening,
    setSpokenText,
}) => {
    const recognitionRef = useRef(null);

    // ------------------------------------------------------------------
    // Stop
    // ------------------------------------------------------------------
    const stopVoiceRecognition = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                console.log('[Speech] Stopped');
            } catch (err) {
                console.warn('[Speech] Error stopping:', err);
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
        setSpokenText(MIC_OFF_TEXT);
    }, [setIsListening, setSpokenText]);

    // ------------------------------------------------------------------
    // Start
    // ------------------------------------------------------------------
    const startVoiceListener = useCallback((targetId) => {
        if (!window.webkitSpeechRecognition) {
            console.warn('[Speech] Web Speech API not available');
            return;
        }
        if (recognitionRef.current) {
            console.log('[Speech] Already initialised, skipping');
            return;
        }

        console.log('[Speech] Initialising for skill:', targetId);
        const rec = new window.webkitSpeechRecognition();
        rec.lang       = 'en-US';
        rec.continuous = true;
        recognitionRef.current = rec;

        rec.onstart = () => {
            console.log('[Speech] Started listening');
            setIsListening(true);
            setSpokenText('Listening...');
        };

        rec.onend = () => {
            console.log('[Speech] Ended');
            setIsListening(false);
            // Intentionally read battlingSkillId from closure — stale value
            // is the desired guard against restarting after battle ends.
            if (battlingSkillId !== 'reading' && targetId !== 'reading') {
                setSpokenText(MIC_OFF_TEXT);
                return;
            }
            const tryRestart = () => {
                if (battlingSkillId === 'reading') {
                    console.log('[Speech] Auto-restarting');
                    recognitionRef.current = null;
                    startVoiceListener(targetId);
                }
            };
            setTimeout(tryRestart, 100);
        };

        rec.onerror = (event) => {
            console.error('[Speech] Error:', event.error);
            if (event.error === 'no-speech') {
                console.log('[Speech] No speech detected, continuing...');
            } else if (event.error === 'not-allowed') {
                console.error('[Speech] Microphone permission denied');
                setSpokenText('Mic permission denied');
                setIsListening(false);
            } else {
                console.error('[Speech] Error type:', event.error);
            }
        };

        rec.onresult = (e) => {
            const transcript = e.results[e.results.length - 1][0].transcript
                .toUpperCase()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

            console.log('[Speech] Recognised:', transcript);
            setSpokenText(transcript);

            const challenge = challengeDataRef.current;
            if (!challenge || challenge.type !== 'reading') return;

            const skillTarget  = targetId || battlingSkillId;
            const isCorrect    = transcript === challenge.answer
                || HOMOPHONES[challenge.answer]?.includes(transcript);

            if (isCorrect) {
                console.log('[Speech] Correct answer!');
                onCorrect(skillTarget);
            } else if (transcript.length >= MIN_SPOKEN_TEXT_LENGTH) {
                console.log('[Speech] Wrong answer');
                onWrong(skillTarget);
            }
        };

        try {
            rec.start();
            console.log('[Speech] Start command issued');
        } catch (err) {
            console.error('[Speech] Failed to start:', err);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battlingSkillId, challengeDataRef, onCorrect, onWrong, setIsListening, setSpokenText]);

    // ------------------------------------------------------------------
    // Toggle
    // ------------------------------------------------------------------
    const toggleMicListener = useCallback((targetId) => {
        console.log('[Mic Toggle] active:', !!recognitionRef.current);

        if (!window.webkitSpeechRecognition) {
            console.warn('[Mic Toggle] Web Speech API not available');
            setSpokenText('Mic not available');
            return;
        }

        if (recognitionRef.current) {
            stopVoiceRecognition();
        } else {
            startVoiceListener(targetId);
        }
    }, [startVoiceListener, stopVoiceRecognition, setSpokenText]);

    return { recognitionRef, startVoiceListener, stopVoiceRecognition, toggleMicListener };
};
