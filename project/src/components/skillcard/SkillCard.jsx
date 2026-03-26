import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import ParentalVerificationModal from '../ui/ParentalVerificationModal';
import { BASE_ASSETS, HOSTILE_MOBS, CHEST_BLOCKS, BOSS_MOBS, MINIBOSS_MOBS, DIFFICULTY_CONTENT, HOMOPHONES } from '../../constants/gameData';
import { getSfxVolume } from '../../utils/soundManager';
import { calculateXPToLevel, normalizeText } from '../../utils/gameUtils';
import { AURA_ADJECTIVES } from '../../utils/mobDisplayUtils';
import { useSkillGame } from './useSkillGame';
import BattleInfoPanel from './BattleInfoPanel';
import TopSection from './TopSection';
import HPBar from './HPBar';
import XPBar from './XPBar';
import GameSection from './GameSection';
import BattlePortal from './BattlePortal';
import CleaningGame from './game/CleaningGame';

const PRESTIGE_LEVEL_THRESHOLD = 20;
const MIN_SPOKEN_TEXT_LENGTH = 2;

const SkillCard = ({ config, data, themeData, isCenter, isBattling, mobName, mobAura, challenge, isListening, spokenText, damageNumbers, onStartBattle, onEndBattle, onMathSubmit, onMicClick, difficulty, setDifficulty, unlockedDifficulty, selectedBorder, borderColor, bossHealing }) => {
    const game = useSkillGame({
      config,
      challenge,
      difficulty,
      isBattling,
      onMathSubmit
    });  
    const { t } = useTranslation();
    const [isHit, setIsHit] = useState(false);
    const [isReadingWrong, setIsReadingWrong] = useState(false);
    const prevDamageCount = useRef(0);
    const inputRef = useRef(null);
    const readingWordRef = useRef(null);
    const prevSpokenTextRef = useRef('');

    const [showParentalModal, setShowParentalModal] = useState(false);

    const safeData = data ?? {
      level: 1,
      xp: 0,
      mobHealth: 100,
      mobMaxHealth: 100
    };
    const handleStartBattle = useCallback(() => {
      onStartBattle(config.id);
    }, [onStartBattle, config.id]);

    // Handler for when parental verification succeeds for Cleaning skill
    const handleParentalVerified = useCallback(() => {
        setShowParentalModal(false);
        onMathSubmit(config.id, challenge?.answer);
    }, [onMathSubmit, challenge, config.id]);

    // Calculate HP percentage based on mobHealth/mobMaxHealth for HP bar display
    const mobHealth = safeData.mobHealth || 100;
    const mobMaxHealth = safeData.mobMaxHealth || 100;
    const hpPercent = useMemo(
      () => Math.round((mobHealth / mobMaxHealth) * 100),
      [mobHealth, mobMaxHealth]
    ); 
    const xpToLevel = useMemo(
      () => calculateXPToLevel(difficulty, safeData.level),
      [difficulty, safeData?.level]
    );

    const { borderClass, levelTextColor } = useMemo(() => {
      if (safeData.level >= 160) return { levelTextColor: 'text-rainbow', borderClass: 'border-netherite' };
      if (safeData.level >= 140) return { levelTextColor: 'text-gray-500', borderClass: 'border-netherite' };
      if (safeData.level >= 120) return { levelTextColor: 'text-cyan-300', borderClass: 'border-diamond' };
      if (safeData.level >= 100) return { levelTextColor: 'text-emerald-400', borderClass: 'border-emerald' };
      if (safeData.level >= 80) return { levelTextColor: 'text-gray-200', borderClass: 'border-iron' };
      if (safeData.level >= 60) return { levelTextColor: 'text-yellow-400', borderClass: 'border-gold' };
      if (safeData.level >= 40) return { levelTextColor: 'text-stone-400', borderClass: 'border-stone' };
      if (safeData.level >= 20) return { levelTextColor: 'text-amber-700', borderClass: 'border-wood' };

      return { levelTextColor: 'text-white', borderClass: 'border-stone-500' };
    }, [safeData.level]);

    // Apply selected border effect if this is the center card
    const { appliedBorderEffect, borderStyle } = useMemo(() => {
      if (!isCenter || !selectedBorder) {
        return { appliedBorderEffect: '', borderStyle: {} };
      }
    
      if (selectedBorder === 'solid' || selectedBorder === 'solid-picker') {
        const effectiveColor =
          selectedBorder === 'solid' ? '#FFD700' : (borderColor || '#FFD700');
      
        return {
          appliedBorderEffect: '',
          borderStyle: {
            borderColor: effectiveColor,
            boxShadow: `0 0 20px ${effectiveColor}, 0 0 40px ${effectiveColor}`
          }
        };
      }
    
      return {
        appliedBorderEffect: `border-effect-${selectedBorder}`,
        borderStyle:
          selectedBorder === 'gradient' || selectedBorder === 'sparkle'
            ? { '--border-color': borderColor || '#FFD700' }
            : {}
      };
    }, [isCenter, selectedBorder, borderColor]);

    const skillThemeConfig = themeData.skills[config.id] || {};
    const skillName = skillThemeConfig.name || t(`skills.${config.id}.name`, { defaultValue: config.name });

    // Translated skill text (fallback to config values)
    const fantasyName = t(`skills.${config.id}.fantasyName`, { defaultValue: config.fantasyName });
    const taskDescription = t(`skills.${config.id}.taskDescription`, { defaultValue: config.taskDescription });
    const actionName = t(`skills.${config.id}.actionName`, { defaultValue: config.actionName });

    const { mobSrc, displayMobName } = useMemo(() => {
      const mobKey = mobName?.toLowerCase().replace(/ /g, '_');
      let name = t(`mobs.${mobKey}`, { defaultValue: mobName });
    
      let src;
    
      if (config.id === 'memory') {
        src = 'assets/skills/farm_icon.png';
      } else if (config.id === 'cleaning') {
        src = CHEST_BLOCKS[mobName] || themeData.assets.mobs[mobName] || BASE_ASSETS.axolotls.Pink;
      } else {
        src =
          HOSTILE_MOBS[mobName] ||
          BOSS_MOBS[mobName] ||
          MINIBOSS_MOBS[mobName] ||
          themeData.assets.mobs[mobName];
      
        if (!src) {
          name = t('mobs.zombie', { defaultValue: 'Zombie' });
          src = HOSTILE_MOBS['Zombie'] || BASE_ASSETS.axolotls.Pink;
        }
      }
    
      return { mobSrc: src, displayMobName: name };
    }, [config.id, mobName, themeData, t]);

    // Add aura adjective to mob name when battling
    const displayMobNameWithAura = isBattling && mobAura && AURA_ADJECTIVES[mobAura]
        ? `${AURA_ADJECTIVES[mobAura]} ${displayMobName}`
        : displayMobName;

    const mobSize = '100%';
    const gemStyle = {};

    const buttonStyle = useMemo(() => {
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
        
          return {
            background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
            boxShadow: `0 6px 0 ${darkenColor(toColor)}`,
            borderColor: fromColor
          };
        }
      
        return {
          background: 'linear-gradient(to bottom, #7e22ce, #581c87)',
          boxShadow: '0 6px 0 #581c87',
          borderColor: '#a855f7'
        };
      }, [config.colorStyle]);

    const playMismatch = useCallback(() => {
      const audio = new Audio(BASE_ASSETS.audio.mismatch);
      audio.volume = getSfxVolume();
      audio.play().catch(() => {});
    }, []);

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

    // Resolve displayed spoken text (keep internal English values for comparisons)
    const displaySpokenText = spokenText === 'Listening...'
        ? t('mic.listening')
        : spokenText === 'Mic Off'
            ? t('mic.off')
            : spokenText;

    const showMob = !isBattling || config.id !== 'memory';
    const bottomSectionClass = config.id === 'memory' && isBattling ? 'h-full bg-[#3a3a3a] p-4 flex flex-col relative rounded-lg' : 'flex-1 bg-[#3a3a3a] p-4 flex flex-col relative rounded-b-sm';

    const isBattlingCenter = isBattling && isCenter;

const cardContent = (
  <div
    data-testid={`skill-card-${config.id}`}
    className={`bg-[#2b2b2b] border-4 rounded-lg overflow-visible flex flex-col transition-all duration-500 ${
      isCenter
        ? `${appliedBorderEffect} ${!appliedBorderEffect ? borderClass : ''}`
        : 'border-stone-700'
    } w-[300px] h-[600px] ${!isBattlingCenter ? 'relative' : ''}`}
    style={isCenter ? borderStyle : {}}
  >
    {/* Prestige gem */}
    {isCenter && safeData.level >= PRESTIGE_LEVEL_THRESHOLD && (
      <div className="gem-socket">
        <div className="gem-stone" style={gemStyle}></div>
      </div>
    )}

    {/* ================= TOP SECTION ================= */}
    <TopSection
      isBattling={isBattling}
      configId={config.id}
      colorStyle={config.colorStyle}
      skillName={skillName}
      fantasyName={fantasyName}
      level={safeData.level}
      levelTextColor={levelTextColor}
      showMob={showMob}
      mobAura={mobAura}
      mobSrc={mobSrc}
      displayMobName={displayMobName}
      displayMobNameWithAura={displayMobNameWithAura}
      mobSize={mobSize}
      isHit={isHit}
      bossHealing={bossHealing}
      damageNumbers={damageNumbers}
      t={t}
    />

    {/* ================= HP BAR ================= */}
    {(!isBattling || config.id !== 'memory') && (
      <HPBar hpPercent={hpPercent} t={t} />
    )}

    {/* ================= BOTTOM SECTION ================= */}
    <div className={bottomSectionClass}>
      {isBattling && challenge ? (
        <div className="flex flex-col h-full animate-in slide-in-from-bottom-10 duration-300">

          {/* GAME SWITCH */}
           <GameSection
            config={config}
            challenge={challenge}
            game={game}
            themeData={themeData}
            inputRef={inputRef}
            readingWordRef={readingWordRef}
            isReadingWrong={isReadingWrong}
            onMathSubmit={onMathSubmit}
            onMicClick={onMicClick}
            isListening={isListening}
            displaySpokenText={displaySpokenText}
            t={t}
            playMismatch={playMismatch}
          />
          {/* XP BAR */}
          <XPBar
            xp={safeData.xp}
            xpToLevel={xpToLevel}
            label={t('battle.xp')}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-gray-400 text-center mb-4 px-2">
            {taskDescription}
          </p>
          <button
            data-testid={`start-battle-${config.id}`}
            onClick={handleStartBattle}
            style={buttonStyle}
            className="w-full text-white text-3xl font-bold py-6 rounded-lg"
          >
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
                <BattlePortal
                  onClose={onEndBattle}
                  configId={config.id}
                  t={t}
                  displayMobNameWithAura={displayMobNameWithAura}
                  skillName={skillName}
                  level={safeData.level}
                  levelTextColor={levelTextColor}
                  taskDescription={taskDescription}
                  fantasyName={fantasyName}
                >
                  {cardContent}
                </BattlePortal>
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
