import { useState, useRef, useCallback, useEffect } from 'react';

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

const BOSS_HEALING_ANIMATION_DURATION = 600;

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

  const [damageNumbers, setDamageNumbers] = useState([]);
  const [lootBox, setLootBox] = useState(null);
  const [showDeathOverlay] = useState(false);
  const [showLevelRestored] = useState(false);
  const [bossHealing, setBossHealing] = useState(null);

  const damageIdRef = useRef(0);

  // -----------------------------
  // HELPERS
  // -----------------------------

  useEffect(() => {
      if (!lootBox) return;
      const t = setTimeout(() => setLootBox(null), 4000);
      return () => clearTimeout(t);
    }, [lootBox]);

  const applyPartialHit = useCallback((current, actualDamage, isInstantDefeat, damage) => {
    const totalXP = calculateXPReward(current.difficulty, current.level);
    const effectiveDmg = isInstantDefeat ? current.mobMaxHealth : damage;
    const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDmg);
    const xpPerHit = Math.floor(totalXP / hitsToKill);

    return {
      ...current,
      mobHealth: current.mobHealth - actualDamage,
      xp: current.xp + xpPerHit,
    };
  }, []);

  const applyKillHit = useCallback((prev, skillId, current, skillConfig, actualDamage, isInstantDefeat, damage) => {
    const totalXP = calculateXPReward(current.difficulty, current.level);
    const effectiveDmg = isInstantDefeat ? current.mobMaxHealth : damage;
    const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDmg);

    const xpGain = Math.floor(totalXP / hitsToKill);

    let newLevel = current.level;
    let newXp = current.xp + xpGain;

    while (newXp >= 100) {
      newLevel++;
      newXp -= 100;
    }

    // stats + achievements
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

    // progression
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
  // PHANTOM
  // -----------------------------

  const handlePhantomLevelAward = useCallback((skillId) => {
    if (!skillId) return;

    setSkills(prev => {
      const current = prev[skillId];
      const newLevel = current.level + 1;

      const config = SKILL_DATA.find(s => s.id === skillId);

      setTimeout(() => {
        playLevelUp();

        setLootBox({
          level: newLevel,
          skillName: config?.fantasyName || '',
          item: 'Phantom Bonus!',
          img: HOSTILE_MOBS['Phantom'],
        });

        playNotification();
      }, 0);

      return {
        ...prev,
        [skillId]: {
          ...current,
          level: newLevel,
        }
      };
    });

  }, [setSkills]);

  const handlePhantomCaught = useCallback(() => {
    setStats(prev => {
      const next = {
        ...prev,
        phantomsCaught: (prev.phantomsCaught || 0) + 1,
      };

      setTimeout(() => {
        checkAchievements(prev, next, skills, skills);
      }, 100);

      return next;
    });
  }, [skills, checkAchievements, setStats]);

  // -----------------------------
  // MAIN
  // -----------------------------

  const handleFailure = useCallback((skillId) => {
    setPlayerHealth(prev => Math.max(0, prev - 1));
  
    setStats(prev => ({
      ...prev,
      totalMistakes: (prev.totalMistakes || 0) + 1
    }));
  
    playFail();
  }, [setPlayerHealth, setStats]);

  const handleSuccessHit = useCallback((skillId, isWrong) => {

    if (isWrong === 'WRONG') {

      const isBoss = battlingSkillId &&
        getEncounterType(skills[battlingSkillId].level) === 'boss';

      if (isBoss) {
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
        return;
      }
      handleFailure(skillId);
      return;
    }

    const skillConfig = SKILL_DATA.find(s => s.id === skillId);
    const cur = skills[skillId];

    const damage = calculateDamage(cur.level, cur.difficulty);
    const isInstantDefeat =
      skillConfig.id === 'cleaning' ||
      skillConfig.id === 'memory';

    const actualDamage = isInstantDefeat ? cur.mobHealth : damage;
    const willKill = (cur.mobHealth - actualDamage) <= 0;

    // damage numbers
    const id = ++damageIdRef.current;
    setDamageNumbers(prev => [
      ...prev,
      { id, skillId, val: actualDamage, x: Math.random() * 40 - 20, y:Math.random() * 40 - 20}
    ]);

    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id));
    }, 800);

    // sounds
    if (willKill) playMobDeath(cur.currentMob);
    else playMobHurt(cur.currentMob);

    playSuccessfulHit();

    // update
    setSkills(prev => {
      const current = prev[skillId];

      const updated = willKill
        ? applyKillHit(prev, skillId, current, skillConfig, actualDamage, isInstantDefeat, damage)
        : applyPartialHit(current, actualDamage, isInstantDefeat, damage);

      return { ...prev, [skillId]: updated };
    });

    // next challenge
    if (skillConfig.hasChallenge) {
        setChallengeData(generateChallenge(skillConfig.challengeType, battleDifficulty));
        setSpokenText('');
    }

  }, [
    skills,
    battlingSkillId,
    setSkills,
    setStats,
    setChallengeData,
    setSpokenText,
    checkAchievements,
    applyKillHit,
    applyPartialHit,
    generateChallenge,
    battleDifficulty,
    handleFailure
  ]);

  return {
    handleSuccessHit,
    damageNumbers,
    lootBox,
    showDeathOverlay,
    showLevelRestored,
    bossHealing,
    handlePhantomLevelAward,
    handlePhantomCaught,
  };
};