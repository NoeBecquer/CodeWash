import { useState, useRef, useCallback, useEffect } from 'react';
import { calculateXPToLevel } from '../utils/gameUtils';

import {
  calculateDamage,
  calculateMobHealth,
  calculateXPReward,
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

import { SKILL_DATA, HOSTILE_MOBS } from '../constants/gameData';

// -----------------------------
const BATTLE_STATES = {
  IDLE: 'IDLE',
  IN_PROGRESS: 'IN_PROGRESS',
  VICTORY: 'VICTORY',
};

const BOSS_HEALING_ANIMATION_DURATION = 600;

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
  const [bossHealing, setBossHealing] = useState(null);

  const damageIdRef = useRef(0);
  const nextChallengeRef = useRef(null);

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
  // 🔥 PRELOAD PIPELINE (CORE FIX)
  // -----------------------------
  useEffect(() => {
    if (!battlingSkillId) return;

    const skillConfig = SKILL_DATA.find(s => s.id === battlingSkillId);

    (async () => {
      nextChallengeRef.current = await generateChallenge(
        skillConfig.challengeType,
        battleDifficulty
      );
    })();

    transition(BATTLE_STATES.IN_PROGRESS);

  }, [battlingSkillId, battleDifficulty, generateChallenge, transition]);

  // -----------------------------
  // 🔥 INSTANT LOOP (NO DELAY)
  // -----------------------------
  useEffect(() => {
    if (battleState !== BATTLE_STATES.VICTORY) return;
    if (!battlingSkillId) return;

    const skillConfig = SKILL_DATA.find(s => s.id === battlingSkillId);

    (async () => {
      // 1. use preloaded instantly
      const next = nextChallengeRef.current;

      if (next) {
        setChallengeData(next);
        setSpokenText('');
      }

      // 2. preload next immediately
      nextChallengeRef.current = await generateChallenge(
        skillConfig.challengeType,
        battleDifficulty
      );

      // 3. resume battle instantly
      transition(BATTLE_STATES.IN_PROGRESS);
    })();

  }, [
    battleState,
    battlingSkillId,
    battleDifficulty,
    generateChallenge,
    setChallengeData,
    setSpokenText,
    transition
  ]);

  // -----------------------------
  // HELPERS
  // -----------------------------
  const applyPartialHit = useCallback((current, actualDamage, isInstantDefeat, damage) => {
    const totalXP = calculateXPReward(current.difficulty, current.level);
    const effectiveDmg = isInstantDefeat ? current.mobMaxHealth : damage;
    const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDmg);
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
      mobHealth: current.mobHealth - actualDamage,
      xp: newXp,
      level: newLevel,
    };
  }, []);
  
  const applyKillHit = useCallback((prev, skillId, current, skillConfig, actualDamage, isInstantDefeat, damage) => {
    const totalXP = calculateXPReward(current.difficulty, current.level);
    const effectiveDmg = isInstantDefeat ? current.mobMaxHealth : damage;
    const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDmg);

    const xpGain = Math.floor(totalXP / hitsToKill);

    let newLevel = current.level;
    let newXp = current.xp + xpGain;

    let xpToLevel = calculateXPToLevel(current.difficulty, newLevel);

    while (newXp >= xpToLevel) {
      newXp -= xpToLevel;
      newLevel++;
      xpToLevel = calculateXPToLevel(current.difficulty, newLevel);
    }

    setStats(prevStats => {
      const nextStats = buildMobDefeatStats(prevStats, getEncounterType(current.level), current);

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

  const handleBossFailure = useCallback((skillId) => {
    setSkills(prev => ({
      ...prev,
      [battlingSkillId]: {
        ...prev[battlingSkillId],
        mobHealth: prev[battlingSkillId].mobMaxHealth
      }
    }));

    setBossHealing(battlingSkillId);
    setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);

    handleFailure(skillId);
  }, [battlingSkillId, setSkills, handleFailure]);

  const isBossBattle = useCallback(() => {
    if (!battlingSkillId) return false;
    return getEncounterType(skills[battlingSkillId]?.level ?? 1) === 'boss';
  }, [battlingSkillId, skills]);

  // -----------------------------
  // MAIN
  // -----------------------------
 const handleSuccessHit = useCallback((skillId, isWrong) => {
  if (battleState !== BATTLE_STATES.IN_PROGRESS) return;

  // ❌ WRONG ANSWER
  if (isWrong === 'WRONG') {
    if (isBossBattle()) handleBossFailure(skillId);
    else handleFailure(skillId);
    return;
  }

  let shouldTriggerVictory = false;
  let shouldLoadNextChallenge = false;
  let nextSkillConfig = null;

  setSkills(prev => {
    const current = prev[skillId];

    if (!current) {
      console.warn(`⚠️ Missing skill state for ${skillId}`);
      return prev;
    }

    const skillConfig = SKILL_DATA.find(s => s.id === skillId);
    nextSkillConfig = skillConfig;

    const damage = calculateDamage(current.level, current.difficulty);

    const isInstantDefeat =
      skillConfig.id === 'cleaning' ||
      skillConfig.id === 'memory';

    const actualDamage = isInstantDefeat ? current.mobHealth : damage;
    const willKill = (current.mobHealth - actualDamage) <= 0;

    const isInstantGame =
      skillConfig.id === 'memory' ||
      skillConfig.id === 'cleaning' ||
      skillConfig.id === 'patterns';

    // -----------------------------
    // DECISION FLAGS (NO SIDE EFFECTS)
    // -----------------------------
    if (willKill || isInstantGame) {
      shouldTriggerVictory = true;
    } else if (skillConfig.hasChallenge) {
      shouldLoadNextChallenge = true;
    }

    // -----------------------------
    // DAMAGE NUMBERS
    // -----------------------------
    const id = ++damageIdRef.current;
    setDamageNumbers(prevDmg => [
      ...prevDmg,
      {
        id,
        skillId,
        val: actualDamage,
        x: Math.random() * 40 - 20,
        y: Math.random() * 40 - 20
      }
    ]);

    setTimeout(() => {
      setDamageNumbers(prevDmg =>
        prevDmg.filter(d => d.id !== id)
      );
    }, 800);

    // -----------------------------
    // SOUNDS
    // -----------------------------
    if (willKill) playMobDeath(current.currentMob);
    else playMobHurt(current.currentMob);

    playSuccessfulHit();

    // -----------------------------
    // STATE UPDATE
    // -----------------------------
    const updated = willKill
      ? applyKillHit(
          prev,
          skillId,
          current,
          skillConfig,
          actualDamage,
          isInstantDefeat,
          damage
        )
      : applyPartialHit(
          current,
          actualDamage,
          isInstantDefeat,
          damage
        );

    return { ...prev, [skillId]: updated };
  });

  // =====================================================
  // 🔥 SIDE EFFECTS (OUTSIDE setState)
  // =====================================================

  // 🎯 VICTORY FLOW
  if (shouldTriggerVictory) {
    transition(BATTLE_STATES.VICTORY);
    return;
  }

  // 🔁 CONTINUOUS CHALLENGE FLOW
  if (shouldLoadNextChallenge && nextSkillConfig) {
    if (nextChallengeRef.current) {
      setChallengeData(nextChallengeRef.current);
    }

    (async () => {
      nextChallengeRef.current = await generateChallenge(
        nextSkillConfig.challengeType,
        battleDifficulty
      );
    })();

    setSpokenText('');
  }

}, [
  battleState,
  setSkills,
  applyKillHit,
  applyPartialHit,
  handleFailure,
  handleBossFailure,
  isBossBattle,
  transition,
  generateChallenge,
  battleDifficulty,
  setChallengeData,
  setSpokenText
]);

  // -----------------------------
  return {
    handleSuccessHit,
    damageNumbers,
    lootBox,
    bossHealing,
    battleState,
    transition,
  };
};