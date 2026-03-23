import React from 'react';
import { Users, Music, Trash2, AlertTriangle, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProfileCard from '../profile/ProfileCard';

const SettingsDrawer = ({ isOpen, onReset, bgmVol, setBgmVol, sfxVol, setSfxVol, currentProfile, onSwitchProfile, profileNames, onRenameProfile, getProfileStats, parentStatus, onParentVerified, currentSkills }) => {
    const { t, i18n } = useTranslation();

    return (
        <div
            className={`fixed z-[200] h-full w-[85%] md:w-[60%] bg-[#0f172a]/95 backdrop-blur-xl z-50 border-r-4 border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ top: 0, left: 0 }}
        >
            <div className="p-6 h-full flex flex-col text-slate-200 font-sans">
                {/* Header - Fixed at top */}
                <div className="flex justify-between items-center border-b-2 border-slate-700 pb-4 shrink-0">
                    <h2 className="text-4xl text-yellow-400 font-bold uppercase tracking-widest drop-shadow-md" style={{ fontFamily: '"VT323", monospace' }}>{t('settings.title')}</h2>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto scrollbar-hide py-6">
                    <div className="flex flex-col gap-6">
                        <div>
                            <h3 className="text-xl text-blue-300 mb-5 font-bold flex items-center gap-3 uppercase tracking-wider"><Users size={20} /> {t('settings.select_file')}</h3>
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map(id => (
                                    <ProfileCard
                                        key={id}
                                        id={id}
                                        name={profileNames[id]}
                                        stats={id === currentProfile ? getProfileStats(id, currentSkills) : getProfileStats(id)}
                                        isCurrent={currentProfile === id}
                                        onSwitch={onSwitchProfile}
                                        onRename={onRenameProfile}
                                        isParent={parentStatus && parentStatus[id]}
                                        onParentVerified={onParentVerified}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl text-blue-300 mb-5 font-bold flex items-center gap-3 uppercase tracking-wider"><Music size={20} /> {t('settings.audio_configuration')}</h3>
                            <div className="space-y-4 bg-slate-900/50 p-5 rounded-xl border-2 border-slate-600">
                                <div className="px-3">
                                    <div className="flex justify-between mb-1 text-slate-400 font-bold text-sm uppercase"><span className="pl-2">{t('settings.music_volume')}</span><span className="text-yellow-400">{Math.round(bgmVol * 100)}%</span></div>
                                    <input type="range" min="0" max="1" step="0.05" value={bgmVol} onChange={(e) => setBgmVol(parseFloat(e.target.value))} className="h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                                </div>
                                <div className="px-3">
                                    <div className="flex justify-between mb-1 text-slate-400 font-bold text-sm uppercase"><span className="pl-2">{t('settings.sfx_volume')}</span><span className="text-yellow-400">{Math.round(sfxVol * 100)}%</span></div>
                                    <input type="range" min="0" max="1" step="0.05" value={sfxVol} onChange={(e) => setSfxVol(parseFloat(e.target.value))} className="h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                                </div>
                            </div>
                        </div>

                        {/* Language Switcher */}
                        <div>
                            <h3 className="text-xl text-blue-300 mb-5 font-bold flex items-center gap-3 uppercase tracking-wider"><Globe size={20} /> {t('settings.language')}</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => i18n.changeLanguage('en')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'en' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇬🇧 English
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('fr')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'fr' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇫🇷 Français
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => i18n.changeLanguage('zh')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'zh' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇨🇳 中文
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('hi')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'hi' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇮🇳 हिंदी
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => i18n.changeLanguage('ar')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'ar' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇸🇦 عربي
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('es')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'es' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇪🇸 Español
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => i18n.changeLanguage('bn')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'bn' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇧🇩 বাঙালি
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('pt')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'pt' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇵🇹 Português
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => i18n.changeLanguage('ru')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'ru' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇷🇺 Русский
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('ur')}
                                    className={`flex-1 py-3 rounded-lg font-bold uppercase tracking-wider border-2 transition-all ${i18n.language === 'ur' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                                >
                                    🇵🇰 اردو
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone - Fixed at bottom */}
                <div className="shrink-0 pt-4 border-t-2 border-red-900/50">
                    <h3 className="text-xl text-red-400 mb-4 font-bold flex items-center gap-3 uppercase tracking-wider">
                        <AlertTriangle size={20} className="text-red-500" /> {t('settings.danger_zone')}
                    </h3>
                    <button onClick={onReset} className="w-full bg-red-950/50 hover:bg-red-900/80 text-red-400 p-3 rounded-lg border border-red-900/50 hover:border-red-500 font-bold text-lg flex items-center justify-center gap-3 transition-all">
                        <Trash2 size={20} /> {t('settings.delete_profile_progress')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsDrawer;
