/**
 * profileStorage.js
 *
 * Pure localStorage helpers for profile persistence.
 * No React imports — safe to use outside components.
 */

import {
    getRandomMob, getRandomFriendlyMob, getRandomMiniboss, getRandomBoss,
    calculateMobHealth,
} from './gameUtils';
import { getRandomAura } from './mobDisplayUtils';
import { SKILL_DATA } from '../constants/gameData';
import { getDefaultStats } from './achievementUtils';
import {
    ensureBasicSkillFields, ensureSkillMobs,
    ensureSkillAuras, ensureEncounterMobs,
} from './skillStateUtils';

// ---------------------------------------------------------------------------
// Key
// ---------------------------------------------------------------------------
export const getStorageKey = (profileId) => `heroSkills_v23_p${profileId}`;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const getRaw = (profileId) => {
    const raw = localStorage.getItem(getStorageKey(profileId));
    if (!raw && profileId === 1) return localStorage.getItem('heroSkills_v23');
    return raw;
};

const buildDefaultSkill = (skill) => {
    const difficulty = 1;
    return {
        level: 1, xp: 0, difficulty,
        earnedBadges: [], lostLevel: false, recoveryDifficulty: null,
        currentMob:          getRandomMob(null),
        mobHealth:           calculateMobHealth(difficulty),
        mobMaxHealth:        calculateMobHealth(difficulty),
        memoryMob:           skill.id === 'memory'   ? getRandomFriendlyMob() : null,
        patternMob:          skill.id === 'patterns' ? getRandomMob(null)     : null,
        readingMob:          skill.id === 'reading'  ? getRandomMob(null)     : null,
        mathMob:             skill.id === 'math'     ? getRandomMob(null)     : null,
        writingMob:          skill.id === 'writing'  ? getRandomMob(null)     : null,
        readingMobAura:      skill.id === 'reading'  ? getRandomAura() : null,
        mathMobAura:         skill.id === 'math'     ? getRandomAura() : null,
        writingMobAura:      skill.id === 'writing'  ? getRandomAura() : null,
        patternMobAura:      skill.id === 'patterns' ? getRandomAura() : null,
        currentMiniboss:     getRandomMiniboss(),
        currentBoss:         getRandomBoss(),
        currentMinibossAura: getRandomAura(),
        currentBossAura:     getRandomAura(),
    };
};

const applyCompatPatches = (initial, savedData) => {
    Object.keys(savedData).forEach(key => {
        initial[key] = { ...initial[key], ...savedData[key] };
        ensureBasicSkillFields(initial[key]);
        ensureSkillMobs(initial[key], key);
        ensureSkillAuras(initial[key], key);
        ensureEncounterMobs(initial[key], key);
    });
    return initial;
};

// ---------------------------------------------------------------------------
// Public loaders
// ---------------------------------------------------------------------------

export const loadSkills = (profileId) => {
    const initial = {};
    SKILL_DATA.forEach(skill => { initial[skill.id] = buildDefaultSkill(skill); });

    const raw = getRaw(profileId);
    if (!raw) return initial;

    try {
        const parsed = JSON.parse(raw);
        return applyCompatPatches(initial, parsed.skills || parsed);
    } catch (e) {
        console.warn('Failed to parse saved skills:', e);
        return initial;
    }
};

export const loadTheme = (profileId) => {
    try { return JSON.parse(getRaw(profileId)).theme || 'minecraft'; }
    catch { return 'minecraft'; }
};

export const loadStats = (profileId) => {
    try {
        const data = JSON.parse(getRaw(profileId));
        if (data?.stats) return { ...getDefaultStats(), ...data.stats };
    } catch (e) {
        console.warn('Failed to parse stats:', e);
    }
    return getDefaultStats();
};

/** Read summary stats for a stored profile (used by the profile switcher). */
export const readStoredProfileStats = (id) => {
    const raw = getRaw(id);
    if (!raw) return null;
    try {
        const data       = JSON.parse(raw);
        const skillsData = data.skills || data;
        const theme      = data.theme  || 'minecraft';
        let totalLevel = 0, highestLevel = 0;
        Object.values(skillsData).forEach(s => {
            if (s && typeof s.level === 'number') {
                totalLevel += s.level;
                if (s.level > highestLevel) highestLevel = s.level;
            }
        });
        return { totalLevel, highestLevel, skills: skillsData, theme };
    } catch (e) {
        console.warn('Failed to parse stored profile stats:', e);
        return null;
    }
};
