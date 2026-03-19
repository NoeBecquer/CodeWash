import React, { useState } from 'react'
import {
  Menu,
  Settings,
  Bug,
  Maximize,
  Minimize,
  Sparkles
} from 'lucide-react'

// Drawers
import MenuDrawer from '../drawers/MenuDrawer'
import SettingsDrawer from '../drawers/SettingsDrawer'
import CosmeticsDrawer from '../drawers/CosmeticsDrawer'

// Modals
import BugReportModal from '../modals/BugReportModal'
import ResetModal from '../modals/ResetModal'

// Sounds (keep UX consistent)
import { playClick } from '../../utils/soundManager'

const MainHUD = ({
  // Theme / cosmetics
  activeTheme,
  setActiveTheme,
  selectedBorder,
  setSelectedBorder,
  borderColor,
  setBorderColor,
  unlockedBorders,
  unlockedAchievements,

  // Settings / profiles
  bgmVol,
  setBgmVol,
  sfxVol,
  setSfxVol,
  currentProfile,
  onSwitchProfile,
  profileNames,
  onRenameProfile,
  getProfileStats,
  parentStatus,
  onParentVerified,

  // Stats / menu
  skills,
  stats,

  // Actions
  onReset
}) => {
  // Drawer state
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false)

  // Modal state
  const [isBugOpen, setIsBugOpen] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ---- Handlers ----
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
    playClick()
  }

  const closeAll = () => {
    setIsMenuOpen(false)
    setIsSettingsOpen(false)
    setIsCosmeticsOpen(false)
  }

  return (
    <>
      {/* ================= TOP LEFT ================= */}
      <button
        onClick={() => {
          closeAll()
          setIsSettingsOpen(true)
          playClick()
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 shadow-lg"
        style={{ top: '24px', left: '24px' }}
        data-testid="settings-button"
      >
        <Settings size={48} className="text-slate-400" />
      </button>

      <button
        onClick={() => {
          closeAll()
          setIsCosmeticsOpen(true)
          playClick()
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 shadow-lg"
        style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }}
        data-testid="theme-button"
      >
        <Sparkles size={48} className="text-purple-400" />
      </button>

      {/* ================= TOP RIGHT ================= */}
      <button
        onClick={toggleFullscreen}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 shadow-lg"
        style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }}
        data-testid="fullscreen-button"
      >
        {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
      </button>

      <button
        onClick={() => {
          closeAll()
          setIsMenuOpen(true)
          playClick()
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 shadow-lg"
        style={{ top: '24px', right: '24px' }}
        data-testid="menu-button"
      >
        <Menu size={48} />
      </button>

      {/* ================= BUG BUTTON ================= */}
      <button
        onClick={() => {
          closeAll()
          setIsBugOpen(true)
          playClick()
        }}
        className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 shadow-lg"
        style={{ bottom: '24px', right: '24px' }}
        data-testid="bug-button"
      >
        <Bug size={48} className="text-red-400" />
      </button>

      {/* ================= OVERLAYS ================= */}
      {isCosmeticsOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsCosmeticsOpen(false)} />
      )}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSettingsOpen(false)} />
      )}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* ================= DRAWERS ================= */}
      <CosmeticsDrawer
        isOpen={isCosmeticsOpen}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        selectedBorder={selectedBorder}
        setSelectedBorder={setSelectedBorder}
        borderColor={borderColor}
        setBorderColor={setBorderColor}
        unlockedBorders={unlockedBorders}
        unlockedAchievements={unlockedAchievements}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onReset={() => setIsResetOpen(true)}
        bgmVol={bgmVol}
        setBgmVol={setBgmVol}
        sfxVol={sfxVol}
        setSfxVol={setSfxVol}
        currentProfile={currentProfile}
        onSwitchProfile={onSwitchProfile}
        profileNames={profileNames}
        onRenameProfile={onRenameProfile}
        getProfileStats={getProfileStats}
        parentStatus={parentStatus}
        onParentVerified={onParentVerified}
        skills={skills}
      />

      <MenuDrawer
        isOpen={isMenuOpen}
        skills={skills}
        stats={stats}
      />

      {/* ================= MODALS ================= */}
      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={onReset}
      />

      <BugReportModal
        isOpen={isBugOpen}
        onClose={() => setIsBugOpen(false)}
      />
    </>
  )
}

export default MainHUD