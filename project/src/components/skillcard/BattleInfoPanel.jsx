import React from 'react';

const BattleInfoPanel = ({
  t,
  displayMobNameWithAura,
  skillName,
  level,
  levelTextColor,
  taskDescription,
  fantasyName
}) => {
  return (
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
        {/* Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-700"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-700"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-700"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-700"></div>

        {/* Header */}
        <div className="bg-gradient-to-b from-red-700 to-red-800 p-2 border-b-4 border-amber-900 relative">
          <div
            className="text-yellow-300 text-sm font-black uppercase tracking-wider text-center"
            style={{
              textShadow:
                '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
            }}
          >
            {t('battle.battle_header')}
          </div>
        </div>

        {/* Content */}
        <div className="p-2 space-y-1.5">

          {/* Target */}
          <div className="bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
            <div className="text-[8px] text-amber-900 uppercase font-bold">
              {t('battle.target')}
            </div>
            <div className="text-stone-900 font-black text-sm">
              {displayMobNameWithAura}
            </div>
          </div>

          {/* Skill + Level */}
          <div className="flex gap-1.5">
            <div className="flex-1 bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
              <div className="text-[8px] text-amber-900 uppercase font-bold">
                {t('battle.skill_label')}
              </div>
              <div className="text-stone-900 font-bold text-xs">
                {skillName}
              </div>
            </div>

            <div className="flex-1 bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
              <div className="text-[8px] text-amber-900 uppercase font-bold">
                {t('battle.level_label')}
              </div>
              <div
                className={`font-black text-base ${levelTextColor}`}
                style={{
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.5)',
                  filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))'
                }}
              >
                {level}
              </div>
            </div>
          </div>

          {/* Quest */}
          <div className="bg-amber-900/20 border-2 border-amber-900/40 rounded p-1.5">
            <div className="text-[8px] text-amber-900 uppercase font-bold mb-0.5">
              {t('battle.quest')}
            </div>
            <div className="text-stone-800 text-[10px] italic">
              {taskDescription}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-t from-amber-900 to-amber-800 p-1 border-t-4 border-amber-950">
          <div className="text-center text-yellow-200 text-[8px] font-bold uppercase">
            {fantasyName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BattleInfoPanel);