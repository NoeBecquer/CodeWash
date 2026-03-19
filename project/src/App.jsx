import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Menu, Sparkles, Gift, Maximize, Minimize, Settings, Bug
} from 'lucide-react';

// Modules
import GlobalStyles from './components/ui/GlobalStyles';
import SafeImage from './components/ui/SafeImage';
import PixelHeart from './components/ui/PixelHeart';
import ResetModal from './components/modals/ResetModal';
import BugReportModal from './components/modals/BugReportModal';
import SettingsDrawer from './components/drawers/SettingsDrawer';
import CosmeticsDrawer from './components/drawers/CosmeticsDrawer';
import MenuDrawer from './components/drawers/MenuDrawer';
import SkillCard from './components/skills/SkillCard';
import PhantomEvent from './components/PhantomEvent';
import AchievementToast from './components/ui/AchievementToast';

// Utils & Constants
import { getRandomMob, getRandomFriendlyMob, getRandomMiniboss, getRandomBoss, getMobForSkill, getEncounterType, generateMathProblem, getReadingWord, getWordForDifficulty, calculateDamage, calculateMobHealth, calculateXPReward, calculateXPToLevel } from './utils/gameUtils';
import { getRandomAura } from './utils/mobDisplayUtils';
import {
    BASE_ASSETS, THEME_CONFIG, SKILL_DATA,
    HOMOPHONES, HOSTILE_MOBS
} from './constants/gameData';
import {
    getBGMManager, setSfxVolume,
    playActionCardLeft, playActionCardRight, playClick, 
    playDeath, playFail, playLevelUp, playNotification, playSuccessfulHit,
    playMobHurt, playMobDeath, playAchievement
} from './utils/soundManager';
import {
    getDefaultStats, getNewlyUnlockedAchievements, getNewTierAchievements,
    addUniqueToArray, isAchievementUnlocked
} from './utils/achievementUtils';

// Parent verification privilege constants
const PARENT_PRIVILEGE_LEVEL = 200;
const PARENT_PRIVILEGE_DIFFICULTY = 7;
const PARENT_PRIVILEGE_BADGES = [1, 2, 3, 4, 5, 6, 7, 8];

// Voice recognition constants
const MIN_SPOKEN_TEXT_LENGTH = 2;
const MIC_OFF_TEXT = "Mic Off";

// Boss healing animation duration (ms)
const BOSS_HEALING_ANIMATION_DURATION = 600;

// Backward compatibility: Ensure basic skill fields exist
const ensureBasicSkillFields = (skill) => {
    if (typeof skill.difficulty !== 'number') skill.difficulty = 1;
    if (!Array.isArray(skill.earnedBadges)) skill.earnedBadges = [];
    if (typeof skill.mobHealth !== 'number') {
        const diff = skill.difficulty || 1;
        skill.mobHealth = calculateMobHealth(diff);
        skill.mobMaxHealth = calculateMobHealth(diff);
    }
    if (typeof skill.lostLevel !== 'boolean') skill.lostLevel = false;
    if (skill.recoveryDifficulty === undefined) skill.recoveryDifficulty = null;
    return skill;
};

// Backward compatibility: Ensure skill-specific mobs exist
const ensureSkillMobs = (skill, key) => {
    const mobMappings = {
        'memory': () => { if (!skill.memoryMob) skill.memoryMob = getRandomFriendlyMob(); },
        'patterns': () => { if (!skill.patternMob) skill.patternMob = getRandomMob(null); },
        'reading': () => { if (!skill.readingMob) skill.readingMob = getRandomMob(null); },
        'math': () => { if (!skill.mathMob) skill.mathMob = getRandomMob(null); },
        'writing': () => { if (!skill.writingMob) skill.writingMob = getRandomMob(null); }
    };
    if (mobMappings[key]) mobMappings[key]();
    return skill;
};

// Backward compatibility: Ensure mob auras exist
const ensureSkillAuras = (skill, key) => {
    const auraMappings = {
        'reading': () => { if (!skill.readingMobAura) skill.readingMobAura = getRandomAura(); },
        'math': () => { if (!skill.mathMobAura) skill.mathMobAura = getRandomAura(); },
        'writing': () => { if (!skill.writingMobAura) skill.writingMobAura = getRandomAura(); },
        'patterns': () => { if (!skill.patternMobAura) skill.patternMobAura = getRandomAura(); }
    };
    if (auraMappings[key]) auraMappings[key]();
    return skill;
};

// Backward compatibility: Ensure miniboss/boss exists for combat skills
const ensureEncounterMobs = (skill, key) => {
    if (key === 'cleaning' || key === 'memory') return skill;
    if (!skill.currentMiniboss) skill.currentMiniboss = getRandomMiniboss();
    if (!skill.currentBoss) skill.currentBoss = getRandomBoss();
    if (!skill.currentMinibossAura) skill.currentMinibossAura = getRandomAura();
    if (!skill.currentBossAura) skill.currentBossAura = getRandomAura();
    return skill;
};

// Map offsets to specific UI values to avoid if/else logic
const OFFSET_CONFIG = {
    0: { translateY: -55, rotateX: 0, scale: 1.1, opacity: 1, zIndex: 20 },
    1: { translateY: -30, rotateX: -4, scale: 0.85, opacity: 0.6, zIndex: 9 },
    2: { translateY: 20, rotateX: -8, scale: 0.85, opacity: 0.3, zIndex: 8 },
    3: { translateY: 75, rotateX: -12, scale: 0.85, opacity: 0, zIndex: 7 },
};

const getCardStyle = (offset, isItemBattling) => {
    const absOffset = Math.abs(offset);
    const config = OFFSET_CONFIG[absOffset] || OFFSET_CONFIG[3];
    
    return {
        transform: `translateX(${offset * 320}px) translateY(${config.translateY}px) rotateX(${config.rotateX}deg) scale(${config.scale})`,
        opacity: config.opacity,
        zIndex: isItemBattling ? 50 : config.zIndex,
        filter: offset === 0 ? 'none' : 'brightness(0.5) blur(1px)',
        cursor: (offset !== 0 && !isItemBattling) ? 'pointer' : 'default',
        transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    };
};

const App = () => {
    const [currentProfile, setCurrentProfile] = useState(() => localStorage.getItem('currentProfile_v1') ? Number.parseInt(localStorage.getItem('currentProfile_v1')) : 1);
    const [profileNames, setProfileNames] = useState(() => localStorage.getItem('heroProfileNames_v1') ? JSON.parse(localStorage.getItem('heroProfileNames_v1')) : { 1: "Player 1", 2: "Player 2", 3: "Player 3" });
    const [parentStatus, setParentStatus] = useState(() => localStorage.getItem('heroParentStatus_v1') ? JSON.parse(localStorage.getItem('heroParentStatus_v1')) : { 1: false, 2: false, 3: false });
    const [playerHealth, setPlayerHealth] = useState(10);

    const getStorageKey = (profileId) => `heroSkills_v23_p${profileId}`;
    const loadSkills = (profileId) => {
        const initial = {};
        // Initialize each skill with level, xp, currentMob, difficulty (1-7), earnedBadges array,
        // mobHealth for HP-based combat, and death/recovery state
        SKILL_DATA.forEach(skill => {
            const initialDifficulty = 1;
            initial[skill.id] = {
                level: 1,
                xp: 0,
                currentMob: getRandomMob(null),
                difficulty: initialDifficulty,  // Per-skill difficulty (1-7)
                earnedBadges: [], // Array of earned badge tier numbers (1-7)
                mobHealth: calculateMobHealth(initialDifficulty), // Mob's current HP
                mobMaxHealth: calculateMobHealth(initialDifficulty), // Mob's max HP
                lostLevel: false, // True if player died and lost a level
                recoveryDifficulty: null, // Difficulty to suggest for recovery
                memoryMob: skill.id === 'memory' ? getRandomFriendlyMob() : null, // Stable mob for Memory card display
                patternMob: skill.id === 'patterns' ? getRandomMob(null) : null, // Stable hostile mob for Patterns card display
                currentMiniboss: getRandomMiniboss(), // Stable miniboss for miniboss encounters
                currentBoss: getRandomBoss(), // Stable boss for boss encounters
                readingMob: skill.id === 'reading' ? getRandomMob(null) : null, // Stable mob for Reading card display
                mathMob: skill.id === 'math' ? getRandomMob(null) : null, // Stable mob for Math card display
                writingMob: skill.id === 'writing' ? getRandomMob(null) : null, // Stable mob for Writing card display
                // Auras for each mob type
                readingMobAura: skill.id === 'reading' ? getRandomAura() : null,
                mathMobAura: skill.id === 'math' ? getRandomAura() : null,
                writingMobAura: skill.id === 'writing' ? getRandomAura() : null,
                patternMobAura: skill.id === 'patterns' ? getRandomAura() : null,
                currentMinibossAura: getRandomAura(), // Aura for miniboss encounters
                currentBossAura: getRandomAura() // Aura for boss encounters
            };
        });
        let saved = localStorage.getItem(getStorageKey(profileId));
        if (!saved && profileId === 1) saved = localStorage.getItem('heroSkills_v23');
        try {
            if (saved) {
                const parsed = JSON.parse(saved);
                const data = parsed.skills || parsed;
                Object.keys(data).forEach(key => {
                    initial[key] = { ...initial[key], ...data[key] };
                    // Apply backward compatibility fixes in sequence
                    ensureBasicSkillFields(initial[key]);
                    ensureSkillMobs(initial[key], key);
                    ensureSkillAuras(initial[key], key);
                    ensureEncounterMobs(initial[key], key);
                });
                return initial;
            }
        } catch (e) {
            console.warn('Failed to parse saved skills:', e);
        }
        return initial;
    };
    const loadTheme = (profileId) => {
        let saved = localStorage.getItem(getStorageKey(profileId));
        if (!saved && profileId === 1) {
            saved = localStorage.getItem('heroSkills_v23');
        }
        try {
            return JSON.parse(saved).theme || 'minecraft';
        } catch (e) {
            console.warn('Failed to parse theme:', e);
        }
        return 'minecraft';
    };

    const loadStats = (profileId) => {
        let saved = localStorage.getItem(getStorageKey(profileId));
        if (!saved && profileId === 1) {
            saved = localStorage.getItem('heroSkills_v23');
        }
        try {
            const data = JSON.parse(saved);
            if (data.stats) {
                // Merge with default stats to ensure all fields exist
                return { ...getDefaultStats(), ...data.stats };
            }
        } catch (e) {
            console.warn('Failed to parse stats:', e);
        }
        return getDefaultStats();
    };

    const getProfileStats = (id, liveSkills = null) => {
        const initial = {};
        SKILL_DATA.forEach(skill => { initial[skill.id] = { level: 1 }; });

        // Use live skills if provided (for current profile with pending state changes)
        if (liveSkills) {
            let totalLevel = 0;
            let highestLevel = 0;
            Object.values(liveSkills).forEach(s => {
                if (s && typeof s.level === 'number') {
                    totalLevel += s.level;
                    if (s.level > highestLevel) highestLevel = s.level;
                }
            });
            return { totalLevel, highestLevel, skills: liveSkills, theme: activeTheme };
        }

        const key = getStorageKey(id);
        let saved = localStorage.getItem(key);
        if (!saved && id === 1) saved = localStorage.getItem('heroSkills_v23');
        if (!saved) return null;
        try {
            const data = JSON.parse(saved);
            const skillsData = data.skills || data;
            const theme = data.theme || 'minecraft';
            let totalLevel = 0;
            let highestLevel = 0;
            Object.values(skillsData).forEach(s => {
                if (s && typeof s.level === 'number') {
                    totalLevel += s.level;
                    if (s.level > highestLevel) highestLevel = s.level;
                }
            });
            return { totalLevel, highestLevel, skills: skillsData, theme };
        } catch (e) {
            console.warn('Failed to parse profile stats:', e);
            return null;
        }
    };

    const [skills, setSkills] = useState(() => loadSkills(currentProfile));
    const [activeTheme, setActiveTheme] = useState(() => loadTheme(currentProfile));
    const [stats, setStats] = useState(() => loadStats(currentProfile));
    const [achievementToast, setAchievementToast] = useState(null);
    const [battlingSkillId, setBattlingSkillId] = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null); // Track battle's starting difficulty for consistent challenge generation
    const [challengeData, setChallengeData] = useState(null);
    const [lootBox, setLootBox] = useState(null); 
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isBugReportOpen, setIsBugReportOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState("");
    const [damageNumbers, setDamageNumbers] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [showDeathOverlay, setShowDeathOverlay] = useState(false);
    const [showLevelRestored, setShowLevelRestored] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [bossHealing, setBossHealing] = useState(null); // skillId of boss being healed
    const recognitionRef = useRef(null);
    const challengeDataRef = useRef(null);
    const damageIdRef = useRef(0); // Counter for generating unique damage number IDs
    const loginTrackedRef = useRef(false); // Track if we've already recorded today's login
    const [bgmVol, setBgmVol] = useState(0.3);
    const [sfxVol, setSfxVolState] = useState(0.5);
    const bgmManager = useRef(getBGMManager());

    // Cosmetics state
    const [selectedBorder, setSelectedBorder] = useState(() => {
        const saved = localStorage.getItem(`borderEffect_p${currentProfile}`);
        return saved || 'solid';
    });
    const [borderColor, setBorderColor] = useState(() => {
        const saved = localStorage.getItem(`borderColor_p${currentProfile}`);
        return saved || '#FFD700';
    });

    useEffect(() => {
        const dataToSave = { skills: skills, theme: activeTheme, stats: stats };
        localStorage.setItem(getStorageKey(currentProfile), JSON.stringify(dataToSave));
        localStorage.setItem('currentProfile_v1', currentProfile);
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNames));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatus));
    }, [skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);

    // Save cosmetics preferences
    useEffect(() => {
        localStorage.setItem(`borderEffect_p${currentProfile}`, selectedBorder);
        localStorage.setItem(`borderColor_p${currentProfile}`, borderColor);
    }, [selectedBorder, borderColor, currentProfile]);

    // Calculate unlocked borders based on earned badges (memoized)
    const unlockedBorders = React.useMemo(() => {
        const unlockedBadges = new Set();
        // Tier to badge name mapping
        const tierToBadge = ['Wood', 'Stone', 'Gold', 'Iron', 'Emerald', 'Diamond', 'Netherite', 'Obsidian'];

        Object.values(skills).forEach(skill => {
            if (skill.earnedBadges && Array.isArray(skill.earnedBadges)) {
                skill.earnedBadges.forEach(tier => {
                    // Convert tier number to badge name (tier 1 = Wood = index 0)
                    if (tier >= 1 && tier <= 8) {
                        unlockedBadges.add(tierToBadge[tier - 1]);
                    }
                });
            }
            // Check for Star badge (level 180+) - this is awarded separately
            if (skill.level >= 180) {
                unlockedBadges.add('Star');
            }
        });
        return Array.from(unlockedBadges);
    }, [skills]);

    // Calculate unlocked achievements (memoized)
    const unlockedAchievements = React.useMemo(() => {
        const unlocked = [];
        const achievementIds = ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'];

        achievementIds.forEach(id => {
            if (isAchievementUnlocked(id, stats, skills)) {
                unlocked.push(id);
            }
        });

        return unlocked;
    }, [stats, skills]);

    // Update BGM volume
    useEffect(() => {
        bgmManager.current.setVolume(bgmVol);
    }, [bgmVol]);

    // Update SFX volume in sound manager
    useEffect(() => {
        setSfxVolume(sfxVol);
    }, [sfxVol]);

    // Keep challengeDataRef in sync with challengeData state for voice listener
    useEffect(() => {
        challengeDataRef.current = challengeData;
    }, [challengeData]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Start BGM on first user interaction
    const startBGM = useCallback(() => {
        if (!bgmManager.current.isPlaying) {
            bgmManager.current.play();
        }
    }, []);

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.warn('Failed to exit fullscreen:', err);
            });
        }
        playClick();
    };

    const generateChallenge = (type, diff) => {
        // Math: Use difficulty-based problem generation
        if (type === 'math') {
            return generateMathProblem(diff);
        }
        // Patterns: Simon Says - no challenge data needed, handled in SkillCard
        if (type === 'patterns') {
            return { type: 'patterns', question: "Simon Says!", answer: "WIN" };
        }
        // Reading: Use difficulty-based word selection
        if (type === 'reading') {
            const word = getReadingWord(diff);
            return { type, question: word, answer: word };
        }
        // Writing: Use difficulty-based word selection from comprehensive index
        if (type === 'writing') {
            const wordData = getWordForDifficulty(diff);
            // Use displayName in uppercase for the answer (handles multi-word items with spaces)
            const answer = wordData.displayName.toUpperCase();
            return { 
                type, 
                question: "Spell it!", 
                answer, 
                images: [wordData.image],
                displayName: wordData.displayName
            };
        }
        // Memory: No specific challenge data, handled in SkillCard
        if (type === 'memory') return { type: 'memory', question: "Find Pairs!", answer: "WIN" };
        // Cleaning: Manual task
        return { type: 'manual', question: "Task Complete?", answer: "yes" };
    };

    // Regenerate challenge when difficulty or level changes during active battle
    // This fixes the issue where challenges use stale difficulty after leveling up
    // Removed problematic useEffect that was causing infinite loop
    // The startBattle function already sets battleDifficulty correctly

    // Check for achievement unlocks
    // --- REFACTORED HELPERS ---
    
    // Helper: Handles death sequence (Nesting Level 2)
    const processPlayerDeath = (activeSkillId) => {
        playDeath();
        setShowDeathOverlay(true);
        setStats(prev => {
            const next = { ...prev, totalDeaths: (prev.totalDeaths || 0) + 1 };
            setTimeout(() => checkAchievements(prev, next, skills, skills), 100);
            return next;
        });

        if (activeSkillId) {
            setSkills(prev => ({
                ...prev,
                [activeSkillId]: {
                    ...prev[activeSkillId],
                    level: Math.max(1, prev[activeSkillId].level - 1),
                    lostLevel: prev[activeSkillId].level > 1,
                    recoveryDifficulty: Math.max(1, (prev[activeSkillId].difficulty || 1) - 1)
                }
            }));
        }
        setTimeout(() => { setBattlingSkillId(null); setShowDeathOverlay(false); }, 2000);
        return 10; // Reset player health
    };

    // Helper: Handles Mob Defeat calculations (Nesting Level 2)
    const processMobDefeat = (skillId, current, config, xpGained) => {
        let { level: nLvl, xp: nXp, difficulty: nDiff, earnedBadges: nBadges, lostLevel: nLost } = current;
        nXp += xpGained;

        if (nLost) {
            nLvl += 1; nLost = false;
            setShowLevelRestored(true);
            setTimeout(() => setShowLevelRestored(false), 2000);
            playNotification();
        }

        const xpReq = calculateXPToLevel(nDiff, nLvl);
        if (nXp >= xpReq) {
            nLvl += Math.floor(nXp / xpReq);
            nXp %= xpReq;
            playLevelUp();
            
            const tier = Math.floor((nLvl - 1) / 20);
            if (config.id !== 'cleaning' && tier > 0 && tier <= 7 && !nBadges.includes(tier)) {
                nBadges.push(tier);
                nDiff = Math.min(7, nDiff + 1);
                setLootBox({ level: nLvl, skillName: config.fantasyName, item: "New Rank!", img: BASE_ASSETS.badges.Wood });
            }
        }

        const newH = calculateMobHealth(nDiff);
        return { 
            level: nLvl, xp: nXp, difficulty: nDiff, earnedBadges: nBadges, lostLevel: nLost,
            mobHealth: newH, mobMaxHealth: newH,
            currentMob: nLvl % 20 !== 0 ? getRandomMob(current.currentMob) : current.currentMob 
        };
    };

    // Helper: Visual and Audio feedback (Nesting Level 2)
    const triggerHitVisuals = (skillId, finalDmg, isKill, curMob, isMemory) => {
         // 1. Guard clause (Depth 0)
         if (isMemory) return;

        // 2. Prepare Data
        const id = ++damageIdRef.current;
        const x = Math.random() * 100 - 50;
        const y = Math.random() * 50 - 25;
        const newDamage = { id, skillId, val: finalDmg, x, y };

        // 3. Add damage number (Depth 1)
        setDamageNumbers(prev => [...prev, newDamage]);

        // 4. Cleanup Logic (Extracted to keep nesting shallow)
        const removeDamageNumber = () => {
            setDamageNumbers(currentList => 
                currentList.filter(n => n.id !== id)
            );
        };
        setTimeout(removeDamageNumber, 800);
        // 5. Audio Feedback
        if (isKill) {
            playMobDeath(curMob);
        } else {
            playMobHurt(curMob);
        }
        playSuccessfulHit();
    };

    // --- REFACTORED MAIN FUNCTION ---

    const handleSuccessHit = (skillId, isWrong) => {
        // 1. Logic for Mistakes/Death
        if (isWrong === 'WRONG') {
            const isBoss = battlingSkillId && getEncounterType(skills[battlingSkillId].level) === 'boss';
            if (isBoss) {
                setSkills(p => ({ ...p, [battlingSkillId]: { ...p[battlingSkillId], mobHealth: p[battlingSkillId].mobMaxHealth } }));
                setBossHealing(battlingSkillId);
                setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);
                return playFail();
            }
            return setPlayerHealth(h => (h - 1 <= 0 ? processPlayerDeath(battlingSkillId) : (playFail(), h - 1)));
        }

        if (!skillId) return;

        // 2. Variable Setup
        const cur = skills[skillId];
        const config = SKILL_DATA.find(s => s.id === skillId);
        const type = getEncounterType(cur.level);
        const dmg = calculateDamage(cur.level, cur.difficulty || 1);
        const isInsta = config.id === 'cleaning' || config.id === 'memory' || (type === 'miniboss' && config.id !== 'cleaning');
        
        const finalDmg = isInsta ? cur.mobHealth : dmg;
        const willKill = (cur.mobHealth - finalDmg) <= 0;

        // 3. Execution
        triggerHitVisuals(skillId, finalDmg, willKill, cur.currentMob, config.id === 'memory');

        setSkills(prev => {
            const state = prev[skillId];
            if (willKill) {
                setStats(ps => ({ ...ps, battlesThisSession: (ps.battlesThisSession || 0) + 1 }));
                const updates = processMobDefeat(skillId, state, config, calculateXPReward(state.difficulty, state.level));
                return { ...prev, [skillId]: { ...state, ...updates } };
            }
            // Partial XP Reward
            const hits = Math.ceil(state.mobMaxHealth / (isInsta ? state.mobMaxHealth : dmg));
            const xpTick = Math.floor(calculateXPReward(state.difficulty, state.level) / hits);
            return { ...prev, [skillId]: { ...state, mobHealth: state.mobHealth - finalDmg, xp: state.xp + xpTick } };
        });

        // 4. Next Challenge Logic
        if (config.id === 'memory') {
            setBattlingSkillId(null);
        } else if (config.hasChallenge) {
            setChallengeData(generateChallenge(config.challengeType, battleDifficulty || cur.difficulty));
            if (config.challengeType === 'reading') setSpokenText('');
        }
    };

    // Award a free level from phantom click
    const handlePhantomLevelAward = (skillId) => {
        if (!skillId) return;

        // Play level up sound
        playLevelUp();

        setSkills(prev => {
            const current = prev[skillId];
            return {
                ...prev,
                [skillId]: {
                    ...current,
                    level: current.level + 1
                }
            };
        });

        // Show celebration notification
        const skillConfig = SKILL_DATA.find(s => s.id === skillId);
        if (skillConfig) {
            setLootBox({
                level: skills[skillId].level + 1,
                skillName: skillConfig.fantasyName,
                item: "Phantom Bonus!",
                img: HOSTILE_MOBS['Phantom']
            });
            playNotification();
        }
    };

    const startBattle = (id) => {
        const skill = SKILL_DATA.find(s => s.id === id);
        setBattlingSkillId(id);
        // Use the skill's current difficulty setting
        const currentDiff = skills[id].difficulty || 1;
        const playerLevel = skills[id].level;

        // For miniboss encounters, use difficulty+1 for content (capped at 7)
        const encounterType = getEncounterType(playerLevel);
        const challengeDiff = encounterType === 'miniboss'
            ? Math.min(7, currentDiff + 1)
            : currentDiff;

        // Store the battle's challenge difficulty so it remains consistent throughout the battle
        setBattleDifficulty(challengeDiff);

        setChallengeData(generateChallenge(skill.challengeType, challengeDiff));
        playClick();
        startBGM(); // Start BGM on first battle (user interaction)
        if (skill.challengeType === 'reading' && window.webkitSpeechRecognition) startVoiceListener(id);
    };

    const endBattle = () => {
        console.log('[Battle] Ending battle, cleaning up speech recognition');
        setBattlingSkillId(null);
        setBattleDifficulty(null);
        setChallengeData(null);
        stopVoiceRecognition();
        playClick();
    };

    const handleSwitchProfile = (newId) => {
        if (newId === currentProfile) return;
        playClick();
        const newSkills = loadSkills(newId);
        const newTheme = loadTheme(newId);
        setSkills(newSkills);
        setActiveTheme(newTheme);
        setCurrentProfile(newId);
    };
    const handleRenameProfile = (id, newName) => {
        setProfileNames(prev => ({ ...prev, [id]: newName }));
    };
    const handleParentVerified = (profileId, verified) => {
        setParentStatus(prev => ({ ...prev, [profileId]: verified }));

        if (verified && profileId === currentProfile) {
            // When parent verification passes, apply parent privileges to all skills
            setSkills(prev => {
                const updated = {};
                Object.keys(prev).forEach(skillId => {
                    const current = prev[skillId];
                    updated[skillId] = {
                        ...current,
                        level: PARENT_PRIVILEGE_LEVEL,
                        difficulty: PARENT_PRIVILEGE_DIFFICULTY,
                        earnedBadges: [...PARENT_PRIVILEGE_BADGES],
                        mobHealth: calculateMobHealth(PARENT_PRIVILEGE_DIFFICULTY, PARENT_PRIVILEGE_LEVEL),
                        mobMaxHealth: calculateMobHealth(PARENT_PRIVILEGE_DIFFICULTY, PARENT_PRIVILEGE_LEVEL)
                    };
                });
                return updated;
            });

            // Force a re-render to ensure UI immediately reflects the new levels
            setTimeout(() => {
                setSkills(current => ({ ...current }));
            }, 0);
        }
    };
    const handleReset = () => {
        // Remove skills data for current profile
        localStorage.removeItem(getStorageKey(currentProfile));
        if (currentProfile === 1) localStorage.removeItem('heroSkills_v23');
        // Update parent status in localStorage directly
        const currentParentStatus = localStorage.getItem('heroParentStatus_v1');
        const parentStatusObj = currentParentStatus ? JSON.parse(currentParentStatus) : { 1: false, 2: false, 3: false };
        parentStatusObj[currentProfile] = false;
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatusObj));
        // Update profile name in localStorage directly
        const currentProfileNames = localStorage.getItem('heroProfileNames_v1');
        const profileNamesObj = currentProfileNames ? JSON.parse(currentProfileNames) : { 1: "Player 1", 2: "Player 2", 3: "Player 3" };
        profileNamesObj[currentProfile] = `Player ${currentProfile}`;
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNamesObj));
        window.location.reload();
    };

    // Helper function to stop and cleanup speech recognition
    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                console.log('[Speech Recognition] Stopped');
            } catch (error) {
                console.warn('[Speech Recognition] Error stopping:', error);
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
        setSpokenText(MIC_OFF_TEXT);
    };

    const startVoiceListener = (targetId) => {
        if (!window.webkitSpeechRecognition) {
            console.warn('[Speech Recognition] Web Speech API not available');
            return;
        }

        // If recognition already exists and is active, don't reinitialize
        if (recognitionRef.current) {
            console.log('[Speech Recognition] Already initialized, skipping');
            return;
        }

        console.log('[Speech Recognition] Initializing for skill:', targetId);
        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;

        recognitionRef.current.onstart = () => { 
            console.log('[Speech Recognition] Started listening');
            setIsListening(true); 
            setSpokenText("Listening..."); 
        };
        
        recognitionRef.current.onend = () => {
            console.log('[Speech Recognition] Ended');
            setIsListening(false);
            // Auto-restart if still in Reading challenge
            // Note: battlingSkillId is intentionally checked from closure - if battle has ended
            // by the time this timeout fires, we don't want to restart (which is the desired behavior)
            if (battlingSkillId === 'reading' || targetId === 'reading') {
                // Small delay before restarting to avoid rapid restarts
                setTimeout(() => {
                    // Double-check that we're still in reading challenge
                    if (battlingSkillId === 'reading') {
                        console.log('[Speech Recognition] Auto-restarting');
                        recognitionRef.current = null; // Clear ref to allow restart
                        startVoiceListener(targetId);
                    }
                }, 100);
            } else {
                setSpokenText(MIC_OFF_TEXT);
            }
        };
        
        recognitionRef.current.onerror = (event) => {
            console.error('[Speech Recognition] Error:', event.error);
            if (event.error === 'no-speech') {
                console.log('[Speech Recognition] No speech detected, continuing...');
            } else if (event.error === 'not-allowed') {
                console.error('[Speech Recognition] Microphone permission denied');
                setSpokenText("Mic permission denied");
                setIsListening(false);
            } else {
                console.error('[Speech Recognition] Error type:', event.error);
            }
        };
        
        recognitionRef.current.onresult = (e) => { 
            const t = e.results[e.results.length - 1][0].transcript.toUpperCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ""); 
            console.log('[Speech Recognition] Recognized text:', t);
            setSpokenText(t); 
            // Use the ref to get the CURRENT challenge data
            const currentChallenge = challengeDataRef.current;
            if (currentChallenge && currentChallenge.type === 'reading') {
                if (t === currentChallenge.answer || HOMOPHONES[currentChallenge.answer]?.includes(t)) {
                    console.log('[Speech Recognition] Correct answer!');
                    handleSuccessHit(targetId || battlingSkillId);
                } else if (t && t.length >= MIN_SPOKEN_TEXT_LENGTH) {
                    // Wrong answer - trigger error feedback
                    console.log('[Speech Recognition] Wrong answer');
                    handleSuccessHit(targetId || battlingSkillId, 'WRONG');
                }
            }
        };
        
        try {
            recognitionRef.current.start();
            console.log('[Speech Recognition] Start command issued');
        } catch (error) {
            console.error('[Speech Recognition] Failed to start:', error);
        }
    };

    // Toggle mic on/off when mic button is clicked
    const toggleMicListener = (targetId) => {
        console.log('[Mic Toggle] isListening:', isListening);
        
        if (!window.webkitSpeechRecognition) {
            console.warn('[Mic Toggle] Web Speech API not available');
            setSpokenText("Mic not available");
            return;
        }
        
        // If currently listening, stop it
        if (recognitionRef.current && isListening) {
            console.log('[Mic Toggle] Stopping recognition');
            stopVoiceRecognition();
        } else {
            // If not listening, start it
            console.log('[Mic Toggle] Starting recognition');
            startVoiceListener(targetId);
        }
    };

    useEffect(() => { if(lootBox) setTimeout(() => setLootBox(null), 4000); }, [lootBox]);
    
    // Achievement toast auto-dismiss
    useEffect(() => { 
        if(achievementToast) {
            setTimeout(() => setAchievementToast(null), 6000); 
        }
    }, [achievementToast]);
    
    // Track login date (once per day)
    useEffect(() => {
        if (loginTrackedRef.current) return; // Skip if already tracked
        loginTrackedRef.current = true;
        
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const currentDates = stats.loginDates || [];
        // Only set if today's date is not already recorded
        if (!currentDates.includes(today)) {
            setStats(prev => ({
                ...prev,
                loginDates: [...(prev.loginDates || []), today]
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount, guarded by loginTrackedRef
    
    const getVisibleItems = () => {
        const items = [];
        // Generate 7 items: 5 visible cards (offsets -2 to +2) + 2 hidden positions (±3) for smooth entry/exit animation
        for (let i = -3; i <= 3; i++) {
            let idx = selectedIndex + i;
            let dataIndex = idx % SKILL_DATA.length;
            if (dataIndex < 0) dataIndex += SKILL_DATA.length;
            items.push({ ...SKILL_DATA[dataIndex], offset: i, key: idx });
        }
        return items;
    };
    const currentThemeData = THEME_CONFIG[activeTheme] || THEME_CONFIG.minecraft;
    const containerStyle = { ...currentThemeData.style, fontFamily: '"VT323", monospace' };

    // Drag handlers for carousel navigation
    const handleDragStart = (clientX) => {
        if (battlingSkillId) return;
        setIsDragging(true);
        setDragStartX(clientX);
    };
    const handleDragMove = (clientX) => {
        if (!isDragging || battlingSkillId) return;
        const diff = dragStartX - clientX;
        if (Math.abs(diff) >= 100) {
            if (diff > 0) {
                setSelectedIndex(p => p + 1);
                playActionCardRight();
            } else {
                setSelectedIndex(p => p - 1);
                playActionCardLeft();
            }
            setIsDragging(false);
        }
    };
    const handleDragEnd = () => {
        setIsDragging(false);
    };
    const handleCardClick = (offset) => {
        if (battlingSkillId || offset === 0) return;
        setSelectedIndex(p => p + offset);
        if (offset > 0) {
            playActionCardRight();
        } else {
            playActionCardLeft();
        }
    };

    // Helper to get the aura for the current mob encounter
    const getAuraForSkill = (skillConfig, userSkill) => {
        // Memory and Cleaning don't use auras
        if (skillConfig.id === 'memory' || skillConfig.id === 'cleaning') {
            return null;
        }
        
        const encounterType = getEncounterType(userSkill.level);
        
        if (encounterType === 'boss') {
            return userSkill.currentBossAura;
        }
        
        if (encounterType === 'miniboss') {
            return userSkill.currentMinibossAura;
        }
        
        // Combat skills have their own auras
        const combatSkillAuras = {
            'reading': userSkill.readingMobAura,
            'math': userSkill.mathMobAura,
            'writing': userSkill.writingMobAura,
            'patterns': userSkill.patternMobAura
        };
        
        return combatSkillAuras[skillConfig.id] || null;
    };

    return (
        <div className="min-h-screen overflow-hidden relative flex flex-col bg-cover bg-center bg-no-repeat font-sans text-stone-100" style={containerStyle}>
            <GlobalStyles />
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-0"></div>
            
            {/* Top Left Buttons */}
            {/* Button dimensions: p-3 (12px) + icon(48px) + p-3 (12px) + border-2*2 (4px) = 76px + 8px gap = 84px spacing */}
            <button 
                onClick={() => { setIsMenuOpen(false); setIsCosmeticsOpen(false); setIsSettingsOpen(true); playClick(); }} 
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg" 
                style={{ top: '24px', left: '24px' }}
                data-cy="settings-button"
            >
                <Settings size={48} className="text-slate-400" />
            </button>
            <button 
                onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(false); setIsCosmeticsOpen(true); playClick(); }} 
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg" 
                style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }}
                data-cy="theme-button"
            >
                <Sparkles size={48} className="text-purple-400" />
            </button>
            
            {/* Player Health Display - Centered */}
            <div className="absolute z-40 flex gap-1.5" style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>{Array(10).fill(0).map((_, i) => (<PixelHeart key={i} size={48} filled={i < playerHealth} />))}</div>
            
            {/* Cosmetics drawer overlay - click to close */}
            {isCosmeticsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => { setIsCosmeticsOpen(false); playClick(); }}
                />
            )}
            <CosmeticsDrawer 
                isOpen={isCosmeticsOpen} 
                activeTheme={activeTheme} 
                setActiveTheme={handleThemeChange}
                selectedBorder={selectedBorder}
                setSelectedBorder={handleBorderChange}
                borderColor={borderColor}
                setBorderColor={setBorderColor}
                unlockedBorders={unlockedBorders}
                unlockedAchievements={unlockedAchievements}
            />
            
            {/* Settings drawer overlay - click to close */}
            {isSettingsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => { setIsSettingsOpen(false); playClick(); }}
                />
            )}
            <SettingsDrawer 
                isOpen={isSettingsOpen} 
                onReset={() => setIsResetOpen(true)} 
                bgmVol={bgmVol} 
                setBgmVol={setBgmVol} 
                sfxVol={sfxVol} 
                setSfxVol={setSfxVolState} 
                currentProfile={currentProfile} 
                onSwitchProfile={handleSwitchProfile} 
                profileNames={profileNames} 
                onRenameProfile={handleRenameProfile} 
                getProfileStats={getProfileStats} 
                parentStatus={parentStatus} 
                onParentVerified={handleParentVerified} 
                currentSkills={skills} 
            />
            <ResetModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />
            <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />
            
            {/* Top Right Buttons */}
            {/* Button dimensions: p-3 (12px) + icon(48px) + p-3 (12px) + border-2*2 (4px) = 76px + 8px gap = 84px spacing */}
            <button 
                onClick={toggleFullscreen} 
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg" 
                style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }} 
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} 
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                data-cy="fullscreen-button"
            >
                {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
            </button>
            <button 
                onClick={() => { setIsSettingsOpen(false); setIsCosmeticsOpen(false); setIsMenuOpen(true); playClick(); }} 
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg" 
                style={{ top: '24px', right: '24px' }}
                data-cy="achievement-button"
            >
                <Menu size={48} />
            </button>
            
            {/* Achievement drawer overlay - click to close */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => { setIsMenuOpen(false); playClick(); }}
                />
            )}
            <MenuDrawer isOpen={isMenuOpen} skills={skills} stats={stats} />
            
            {/* Bottom Right Bug Report Button */}
            <button 
                onClick={() => { setIsMenuOpen(false); setIsCosmeticsOpen(false); setIsSettingsOpen(false); setIsBugReportOpen(true); playClick(); }} 
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg" 
                style={{ bottom: '24px', right: '24px' }}
                data-cy="bug-button"
            >
                <Bug size={48} className="text-red-400" />
            </button>
            
            {/* Backdrop overlay when battling - click to exit */}
            {battlingSkillId && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', minWidth: '100vw', minHeight: '100vh' }}
                    onClick={endBattle}
                />
            )}
            <main className="flex-1 relative flex flex-col items-center justify-center w-full">
                <div className="z-10 relative mb-[-30px] md:mb-[-50px] pointer-events-none opacity-90"><SafeImage src={currentThemeData.assets.logo} fallbackSrc="https://placehold.co/800x300/333/FFD700?text=LOGO+PLACEHOLDER&font=monsterrat" alt="Game Logo" className="w-[480px] md:w-[720px] lg:w-[960px] object-contain drop-shadow-2xl" /></div>
                <h1 className="text-9xl text-yellow-400 tracking-widest uppercase mt-[-20px] mb-[95px] z-20 relative drop-shadow-[4px_4px_0_#000]" style={{ textShadow: '6px 6px 0 #000' }}>Level Up!</h1>
                
                {/* Left Chevron - Parenthesis style with gradient fade */}
                <button 
                    onClick={() => {setSelectedIndex(p => p - 1); playActionCardLeft();}} 
                    className="flex absolute left-0 z-30 items-center justify-center h-full"
                    style={{ 
                        background: 'linear-gradient(to right, rgba(100, 100, 100, 0.6), transparent)',
                        width: '80px',
                        padding: '0'
                    }}
                >
                    <svg 
                        width="60" 
                        height="450" 
                        viewBox="0 0 60 450" 
                        className="animate-chevron-left"
                        style={{ opacity: 0.8 }}
                    >
                        <path 
                            d="M 50 25 Q 15 225 50 425" 
                            stroke="rgba(150, 150, 150, 0.9)" 
                            strokeWidth="8" 
                            fill="none" 
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
                
                {/* Right Chevron - Parenthesis style with gradient fade */}
                <button 
                    onClick={() => {setSelectedIndex(p => p + 1); playActionCardRight();}} 
                    className="flex absolute right-0 z-30 items-center justify-center h-full"
                    style={{ 
                        background: 'linear-gradient(to left, rgba(100, 100, 100, 0.6), transparent)',
                        width: '80px',
                        padding: '0'
                    }}
                >
                    <svg 
                        width="60" 
                        height="450" 
                        viewBox="0 0 60 450" 
                        className="animate-chevron-right"
                        style={{ opacity: 0.8 }}
                    >
                        <path 
                            d="M 10 25 Q 45 225 10 425" 
                            stroke="rgba(150, 150, 150, 0.9)" 
                            strokeWidth="8" 
                            fill="none" 
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
                <div 
                    className={`relative w-full flex items-center justify-center perspective-1000 h-[650px] mb-12 ${battlingSkillId ? 'z-50' : ''}`}
                    style={{ cursor: battlingSkillId ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
                    onMouseDown={(e) => handleDragStart(e.clientX)}
                    onMouseMove={(e) => handleDragMove(e.clientX)}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                    onTouchMove={(e) => { e.preventDefault(); handleDragMove(e.touches[0].clientX); }}
                    onTouchEnd={handleDragEnd}
                >
                    {getVisibleItems().map((item) => {
                        const isItemBattling = item.offset === 0 && battlingSkillId === item.id;
                        const style = getCardStyle(item.offset, isItemBattling);

                        return (
                            <div
                                key={item.key}
                                className="absolute transition-all duration-500 ease-out"
                                style={style}
                                onClick={() => handleCardClick(item.offset)}
                            >
                                <SkillCard
                                    skill={skills[item.id]}
                                    config={SKILL_DATA.find(s => s.id === item.id)}
                                    // ... rest of your SkillCard props
                                />
                            </div>
                        );
                    })}
                </div>
            </main>
            {lootBox && <div className="fixed bottom-8 left-1/2 z-50 animate-toast w-full max-w-2xl pointer-events-none transform -translate-x-1/2"><div className="bg-black/80 border-4 border-yellow-500 rounded-full p-4 px-12 flex items-center justify-between shadow-[0_0_30px_rgba(255,215,0,0.6)] backdrop-blur-md mx-4"><div className="flex items-center gap-4"><div className="bg-yellow-500/20 p-3 rounded-full border-2 border-yellow-400"><Gift size={32} className="text-yellow-300 animate-bounce" /></div><div className="text-left"><h2 className="text-2xl text-yellow-400 font-bold leading-none mb-1">LEVEL {lootBox.level} REACHED!</h2><p className="text-stone-300 text-sm">{lootBox.skillName}</p></div></div><div className="text-right pl-8 border-l-2 border-stone-600 flex items-center gap-4"><SafeImage src={lootBox.img} alt="Badge" className="w-12 h-12 object-contain" /><div><p className="text-stone-400 text-xs uppercase tracking-wider">Unlocked</p><p className="text-2xl text-green-400 font-bold">{lootBox.item}</p></div></div></div></div>}
            
            {/* Achievement Toast */}
            {achievementToast && (
                <AchievementToast 
                    achievementId={achievementToast.achievementId}
                    tierIndex={achievementToast.tierIndex}
                />
            )}
            
            {/* Death Overlay - Minecraft-style YOU DIED screen */}
            {showDeathOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/60 animate-pulse pointer-events-none">
                    <div className="text-center">
                        <h1 className="text-8xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]" style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000' }}>
                            YOU DIED
                        </h1>
                        <p className="text-2xl text-red-300 mt-4">Level -1</p>
                        <p className="text-lg text-stone-400 mt-2">Take a moment to rest...</p>
                    </div>
                </div>
            )}
            
            {/* Level Restored celebration */}
            {showLevelRestored && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="text-center animate-bounce">
                        <h1 className="text-6xl font-bold text-green-400 drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]" style={{ textShadow: '4px 4px 0 #000' }}>
                            LEVEL RESTORED!
                        </h1>
                        <p className="text-2xl text-yellow-400 mt-4">Welcome back, hero!</p>
                    </div>
                </div>
            )}
            
            {/* Phantom Fly-By Bonus Event */}
            <PhantomEvent 
                battlingSkillId={battlingSkillId} 
                onAwardLevel={handlePhantomLevelAward}
                onPhantomCaught={() => {
                    setStats(prevStats => {
                        const newStats = {
                            ...prevStats,
                            phantomsCaught: (prevStats.phantomsCaught || 0) + 1
                        };
                        // Check achievements
                        setTimeout(() => {
                            checkAchievements(prevStats, newStats, skills, skills);
                        }, 100);
                        return newStats;
                    });
                }}
            />
        </div>
    );
};

export default App;