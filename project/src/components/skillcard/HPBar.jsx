import React from 'react';

const HPBar = ({ hpPercent, t }) => {
  return (
    <div className="bg-[#1a1a1a] p-2 border-t-4 border-b-4 border-black">
      
      <div className="flex justify-between text-gray-400 text-xs mb-1 uppercase">
        <span>{t('battle.hp')}</span>
        <span>{hpPercent}%</span>
      </div>

      <div className="w-full h-6 bg-[#333] rounded-full overflow-hidden border-2 border-[#555]">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-200"
          style={{ width: `${hpPercent}%` }}
        />
      </div>

    </div>
  );
};

export default React.memo(HPBar);