import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FRIENDLY_MOBS, DIFFICULTY_CONTENT, BASE_ASSETS } from '../../constants/gameData';
import { normalizeText } from '../../utils/gameUtils';
import { playClick, getSfxVolume } from '../../utils/soundManager';

// =====================================================
// UTILS
// =====================================================
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const AXOLOTL_NOTE_MAP = {
  Pink: 'c4',
  Cyan: 'd4',
  Gold: 'e4',
  Brown: 'f4',
  Blue: 'g4',
  Red: 'a4',
  Green: 'b4',
  Black: 'g5'
};

// =====================================================
// READING FEEDBACK (isolated + reusable)
// =====================================================
const useReadingFeedback = ({
  spokenText,
  challenge,
  config,
  isBattling,
}) => {
  const [isReadingWrong, setIsReadingWrong] = useState(false);
  const prevSpokenTextRef = useRef('');

  useEffect(() => {
    if (
      config.challengeType !== 'reading' ||
      !isBattling ||
      !spokenText ||
      spokenText === 'Listening...' ||
      spokenText === 'Mic Off'
    ) return;

    if (spokenText === prevSpokenTextRef.current) return;

    if (challenge?.answer) {
      const isCorrect =
        normalizeText(spokenText) === normalizeText(challenge.answer);

      if (!isCorrect && spokenText.length >= 2) {
        setIsReadingWrong(true);

        const timeout = setTimeout(() => {
          setIsReadingWrong(false);
        }, 500);

        return () => clearTimeout(timeout);
      }
    }

    prevSpokenTextRef.current = spokenText;
  }, [spokenText, config.challengeType, isBattling, challenge?.answer]);

  return isReadingWrong;
};

// =====================================================
// INPUT GAME
// =====================================================
const useInputGame = (props) => {
  const { challenge } = props;

  const isReadingWrong = useReadingFeedback(props);

  const [userAnswer, setUserAnswer] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  useEffect(() => {
    setUserAnswer('');
  }, [challenge?.id]);

  const validateAnswer = useCallback(() => {
    if (!challenge) return false;
    return normalizeText(userAnswer) === normalizeText(challenge.answer);
  }, [userAnswer, challenge]);

  return {
    type: 'input',
    userAnswer,
    setUserAnswer,
    validateAnswer,
    isWrong,
    setIsWrong,
    isReadingWrong,
  };
};

// =====================================================
// MEMORY GAME
// =====================================================
const useMemoryGame = (props) => {
  const { config, challenge, difficulty, isBattling, onMathSubmit } = props;

  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);
  const [mismatchShake, setMismatchShake] = useState(false);

  const memoryConfig = DIFFICULTY_CONTENT.memory[difficulty] || DIFFICULTY_CONTENT.memory[1];
  const memoryPairs = memoryConfig.pairs || 3;
  const memoryGridCols = memoryConfig.gridCols || 4;

  useEffect(() => {
    if (!isBattling || config.id !== 'memory') return;

    const allMobKeys = Object.keys(FRIENDLY_MOBS);
    const selected = shuffle(allMobKeys).slice(0, memoryPairs);
    const deck = shuffle([...selected, ...selected]);

    setMemoryCards(deck.map((mobKey, i) => ({
      id: i,
      color: mobKey,
      img: FRIENDLY_MOBS[mobKey]
    })));

    setFlippedIndices([]);
    setMatchedPairs([]);
    setIsProcessingMatch(false);
    setMismatchShake(false);

  }, [challenge?.id, isBattling, config.id, memoryPairs]);

  const handleCardClick = useCallback((index) => {
    if (!memoryCards[index]) return;

    if (
      isProcessingMatch ||
      flippedIndices.includes(index) ||
      matchedPairs.includes(memoryCards[index].color)
    ) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);
    playClick();

    if (newFlipped.length === 2) {
      setIsProcessingMatch(true);

      setTimeout(() => {
        const [a, b] = newFlipped;

        if (memoryCards[a].color === memoryCards[b].color) {
          const newMatched = [...matchedPairs, memoryCards[a].color];

          setMatchedPairs(newMatched);
          setFlippedIndices([]);
          setIsProcessingMatch(false);

          if (newMatched.length === memoryPairs) {
            setTimeout(() => onMathSubmit(config.id, "WIN"), 400);
          }

        } else {
          setMismatchShake(true);
          setTimeout(() => {
            setMismatchShake(false);
            setFlippedIndices([]);
            setIsProcessingMatch(false);
          }, 400);
        }
      }, 300);
    }
  }, [memoryCards, flippedIndices, matchedPairs, isProcessingMatch, memoryPairs, config.id, onMathSubmit]);

  return {
    type: 'memory',
    memoryCards,
    flippedIndices,
    matchedPairs,
    mismatchShake,
    memoryGridCols,
    handleCardClick,
  };
};

// =====================================================
// SIMON GAME
// =====================================================
const useSimonGame = (props) => {
  const { config, isBattling, onMathSubmit } = props;

  const [simonSequence, setSimonSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [litAxolotl, setLitAxolotl] = useState(null);
  const [simonActive, setSimonActive] = useState(false);

  const axolotlColors = useMemo(() => {
    return Object.keys(BASE_ASSETS.axolotls).slice(0, 4);
  }, []);

  const playAxolotlNote = useCallback((color) => {
    const note = AXOLOTL_NOTE_MAP[color];
    if (note) {
      const audio = new Audio(`assets/sounds/axolotl/${note}.wav`);
      audio.volume = getSfxVolume();
      audio.play().catch(playClick);
    } else {
      playClick();
    }
  }, []);

  const playSequence = useCallback((sequence) => {
    setIsShowingSequence(true);
    let i = 0;

    const run = () => {
      if (i < sequence.length) {
        setLitAxolotl(sequence[i]);
        playAxolotlNote(sequence[i]);

        setTimeout(() => {
          setLitAxolotl(null);
          i++;
          setTimeout(run, 200);
        }, 400);
      } else {
        setIsShowingSequence(false);
      }
    };

    setTimeout(run, 500);
  }, [playAxolotlNote]);

  const startSimonGame = useCallback(() => {
    const first = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
    const seq = [first];

    setSimonSequence(seq);
    setPlayerIndex(0);
    setCompletedRounds(0);
    setSimonActive(true);

    playSequence(seq);
  }, [axolotlColors, playSequence]);

  const handleAxolotlClick = useCallback((color) => {
    if (isShowingSequence || !simonActive) return;

    playAxolotlNote(color);

    if (color === simonSequence[playerIndex]) {
      if (playerIndex === simonSequence.length - 1) {
        const nextRound = completedRounds + 1;
        setCompletedRounds(nextRound);

        setTimeout(() => onMathSubmit(config.id, "WIN"), 300);

        const nextColor = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
        const newSeq = [...simonSequence, nextColor];

        setSimonSequence(newSeq);
        setPlayerIndex(0);
        setTimeout(() => playSequence(newSeq), 600);

      } else {
        setPlayerIndex(playerIndex + 1);
      }
    } else {
      setSimonActive(false);
    }
  }, [
    isShowingSequence,
    simonActive,
    simonSequence,
    playerIndex,
    completedRounds,
    axolotlColors,
    config.id,
    onMathSubmit,
    playSequence,
    playAxolotlNote
  ]);

  useEffect(() => {
    if (!isBattling && config.id === 'patterns') {
      setSimonSequence([]);
      setPlayerIndex(0);
      setIsShowingSequence(false);
      setCompletedRounds(0);
      setLitAxolotl(null);
      setSimonActive(false);
    }
  }, [isBattling, config.id]);

  return {
    type: 'patterns',
    axolotlColors,
    litAxolotl,
    isShowingSequence,
    completedRounds,
    startSimonGame,
    handleAxolotlClick,
  };
};

// =====================================================
// MAIN DISPATCHER (SAFE)
// =====================================================
export const useSkillGame = (props) => {
  const input = useInputGame(props);
  const memory = useMemoryGame(props);
  const simon = useSimonGame(props);

  switch (props.config.id) {
    case 'memory':
      return memory;
    case 'patterns':
      return simon;
    default:
      return input;
  }
};