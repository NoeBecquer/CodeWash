import { useState, useEffect, useMemo, useCallback } from 'react';
import { FRIENDLY_MOBS, DIFFICULTY_CONTENT, BASE_ASSETS } from '../../constants/gameData';
import { normalizeText } from '../../utils/gameUtils';
import { playClick, getSfxVolume } from '../../utils/soundManager';

// -----------------------------
// UTILS
// -----------------------------
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
// INPUT GAME
// =====================================================
const useInputGame = ({ challenge }) => {
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
    userAnswer,
    setUserAnswer,
    validateAnswer,
    isWrong,
    setIsWrong,
  };
};

// =====================================================
// MEMORY GAME
// =====================================================
const useMemoryGame = ({
  config,
  challenge,
  difficulty,
  isBattling,
  onMathSubmit
}) => {
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
const useSimonGame = ({
  config,
  isBattling,
  onMathSubmit
}) => {
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

  // reset on exit
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
    axolotlColors,
    litAxolotl,
    isShowingSequence,
    completedRounds,
    startSimonGame,
    handleAxolotlClick,
  };
};


// =====================================================
// CLEANING GAME
// =====================================================

const ITEM_CATEGORIES = {
  AXE: 'tools',
  HOE: 'tools',
  BOW: 'tools',

  CAKE: 'food',
  MILK: 'food',

  DIRT: 'blocks',
  SAND: 'blocks',
  WOOL: 'blocks',

  TNT: 'special',
  MAP: 'special',
};

const CATEGORY_LIST = ['tools', 'food', 'blocks', 'special'];

const useCleaningGame = ({
  config,
  isBattling,
  onMathSubmit,
  challenge
}) => {
  // -----------------------------
  // STATE
  // -----------------------------
  const [items, setItems] = useState([]);
  const [sortedMap, setSortedMap] = useState({});
  const [wrongItem, setWrongItem] = useState(null);
  const [flyingItem, setFlyingItem] = useState(null);

  // -----------------------------
  // INIT
  // -----------------------------
  useEffect(() => {
    if (!isBattling || config.id !== 'cleaning') return;

    const allItems = Object.keys(BASE_ASSETS.items);
    const validItems = allItems.filter(item => ITEM_CATEGORIES[item]);
    const selected = shuffle(validItems).slice(0, 4);

    setItems(selected);
    setSortedMap({});


    setWrongItem(null);
    setFlyingItem(null);

  }, [challenge?.id, isBattling, config.id]);

  // -----------------------------
  // WRONG FEEDBACK
  // -----------------------------
  const triggerMistake = useCallback((item) => {
    setWrongItem(item);

    setTimeout(() => {
      setWrongItem(null);
    }, 300);
  }, []);

  // -----------------------------
  // SUCCESS HANDLER
  // -----------------------------
const handleSuccess = useCallback((item, category) => {
  setFlyingItem({ item, category });

  setTimeout(() => {
    setSortedMap(prev => {
      const updated = { ...prev, [item]: true };
      const isComplete = Object.keys(updated).length === items.length;

      if (isComplete) {
        setTimeout(() => {
          onMathSubmit(config.id, "WIN");
        }, 200);
      }

      return updated;
    });

    setFlyingItem(null);
  }, 300);

}, [items, config.id, onMathSubmit]);

  // -----------------------------
  // DROP HANDLER
  // -----------------------------
  const handleDrop = useCallback((item, category) => {
    if (!item) return;

    // prevent duplicate handling
    if (sortedMap[item]) return;

    const correctCategory = ITEM_CATEGORIES[item];

    if (!correctCategory) {
      console.warn(`⚠️ Missing category for item: ${item}`);
      return;
    }

    // -----------------------------
    // ✅ CORRECT
    // -----------------------------
    if (correctCategory === category) {
      handleSuccess(item, category);
      return;
    }

    // -----------------------------
    // ❌ WRONG
    // -----------------------------
    triggerMistake(item);

  }, [sortedMap, handleSuccess, triggerMistake]);

  // -----------------------------
  // DERIVED STATE
  // -----------------------------
  const isComplete = items.length > 0 && Object.keys(sortedMap).length === items.length;

  // -----------------------------
  return {
    items,
    sortedMap,
    categories: CATEGORY_LIST,

    handleDrop,

    wrongItem,
    flyingItem,
    isComplete
  };
}

// =====================================================
// MAIN DISPATCHER
// =====================================================
export const useSkillGame = (props) => {
  switch (props.config.id) {
    case 'memory':
      return useMemoryGame(props);
    case 'patterns':
      return useSimonGame(props);
    case 'cleaning':
      return useCleaningGame(props);
    default:
      return useInputGame(props);
  }
};