import React from 'react';

const BattleLayer = ({
  battlingSkillId,
  challengeData,
  isListening,
  spokenText,
  onEndBattle,
  children,
}) => {

  if (!battlingSkillId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        style={{ minWidth: '100vw', minHeight: '100vh' }}
        onClick={onEndBattle}
      />

      {/* Battle content (cards, challenge UI, etc.) */}
      <div className="relative z-50">
        {children}
      </div>
    </>
  );
};

export default BattleLayer;