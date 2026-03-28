import React from 'react';

const ReadingGame = ({
  config,
  challenge,
  isListening,
  displaySpokenText,
  onMicClick,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">

      <p className="text-xl text-white text-center">
        {challenge?.question}
      </p>

      <button
        onClick={() => onMicClick(config.id)}
        className={`px-6 py-3 rounded-lg text-white font-bold ${
          isListening ? 'bg-red-600' : 'bg-green-600'
        }`}
      >
        {isListening ? 'Stop 🎤' : 'Start 🎤'}
      </button>

      <p className="text-lg text-yellow-300">
        {displaySpokenText}
      </p>

    </div>
  );
};

export default ReadingGame;