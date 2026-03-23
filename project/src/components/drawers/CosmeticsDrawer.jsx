import React, { useState } from 'react';
import { Sparkles, Flame, Snowflake, Zap, Skull, Star, Activity, Atom, Droplet, Grid3x3, Gem, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SafeImage from '../ui/SafeImage';
import { THEMES_LIST } from '../../constants/gameData';
import { ACHIEVEMENTS } from '../../constants/achievements';

const BORDER_EFFECTS = [
    { id: 'solid', badge: null, icon: Star },
    { id: 'solid-picker', badge: 'Wood', icon: Star },
    { id: 'gradient', badge: 'Stone', icon: Atom },
    { id: 'sparkle', badge: 'Gold', icon: Sparkles },
    { id: 'electric', badge: 'Iron', icon: Zap },
    { id: 'lifestream', badge: 'Emerald', icon: Activity },
    { id: 'frost', badge: 'Diamond', icon: Snowflake },
    { id: 'fire', badge: 'Netherite', icon: Flame },
    { id: 'shadow', badge: 'Obsidian', icon: Skull },
    { id: 'rainbow', badge: 'Star', icon: Gem }
];

// Achievement-unlocked border effects
const ACHIEVEMENT_EFFECTS = [
    { id: 'livewire', achievement: 'speed_demon', icon: Zap },
    { id: 'void', achievement: 'world_ender', icon: Atom },
    { id: 'toxic', achievement: 'monster_manual', icon: Droplet },
    { id: 'holo', achievement: 'perfectionist', icon: Grid3x3 },
    { id: 'crystal', achievement: 'full_set', icon: Gem }
];

const CosmeticsDrawer = ({
    isOpen,
    activeTheme,
    setActiveTheme,
    selectedBorder,
    setSelectedBorder,
    borderColor,
    setBorderColor,
    unlockedBorders,
    unlockedAchievements = []
}) => {
    const { t } = useTranslation();
    const [showColorPicker, setShowColorPicker] = useState(false);

    const isBorderUnlocked = (badge) => {
        if (badge === null) return true;
        return unlockedBorders.includes(badge);
    };

    const isAchievementEffectUnlocked = (achievementId) => {
        return unlockedAchievements.includes(achievementId);
    };

    return (
        <div
            className={`fixed z-[200] h-full w-[85%] md:w-[60%] bg-[#0f172a]/95 backdrop-blur-xl z-50 border-r-4 border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ top: 0, left: 0 }}
        >
            <div className="p-6 h-full flex flex-col justify-start gap-6 overflow-y-auto scrollbar-hide text-slate-200 font-sans">
                <div className="flex justify-between items-center border-b-2 border-slate-700 pb-4 shrink-0">
                    <h2 className="text-4xl text-yellow-400 font-bold uppercase tracking-widest drop-shadow-md" style={{ fontFamily: '"VT323", monospace' }}>
                        {t('cosmetics.title')}
                    </h2>
                </div>

                {/* Theme Selection */}
                <div>
                    <h3 className="text-xl text-blue-300 mb-5 font-bold flex items-center gap-3 uppercase tracking-wider">
                        <Sparkles size={20} /> {t('cosmetics.theme_select')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {THEMES_LIST.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => setActiveTheme(theme.id)}
                                disabled={activeTheme === theme.id}
                                className={`h-24 rounded-lg border-2 overflow-hidden relative transition-all duration-300 shadow-lg group ${
                                    activeTheme === theme.id
                                        ? 'border-yellow-400 ring-2 ring-yellow-400/20 opacity-100 cursor-default'
                                        : 'border-slate-600 hover:scale-105 hover:border-white opacity-60 hover:opacity-100'
                                }`}
                            >
                                <SafeImage
                                    src={theme.img}
                                    alt={theme.name}
                                    className={`w-full h-full object-cover ${activeTheme === theme.id ? 'grayscale-0' : 'grayscale'}`}
                                />
                                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                                    activeTheme === theme.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                    <span className={`text-lg font-bold uppercase tracking-widest ${
                                        activeTheme === theme.id ? 'text-yellow-400' : 'text-white'
                                    }`}>
                                        {theme.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Border Effect Selection */}
                <div>
                    <h3 className="text-xl text-blue-300 mb-4 font-bold flex items-center gap-3 uppercase tracking-wider">
                        <Sparkles size={20} /> {t('cosmetics.border_effects')}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Badge-unlocked border effects */}
                        {BORDER_EFFECTS.map((effect, index) => {
                            const unlocked = isBorderUnlocked(effect.badge);
                            const isSelected = selectedBorder === effect.id;
                            const isSolid = effect.id === 'solid' || effect.id === 'solid-picker';
                            const showPicker = effect.id === 'solid-picker' && isSelected && showColorPicker;
                            const IconComponent = effect.icon;
                            const columnIndex = index % 3;
                            const tooltipPosition = columnIndex === 2 ? 'right-full mr-2' : 'left-full ml-2';
                            const effectName = t(`borders.${effect.id}.name`, { defaultValue: effect.id });
                            const effectDesc = t(`borders.${effect.id}.description`, { defaultValue: '' });

                            return (
                                <div key={effect.id} className="relative group">
                                    <button
                                        onClick={() => {
                                            if (unlocked) {
                                                if (effect.id === 'solid-picker' && isSelected) {
                                                    setShowColorPicker(!showColorPicker);
                                                } else {
                                                    setSelectedBorder(effect.id);
                                                    setShowColorPicker(false);
                                                }
                                            }
                                        }}
                                        disabled={!unlocked}
                                        className={`relative p-3 rounded-lg border-2 transition-all duration-300 w-full ${
                                            !unlocked
                                                ? 'bg-slate-800/50 border-slate-600 opacity-70 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-yellow-900/30 border-yellow-400 ring-2 ring-yellow-400/20'
                                                    : 'bg-slate-800/70 border-slate-600 hover:border-yellow-400/50 hover:scale-105'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-2 items-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div
                                                    className={`w-24 h-24 rounded border-4 flex items-center justify-center ${
                                                        !isSolid ? `border-effect-${effect.id}` : ''
                                                    }`}
                                                    style={
                                                        isSolid
                                                            ? { borderColor: effect.id === 'solid' ? '#FFD700' : borderColor, boxShadow: `0 0 20px ${effect.id === 'solid' ? '#FFD700' : borderColor}` }
                                                            : (effect.id === 'gradient' || effect.id === 'sparkle')
                                                                ? { '--border-color': borderColor }
                                                                : {}
                                                    }
                                                >
                                                    <IconComponent
                                                        size={32}
                                                        className={`${!unlocked ? 'text-slate-600' : 'text-slate-300'}`}
                                                    />
                                                </div>
                                                {!unlocked && (
                                                    <Info size={16} className="text-slate-500" />
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-sm font-bold ${!unlocked ? 'text-slate-500' : 'text-yellow-400'}`}>
                                                    {effectName}
                                                </div>
                                                <div className={`text-xs ${!unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {effectDesc}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                    {t('cosmetics.active')}
                                                </div>
                                            )}

                                            {/* Inline Color Picker for Solid Color with Picker */}
                                            {showPicker && (
                                                <div className="mt-2 p-2 bg-slate-900/80 rounded border border-slate-600 w-full">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={borderColor}
                                                            onChange={(e) => setBorderColor(e.target.value)}
                                                            className="w-10 h-10 rounded cursor-pointer border-2 border-slate-600"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-[9px] text-slate-400 mb-0.5">{t('cosmetics.color')}</div>
                                                            <div className="text-[11px] font-mono text-white">{borderColor.toUpperCase()}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                    {/* Badge Info Popup */}
                                    {!unlocked && effect.badge && (
                                        <div className={`absolute z-50 ${tooltipPosition} top-0 w-48 bg-slate-900 border-2 border-yellow-400 rounded-lg shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 pointer-events-none`}>
                                            <div className="flex items-start gap-2 mb-2">
                                                <div className="p-1.5 rounded bg-slate-700">
                                                    <IconComponent
                                                        size={20}
                                                        className="text-slate-400"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-slate-300">
                                                        {t('cosmetics.badge_required', { badge: effect.badge })}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {t('cosmetics.earn_badge_unlock', { badge: effect.badge })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400">
                                                {t('cosmetics.locked_x')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Achievement-unlocked effects */}
                        {ACHIEVEMENT_EFFECTS.map((effect, index) => {
                            const unlocked = isAchievementEffectUnlocked(effect.achievement);
                            const isSelected = selectedBorder === effect.id;
                            const IconComponent = effect.icon;
                            const achievement = ACHIEVEMENTS[effect.achievement];
                            const totalIndex = BORDER_EFFECTS.length + index;
                            const columnIndex = totalIndex % 3;
                            const tooltipPosition = columnIndex === 2 ? 'right-full mr-2' : 'left-full ml-2';
                            const effectName = t(`borders.${effect.id}.name`, { defaultValue: effect.id });
                            const effectDesc = t(`borders.${effect.id}.description`, { defaultValue: '' });

                            return (
                                <div key={effect.id} className="relative group">
                                    <button
                                        onClick={() => {
                                            if (unlocked) {
                                                setSelectedBorder(effect.id);
                                                setShowColorPicker(false);
                                            }
                                        }}
                                        disabled={!unlocked}
                                        className={`relative p-3 rounded-lg border-2 transition-all duration-300 w-full ${
                                            !unlocked
                                                ? 'bg-slate-800/50 border-slate-600 opacity-70 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-yellow-900/30 border-yellow-400 ring-2 ring-yellow-400/20'
                                                    : 'bg-slate-800/70 border-slate-600 hover:border-yellow-400/50 hover:scale-105'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-2 items-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div
                                                    className={`w-24 h-24 rounded border-4 flex items-center justify-center border-effect-${effect.id}`}
                                                >
                                                    <IconComponent
                                                        size={32}
                                                        className={`${!unlocked ? 'text-slate-600' : 'text-slate-300'}`}
                                                    />
                                                </div>
                                                {!unlocked && (
                                                    <Info size={16} className="text-slate-500" />
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-sm font-bold ${!unlocked ? 'text-slate-500' : 'text-yellow-400'}`}>
                                                    {effectName}
                                                </div>
                                                <div className={`text-xs ${!unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {effectDesc}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                    {t('cosmetics.active')}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                    {/* Achievement Info Popup */}
                                    <div className={`absolute z-50 ${tooltipPosition} top-0 w-64 bg-slate-900 border-2 border-yellow-400 rounded-lg shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 pointer-events-none`}>
                                        <div className="flex items-start gap-2 mb-2">
                                            {achievement && (
                                                <>
                                                    <div className={`p-1.5 rounded ${unlocked ? 'bg-yellow-400/20' : 'bg-slate-700'}`}>
                                                        <IconComponent
                                                            size={20}
                                                            className={unlocked ? 'text-yellow-400' : 'text-slate-400'}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={`text-sm font-bold ${unlocked ? 'text-yellow-400' : 'text-slate-300'}`}>
                                                            {t(`achievements.${achievement.id}.name`, { defaultValue: achievement.name })}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {t(`achievements.${achievement.id}.description`, { defaultValue: achievement.description })}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded ${unlocked ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                            {unlocked ? t('cosmetics.unlocked_check') : t('cosmetics.locked_x')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CosmeticsDrawer;
