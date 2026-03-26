import React from 'react';
import MemoryGame from './game/MemoryGame';
import SimonGame from './game/SimonGame';
import InputGame from './game/InputGame';
import CleaningGame from './game/CleaningGame';

const GameSection = ({
  config,
  challenge,
  game,
  themeData,
  inputRef,
  readingWordRef,
  isReadingWrong,
  onMathSubmit,
  onMicClick,
  isListening,
  displaySpokenText,
  t,
  playMismatch,
}) => {

  if (!challenge) return null;

  // MEMORY
  if (config.id === 'memory') {
    return (
      <MemoryGame
        key={challenge.id}
        memoryCards={game.memoryCards}
        flippedIndices={game.flippedIndices}
        matchedPairs={game.matchedPairs}
        mismatchShake={game.mismatchShake}
        memoryGridCols={game.memoryGridCols}
        handleCardClick={game.handleCardClick}
        themeData={themeData}
      />
    );
  }

  // SIMON
  if (config.id === 'patterns') {
    return (
      <SimonGame
        axolotlColors={game.axolotlColors}
        litAxolotl={game.litAxolotl}
        handleAxolotlClick={game.handleAxolotlClick}
        isShowingSequence={game.isShowingSequence}
        completedRounds={game.completedRounds}
        startSimonGame={game.startSimonGame}
        t={t}
      />
    );
  }

if (config.id === 'cleaning') {
  return (
    <CleaningGame
      key={challenge.id}
      items={game.items}
      sortedMap={game.sortedMap}
      selectedCategory={game.selectedCategory}
      categories={game.categories}
      selectCategory={game.selectCategory}
      handleDrop={game.handleDrop}
      mistake={game.mistake}
    />
  );
}

  // INPUT (default)
  return (
    <InputGame
      config={config}
      challenge={challenge}
      mathInput={game.userAnswer}
      setMathInput={game.setUserAnswer}
      isWrong={game.isWrong}
      setIsWrong={game.setIsWrong}
      isReadingWrong={isReadingWrong}
      inputRef={inputRef}
      readingWordRef={readingWordRef}
      onMathSubmit={onMathSubmit}
      onMicClick={onMicClick}
      isListening={isListening}
      displaySpokenText={displaySpokenText}
      t={t}
      playMismatch={playMismatch}
    />
  );
};

export default React.memo(GameSection);