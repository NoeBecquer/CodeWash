import React, { useEffect } from 'react';
import { Mic } from 'lucide-react';
import SafeImage from '../../ui/SafeImage';

const InputGame = ({
  config,
  challenge,
  mathInput,
  setMathInput,
  isWrong,
  setIsWrong,
  isReadingWrong,
  inputRef,
  readingWordRef,
  onMathSubmit,
  onMicClick,
  isListening,
  displaySpokenText,
  t,
  playMismatch,
}) => {
  // ✅ Auto-focus input when challenge changes
  useEffect(() => {
    inputRef?.current?.focus();
  }, [challenge]);

  const answer = challenge?.answer || '';

  // =========================
  // INPUT HANDLER
  // =========================
  const handleChange = (value) => {
    let formatted = value;

    if (config.challengeType === 'math') {
      formatted = value.replace(/[^0-9-]/g, '');
    }

    if (config.challengeType === 'writing') {
      formatted = value.toUpperCase().replace(/\s/g, '');
    }

    setMathInput(formatted);

    const expected =
      config.challengeType === 'writing'
        ? answer.replace(/\s/g, '')
        : String(answer);

    if (formatted === expected) {
      onMathSubmit(config.id, formatted);
      setMathInput('');
      return;
    }

    if (formatted.length === expected.length) {
      setIsWrong(true);
      playMismatch();
      onMathSubmit(config.id, 'WRONG');

      setTimeout(() => {
        setIsWrong(false);
        setMathInput('');
        inputRef?.current?.focus();
      }, 500);
    }
  };

  // =========================
  // QUESTION DISPLAY
  // =========================
  const renderQuestion = () => {
    if (config.challengeType === 'writing') {
      return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {challenge?.images?.map((img, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span className="text-3xl text-yellow-400 font-bold">+</span>
              )}
              <SafeImage
                src={img}
                className="w-20 h-20 object-contain animate-bob"
              />
            </React.Fragment>
          ))}
        </div>
      );
    }

    return (
      <span
        ref={readingWordRef}
        className="text-white font-bold tracking-wider px-2 text-center text-xl"
      >
        {(challenge?.question || '').replace('Write: ', '')}
      </span>
    );
  };

  // =========================
  // INPUT UI (BOX STYLE)
  // =========================
  const renderInputBoxes = () => {
    const expected =
      config.challengeType === 'writing'
        ? answer.replace(/\s/g, '')
        : String(answer);

    return (
      <div className={`flex gap-2 justify-center ${isWrong ? 'animate-shake' : ''}`}>
        {expected.split('').map((_, i) => (
          <div
            key={i}
            className={`w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-mono font-bold text-white bg-black/20 rounded-t
              ${
                isWrong
                  ? 'border-red-500 bg-red-900/30'
                  : i < mathInput.length
                  ? 'border-green-500'
                  : 'border-gray-600'
              }`}
          >
            {mathInput[i] || ''}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* =========================
          QUESTION DISPLAY
      ========================= */}
      <div
        className={`flex-1 bg-black/40 rounded border-2 flex items-center justify-center mb-3 p-3 relative overflow-hidden w-full
        ${isReadingWrong ? 'border-red-500 bg-red-900/30 animate-shake' : 'border-[#555]'}`}
      >
        {renderQuestion()}

        {/* Reading feedback */}
        {config.challengeType === 'reading' && (
          <div
            className={`absolute bottom-1 text-xs ${
              isReadingWrong ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {displaySpokenText}
          </div>
        )}
      </div>

      {/* =========================
          INPUT (HIDDEN REAL INPUT)
      ========================= */}
      {(config.challengeType === 'math' ||
        config.challengeType === 'writing') && (
        <div className="relative w-full flex justify-center">
          {/* Invisible input (real input) */}
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={mathInput}
            onChange={(e) => handleChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          {/* Visible boxes */}
          {renderInputBoxes()}
        </div>
      )}

      {/* =========================
          READING (MIC)
      ========================= */}
      {config.challengeType === 'reading' && (
        <button
          onClick={() => onMicClick(config.id)}
          className={`w-full p-2 rounded border-2 flex items-center justify-center gap-2 transition-colors
            ${
              isListening
                ? 'border-red-500 bg-red-900/20'
                : 'border-gray-600 hover:bg-white/10'
            }`}
        >
          <Mic className={isListening ? 'animate-pulse text-red-500' : ''} />
          <span className="text-xs uppercase font-bold text-stone-400">
            {t('skill_card.tap_to_speak')}
          </span>
        </button>
      )}
    </>
  );
};

export default React.memo(InputGame);