import React from 'react';
import PixelHeart from '../ui/PixelHeart';

const BottomHUD = ({ playerHealth, maxHealth = 10 }) => {
  return (
    <div
      className="absolute z-40 flex gap-1.5"
      style={{
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      {Array(maxHealth).fill(0).map((_, i) => (
        <PixelHeart key={i} size={48} filled={i < playerHealth} />
      ))}
    </div>
  );
};

export default BottomHUD;