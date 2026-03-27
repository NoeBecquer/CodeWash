import React from 'react';
import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS, TIER_COLORS, TIER_NAMES } from '../../constants/achievements';

const AchievementToast = ({ achievementId, tierIndex = null }) => {
    const { t } = useTranslation();
    const achievement = ACHIEVEMENTS[achievementId];

    if (!achievement) return null;

    // -------------------------------------
    // Safe translation
    // -------------------------------------
    const safeT = (key, fallback) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    // -------------------------------------
    // Display values
    // -------------------------------------
    let displayName = achievement.name;
    let tierLabel = null;
    let tierColor = null;

    if (achievement.isTiered && tierIndex !== null && tierIndex >= 0) {
        const tier = achievement.tiers[tierIndex];

        // ✅ IMPORTANT: use tier.tierName (not base name)
        displayName = tier.tierName;

        // ✅ "Bronze Tier"
        tierLabel = `${TIER_NAMES[tierIndex]} Tier`;

        // ✅ color mapping
        tierColor = TIER_COLORS[tierIndex];
    }

    const borderColor = tierColor ? tierColor.border : '#FFD700';
    const bgColor = tierColor ? tierColor.bg : 'rgba(255, 215, 0, 0.1)';
    const Icon = achievement.icon;

    // -------------------------------------
    // Render
    // -------------------------------------
    return (
        <div className="fixed bottom-8 left-1/2 z-50 animate-achievement-toast w-full max-w-2xl pointer-events-none transform -translate-x-1/2">
            <div
                className="bg-black/90 rounded-xl p-4 px-8 flex items-center justify-between backdrop-blur-md mx-4"
                style={{
                    border: `4px solid ${borderColor}`,
                    boxShadow: `0 0 30px ${borderColor}80, 0 0 50px ${borderColor}40`
                }}
            >
                <div className="flex items-center gap-4">

                    {/* Icon */}
                    <div
                        className="p-3 rounded-full border-2 animate-bounce"
                        style={{
                            borderColor: borderColor,
                            backgroundColor: bgColor
                        }}
                    >
                        <Icon size={32} className="text-yellow-300" />
                    </div>

                    {/* Text */}
                    <div className="text-left">
                        <h2 className="text-2xl text-yellow-400 font-bold leading-none mb-1 uppercase tracking-wide">
                            {safeT('achievement_toast.unlocked', 'ACHIEVEMENT UNLOCKED!')}
                        </h2>

                        {/* ✅ displayName matches test */}
                        <p className="text-white text-lg font-bold">
                            {displayName}
                        </p>

                        {/* ✅ tier label */}
                        {tierLabel && (
                            <p className="text-stone-400 text-sm mt-1">
                                {tierLabel}
                            </p>
                        )}
                    </div>
                </div>

                {/* Trophy */}
                <div className="pl-6 border-l-2 border-stone-600">
                    <Trophy
                        size={48}
                        className="text-yellow-400 animate-pulse"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AchievementToast;