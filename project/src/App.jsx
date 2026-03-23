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
import TopLeftControls from './components/layout/TopLeftComponent';
import TopRightControls from './components/layout/TopRightComponent';
import BottomHUD from './components/layout/BottomHUD';
import BattleLayer from './components/layout/BattleLayer';
import { useAppState } from './hooks/useAppState';

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
import { useBattleLogic } from './hooks/useBattleLogic';

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

    const {
      currentProfile,
      profileNames,
      parentStatus,
      skills,
      activeTheme,
      stats,
      playerHealth,

      isMenuOpen,
      isSettingsOpen,
      isCosmeticsOpen,
      isResetOpen,
      isBugReportOpen,
      isFullscreen,

      selectedBorder,
      borderColor,
      bgmVol,
      sfxVol,

      setSkills,
      setActiveTheme,
      setStats,
      setPlayerHealth,

      setIsMenuOpen,
      setIsSettingsOpen,
      setIsCosmeticsOpen,
      setIsResetOpen,
      setIsBugReportOpen,
      setIsFullscreen,

      setSelectedBorder,
      setBorderColor,
      setBgmVol,
      setSfxVol,

      switchProfile,
      renameProfile,
      resetProfile,
      setParentVerified,
      setCurrentProfile,
    } = useAppState();


    const [battlingSkillId,  setBattlingSkillId]  = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null);
    const [challengeData,    setChallengeData]    = useState(null);

    const [achievementToast, setAchievementToast] = useState(null);
    const [isListening,      setIsListening]       = useState(false);
    const [spokenText,       setSpokenText]        = useState('');
    const [selectedIndex,    setSelectedIndex]     = useState(0);
    const [isDragging,       setIsDragging]        = useState(false);
    const [dragStartX,       setDragStartX]        = useState(0);

    // ------------------------------------------------------------------- refs
    const challengeDataRef = useRef(null);
    const damageIdRef      = useRef(0);
    const loginTrackedRef  = useRef(false);
    const bgmManager       = useRef(getBGMManager());

    // ------------------------------------------------------------ persistence

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

    const {
      handleSuccessHit,
      damageNumbers,
      lootBox,
      showDeathOverlay,
      showLevelRestored,
      bossHealing,
      handlePhantomLevelAward,
      handlePhantomCaught,
    } = useBattleLogic({
      skills,
      setSkills,
      stats,
      setStats,
      battlingSkillId,
      setBattlingSkillId,
      setChallengeData,
      battleDifficulty,
      setSpokenText,
      checkAchievements,
    });

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

    // ------------------------------------------------- voice recognition
    const { startVoiceListener, stopVoiceRecognition, toggleMicListener } = useVoiceRecognition({
        challengeDataRef,
        battlingSkillId,
        onCorrect: useCallback((id) => handleSuccessHit(id),         [handleSuccessHit]),   // eslint-disable-line
        onWrong:   useCallback((id) => handleSuccessHit(id, 'WRONG'), [handleSuccessHit]),  // eslint-disable-line
        setIsListening,
        setSpokenText,
    });

    // ----------------------------------------- handleSuccessHit helpers
    // These named helpers are called from inside setSkills' setState callback,
    // keeping the callback body at depth ≤ 2 (callback → helper call).

    /** Apply a killing hit: XP, level-up, badges, mob rotation, new health. */
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

    const handleReset = () => {
      resetProfile(currentProfile);
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

            <TopLeftControls
                setIsMenuOpen={setIsMenuOpen}
                setIsSettingsOpen={setIsSettingsOpen}
                setIsCosmeticsOpen={setIsCosmeticsOpen}
                playClick={playClick}
            />

            <BottomHUD playerHealth={playerHealth} />

            {/* ---- Drawers ---- */}
            {isCosmeticsOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setIsCosmeticsOpen(false); playClick(); }} />}
            <CosmeticsDrawer isOpen={isCosmeticsOpen} activeTheme={activeTheme} setActiveTheme={handleThemeChange}
                selectedBorder={selectedBorder} setSelectedBorder={handleBorderChange}
                borderColor={borderColor} setBorderColor={setBorderColor}
                unlockedBorders={unlockedBorders} unlockedAchievements={unlockedAchievements} />

            {isSettingsOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setIsSettingsOpen(false); playClick(); }} />}
            <SettingsDrawer isOpen={isSettingsOpen} onReset={() => setIsResetOpen(true)}
                bgmVol={bgmVol} setBgmVol={setBgmVol} sfxVol={sfxVol} setSfxVol={setSfxVol}
                currentProfile={currentProfile} onSwitchProfile={switchProfile}
                profileNames={profileNames} onRenameProfile={renameProfile}
                getProfileStats={getProfileStats} parentStatus={parentStatus}
                onParentVerified={setParentVerified} currentSkills={skills} />

            <ResetModal  isOpen={isResetOpen}    onClose={() => setIsResetOpen(false)}    onConfirm={handleReset} />
            <BugReportModal isOpen={isBugReportOpen} onClose={() => setIsBugReportOpen(false)} />

            <TopRightControls
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              setIsMenuOpen={setIsMenuOpen}
              setIsSettingsOpen={setIsSettingsOpen}
              setIsCosmeticsOpen={setIsCosmeticsOpen}
              playClick={playClick}
            />

            {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setIsMenuOpen(false); playClick(); }} />}
            <MenuDrawer isOpen={isMenuOpen} skills={skills} stats={stats} />

            <button onClick={() => { setIsMenuOpen(false); setIsCosmeticsOpen(false); setIsSettingsOpen(false); setIsBugReportOpen(true); playClick(); }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ bottom: '24px', right: '24px' }} data-cy="bug-button">
                <Bug size={48} className="text-red-400" />
            </button>

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
            
            <BattleLayer
                battlingSkillId={battlingSkillId}
                challengeData={challengeData}
                isListening={isListening}
                spokenText={spokenText}
                onEndBattle={endBattle}
            />

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
