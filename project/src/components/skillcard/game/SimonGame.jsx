import React from 'react';
import SafeImage from '../../ui/SafeImage';
import { BASE_ASSETS } from '../../../constants/gameData';

const SimonGame = ({
  t,
  completedRounds,
  isShowingSequence,
  simonGameActive,
  axolotlColors,
  litAxolotl,
  handleAxolotlClick,
  startSimonGame,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-1">
      {/* Round */}
      <div className="text-white text-lg font-bold py-1">
        {t('skill_card.round')} {completedRounds}
        {isShowingSequence && (
          <span className="text-yellow-400 animate-pulse">
            {t('skill_card.watch')}
          </span>
        )}
        {!isShowingSequence && simonGameActive && (
          <span className="text-green-400">
            {t('skill_card.your_turn')}
          </span>
        )}
      </div>

      {/* Axolotl circle */}
      <div className="relative w-[240px] h-[240px]">
        {axolotlColors.map((color, index) => {
          const anglePerAxolotl = 360 / axolotlColors.length;
          const angle = (index * anglePerAxolotl - 90) * (Math.PI / 180);
          const radius = 85;

          const x = 120 + radius * Math.cos(angle) - 40;
          const y = 120 + radius * Math.sin(angle) - 40;

          const isLit = litAxolotl === color;

          return (
            <div
              key={color}
              onClick={() => handleAxolotlClick(color)}
              className={`
                absolute w-[80px] h-[80px] cursor-pointer transition-all duration-200 rounded-full p-1
                ${isLit ? 'scale-125 ring-4 ring-yellow-400 brightness-150 z-10' : 'hover:scale-110'}
                ${isShowingSequence ? 'pointer-events-none' : ''}
              `}
              style={{ left: x, top: y }}
            >
              <SafeImage
                src={BASE_ASSETS.axolotls[color]}
                alt={color}
                className="w-full h-full object-contain drop-shadow-lg"
              />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/60 px-1 rounded">
                {color}
              </span>
            </div>
          );
        })}
      </div>

      {/* Game over */}
      {!simonGameActive && completedRounds > 0 && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-red-400 text-lg font-bold animate-pulse">
            {t('skill_card.game_over_rounds')} {completedRounds}
          </div>

          <button
            onClick={startSimonGame}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-3 px-6 rounded shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-[4px] transition-all"
          >
            {t('skill_card.retry')}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(SimonGame);