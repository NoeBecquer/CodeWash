import { useState, useRef, useCallback, useEffect } from 'react';
import {
  calculateDamage,
  calculateMobHealth,
  calculateXPReward,
  calculateXPToLevel,
  getEncounterType,
} from '../utils/gameUtils';

import {
  playFail,
  playLevelUp,
  playNotification,
  playSuccessfulHit,
  playMobHurt,
  playMobDeath,
} from '../utils/soundManager';

import {
  buildMobDefeatStats,
  buildLevelProgression,
  buildMobRotation,
} from '../utils/skillStateUtils';

import { SKILL_DATA } from '../constants/gameData';

import { getReadingDifficultyFromLevel } from '../utils/gameUtils';

// -----------------------------
const BATTLE_STATES = {
  IDLE: 'IDLE',
  IN_PROGRESS: 'IN_PROGRESS',
  VICTORY: 'VICTORY',
};

// -----------------------------
export const useBattleLogic = ({
  skills,
  setSkills,
  stats,
  setStats,
  battlingSkillId,
  setChallengeData,
  setSpokenText,
  checkAchievements,
  setPlayerHealth,
  generateChallenge,
  battleDifficulty,
}) => {

  const [battleState, setBattleState] = useState(BATTLE_STATES.IDLE);
  const [damageNumbers, setDamageNumbers] = useState([]);
  const [lootBox, setLootBox] = useState(null);

  const damageIdRef = useRef(0);
  const requestIdRef = useRef(0); // 🔥 prevents async race conditions

  // -----------------------------
  // FSM
  // -----------------------------
  const transition = useCallback((next) => {
    console.log(`⚔️ ${battleState} → ${next}`);
    setBattleState(next);
  }, [battleState]);

  // -----------------------------
  // CLEANUP
  // -----------------------------
  useEffect(() => {
    if (!lootBox) return;
    const t = setTimeout(() => setLootBox(null), 4000);
    return () => clearTimeout(t);
  }, [lootBox]);

  // -----------------------------
  // INIT
  // -----------------------------
  useEffect(() => {
    if (!battlingSkillId) return;

    transition(BATTLE_STATES.IN_PROGRESS);
  }, [battlingSkillId, transition]);

  // -----------------------------
  // HELPERS
  // -----------------------------
  const applyPartialHit = useCallback((current, damage) => {
    const totalXP = calculateXPReward(current.difficulty, current.level);
    const hitsToKill = Math.ceil(current.mobMaxHealth / damage);
    const xpPerHit = Math.floor(totalXP / hitsToKill);

    let newXp = current.xp + xpPerHit;
    let newLevel = current.level;
    let xpToLevel = calculateXPToLevel(current.difficulty, newLevel);

    while (newXp >= xpToLevel) {
      newXp -= xpToLevel;
      newLevel++;
      xpToLevel = calculateXPToLevel(current.difficulty, newLevel);
    }

    return {
      ...current,
      mobHealth: current.mobHealth - damage,
      xp: newXp,
      level: newLevel,
    };
  }, []);

  const applyKillHit = useCallback((prev, skillId, current, skillConfig) => {
    const xpGain = calculateXPReward(current.difficulty, current.level);

    let newXp = current.xp + xpGain;
    let newLevel = current.level;
    let xpToLevel = calculateXPToLevel(current.difficulty, newLevel);

    while (newXp >= xpToLevel) {
      newXp -= xpToLevel;
      newLevel++;
      xpToLevel = calculateXPToLevel(current.difficulty, newLevel);
    }

    setStats(prevStats => {
      const nextStats = buildMobDefeatStats(
        prevStats,
        getEncounterType(current.level),
        current
      );

      setTimeout(() => {
        checkAchievements(prevStats, nextStats, prev, {
          ...prev,
          [skillId]: { ...current, level: newLevel }
        });
      }, 100);

      return nextStats;
    });

    const progression = buildLevelProgression(
      newLevel,
      newXp,
      current.difficulty,
      current.earnedBadges || [],
      skillConfig
    );

    if (progression.didLevelUp) playLevelUp();

    if (progression.lootBoxNotif) {
      setLootBox(progression.lootBoxNotif);
      playNotification();
    }

    const newMaxHealth = calculateMobHealth(progression.newDifficulty);

    return {
      ...current,
      level: progression.newLevel,
      xp: progression.newXp,
      difficulty: progression.newDifficulty,
      earnedBadges: progression.newBadges,
      mobHealth: newMaxHealth,
      mobMaxHealth: newMaxHealth,
      ...buildMobRotation(skillConfig.id, current),
    };
  }, [setStats, checkAchievements]);

  // -----------------------------
  // FAILURE
  // -----------------------------
  const handleFailure = useCallback(() => {
    setPlayerHealth(prev => Math.max(0, prev - 1));

    setStats(prev => ({
      ...prev,
      totalMistakes: (prev.totalMistakes || 0) + 1
    }));

    playFail();
  }, [setPlayerHealth, setStats]);

  // -----------------------------
  // CHALLENGE LOADER (SAFE)
  // -----------------------------
  const loadNextChallenge = useCallback(async (challengeType) => {
    const currentRequest = ++requestIdRef.current;

    const newChallenge = await generateChallenge(
      challengeType,
      battleDifficulty
    );

    // 🛑 cancel outdated async
    if (currentRequest !== requestIdRef.current) return;

    setChallengeData(newChallenge);
    setSpokenText('');
  }, [generateChallenge, battleDifficulty, setChallengeData, setSpokenText]);

  // -----------------------------
  // MAIN LOOP
  // -----------------------------
const handleSuccessHit = useCallback(async (skillId, isWrong) => {
  if (battleState !== BATTLE_STATES.IN_PROGRESS) return;

  // -----------------------------
  // FAILURE
  // -----------------------------
  if (isWrong === 'WRONG') {
    handleFailure();
    return;
  }

  const current = skills[skillId];
  if (!current) return;

  const skillConfig = SKILL_DATA.find(s => s.id === skillId);

  // -----------------------------
  // COMPUTE OUTSIDE STATE
  // -----------------------------
  const damage = calculateDamage(current.level, current.difficulty);
  const willKill = current.mobHealth - damage <= 0;

  const isInstantGame =
    skillConfig.id === 'cleaning' ||
    skillConfig.id === 'patterns';

  const isLoopGame =
    skillConfig.challengeType === 'reading' ||
    skillConfig.id === 'memory';

  const shouldLoadNext = isLoopGame || (!willKill && !isInstantGame);
  const shouldTriggerVictory = !isLoopGame && (willKill || isInstantGame);

  // -----------------------------
  // STATE UPDATE
  // -----------------------------
  setSkills(prev => {
    const prevSkill = prev[skillId];
    if (!prevSkill) return prev;

    const updated = willKill
      ? applyKillHit(prev, skillId, prevSkill, skillConfig)
      : applyPartialHit(prevSkill, damage);

    return { ...prev, [skillId]: updated };
  });

  // -----------------------------
  // VISUAL + AUDIO FX
  // -----------------------------
  const id = ++damageIdRef.current;

  setDamageNumbers(prev => [
    ...prev,
    { id, skillId, val: damage }
  ]);

  setTimeout(() => {
    setDamageNumbers(prev => prev.filter(d => d.id !== id));
  }, 800);

  if (willKill) playMobDeath(current.currentMob);
  else playMobHurt(current.currentMob);

  playSuccessfulHit();

  // Reset speech buffer
  setSpokenText('');

  // -----------------------------
  // 🔥 NEXT CHALLENGE (FIXED + SCALED)
  // -----------------------------
  if (shouldLoadNext && skillConfig) {
    const nextDifficulty =
      skillConfig.challengeType === 'reading'
        ? getReadingDifficultyFromLevel(current.level) // ✅ FIXED scaling
        : current.difficulty;

    const newChallenge = await generateChallenge(
      skillConfig.challengeType,
      nextDifficulty
    );

    setChallengeData({ ...newChallenge });
  }

  // -----------------------------
  // VICTORY
  // -----------------------------
  if (shouldTriggerVictory) {
    setBattleState(BATTLE_STATES.VICTORY);
  }

}, [
  battleState,
  skills,
  generateChallenge,
  setChallengeData,
  setSkills,
  setSpokenText,
  handleFailure
]);
  // -----------------------------
  return {
    handleSuccessHit,
    damageNumbers,
    lootBox,
    battleState,
    transition,
  };
};