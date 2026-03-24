import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Mic, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SafeImage from '../ui/SafeImage';
import MobWithAura from '../ui/MobWithAura';
import ParentalVerificationModal from '../ui/ParentalVerificationModal';
import { BASE_ASSETS, FRIENDLY_MOBS, HOSTILE_MOBS, CHEST_BLOCKS, BOSS_MOBS, MINIBOSS_MOBS, DIFFICULTY_IMAGES, DIFFICULTY_CONTENT, HOMOPHONES } from '../../constants/gameData';
import { playClick, getSfxVolume } from '../../utils/soundManager';
import { calculateXPToLevel, normalizeText } from '../../utils/gameUtils';
import { AURA_ADJECTIVES } from '../../utils/mobDisplayUtils';
import MemoryGame from './game/MemoryGame';
import SimonGame from './game/SimonGame';

const PRESTIGE_LEVEL_THRESHOLD = 20;

// Voice recognition constants
const MIN_SPOKEN_TEXT_LENGTH = 2;
// Tempo constants for pattern recognition
const MAX_TEMPO_DELAY = 800; // Slowest tempo (difficulty 1, round 1)
const MIN_TEMPO_DELAY = 200; // Fastest tempo (difficulty 7, always)

// Map axolotl colors to specific note files for consistent sound feedback
const AXOLOTL_NOTE_MAP = {
    'Pink': 'c4',
    'Cyan': 'd4',
    'Gold': 'e4',
    'Brown': 'f4',
    'Blue': 'g4',
    'Red': 'a4',
    'Green': 'b4',
    'Black': 'g5'
};

// Helper: clamp a value between min and max
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Helper: linearly interpolate between two values
const lerp = (start, end, t) => start + (end - start) * clamp(t, 0, 1);

// Calculate tempo delays based on completed rounds and difficulty
const getTempoDelays = (completedRounds, currentDifficulty) => {
    const round = completedRounds + 1;
    const startingDelay = lerp(MAX_TEMPO_DELAY, MIN_TEMPO_DELAY, (currentDifficulty - 1) / 6);
    const maxRunwayRounds = lerp(10, 1, (currentDifficulty - 1) / 6);
    const runwayProgress = maxRunwayRounds > 1 ? (round - 1) / (maxRunwayRounds - 1) : 1;
    const rawOnDelay = lerp(startingDelay, MIN_TEMPO_DELAY, runwayProgress);
    const onDelay = clamp(rawOnDelay, MIN_TEMPO_DELAY, MAX_TEMPO_DELAY);
    const offDelay = Math.max(100, Math.round(onDelay * 0.35));
    return { onDelay, offDelay };
};

const SkillCard = ({ config, data, themeData, isCenter, isBattling, mobName, mobAura, challenge, isListening, spokenText, damageNumbers, onStartBattle, onEndBattle, onMathSubmit, onMicClick, difficulty, setDifficulty, unlockedDifficulty, selectedBorder, borderColor, bossHealing }) => {
    const { t } = useTranslation();
    const [mathInput, setMathInput] = useState('');
    const [isHit, setIsHit] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [isReadingWrong, setIsReadingWrong] = useState(false);
    const prevDamageCount = useRef(0);
    const inputRef = useRef(null);
    const readingWordRef = useRef(null);
    const prevSpokenTextRef = useRef('');

    const [memoryCards, setMemoryCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [isProcessingMatch, setIsProcessingMatch] = useState(false);
    const [mismatchShake, setMismatchShake] = useState(false);

    const memorySessionStartedRef = useRef(false);

    // Simon Says state for Pattern Recognition
    const [simonSequence, setSimonSequence] = useState([]);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [isShowingSequence, setIsShowingSequence] = useState(false);

    const [showParentalModal, setShowParentalModal] = useState(false);
    const [completedRounds, setCompletedRounds] = useState(0);
    const [litAxolotl, setLitAxolotl] = useState(null);
    const [simonGameActive, setSimonGameActive] = useState(false);

    const simonSessionStartedRef = useRef(false);

    // Helper function to play axolotl-specific note with fallback to click
    const playAxolotlNote = useCallback((color) => {
        const noteName = AXOLOTL_NOTE_MAP[color];
        if (noteName) {
            const audio = new Audio(`assets/sounds/axolotl/${noteName}.wav`);
            audio.volume = getSfxVolume();
            audio.play().catch(() => {
                playClick();
            });
        } else {
            playClick();
        }
    }, []);

    // Handler for when parental verification succeeds for Cleaning skill
    const handleParentalVerified = useCallback(() => {
        setShowParentalModal(false);
        onMathSubmit(config.id, challenge?.answer);
    }, [onMathSubmit, challenge, config.id]);

    // Calculate HP percentage based on mobHealth/mobMaxHealth for HP bar display
    const mobHealth = data.mobHealth || 100;
    const mobMaxHealth = data.mobMaxHealth || 100;
    const hpPercent = Math.round((mobHealth / mobMaxHealth) * 100);

    let borderClass = 'border-stone-500';
    let levelTextColor = 'text-white';
    if (data.level >= 20) { levelTextColor = 'text-amber-700'; borderClass = 'border-wood'; }
    if (data.level >= 40) { levelTextColor = 'text-stone-400'; borderClass = 'border-stone'; }
    if (data.level >= 60) { levelTextColor = 'text-yellow-400'; borderClass = 'border-gold'; }
    if (data.level >= 80) { levelTextColor = 'text-gray-200'; borderClass = 'border-iron'; }
    if (data.level >= 100) { levelTextColor = 'text-emerald-400'; borderClass = 'border-emerald'; }
    if (data.level >= 120) { levelTextColor = 'text-cyan-300'; borderClass = 'border-diamond'; }
    if (data.level >= 140) { levelTextColor = 'text-gray-500'; borderClass = 'border-netherite'; }
    if (data.level >= 160) { levelTextColor = 'text-rainbow'; borderClass = 'border-netherite'; }

    // Apply selected border effect if this is the center card
    let appliedBorderEffect = '';
    let borderStyle = {};
    if (isCenter && selectedBorder) {
        if (selectedBorder === 'solid' || selectedBorder === 'solid-picker') {
            appliedBorderEffect = '';
            const effectiveColor = selectedBorder === 'solid' ? '#FFD700' : (borderColor || '#FFD700');
            borderStyle = {
                borderColor: effectiveColor,
                boxShadow: `0 0 20px ${effectiveColor}, 0 0 40px ${effectiveColor}`
            };
        } else {
            appliedBorderEffect = `border-effect-${selectedBorder}`;
            if (selectedBorder === 'gradient' || selectedBorder === 'sparkle') {
                borderStyle = { '--border-color': borderColor || '#FFD700' };
            }
        }
    }

    const skillThemeConfig = themeData.skills[config.id] || {};
    const skillName = skillThemeConfig.name || t(`skills.${config.id}.name`, { defaultValue: config.name });

    // Translated skill text (fallback to config values)
    const fantasyName = t(`skills.${config.id}.fantasyName`, { defaultValue: config.fantasyName });
    const taskDescription = t(`skills.${config.id}.taskDescription`, { defaultValue: config.taskDescription });
    const actionName = t(`skills.${config.id}.actionName`, { defaultValue: config.actionName });

    // Determine valid mob source and display name based on skill type
    let mobSrc;
    const mobKey = mobName?.toLowerCase().replace(/ /g, '_');
    let displayMobName = t(`mobs.${mobKey}`, { defaultValue: mobName });

    if (config.id === 'memory') {
        mobSrc = 'assets/skills/farm_icon.png';
    } else if (config.id === 'cleaning') {
        mobSrc = CHEST_BLOCKS[mobName] || themeData.assets.mobs[mobName] || BASE_ASSETS.axolotls.Pink;
    } else if (config.id === 'patterns') {
        mobSrc = HOSTILE_MOBS[mobName] || BOSS_MOBS[mobName] || MINIBOSS_MOBS[mobName] || themeData.assets.mobs[mobName];
        if (!mobSrc) {
            displayMobName = t('mobs.zombie', { defaultValue: 'Zombie' });
            mobSrc = HOSTILE_MOBS['Zombie'] || BASE_ASSETS.axolotls.Pink;
        }
    } else {
        mobSrc = HOSTILE_MOBS[mobName] || BOSS_MOBS[mobName] || MINIBOSS_MOBS[mobName] || themeData.assets.mobs[mobName];
        if (!mobSrc) {
            displayMobName = t('mobs.zombie', { defaultValue: 'Zombie' });
            mobSrc = HOSTILE_MOBS['Zombie'] || BASE_ASSETS.axolotls.Pink;
        }
    }

    // Add aura adjective to mob name when battling
    const displayMobNameWithAura = isBattling && mobAura && AURA_ADJECTIVES[mobAura]
        ? `${AURA_ADJECTIVES[mobAura]} ${displayMobName}`
        : displayMobName;

    const mobSize = '100%';
    const gemStyle = {};

    // Extract button colors from config.colorStyle to match card background
    const getButtonStyle = () => {
        const gradientMatch = config.colorStyle?.background?.match(/#([a-fA-F0-9]{6})/g);
        if (gradientMatch && gradientMatch.length >= 2) {
            const fromColor = gradientMatch[0];
            const toColor = gradientMatch[1];
            const darkenColor = (hex) => {
                const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40);
                const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40);
                const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40);
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            };
            const shadowColor = darkenColor(toColor);
            return {
                background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
                boxShadow: `0 6px 0 ${shadowColor}`,
                borderColor: fromColor
            };
        }
        return {
            background: 'linear-gradient(to bottom, #7e22ce, #581c87)',
            boxShadow: '0 6px 0 #581c87',
            borderColor: '#a855f7'
        };
    };

    const buttonStyle = getButtonStyle();

    const playMismatch = () => {
        const audio = new Audio(BASE_ASSETS.audio.mismatch);
        audio.volume = getSfxVolume();
        audio.play().catch(() => {});
    };

    useEffect(() => { setMathInput(''); }, [challenge]);

    // Memory game config based on difficulty
    const memoryConfig = DIFFICULTY_CONTENT.memory[difficulty] || DIFFICULTY_CONTENT.memory[1];
    const memoryPairs = memoryConfig.pairs || 3;
    const memoryGridCols = memoryConfig.gridCols || 4;

    useEffect(() => {
        if (isBattling && config.id === 'memory' && !memorySessionStartedRef.current) {
            memorySessionStartedRef.current = true;
            const allMobKeys = Object.keys(FRIENDLY_MOBS);
            const shuffledMobs = [...allMobKeys].sort(() => Math.random() - 0.5);
            const selectedMobs = shuffledMobs.slice(0, memoryPairs);
            let deck = [...selectedMobs, ...selectedMobs].sort(() => Math.random() - 0.5);
            setMemoryCards(deck.map((mobKey, i) => ({ id: i, color: mobKey, img: FRIENDLY_MOBS[mobKey] })));
            setFlippedIndices([]); setMatchedPairs([]); setIsProcessingMatch(false); setMismatchShake(false);
        } else if (!isBattling && config.id === 'memory') {
            memorySessionStartedRef.current = false;
            setMemoryCards([]);
            setFlippedIndices([]); setMatchedPairs([]); setIsProcessingMatch(false); setMismatchShake(false);
        }
    }, [isBattling, config.id, memoryPairs]);

    useEffect(() => {
        if (damageNumbers.length > prevDamageCount.current) { setIsHit(true); setTimeout(() => setIsHit(false), 400); }
        prevDamageCount.current = damageNumbers.length;
    }, [damageNumbers]);

    // Detect wrong reading answer based on spoken text changes
    useEffect(() => {
        if (config.challengeType === 'reading' && isBattling && spokenText && spokenText !== 'Listening...' && spokenText !== 'Mic Off') {
            if (spokenText !== prevSpokenTextRef.current) {
                if (challenge?.answer) {
                    const homophones = HOMOPHONES[challenge.answer];
                    const isCorrect = normalizeText(spokenText) === normalizeText(challenge.answer) || (homophones && homophones.includes(spokenText));
                    if (!isCorrect && spokenText.length >= MIN_SPOKEN_TEXT_LENGTH) {
                        setIsReadingWrong(true);
                        setTimeout(() => setIsReadingWrong(false), 500);
                    }
                }
                prevSpokenTextRef.current = spokenText;
            }
        }
    }, [spokenText, config.challengeType, isBattling, challenge?.answer]);

    // Pattern config based on difficulty
    const patternConfig = DIFFICULTY_CONTENT.patterns[difficulty] || DIFFICULTY_CONTENT.patterns[1];
    const axolotlCount = patternConfig.axolotlCount || 2;
    const shouldResetSequence = patternConfig.resetSequence || false;

    const axolotlColors = useMemo(() => {
        const allAxolotlColors = Object.keys(BASE_ASSETS.axolotls);
        return allAxolotlColors.slice(0, Math.min(axolotlCount, allAxolotlColors.length));
    }, [axolotlCount]);

    const playSequence = useCallback((sequence) => {
        setIsShowingSequence(true);
        setPlayerIndex(0);
        let i = 0;
        const { onDelay, offDelay } = getTempoDelays(completedRounds, difficulty);

        const playNext = () => {
            if (i < sequence.length) {
                setLitAxolotl(sequence[i]);
                playAxolotlNote(sequence[i]);
                setTimeout(() => {
                    setLitAxolotl(null);
                    i++;
                    setTimeout(playNext, offDelay);
                }, onDelay);
            } else {
                setIsShowingSequence(false);
            }
        };
        setTimeout(playNext, 500);
    }, [completedRounds, difficulty, playAxolotlNote]);

    const startSimonGame = useCallback(() => {
        const firstColor = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
        const newSequence = [firstColor];
        setSimonSequence(newSequence);
        setPlayerIndex(0);
        setCompletedRounds(0);
        setSimonGameActive(true);
        playSequence(newSequence);
    }, [axolotlColors, playSequence]);

    const handleAxolotlClick = (color) => {
        if (isShowingSequence || !simonGameActive) return;

        playAxolotlNote(color);

        if (color === simonSequence[playerIndex]) {
            if (playerIndex === simonSequence.length - 1) {
                const matchAudio = new Audio(BASE_ASSETS.audio.match);
                matchAudio.volume = getSfxVolume();
                matchAudio.play().catch(() => {});
                const newRounds = completedRounds + 1;
                setCompletedRounds(newRounds);

                const damage = Math.round(newRounds * 1.5);
                setTimeout(() => {
                    onMathSubmit(config.id,"WIN");
                }, 300);

                let newSequence;
                if (shouldResetSequence) {
                    newSequence = [];
                    for (let i = 0; i < simonSequence.length + 1; i++) {
                        newSequence.push(axolotlColors[Math.floor(Math.random() * axolotlColors.length)]);
                    }
                } else {
                    const nextColor = axolotlColors[Math.floor(Math.random() * axolotlColors.length)];
                    newSequence = [...simonSequence, nextColor];
                }

                setSimonSequence(newSequence);
                setPlayerIndex(0);
                setTimeout(() => playSequence(newSequence), 800);
            } else {
                setPlayerIndex(playerIndex + 1);
            }
        } else {
            const mismatchAudio = new Audio(BASE_ASSETS.audio.mismatch);
            mismatchAudio.volume = getSfxVolume();
            mismatchAudio.play().catch(() => {});
            setSimonGameActive(false);
        }
    };

    useEffect(() => {
        if (isBattling && config.id === 'patterns' && !simonSessionStartedRef.current) {
            simonSessionStartedRef.current = true;
            startSimonGame();
        } else if (!isBattling && config.id === 'patterns') {
            simonSessionStartedRef.current = false;
            setSimonSequence([]);
            setPlayerIndex(0);
            setIsShowingSequence(false);
            setCompletedRounds(0);
            setLitAxolotl(null);
            setSimonGameActive(false);
        }
    }, [isBattling, config.id, startSimonGame]);

    const handleCardClick = (index) => {
        if (isProcessingMatch || flippedIndices.includes(index) || matchedPairs.includes(memoryCards[index].color)) return;
        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);
        playClick();

        if (newFlipped.length === 2) {
            setIsProcessingMatch(true);
            setTimeout(() => {
                if (memoryCards[newFlipped[0]].color === memoryCards[newFlipped[1]].color) {
                    const matchAudio = new Audio(BASE_ASSETS.audio.match);
                    matchAudio.volume = getSfxVolume();
                    matchAudio.play().catch(() => {});
                    const newMatched = [...matchedPairs, memoryCards[newFlipped[0]].color];
                    setMatchedPairs(newMatched); setFlippedIndices([]); setIsProcessingMatch(false);
                    if (newMatched.length === memoryPairs) setTimeout(() => onMathSubmit(config.id, "WIN"), 500);
                } else {
                    const mismatchAudio = new Audio(BASE_ASSETS.audio.mismatch);
                    mismatchAudio.volume = getSfxVolume();
                    mismatchAudio.play().catch(() => {});
                    setMismatchShake(true);
                    setTimeout(() => { setMismatchShake(false); setFlippedIndices([]); setIsProcessingMatch(false); }, 500);
                }
            }, 300);
        }
    };

    // Resolve displayed spoken text (keep internal English values for comparisons)
    const displaySpokenText = spokenText === 'Listening...'
        ? t('mic.listening')
        : spokenText === 'Mic Off'
            ? t('mic.off')
            : spokenText;

    const showMob = !isBattling || config.id !== 'memory';
    const topSectionBaseClass = config.id === 'memory' && isBattling ? 'hidden' : 'h-[55%] relative flex items-center justify-center overflow-hidden rounded-t-sm';
    const bottomSectionClass = config.id === 'memory' && isBattling ? 'h-full bg-[#3a3a3a] p-4 flex flex-col relative rounded-lg' : 'flex-1 bg-[#3a3a3a] p-4 flex flex-col relative rounded-b-sm';

    const isBattlingCenter = isBattling && isCenter;

    const cardContent = (
        <div
            className={`bg-[#2b2b2b] border-4 rounded-lg overflow-visible flex flex-col transition-all duration-500 ${isCenter ? `${appliedBorderEffect} ${!appliedBorderEffect ? borderClass : ''}` : 'border-stone-700'} w-[300px] h-[600px] ${!isBattlingCenter ? 'relative' : ''}`}
            style={isCenter ? borderStyle : {}}
        >
            {isCenter && data.level >= PRESTIGE_LEVEL_THRESHOLD && <div className="gem-socket"><div className="gem-stone" style={gemStyle}></div></div>}
            <div className={topSectionBaseClass} style={config.colorStyle}>
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {!isBattling && <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white border border-white/20 z-20"><div className="text-xs text-gray-400 uppercase">{skillName}</div><div className="text-lg leading-none">{fantasyName}</div></div>}
                {!isBattling && <div className="absolute top-2 right-2 z-20"><div className={`bg-black/60 px-3 py-1 rounded border border-white/20 text-3xl font-bold ${levelTextColor}`}>{t('battle.lvl')} {data.level}</div></div>}
                {showMob && <div className="relative z-10 flex items-center justify-center h-full max-h-[200px] w-full">
                    {mobAura ? (
                        <MobWithAura
                            mobSrc={mobSrc}
                            aura={mobAura}
                            displayName={displayMobNameWithAura}
                            size={mobSize}
                            isHit={isHit}
                            bossHealing={bossHealing}
                        />
                    ) : (
                        <SafeImage
                            key={displayMobName}
                            src={mobSrc}
                            alt={displayMobName}
                            className={`
                                relative z-10
                                max-w-full max-h-full
                                object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-transform duration-100
                                ${isHit ? 'animate-knockback' : bossHealing ? 'animate-shake' : 'animate-bob'}
                                ${bossHealing ? 'brightness-150 hue-rotate-90' : ''}
                            `}
                        />
                    )}
                    {damageNumbers.map(dmg => (
                        <div
                            key={dmg.id}
                            className="absolute text-5xl font-bold text-red-500 animate-bounce pointer-events-none whitespace-nowrap"
                            style={{ left: `calc(50% + ${dmg.x}px)`, top: `calc(50% + ${dmg.y}px)`, textShadow: '2px 2px 0 #000' }}
                        >
                            -{dmg.val}
                        </div>
                    ))}
                </div>}
                {config.id !== 'memory' && !isBattling && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-2 rounded-full text-white border-2 border-white/30 text-xl font-bold tracking-wide z-10 shadow-lg whitespace-nowrap min-w-max">{displayMobName}</div>}
            </div>
            {(!isBattling || config.id !== 'memory') && <div className="bg-[#1a1a1a] p-2 border-t-4 border-b-4 border-black relative"><div className="flex justify-between text-gray-400 text-xs mb-1 uppercase"><span>{t('battle.hp')}</span><span>{hpPercent}%</span></div><div className="w-full h-6 bg-[#333] rounded-full overflow-hidden border-2 border-[#555] relative"><div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-200" style={{ width: `${hpPercent}%` }}></div></div></div>}
            <div className={bottomSectionClass}>
                {isBattling ? (
                    <div className="flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">
                        {config.id === 'memory' ? (
                            <MemoryGame
                                memoryCards={memoryCards}
                                flippedIndices={flippedIndices}
                                matchedPairs={matchedPairs}
                                mismatchShake={mismatchShake}
                                memoryGridCols={memoryGridCols}
                                handleCardClick={handleCardClick}
                                themeData={themeData}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {config.id === 'patterns' ? (
                                        <SimonGame
                                            axolotlColors={axolotlColors}
                                            litAxolotl={litAxolotl}
                                            handleAxolotlClick={handleAxolotlClick}
                                            isShowingSequence={isShowingSequence}
                                            completedRounds={completedRounds}
                                            startSimonGame={startSimonGame}
                                            t={t}
                                        />
                                    ) : (
                                    <>
                                        <div className={`flex-1 bg-black/40 rounded border-2 flex items-center justify-center mb-3 p-2 relative overflow-hidden w-full ${isReadingWrong ? 'border-red-500 bg-red-900/30 animate-shake' : 'border-[#555]'}`}>
                                            {config.challengeType === 'writing' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    {challenge?.images?.map((img, idx) => (
                                                        <React.Fragment key={idx}>
                                                            {idx > 0 && <span className="text-3xl text-yellow-400 font-bold">+</span>}
                                                            <SafeImage src={img} className="w-24 h-24 object-contain animate-bob" />
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            ) : (() => {
                                                const word = challenge?.question.replace('Write: ', '') || '';
                                                return (
                                                    <span
                                                        ref={readingWordRef}
                                                        className="text-white font-bold tracking-wider px-2"
                                                        style={{
                                                            fontSize: 'clamp(1rem, 8vw, 2.5rem)',
                                                            maxWidth: '100%',
                                                            wordBreak: 'break-word',
                                                            textAlign: 'center',
                                                            lineHeight: '1.2'
                                                        }}
                                                    >
                                                        {word}
                                                    </span>
                                                );
                                            })()}
                                            {config.challengeType === 'reading' && <div className={`absolute bottom-1 text-xs ${isReadingWrong ? 'text-red-400' : 'text-gray-400'}`}>{displaySpokenText || (isListening ? t('mic.listening') : t('mic.off'))}</div>}
                                        </div>
                                        {config.challengeType === 'math' && <div className="relative w-full flex justify-center"><input ref={inputRef} type="text" inputMode="numeric" pattern="[0-9]*" value={mathInput} onChange={(e) => { const val = e.target.value.replace(/[^0-9-]/g, ''); setMathInput(val); if (val === String(challenge?.answer)) { onMathSubmit(config.id, val); setMathInput(''); } else if (val.length === String(challenge?.answer).length) { setIsWrong(true); playMismatch(); onMathSubmit(config.id, 'WRONG'); setTimeout(() => { setIsWrong(false); setMathInput(''); setTimeout(() => inputRef.current?.focus(), 10); }, 500); } }} className="absolute inset-0 opacity-0 cursor-pointer" autoFocus maxLength={String(challenge?.answer).length} disabled={isWrong} /><div className={`flex gap-2 ${isWrong ? 'animate-shake' : ''}`}>{String(challenge?.answer).split('').map((char, i) => (<div key={i} className={`w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : (i < mathInput.length ? 'border-green-500' : 'border-gray-600')}`}>{mathInput[i] || ''}</div>))}</div></div>}
                                        {config.challengeType === 'writing' && <div className="relative w-full flex justify-center"><input ref={inputRef} type="text" value={mathInput} onChange={(e) => { const val = e.target.value.toUpperCase().replace(/\s/g, ''); setMathInput(val); const answerNoSpaces = challenge?.answer.replace(/\s/g, ''); if (val === answerNoSpaces) { onMathSubmit(config.id, val); setMathInput(''); } else if (val.length === answerNoSpaces.length) { setIsWrong(true); playMismatch(); setTimeout(() => { setIsWrong(false); setMathInput(''); setTimeout(() => inputRef.current?.focus(), 10); }, 500); } }} className="absolute inset-0 opacity-0 cursor-pointer" autoFocus maxLength={challenge?.answer.replace(/\s/g, '').length} disabled={isWrong} /><div className={`flex gap-1 flex-wrap justify-center ${isWrong ? 'animate-shake' : ''}`}>{(() => {
                                            const answerNoSpaces = challenge?.answer.replace(/\s/g, '');
                                            const answerLength = answerNoSpaces.length;
                                            return challenge?.answer.split('').map((char, i) => {
                                                if (char === ' ') {
                                                    return <div key={i} className={`${answerLength > 6 ? 'w-7' : 'w-10'}`}></div>;
                                                }
                                                let inputIndex = 0;
                                                for (let j = 0; j < i; j++) {
                                                    if (challenge?.answer[j] !== ' ') {
                                                        inputIndex++;
                                                    }
                                                }
                                                return (
                                                    <div key={i} className={`${answerLength > 6 ? 'w-7 h-9 text-lg' : 'w-10 h-12 text-2xl'} border-b-4 flex items-center justify-center font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : (inputIndex < mathInput.length ? 'border-green-500' : 'border-gray-600')}`}>
                                                        {mathInput[inputIndex] || ''}
                                                    </div>
                                                );
                                            });
                                        })()}</div></div>}
                                        {config.challengeType === 'reading' && <button onClick={() => onMicClick(config.id)} className={`w-full text-center p-2 rounded border-2 transition-colors flex items-center justify-center gap-2 ${isListening ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:bg-white/10'}`}>{isListening ? <Mic className="inline animate-pulse text-red-500" /> : <><Mic className="inline text-gray-500" /><span className="text-xs uppercase font-bold text-stone-400">{t('skill_card.tap_to_speak')}</span></>}</button>}
                                        {config.challengeType === 'cleaning' && <button onClick={() => setShowParentalModal(true)} className="w-full bg-green-600 hover:bg-green-500 text-white text-3xl font-bold py-4 rounded shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-[4px] transition-all">{t('skill_card.complete')}</button>}
                                        {config.challengeType !== 'cleaning' && config.challengeType !== 'writing' && config.challengeType !== 'math' && <button onClick={() => onMathSubmit(config.id, challenge?.answer)} className="mt-auto text-xs text-gray-500 underline hover:text-white self-center">{t('skill_card.skip_manual_success')}</button>}
                                    </>
                                )}
                            </div>
                        )}
                        {/* Current XP indicator - visible during battle */}
                        {(() => {
                            const xpToLevel = calculateXPToLevel(difficulty, data.level);
                            const xpPercent = Math.min(100, (data.xp / xpToLevel) * 100);
                            return (
                                <div className="mt-2 bg-[#1a1a1a] p-2 rounded border border-[#333]">
                                    <div className="flex justify-between text-gray-400 text-xs mb-1 uppercase">
                                        <span>{t('battle.xp')}</span>
                                        <span>{data.xp} / {xpToLevel}</span>
                                    </div>
                                    <div className="w-full h-4 bg-[#333] rounded-full overflow-hidden border border-[#555] relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
                                            style={{ width: `${xpPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <p className="text-gray-400 text-center mb-4 px-2">{taskDescription}</p>
                        <button onClick={() => onStartBattle(config.id)} data-cy="battle-button" style={buttonStyle} className={`w-full text-white text-3xl font-bold py-6 rounded-lg active:shadow-none active:translate-y-[6px] transition-all border-2 uppercase tracking-wider`}>
                            {actionName}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (isBattlingCenter) {
        return (
            <>
                {ReactDOM.createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onClick={onEndBattle}
                    >
                        <div className="flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
                            {/* Battle Card - Centered */}
                            <div
                                style={{
                                    transform: 'scale(1.5)',
                                    transformOrigin: 'center center',
                                }}
                            >
                                {cardContent}
                            </div>
                            {/* Battle Info Side Panel */}
                            {(!['memory', 'cleaning'].includes(config.id)) && (
                                <div
                                    className="absolute left-[calc(50%+225px+30px)] top-0"
                                    style={{
                                        transform: 'scale(1.5)',
                                        transformOrigin: 'left top',
                                    }}
                                >
                                    <div
                                        className="relative w-[175px] bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-50 border-4 border-amber-800 rounded-lg overflow-hidden"
                                        style={{
                                            boxShadow: '0 0 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(251,191,36,0.3)',
                                        }}
                                    >
                                        {/* Decorative corner accents */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-700"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-700"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-700"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-700"></div>

                                        {/* Header */}
                                        <div className="bg-gradient-to-b from-red-700 to-red-800 p-2 border-b-4 border-amber-900 relative">
                                            <div className="text-yellow-300 text-sm font-black uppercase tracking-wider text-center" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
                                                {t('battle.battle_header')}
                                            </div>
                                            <div className="absolute top-1 left-2 w-2 h-2 bg-amber-900 rounded-full border border-amber-950"></div>
                                            <div className="absolute top-1 right-2 w-2 h-2 bg-amber-900 rounded-full border border-amber-950"></div>
                                        </div>

                                        {/* Info sections */}
                                        <div className="p-2 space-y-1.5">
                                            {/* Enemy Name */}
                                            <div className="bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                <div className="text-[8px] text-amber-900 uppercase font-bold tracking-wide">{t('battle.target')}</div>
                                                <div className="text-stone-900 font-black text-sm leading-tight">{displayMobNameWithAura}</div>
                                            </div>

                                            {/* Skill and Level in a row */}
                                            <div className="flex gap-1.5">
                                                <div className="flex-1 bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                    <div className="text-[8px] text-amber-900 uppercase font-bold">{t('battle.skill_label')}</div>
                                                    <div className="text-stone-900 font-bold text-xs leading-tight">{skillName}</div>
                                                </div>
                                                <div className="flex-1 bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                    <div className="text-[8px] text-amber-900 uppercase font-bold">{t('battle.level_label')}</div>
                                                    <div className={`font-black text-base leading-tight ${levelTextColor}`} style={{
                                                        WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
                                                        filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
                                                    }}>
                                                        {data.level}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quest/Task */}
                                            <div className="bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
                                                <div className="text-[8px] text-amber-900 uppercase font-bold mb-0.5">{t('battle.quest')}</div>
                                                <div className="text-stone-800 text-[10px] leading-snug italic font-medium">
                                                    {taskDescription}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom stamp */}
                                        <div className="bg-gradient-to-t from-amber-900 to-amber-800 p-1 border-t-4 border-amber-950">
                                            <div className="text-center text-yellow-200 text-[8px] font-bold uppercase tracking-widest">
                                                {fantasyName}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
                <ParentalVerificationModal
                    isOpen={showParentalModal}
                    onClose={() => setShowParentalModal(false)}
                    onVerified={handleParentalVerified}
                />
            </>
        );
    }

    return (
        <div className="relative">
            {cardContent}
            <ParentalVerificationModal
                isOpen={showParentalModal}
                onClose={() => setShowParentalModal(false)}
                onVerified={handleParentalVerified}
            />
        </div>
    );
};

export default React.memo(SkillCard);
