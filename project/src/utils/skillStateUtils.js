/**
 * skillStateUtils.js
 *
 * Pure (no React, no side-effects) functions for:
 *  - Backward-compatibility patchers  (called once on load)
 *  - Mob defeat stat updates
 *  - Level / badge progression
 *  - Mob rotation after a kill
 *  - Card carousel layout
 */

import {
    getRandomMob, getRandomFriendlyMob, getRandomMiniboss, getRandomBoss,
    getEncounterType, calculateMobHealth, calculateXPToLevel,
} from './gameUtils';
import { getRandomAura } from './mobDisplayUtils';
import { BASE_ASSETS } from '../constants/gameData';
import { addUniqueToArray } from './achievementUtils';

// ---------------------------------------------------------------------------
// Backward-compatibility patchers  (mutate in place — called once on load)
// ---------------------------------------------------------------------------

export const ensureBasicSkillFields = (skill) => {
    if (typeof skill.difficulty !== 'number') skill.difficulty = 1;
    if (!Array.isArray(skill.earnedBadges)) skill.earnedBadges = [];
    if (typeof skill.mobHealth !== 'number') {
        const diff = skill.difficulty || 1;
        skill.mobHealth    = calculateMobHealth(diff);
        skill.mobMaxHealth = calculateMobHealth(diff);
    }
    if (typeof skill.lostLevel !== 'boolean') skill.lostLevel = false;
    if (skill.recoveryDifficulty === undefined) skill.recoveryDifficulty = null;
    return skill;
};

export const ensureSkillMobs = (skill, key) => {
    const map = {
        memory:   () => { if (!skill.memoryMob)  skill.memoryMob  = getRandomFriendlyMob(); },
        patterns: () => { if (!skill.patternMob) skill.patternMob = getRandomMob(null); },
        reading:  () => { if (!skill.readingMob) skill.readingMob = getRandomMob(null); },
        math:     () => { if (!skill.mathMob)    skill.mathMob    = getRandomMob(null); },
        writing:  () => { if (!skill.writingMob) skill.writingMob = getRandomMob(null); },
    };
    if (map[key]) map[key]();
    return skill;
};

export const ensureSkillAuras = (skill, key) => {
    const map = {
        reading:  () => { if (!skill.readingMobAura)  skill.readingMobAura  = getRandomAura(); },
        math:     () => { if (!skill.mathMobAura)     skill.mathMobAura     = getRandomAura(); },
        writing:  () => { if (!skill.writingMobAura)  skill.writingMobAura  = getRandomAura(); },
        patterns: () => { if (!skill.patternMobAura)  skill.patternMobAura  = getRandomAura(); },
    };
    if (map[key]) map[key]();
    return skill;
};

export const ensureEncounterMobs = (skill, key) => {
    if (key === 'cleaning' || key === 'memory') return skill;
    if (!skill.currentMiniboss)     skill.currentMiniboss     = getRandomMiniboss();
    if (!skill.currentBoss)         skill.currentBoss         = getRandomBoss();
    if (!skill.currentMinibossAura) skill.currentMinibossAura = getRandomAura();
    if (!skill.currentBossAura)     skill.currentBossAura     = getRandomAura();
    return skill;
};

// ---------------------------------------------------------------------------
// Mob-defeat stats  (pure — returns next stats object, no setState)
// ---------------------------------------------------------------------------

export const buildMobDefeatStats = (prevStats, encounterType, current) => {
    const next = { ...prevStats, battlesThisSession: (prevStats.battlesThisSession || 0) + 1 };

    if (encounterType === 'boss') {
        next.totalBossesDefeated  = (next.totalBossesDefeated  || 0) + 1;
        next.uniqueBossesDefeated = addUniqueToArray(next.uniqueBossesDefeated || [], current.currentBoss);
    } else if (encounterType === 'miniboss') {
        next.totalMinibossesDefeated  = (next.totalMinibossesDefeated  || 0) + 1;
        next.uniqueMinibossesDefeated = addUniqueToArray(next.uniqueMinibossesDefeated || [], current.currentMiniboss);
    } else {
        next.totalMobsDefeated  = (next.totalMobsDefeated  || 0) + 1;
        next.uniqueMobsDefeated = addUniqueToArray(next.uniqueMobsDefeated || [], current.currentMob);
    }

    return next;
};

// ---------------------------------------------------------------------------
// Level & badge progression  (pure — callers fire side-effects separately)
// ---------------------------------------------------------------------------

/**
 * Compute the result of a level-up pass.
 *
 * Returns:
 *   { newLevel, newXp, newDifficulty, newBadges, lootBoxNotif, didLevelUp }
 *
 * lootBoxNotif is null, or a { level, skillName, item, img } object.
 * Callers must call setLootBox / playNotification / playLevelUp themselves.
 */
export const buildLevelProgression = (newLevel, newXp, newDifficulty, newBadges, skillConfig) => {
    const xpToLevel = calculateXPToLevel(newDifficulty, newLevel);
    if (newXp < xpToLevel) {
        return { newLevel, newXp, newDifficulty, newBadges, lootBoxNotif: null, didLevelUp: false };
    }

    const levelsGained = Math.floor(newXp / xpToLevel);
    const oldLevel     = newLevel;
    newLevel += levelsGained;
    newXp    %= xpToLevel;

    let lootBoxNotif = null;

    if (skillConfig.id !== 'cleaning') {
        for (let lvl = oldLevel; lvl < newLevel; lvl++) {
            if (lvl % 20 !== 0 || lvl === 0) continue;

            const tier = Math.floor(lvl / 20);
            if (newDifficulty < 7) newDifficulty++;

            if (!newBadges.includes(tier) && tier <= 7) {
                newBadges.push(tier);
                // Only capture the FIRST badge notif per level-up pass
                if (!lootBoxNotif) {
                    lootBoxNotif = { level: lvl, skillName: skillConfig.fantasyName, item: 'New Rank!', img: BASE_ASSETS.badges.Wood };
                }
            }
        }
    }

    return { newLevel, newXp, newDifficulty, newBadges, lootBoxNotif, didLevelUp: true };
};

// ---------------------------------------------------------------------------
// Mob rotation after a kill  (pure — returns an updates patch object)
// ---------------------------------------------------------------------------

export const buildMobRotation = (skillId, current) => {
    const updates = {};
    const encounterType = getEncounterType(current.level);

    const combatMobs = {
        reading: () => { updates.readingMob = getRandomMob(current.readingMob);  updates.readingMobAura  = getRandomAura(); },
        math:    () => { updates.mathMob    = getRandomMob(current.mathMob);     updates.mathMobAura     = getRandomAura(); },
        writing: () => { updates.writingMob = getRandomMob(current.writingMob);  updates.writingMobAura  = getRandomAura(); },
    };

    if (skillId === 'memory')        { updates.memoryMob  = getRandomFriendlyMob(); }
    if (skillId === 'patterns')      { updates.patternMob = getRandomMob(current.currentMob); updates.patternMobAura = getRandomAura(); }
    if (combatMobs[skillId])         combatMobs[skillId]();
    if (encounterType === 'miniboss') { updates.currentMiniboss = getRandomMiniboss(); updates.currentMinibossAura = getRandomAura(); }
    if (encounterType === 'boss')     { updates.currentBoss     = getRandomBoss();     updates.currentBossAura     = getRandomAura(); }

    return updates;
};

// ---------------------------------------------------------------------------
// Card carousel layout  (replaces inline getVerticalOffset + ternary chains)
// ---------------------------------------------------------------------------

const CARD_LAYOUT = {
    0: { translateY: -55, rotateX:   0, scale: 1.10, opacity: 1.0, zIndex: 20 },
    1: { translateY: -30, rotateX:  -4, scale: 0.85, opacity: 0.6, zIndex:  9 },
    2: { translateY:  20, rotateX:  -8, scale: 0.85, opacity: 0.3, zIndex:  8 },
    3: { translateY:  75, rotateX: -12, scale: 0.85, opacity: 0.0, zIndex:  7 },
};

export const getCardStyle = (offset, isItemBattling, isBattleActive) => {
    const layout = CARD_LAYOUT[Math.abs(offset)] ?? CARD_LAYOUT[3];
    return {
        transform:               `translateX(${offset * 320}px) translateY(${layout.translateY}px) rotateX(${layout.rotateX}deg) scale(${layout.scale})`,
        opacity:                 layout.opacity,
        zIndex:                  isItemBattling ? 50 : layout.zIndex,
        filter:                  offset === 0 ? 'none' : 'brightness(0.5) blur(1px)',
        cursor:                  (offset !== 0 && !isBattleActive) ? 'pointer' : 'default',
        transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    };
};
