import { Settings, Sparkles } from 'lucide-react';

const TopLeftControls = ({
  setIsMenuOpen,
  setIsSettingsOpen,
  setIsCosmeticsOpen,
  playClick,
}) => {
  return (
    <>
      {/* Settings button */}
      <button
        onClick={() => {
          setIsMenuOpen(false);
          setIsCosmeticsOpen(false);
          setIsSettingsOpen(prev => !prev);
          playClick();
        }}
        className="absolute z-[100] bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', left: '24px' }}
        data-cy="settings-button"
      >
        <Settings size={48} className="text-slate-400" />
      </button>

      {/* Cosmetics button */}
      <button
        onClick={() => {
          setIsMenuOpen(false);
          setIsSettingsOpen(false);
          setIsCosmeticsOpen(prev=> !prev);
          playClick();
        }}
        className="absolute z-[100] bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
        style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }}
        data-cy="theme-button"
      >
        <Sparkles size={48} className="text-purple-400" />
      </button>
    </>
  );
};

export default TopLeftControls;