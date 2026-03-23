import { useState, useEffect, useCallback } from 'react';
import {
  getStorageKey,
  loadSkills,
  loadTheme,
  loadStats
} from '../utils/profileStorage';

export const useAppState = () => {

  // ---------------- PROFILE STATE
  const [currentProfile, setCurrentProfile] = useState(
    () => Number.parseInt(localStorage.getItem('currentProfile_v1') || '1')
  );

  const [profileNames, setProfileNames] = useState(
    () => JSON.parse(localStorage.getItem('heroProfileNames_v1') || 'null')
      ?? { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' }
  );

  const [parentStatus, setParentStatus] = useState(
    () => JSON.parse(localStorage.getItem('heroParentStatus_v1') || 'null')
      ?? { 1: false, 2: false, 3: false }
  );

  // ---------------- GAME STATE
  const [skills, setSkills] = useState(() => loadSkills(currentProfile));
  const [activeTheme, setActiveTheme] = useState(() => loadTheme(currentProfile));
  const [stats, setStats] = useState(() => loadStats(currentProfile));
  const [playerHealth, setPlayerHealth] = useState(10);

  // ---------------- UI STATE
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [selectedBorder, setSelectedBorder] = useState(
    () => localStorage.getItem(`borderEffect_p${currentProfile}`) || 'solid'
  );

  const [borderColor, setBorderColor] = useState(
    () => localStorage.getItem(`borderColor_p${currentProfile}`) || '#FFD700'
  );

  const [bgmVol, setBgmVol] = useState(0.3);
  const [sfxVol, setSfxVol] = useState(0.5);

  // ---------------- PERSISTENCE

  useEffect(() => {
    localStorage.setItem(
      getStorageKey(currentProfile),
      JSON.stringify({ skills, theme: activeTheme, stats })
    );

    localStorage.setItem('currentProfile_v1', currentProfile);
    localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNames));
    localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatus));
  }, [skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);

  useEffect(() => {
    localStorage.setItem(`borderEffect_p${currentProfile}`, selectedBorder);
    localStorage.setItem(`borderColor_p${currentProfile}`, borderColor);
  }, [selectedBorder, borderColor, currentProfile]);

  // ---------------- PROFILE ACTIONS

  const switchProfile = (newId) => {
    if (newId === currentProfile) return;

    setSkills(loadSkills(newId));
    setActiveTheme(loadTheme(newId));
    setCurrentProfile(newId);
  };

  const renameProfile = (id, newName) => {
    setProfileNames(prev => ({ ...prev, [id]: newName }));
  };

  const resetProfile = useCallback((profileId) => {
    localStorage.removeItem(getStorageKey(profileId));
  
    if (profileId === 1) {
      localStorage.removeItem('heroSkills_v23');
    }
  
    setParentStatus(prev => ({
      ...prev,
      [profileId]: false
    }));
  
    setProfileNames(prev => ({
      ...prev,
      [profileId]: `Player ${profileId}`
    }));
  
    // reload state from fresh storage
    setSkills(loadSkills(profileId));
    setStats(loadStats(profileId));
    setActiveTheme(loadTheme(profileId));
  }, []);

  const setParentVerified = (profileId, verified) => {
    setParentStatus(prev => ({ ...prev, [profileId]: verified }));
  };

  return {
    // state
    currentProfile,
    profileNames,
    parentStatus,
    skills,
    activeTheme,
    stats,
    playerHealth,

    isMenuOpen,
    isSettingsOpen,
    isCosmeticsOpen,
    isResetOpen,
    isBugReportOpen,
    isFullscreen,

    selectedBorder,
    borderColor,
    bgmVol,
    sfxVol,

    // setters
    setSkills,
    setActiveTheme,
    setStats,
    setPlayerHealth,

    setIsMenuOpen,
    setIsSettingsOpen,
    setIsCosmeticsOpen,
    setIsResetOpen,
    setIsBugReportOpen,
    setIsFullscreen,

    setSelectedBorder,
    setBorderColor,
    setBgmVol,
    setSfxVol,

    setCurrentProfile,

    // actions
    switchProfile,
    renameProfile,
    resetProfile,
    setParentVerified,
  };
};