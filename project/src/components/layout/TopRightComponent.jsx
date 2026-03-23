import React from 'react';
import { Menu, Maximize, Minimize } from 'lucide-react';

const TopRightControls = ({
  isFullscreen,
  toggleFullscreen,
  setIsMenuOpen,
  setIsSettingsOpen,
  setIsCosmeticsOpen,
  playClick,
}) => {
  return (
    <>
      {/* Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="absolute z-[100] bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        data-cy="fullscreen-button"
      >
        {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
      </button>

      {/* Menu */}
      <button
        onClick={() => {
          setIsSettingsOpen(false);
          setIsCosmeticsOpen(false);
          setIsMenuOpen(prev => !prev);
          playClick();
        }}
        className="absolute z-[100] bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', right: '24px' }}
        data-cy="achievement-button"
      >
        <Menu size={48} />
      </button>
    </>
  );
};

export default TopRightControls;