import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Sparkles, Gift, Maximize, Minimize, Settings, Bug } from 'lucide-react';

// UI components
import GlobalStyles     from './components/ui/GlobalStyles';
import SafeImage        from './components/ui/SafeImage';
import PixelHeart       from './components/ui/PixelHeart';
import ResetModal       from './components/modals/ResetModal';
import BugReportModal   from './components/modals/BugReportModal';
import SettingsDrawer   from './components/drawers/SettingsDrawer';
import CosmeticsDrawer  from './components/drawers/CosmeticsDrawer';
import MenuDrawer       from './components/drawers/MenuDrawer';
import SkillCard        from './components/skills/SkillCard';
import PhantomEvent     from './components/PhantomEvent';
import AchievementToast from './components/ui/AchievementToast';

// Utils & constants
import {
    getMobForSkill, getEncounterType,
    generateMathProblem, getReadingWord, getWordForDifficulty,
    calculateDamage, calculateMobHealth, calculateXPReward,
} from './utils/gameUtils';
import { THEME_CONFIG, SKILL_DATA, HOSTILE_MOBS } from './constants/gameData';
import {
    getBGMManager, setSfxVolume,
    playActionCardLeft, playActionCardRight, playClick,
    playDeath, playFail, playLevelUp, playNotification, playSuccessfulHit,
    playMobHurt, playMobDeath, playAchievement,
} from './utils/soundManager';
import {
    getDefaultStats, getNewlyUnlockedAchievements, getNewTierAchievements,
    isAchievementUnlocked,
} from './utils/achievementUtils';
import GameCarousel from './components/layout/GameCarousel';


// Extracted modules
import { getStorageKey, loadSkills, loadTheme, loadStats, readStoredProfileStats } from './utils/profileStorage';
import {
    getCardStyle,
    buildMobDefeatStats, buildLevelProgression, buildMobRotation,
} from './utils/skillStateUtils';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------
const PARENT_PRIVILEGE_LEVEL      = 200;
const PARENT_PRIVILEGE_DIFFICULTY = 7;
const PARENT_PRIVILEGE_BADGES     = [1, 2, 3, 4, 5, 6, 7, 8];
const BOSS_HEALING_ANIMATION_DURATION = 600;

// ---------------------------------------------------------------------------
// Pure challenge generator (no state deps — module scope is correct)
// ---------------------------------------------------------------------------
const generateChallenge = (type, diff) => {
    if (type === 'math')     return generateMathProblem(diff);
    if (type === 'patterns') return { type: 'patterns', question: 'Simon Says!', answer: 'WIN' };
    if (type === 'reading')  { const w = getReadingWord(diff); return { type, question: w, answer: w }; }
    if (type === 'writing') {
        const wd = getWordForDifficulty(diff);
        return { type, question: 'Spell it!', answer: wd.displayName.toUpperCase(), images: [wd.image], displayName: wd.displayName };
    }
    if (type === 'memory') return { type: 'memory', question: 'Find Pairs!', answer: 'WIN' };
    return { type: 'manual', question: 'Task Complete?', answer: 'yes' };
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const App = () => {

    // ------------------------------------------------------------------ state
    const [currentProfile, setCurrentProfile] = useState(
        () => Number.parseInt(localStorage.getItem('currentProfile_v1') || '1')
    );
    const [profileNames, setProfileNames] = useState(
        () => JSON.parse(localStorage.getItem('heroProfileNames_v1') || 'null')
            ?? { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' }
    );
    const [parentStatus, setParentStatus] = useState(
        () => JSON.parse(localStorage.getItem('heroParentStatus_v1') || 'null')
            ?? { 1: false, 2: false, 3: false }
    );

    const [skills,        setSkills]        = useState(() => loadSkills(currentProfile));
    const [activeTheme,   setActiveTheme]   = useState(() => loadTheme(currentProfile));
    const [stats,         setStats]         = useState(() => loadStats(currentProfile));
    const [playerHealth,  setPlayerHealth]  = useState(10);

    const [battlingSkillId,  setBattlingSkillId]  = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null);
    const [challengeData,    setChallengeData]    = useState(null);

    const [achievementToast, setAchievementToast] = useState(null);
    const [lootBox,          setLootBox]          = useState(null);
    const [isMenuOpen,       setIsMenuOpen]        = useState(false);
    const [isSettingsOpen,   setIsSettingsOpen]    = useState(false);
    const [isCosmeticsOpen,  setIsCosmeticsOpen]   = useState(false);
    const [isResetOpen,      setIsResetOpen]       = useState(false);
    const [isBugReportOpen,  setIsBugReportOpen]   = useState(false);
    const [isListening,      setIsListening]       = useState(false);
    const [spokenText,       setSpokenText]        = useState('');
    const [damageNumbers,    setDamageNumbers]     = useState([]);
    const [selectedIndex,    setSelectedIndex]     = useState(0);
    const [isDragging,       setIsDragging]        = useState(false);
    const [dragStartX,       setDragStartX]        = useState(0);
    const [showDeathOverlay,   setShowDeathOverlay]   = useState(false);
    const [showLevelRestored,  setShowLevelRestored]  = useState(false);
    const [isFullscreen,       setIsFullscreen]       = useState(false);
    const [bossHealing,        setBossHealing]        = useState(null);
    const [selectedBorder, setSelectedBorder] = useState(
        () => localStorage.getItem(`borderEffect_p${currentProfile}`) || 'solid'
    );
    const [borderColor, setBorderColor] = useState(
        () => localStorage.getItem(`borderColor_p${currentProfile}`) || '#FFD700'
    );
    const [bgmVol,    setBgmVol]       = useState(0.3);
    const [sfxVol,    setSfxVolState]  = useState(0.5);

    // ------------------------------------------------------------------- refs
    const challengeDataRef = useRef(null);
    const damageIdRef      = useRef(0);
    const loginTrackedRef  = useRef(false);
    const bgmManager       = useRef(getBGMManager());

    // ------------------------------------------------------------ persistence
    useEffect(() => {
        localStorage.setItem(getStorageKey(currentProfile), JSON.stringify({ skills, theme: activeTheme, stats }));
        localStorage.setItem('currentProfile_v1', currentProfile);
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNames));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatus));
    }, [skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);

    useEffect(() => {
        localStorage.setItem(`borderEffect_p${currentProfile}`, selectedBorder);
        localStorage.setItem(`borderColor_p${currentProfile}`, borderColor);
    }, [selectedBorder, borderColor, currentProfile]);

    useEffect(() => { challengeDataRef.current = challengeData; }, [challengeData]);
    useEffect(() => { bgmManager.current.setVolume(bgmVol); }, [bgmVol]);
    useEffect(() => { setSfxVolume(sfxVol); }, [sfxVol]);

    useEffect(() => {
        const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFSChange);
        return () => document.removeEventListener('fullscreenchange', onFSChange);
    }, []);

    // Login tracking — once per day
    useEffect(() => {
        if (loginTrackedRef.current) return;
        loginTrackedRef.current = true;
        const today = new Date().toISOString().split('T')[0];
        setStats(prev => {
            if ((prev.loginDates || []).includes(today)) return prev;
            return { ...prev, loginDates: [...(prev.loginDates || []), today] };
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { if (lootBox)         setTimeout(() => setLootBox(null),         4000); }, [lootBox]);
    useEffect(() => { if (achievementToast) setTimeout(() => setAchievementToast(null), 6000); }, [achievementToast]);

    // ------------------------------------------------------------ memos
    const unlockedBorders = React.useMemo(() => {
        const badges      = new Set();
        const tierToBadge = ['Wood', 'Stone', 'Gold', 'Iron', 'Emerald', 'Diamond', 'Netherite', 'Obsidian'];
        Object.values(skills).forEach(skill => {
            (skill.earnedBadges || []).forEach(tier => {
                if (tier >= 1 && tier <= 8) badges.add(tierToBadge[tier - 1]);
            });
            if (skill.level >= 180) badges.add('Star');
        });
        return Array.from(badges);
    }, [skills]);

    const unlockedAchievements = React.useMemo(() =>
        ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set']
            .filter(id => isAchievementUnlocked(id, stats, skills)),
    [stats, skills]);

    // ------------------------------------------------------- achievements
    const checkAchievements = useCallback((oldStats, newStats, oldSkills, newSkills) => {
        const newlyUnlocked = getNewlyUnlockedAchievements(oldStats, newStats, oldSkills, newSkills);
        const newTiers      = getNewTierAchievements(oldStats, newStats, oldSkills, newSkills);

        if (newlyUnlocked.length > 0) {
            setAchievementToast({ achievementId: newlyUnlocked[0], tierIndex: null });
            playAchievement();
        } else if (newTiers.length > 0) {
            setAchievementToast({ achievementId: newTiers[0].achievementId, tierIndex: newTiers[0].tierIndex });
            playAchievement();
        }
    }, []);

    // ------------------------------------------------- voice recognition
    const { startVoiceListener, stopVoiceRecognition, toggleMicListener } = useVoiceRecognition({
        challengeDataRef,
        battlingSkillId,
        onCorrect: useCallback((id) => handleSuccessHit(id),         []),   // eslint-disable-line
        onWrong:   useCallback((id) => handleSuccessHit(id, 'WRONG'), []),  // eslint-disable-line
        setIsListening,
        setSpokenText,
    });

    // ----------------------------------------- handleSuccessHit helpers
    // These named helpers are called from inside setSkills' setState callback,
    // keeping the callback body at depth ≤ 2 (callback → helper call).

    /** Apply a non-killing hit: subtract damage and award partial XP. */
    const applyPartialHit = (current, actualDamage, isInstantDefeat, damage) => {
        const totalXP     = calculateXPReward(current.difficulty, current.level);
        const effectiveDmg = isInstantDefeat ? current.mobMaxHealth : damage;
        const hitsToKill  = Math.ceil(current.mobMaxHealth / effectiveDmg);
        const xpPerHit    = Math.floor(totalXP / hitsToKill);
        return { ...current, mobHealth: current.mobHealth - actualDamage, xp: current.xp + xpPerHit };
    };

    /** Apply a killing hit: XP, level-up, badges, mob rotation, new health. */
    const applyKillHit = (prev, skillId, current, skillConfig, actualDamage, isInstantDefeat, damage) => {
        // XP
        const totalXP      = calculateXPReward(current.difficulty, current.level);
        const effectiveDmg = isInstantDefeat ? current.mobMaxHealth : damage;
        const hitsToKill   = Math.ceil(current.mobMaxHealth / effectiveDmg);
        const xpPerHit     = Math.floor(totalXP / hitsToKill);
        const hitsDealt    = Math.ceil((current.mobMaxHealth - current.mobHealth) / effectiveDmg);
        const remainingXP  = totalXP - hitsDealt * xpPerHit;

        let newLevel      = current.level;
        let newXp         = current.xp + remainingXP;
        let newDifficulty = current.difficulty || 1;
        let newBadges     = [...(current.earnedBadges || [])];
        let newLostLevel  = current.lostLevel;
        let newRecovery   = current.recoveryDifficulty;

        // Encounter stats (side-effect outside pure path)
        const encounterType = getEncounterType(current.level);
        setStats(prevStats => {
            const nextStats = buildMobDefeatStats(prevStats, encounterType, current);
            setTimeout(() => checkAchievements(prevStats, nextStats, prev, { ...prev, [skillId]: { ...current, level: newLevel } }), 100);
            return nextStats;
        });

        // Level restoration
        if (newLostLevel) {
            newLevel++;
            newLostLevel = false;
            newRecovery  = null;
            setShowLevelRestored(true);
            setTimeout(() => setShowLevelRestored(false), 2000);
            playNotification();
        }

        // Level-up & badges
        const progression = buildLevelProgression(newLevel, newXp, newDifficulty, newBadges, skillConfig);
        newLevel      = progression.newLevel;
        newXp         = progression.newXp;
        newDifficulty = progression.newDifficulty;
        newBadges     = progression.newBadges;
        if (progression.lootBoxNotif) { setLootBox(progression.lootBoxNotif); playNotification(); }
        if (progression.didLevelUp)   playLevelUp();

        // Mob rotation
        const mobUpdates = buildMobRotation(skillConfig.id, current);
        const newMaxH    = calculateMobHealth(newDifficulty);
        const newMob     = newLevel % 20 !== 0 ? current.currentMob : current.currentMob; // rotation handled in mobUpdates

        return {
            ...current,
            level:              newLevel,
            xp:                 newXp,
            difficulty:         newDifficulty,
            earnedBadges:       newBadges,
            lostLevel:          newLostLevel,
            recoveryDifficulty: newRecovery,
            mobHealth:          newMaxH,
            mobMaxHealth:       newMaxH,
            currentMob:         newMob,
            ...mobUpdates,
        };
    };

    // -------------------------------------------------- handleSuccessHit
    const handleSuccessHit = (skillId, isWrong) => {

        // Wrong answer path
        if (isWrong === 'WRONG') {
            const isBossEncounter = battlingSkillId
                && getEncounterType(skills[battlingSkillId].level) === 'boss';

            if (isBossEncounter) {
                setSkills(prev => ({
                    ...prev,
                    [battlingSkillId]: { ...prev[battlingSkillId], mobHealth: prev[battlingSkillId].mobMaxHealth },
                }));
                setBossHealing(battlingSkillId);
                setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);
                playFail();
                return;
            }

            // Non-boss: damage player; death sequence if health hits 0
            setPlayerHealth(h => {
                const next = h - 1;
                if (next > 0) { playFail(); return next; }

                // Death (depth 3: handleSuccessHit → setPlayerHealth cb → death block)
                playDeath();
                setShowDeathOverlay(true);
                setStats(prev => {
                    const nextStats = { ...prev, totalDeaths: (prev.totalDeaths || 0) + 1 };
                    setTimeout(() => checkAchievements(prev, nextStats, skills, skills), 100);
                    return nextStats;
                });
                if (battlingSkillId) {
                    setSkills(prev => {
                        const cur = prev[battlingSkillId];
                        return { ...prev, [battlingSkillId]: {
                            ...cur,
                            level:              Math.max(1, cur.level - 1),
                            lostLevel:          cur.level > 1,
                            recoveryDifficulty: Math.max(1, (cur.difficulty || 1) - 1),
                        }};
                    });
                }
                setTimeout(() => { setBattlingSkillId(null); setShowDeathOverlay(false); }, 2000);
                return 10;
            });
            return;
        }

        // Correct hit path
        if (!skillId) return;

        const skillConfig     = SKILL_DATA.find(s => s.id === skillId);
        const cur             = skills[skillId];
        const skillDifficulty = cur.difficulty || 1;
        const encounterType   = getEncounterType(cur.level);
        const damage          = calculateDamage(cur.level, skillDifficulty);
        const isMiniboss      = encounterType === 'miniboss' && skillConfig.id !== 'cleaning';
        const isInstantDefeat = skillConfig.id === 'cleaning' || skillConfig.id === 'memory' || isMiniboss;
        const actualDamage    = isInstantDefeat ? cur.mobHealth : damage;
        const willKill        = (cur.mobHealth - actualDamage) <= 0;

        // Visual / audio feedback
        if (skillConfig.id !== 'memory') {
            const id = ++damageIdRef.current;
            setDamageNumbers(prev => [...prev, { id, skillId, val: actualDamage, x: Math.random() * 100 - 50, y: Math.random() * 50 - 25 }]);
            setTimeout(() => setDamageNumbers(prev => prev.filter(n => n.id !== id)), 800);
            if (willKill) playMobDeath(cur.currentMob); else playMobHurt(cur.currentMob);
            playSuccessfulHit();
        }

        // State update — depth 2: handleSuccessHit → setSkills callback
        setSkills(prev => {
            const current = prev[skillId];
            const updated = willKill
                ? applyKillHit(prev, skillId, current, skillConfig, actualDamage, isInstantDefeat, damage)
                : applyPartialHit(current, actualDamage, isInstantDefeat, damage);
            return { ...prev, [skillId]: updated };
        });

        // Next challenge
        if (skillConfig.id === 'memory') {
            setBattlingSkillId(null);
            setBattleDifficulty(null);
            return;
        }
        if (skillConfig.hasChallenge) {
            setChallengeData(generateChallenge(skillConfig.challengeType, battleDifficulty || skillDifficulty));
            if (skillConfig.challengeType === 'reading') setSpokenText('');
        }
    };

    // -------------------------------------------------------- BGM / fullscreen
    const startBGM = useCallback(() => {
        if (!bgmManager.current.isPlaying) bgmManager.current.play();
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.warn('Fullscreen failed:', err));
        } else {
            document.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
        }
        playClick();
    };

    // ------------------------------------------------------- battle lifecycle
    const startBattle = (id) => {
        const skill        = SKILL_DATA.find(s => s.id === id);
        const currentDiff  = skills[id].difficulty || 1;
        const challengeDiff = getEncounterType(skills[id].level) === 'miniboss'
            ? Math.min(7, currentDiff + 1) : currentDiff;

        setBattlingSkillId(id);
        setBattleDifficulty(challengeDiff);
        setChallengeData(generateChallenge(skill.challengeType, challengeDiff));
        playClick();
        startBGM();
        if (skill.challengeType === 'reading' && window.webkitSpeechRecognition) startVoiceListener(id);
    };

    const endBattle = () => {
        setBattlingSkillId(null);
        setBattleDifficulty(null);
        setChallengeData(null);
        stopVoiceRecognition();
        playClick();
    };

    // --------------------------------------------------- skill difficulty
    const setSkillDifficulty = (skillId, newDiff) => {
        setSkills(prev => {
            const maxH = calculateMobHealth(newDiff);
            return { ...prev, [skillId]: { ...prev[skillId], difficulty: newDiff, mobHealth: maxH, mobMaxHealth: maxH } };
        });
    };

    // -------------------------------------------------- profile management
    const handleSwitchProfile = (newId) => {
        if (newId === currentProfile) return;
        playClick();
        setSkills(loadSkills(newId));
        setActiveTheme(loadTheme(newId));
        setCurrentProfile(newId);
    };

    const handleRenameProfile = (id, newName) =>
        setProfileNames(prev => ({ ...prev, [id]: newName }));

    const handleParentVerified = (profileId, verified) => {
        setParentStatus(prev => ({ ...prev, [profileId]: verified }));
        if (!verified || profileId !== currentProfile) return;

        setSkills(prev => {
            const updated = {};
            Object.keys(prev).forEach(skillId => {
                updated[skillId] = {
                    ...prev[skillId],
                    level:        PARENT_PRIVILEGE_LEVEL,
                    difficulty:   PARENT_PRIVILEGE_DIFFICULTY,
                    earnedBadges: [...PARENT_PRIVILEGE_BADGES],
                    mobHealth:    calculateMobHealth(PARENT_PRIVILEGE_DIFFICULTY, PARENT_PRIVILEGE_LEVEL),
                    mobMaxHealth: calculateMobHealth(PARENT_PRIVILEGE_DIFFICULTY, PARENT_PRIVILEGE_LEVEL),
                };
            });
            return updated;
        });
        setTimeout(() => setSkills(s => ({ ...s })), 0);
    };

    const handleReset = () => {
        localStorage.removeItem(getStorageKey(currentProfile));
        if (currentProfile === 1) localStorage.removeItem('heroSkills_v23');

        const ps = JSON.parse(localStorage.getItem('heroParentStatus_v1') || '{}');
        ps[currentProfile] = false;
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(ps));

        const pn = JSON.parse(localStorage.getItem('heroProfileNames_v1') || '{}');
        pn[currentProfile] = `Player ${currentProfile}`;
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(pn));

        window.location.reload();
    };

    // ----------------------------------------- cosmetic change trackers
    const handleThemeChange = useCallback((newTheme) => {
        if (newTheme === activeTheme) return;
        setActiveTheme(newTheme);
        setStats(prev => {
            const next = { ...prev, themeChanges: (prev.themeChanges || 0) + 1 };
            setTimeout(() => checkAchievements(prev, next, skills, skills), 100);
            return next;
        });
    }, [activeTheme, skills, checkAchievements]);

    const handleBorderChange = useCallback((newBorder) => {
        if (newBorder === selectedBorder) return;
        setSelectedBorder(newBorder);
        setStats(prev => {
            const next = { ...prev, borderChanges: (prev.borderChanges || 0) + 1 };
            setTimeout(() => checkAchievements(prev, next, skills, skills), 100);
            return next;
        });
    }, [selectedBorder, skills, checkAchievements]);

    // ---------------------------------------------- phantom event handlers
    const handlePhantomLevelAward = (skillId) => {
        if (!skillId) return;
        playLevelUp();
        setSkills(prev => ({ ...prev, [skillId]: { ...prev[skillId], level: prev[skillId].level + 1 } }));
        const config = SKILL_DATA.find(s => s.id === skillId);
        if (config) {
            setLootBox({ level: skills[skillId].level + 1, skillName: config.fantasyName, item: 'Phantom Bonus!', img: HOSTILE_MOBS['Phantom'] });
            playNotification();
        }
    };

    const handlePhantomCaught = useCallback(() => {
        setStats(prev => {
            const next = { ...prev, phantomsCaught: (prev.phantomsCaught || 0) + 1 };
            setTimeout(() => checkAchievements(prev, next, skills, skills), 100);
            return next;
        });
    }, [skills, checkAchievements]);

    // -------------------------------------------------- carousel helpers
    const getVisibleItems = () => {
        const items = [];
        for (let i = -3; i <= 3; i++) {
            let idx       = selectedIndex + i;
            let dataIndex = ((idx % SKILL_DATA.length) + SKILL_DATA.length) % SKILL_DATA.length;
            items.push({ ...SKILL_DATA[dataIndex], offset: i, key: idx });
        }
        return items;
    };

    const handleDragStart = (clientX) => {
        if (battlingSkillId) return;
        setIsDragging(true);
        setDragStartX(clientX);
    };
    const handleDragMove = (clientX) => {
        if (!isDragging || battlingSkillId) return;
        const diff = dragStartX - clientX;
        if (Math.abs(diff) < 100) return;
        if (diff > 0) { setSelectedIndex(p => p + 1); playActionCardRight(); }
        else          { setSelectedIndex(p => p - 1); playActionCardLeft();  }
        setIsDragging(false);
    };
    const handleDragEnd  = () => setIsDragging(false);
    const handleCardClick = (offset) => {
        if (battlingSkillId || offset === 0) return;
        setSelectedIndex(p => p + offset);
        if (offset > 0) playActionCardRight(); else playActionCardLeft();
    };

    // ------------------------------------------------ aura & profile stats
    const getAuraForSkill = (skillConfig, userSkill) => {
        if (skillConfig.id === 'memory' || skillConfig.id === 'cleaning') return null;
        const type = getEncounterType(userSkill.level);
        if (type === 'boss')     return userSkill.currentBossAura;
        if (type === 'miniboss') return userSkill.currentMinibossAura;
        const auraMap = { reading: userSkill.readingMobAura, math: userSkill.mathMobAura, writing: userSkill.writingMobAura, patterns: userSkill.patternMobAura };
        return auraMap[skillConfig.id] || null;
    };

    const getProfileStats = (id, liveSkills = null) => {
        if (liveSkills) {
            let totalLevel = 0, highestLevel = 0;
            Object.values(liveSkills).forEach(s => {
                if (s && typeof s.level === 'number') {
                    totalLevel += s.level;
                    if (s.level > highestLevel) highestLevel = s.level;
                }
            });
            return { totalLevel, highestLevel, skills: liveSkills, theme: activeTheme };
        }
        return readStoredProfileStats(id);
    };

    // -------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------
    const currentThemeData = THEME_CONFIG[activeTheme] || THEME_CONFIG.minecraft;
    const containerStyle   = { ...currentThemeData.style, fontFamily: '"VT323", monospace' };

    return (
        <div className="min-h-screen overflow-hidden relative flex flex-col bg-cover bg-center bg-no-repeat font-sans text-stone-100" style={containerStyle}>
            <GlobalStyles />
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-0" />

            {/* ---- Top-left buttons ---- */}
            <button onClick={() => { setIsMenuOpen(false); setIsCosmeticsOpen(false); setIsSettingsOpen(true); playClick(); }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: '24px' }} data-cy="settings-button">
                <Settings size={48} className="text-slate-400" />
            </button>
            <button onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(false); setIsCosmeticsOpen(true); playClick(); }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }} data-cy="theme-button">
                <Sparkles size={48} className="text-purple-400" />
            </button>

            {/* ---- Player health ---- */}
            <div className="absolute z-40 flex gap-1.5" style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
                {Array(10).fill(0).map((_, i) => <PixelHeart key={i} size={48} filled={i < playerHealth} />)}
            </div>

            {/* ---- Drawers ---- */}
            {isCosmeticsOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setIsCosmeticsOpen(false); playClick(); }} />}
            <CosmeticsDrawer isOpen={isCosmeticsOpen} activeTheme={activeTheme} setActiveTheme={handleThemeChange}
                selectedBorder={selectedBorder} setSelectedBorder={handleBorderChange}
                borderColor={borderColor} setBorderColor={setBorderColor}
                unlockedBorders={unlockedBorders} unlockedAchievements={unlockedAchievements} />

            {isSettingsOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setIsSettingsOpen(false); playClick(); }} />}
            <SettingsDrawer isOpen={isSettingsOpen} onReset={() => setIsResetOpen(true)}
                bgmVol={bgmVol} setBgmVol={setBgmVol} sfxVol={sfxVol} setSfxVol={setSfxVolState}
                currentProfile={currentProfile} onSwitchProfile={handleSwitchProfile}
                profileNames={profileNames} onRenameProfile={handleRenameProfile}
                getProfileStats={getProfileStats} parentStatus={parentStatus}
                onParentVerified={handleParentVerified} currentSkills={skills} />

            <ResetModal  isOpen={isResetOpen}    onClose={() => setIsResetOpen(false)}    onConfirm={handleReset} />
            <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />

            {/* ---- Top-right buttons ---- */}
            <button onClick={toggleFullscreen}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} data-cy="fullscreen-button">
                {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
            </button>
            <button onClick={() => { setIsSettingsOpen(false); setIsCosmeticsOpen(false); setIsMenuOpen(true); playClick(); }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: '24px' }} data-cy="achievement-button">
                <Menu size={48} />
            </button>

            {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setIsMenuOpen(false); playClick(); }} />}
            <MenuDrawer isOpen={isMenuOpen} skills={skills} stats={stats} />

            <button onClick={() => { setIsMenuOpen(false); setIsCosmeticsOpen(false); setIsSettingsOpen(false); setIsBugReportOpen(true); playClick(); }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ bottom: '24px', right: '24px' }} data-cy="bug-button">
                <Bug size={48} className="text-red-400" />
            </button>

            {/* ---- Battle backdrop ---- */}
            {battlingSkillId && (
                <div className="fixed inset-0 bg-black/50 z-40"
                    style={{ minWidth: '100vw', minHeight: '100vh' }}
                    onClick={endBattle} />
            )}

            <main className="flex-1 relative flex flex-col items-center justify-center w-full">
                <div className="z-10 relative mb-[-30px] md:mb-[-50px] pointer-events-none opacity-90">
                    <SafeImage src={currentThemeData.assets.logo}
                        fallbackSrc="https://placehold.co/800x300/333/FFD700?text=LOGO+PLACEHOLDER&font=monsterrat"
                        alt="Game Logo" className="w-[480px] md:w-[720px] lg:w-[960px] object-contain drop-shadow-2xl" />
                </div>
                <h1 className="text-9xl text-yellow-400 tracking-widest uppercase mt-[-20px] mb-[95px] z-20 relative drop-shadow-[4px_4px_0_#000]"
                    style={{ textShadow: '6px 6px 0 #000' }}>Level Up!</h1>

                {/* Left chevron */}
                <button onClick={() => { setSelectedIndex(p => p - 1); playActionCardLeft(); }}
                    className="flex absolute left-0 z-30 items-center justify-center h-full"
                    style={{ background: 'linear-gradient(to right, rgba(100,100,100,0.6), transparent)', width: '80px', padding: 0 }}>
                    <svg width="60" height="450" viewBox="0 0 60 450" className="animate-chevron-left" style={{ opacity: 0.8 }}>
                        <path d="M 50 25 Q 15 225 50 425" stroke="rgba(150,150,150,0.9)" strokeWidth="8" fill="none" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Right chevron */}
                <button onClick={() => { setSelectedIndex(p => p + 1); playActionCardRight(); }}
                    className="flex absolute right-0 z-30 items-center justify-center h-full"
                    style={{ background: 'linear-gradient(to left, rgba(100,100,100,0.6), transparent)', width: '80px', padding: 0 }}>
                    <svg width="60" height="450" viewBox="0 0 60 450" className="animate-chevron-right" style={{ opacity: 0.8 }}>
                        <path d="M 10 25 Q 45 225 10 425" stroke="rgba(150,150,150,0.9)" strokeWidth="8" fill="none" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Card carousel */}
                <div className={`relative w-full flex items-center justify-center perspective-1000 h-[650px] mb-12 ${battlingSkillId ? 'z-50' : ''}`}
                    style={{ cursor: battlingSkillId ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
                    onMouseDown={(e) => handleDragStart(e.clientX)}
                    onMouseMove={(e) => handleDragMove(e.clientX)}
                    onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                    onTouchMove={(e) => { e.preventDefault(); handleDragMove(e.touches[0].clientX); }}
                    onTouchEnd={handleDragEnd}>

                    {getVisibleItems().map((item) => {
                        const isItemBattling = item.offset === 0 && battlingSkillId === item.id;
                        return (
                            <div key={item.key}
                                className="absolute transition-all duration-500 ease-out"
                                style={getCardStyle(item.offset, isItemBattling, !!battlingSkillId)}
                                onClick={() => handleCardClick(item.offset)}>
                                <SkillCard
                                    config={item} data={skills[item.id]} themeData={currentThemeData}
                                    isCenter={item.offset === 0}
                                    isBattling={isItemBattling}
                                    mobName={getMobForSkill(item, skills[item.id])}
                                    mobAura={getAuraForSkill(item, skills[item.id])}
                                    challenge={challengeData} isListening={isListening} spokenText={spokenText}
                                    damageNumbers={damageNumbers.filter(d => d.skillId === item.id)}
                                    onStartBattle={() => startBattle(item.id)} onEndBattle={endBattle}
                                    onMathSubmit={(val) => handleSuccessHit(item.id, val)}
                                    onMicClick={() => toggleMicListener(item.id)}
                                    difficulty={skills[item.id].difficulty || 1}
                                    setDifficulty={(newDiff) => setSkillDifficulty(item.id, newDiff)}
                                    unlockedDifficulty={Math.min(7, Math.floor(skills[item.id].level / 20) + 1)}
                                    selectedBorder={selectedBorder} borderColor={borderColor}
                                    bossHealing={bossHealing === item.id}
                                />
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* ---- Loot box toast ---- */}
            {lootBox && (
                <div className="fixed bottom-8 left-1/2 z-50 animate-toast w-full max-w-2xl pointer-events-none transform -translate-x-1/2">
                    <div className="bg-black/80 border-4 border-yellow-500 rounded-full p-4 px-12 flex items-center justify-between shadow-[0_0_30px_rgba(255,215,0,0.6)] backdrop-blur-md mx-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-500/20 p-3 rounded-full border-2 border-yellow-400">
                                <Gift size={32} className="text-yellow-300 animate-bounce" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl text-yellow-400 font-bold leading-none mb-1">LEVEL {lootBox.level} REACHED!</h2>
                                <p className="text-stone-300 text-sm">{lootBox.skillName}</p>
                            </div>
                        </div>
                        <div className="text-right pl-8 border-l-2 border-stone-600 flex items-center gap-4">
                            <SafeImage src={lootBox.img} alt="Badge" className="w-12 h-12 object-contain" />
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-wider">Unlocked</p>
                                <p className="text-2xl text-green-400 font-bold">{lootBox.item}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {achievementToast && <AchievementToast achievementId={achievementToast.achievementId} tierIndex={achievementToast.tierIndex} />}

            {/* ---- Death overlay ---- */}
            {showDeathOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/60 animate-pulse pointer-events-none">
                    <div className="text-center">
                        <h1 className="text-8xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]" style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000' }}>YOU DIED</h1>
                        <p className="text-2xl text-red-300 mt-4">Level -1</p>
                        <p className="text-lg text-stone-400 mt-2">Take a moment to rest...</p>
                    </div>
                </div>
            )}

            {/* ---- Level restored ---- */}
            {showLevelRestored && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="text-center animate-bounce">
                        <h1 className="text-6xl font-bold text-green-400 drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]" style={{ textShadow: '4px 4px 0 #000' }}>LEVEL RESTORED!</h1>
                        <p className="text-2xl text-yellow-400 mt-4">Welcome back, hero!</p>
                    </div>
                </div>
            )}

            <PhantomEvent
                battlingSkillId={battlingSkillId}
                onAwardLevel={handlePhantomLevelAward}
                onPhantomCaught={handlePhantomCaught}
            />
        </div>
    );
};

export default App;
