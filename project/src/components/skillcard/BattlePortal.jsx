import React from 'react';
import ReactDOM from 'react-dom';
import BattleInfoPanel from './BattleInfoPanel';

const BattlePortal = ({
  children,
  onClose,
  configId,
  t,
  displayMobNameWithAura,
  skillName,
  level,
  levelTextColor,
  taskDescription,
  fantasyName,
}) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* CONTENT */}
      <div
        className="flex items-center justify-center relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            transform: 'scale(1.5)',
            transformOrigin: 'center center',
          }}
        >
          {children}
        </div>

        {/* SIDE PANEL */}
        {(!['memory', 'cleaning'].includes(configId)) && (
          <BattleInfoPanel
            t={t}
            displayMobNameWithAura={displayMobNameWithAura}
            skillName={skillName}
            level={level}
            levelTextColor={levelTextColor}
            taskDescription={taskDescription}
            fantasyName={fantasyName}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default React.memo(BattlePortal);