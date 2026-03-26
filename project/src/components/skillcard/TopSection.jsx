import React from 'react';
import SafeImage from '../ui/SafeImage';
import MobWithAura from '../ui/MobWithAura';

const TopSection = ({
  isBattling,
  configId,
  colorStyle,
  skillName,
  fantasyName,
  level,
  levelTextColor,
  showMob,
  mobAura,
  mobSrc,
  displayMobName,
  displayMobNameWithAura,
  mobSize,
  isHit,
  bossHealing,
  damageNumbers,
  t
}) => {
  const isMemory = configId === 'memory';

  const containerClass = isMemory && isBattling
    ? 'hidden'
    : 'h-[55%] relative flex items-center justify-center overflow-hidden rounded-t-sm';

  return (
    <div className={containerClass} style={colorStyle}>
      
      {/* Background texture */}
      <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      {/* Skill + Fantasy name */}
      {!isBattling && (
        <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white border border-white/20 z-20">
          <div className="text-xs text-gray-400 uppercase">{skillName}</div>
          <div className="text-lg leading-none">{fantasyName}</div>
        </div>
      )}

      {/* Level */}
      {!isBattling && (
        <div className="absolute top-2 right-2 z-20">
          <div className={`bg-black/60 px-3 py-1 rounded border border-white/20 text-3xl font-bold ${levelTextColor}`}>
            {t('battle.lvl')} {level}
          </div>
        </div>
      )}

      {/* Mob */}
      {showMob && (
        <div className="relative z-10 flex items-center justify-center h-full max-h-[200px] w-full">
          
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
                object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]
                transition-transform duration-100
                ${isHit ? 'animate-knockback' : bossHealing ? 'animate-shake' : 'animate-bob'}
                ${bossHealing ? 'brightness-150 hue-rotate-90' : ''}
              `}
            />
          )}

          {/* Damage numbers */}
          {damageNumbers.map(dmg => (
            <div
              key={dmg.id}
              className="absolute text-5xl font-bold text-red-500 animate-bounce pointer-events-none whitespace-nowrap"
              style={{
                left: `calc(50% + ${dmg.x}px)`,
                top: `calc(50% + ${dmg.y}px)`,
                textShadow: '2px 2px 0 #000'
              }}
            >
              -{dmg.val}
            </div>
          ))}
        </div>
      )}

      {/* Mob name */}
      {!isBattling && !isMemory && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-2 rounded-full text-white border-2 border-white/30 text-xl font-bold tracking-wide z-10 shadow-lg whitespace-nowrap">
          {displayMobName}
        </div>
      )}
    </div>
  );
};

export default React.memo(TopSection);