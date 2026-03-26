import React, { useState, useMemo, useCallback } from 'react'
import SkillCard from '../skillcard/SkillCard'
import { playActionCardLeft, playActionCardRight } from '../../utils/soundManager'
import { SKILL_DATA } from '../../constants/gameData'

const TOTAL = SKILL_DATA.length
const DRAG_THRESHOLD = 100

// ------------------------ helpers ------------------------

const wrapIndex = (index) => (index + TOTAL) % TOTAL

const getVerticalOffset = (offset) => {
  if (offset === 0) return -55
  if (Math.abs(offset) === 1) return -30
  if (Math.abs(offset) === 2) return 20
  return 75
}

const getTransformStyle = (offset, isBattling) => {
  const translateY = getVerticalOffset(offset)

  const rotateX =
    Math.abs(offset) === 3 ? -12 :
    Math.abs(offset) === 2 ? -8 :
    Math.abs(offset) === 1 ? -4 : 0

  return {
    transform: `translateX(${offset * 320}px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${offset === 0 ? 1.1 : 0.85})`,
    opacity: offset === 0 ? 1 : (Math.abs(offset) === 3 ? 0 : (Math.abs(offset) === 2 ? 0.3 : 0.6)),
    zIndex: isBattling ? 50 : (offset === 0 ? 20 : 10 - Math.abs(offset)),
    filter: offset === 0 ? 'none' : 'brightness(0.5) blur(1px)',
  }
}

// ------------------------ component ------------------------

const GameCarousel = ({
  skills,
  selectedIndex,
  setSelectedIndex,
  battlingSkillId,
  challengeData,
  isListening,
  spokenText,
  damageNumbers,
  selectedBorder,
  borderColor,
  bossHealing,

  startBattle,
  endBattle,
  handleSuccessHit,
  toggleMicListener,
  setSkillDifficulty,

  getAuraForSkill,
  currentThemeData
}) => {

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)

  // ------------------------ navigation ------------------------

  const navigate = useCallback((direction) => {
    setSelectedIndex(prev => wrapIndex(prev + direction))

    if (direction > 0) playActionCardRight()
    else playActionCardLeft()
  }, [setSelectedIndex])

  // ------------------------ drag ------------------------

  const handleDragStart = (x) => {
    if (battlingSkillId) return
    setIsDragging(true)
    setDragStartX(x)
  }

  const handleDragMove = (x) => {
    if (!isDragging || battlingSkillId) return

    const diff = dragStartX - x

    if (Math.abs(diff) >= DRAG_THRESHOLD) {
      navigate(diff > 0 ? 1 : -1)
      setIsDragging(false)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDragStartX(0)
  }

  // ------------------------ click ------------------------

  const handleCardClick = (offset) => {
    if (isDragging) return
    if (battlingSkillId || offset === 0) return

    navigate(offset)
  }

  // ------------------------ callbacks ------------------------

  const handleStartBattle = useCallback(startBattle, [startBattle])
  const handleSubmit = useCallback(handleSuccessHit, [handleSuccessHit])
  const handleMic = useCallback(toggleMicListener, [toggleMicListener])
  const handleDifficulty = useCallback(setSkillDifficulty, [setSkillDifficulty])

  // ------------------------ data ------------------------

  const visibleItems = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const offset = i - 3
      const idx = selectedIndex + offset
      const dataIndex = wrapIndex(idx)

      return {
        ...SKILL_DATA[dataIndex],
        offset,
        key: idx,
      }
    })
  }, [selectedIndex])

  const damageBySkill = useMemo(() => {
    const map = {}
    damageNumbers.forEach(d => {
      if (!map[d.skillId]) map[d.skillId] = []
      map[d.skillId].push(d)
    })
    return map
  }, [damageNumbers])

  // ------------------------ render ------------------------

  return (
    <div
      className={`relative w-full flex items-center justify-center perspective-1000 h-[650px] mb-12 ${battlingSkillId ? 'z-50' : ''}`}
      style={{ cursor: battlingSkillId ? 'default' : (isDragging ? 'grabbing' : 'grab') }}

      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}

      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => {
        e.preventDefault()
        handleDragMove(e.touches[0].clientX)
      }}
      onTouchEnd={handleDragEnd}
    >
      {visibleItems.map((item) => {
        const skillData = skills[item.id]
        if (!skillData) return null

        const isCenter = item.offset === 0
        const isBattling = isCenter && battlingSkillId === item.id

        return (
          <div
            key={item.key}
            data-active={isCenter}
            className="absolute transition-all duration-500 ease-out"
            style={{
              ...getTransformStyle(item.offset, isBattling),
              cursor: !isCenter && !battlingSkillId ? 'pointer' : 'default'
            }}
            onClick={() => handleCardClick(item.offset)}
          >
            <SkillCard
              config={item}
              data={skillData}
              themeData={currentThemeData}
              isCenter={isCenter}
              isBattling={isBattling}
              mobName={item.id}
              mobAura={getAuraForSkill(item, skillData)}
              challenge={challengeData}
              isListening={isListening}
              spokenText={spokenText}
              damageNumbers={damageBySkill[item.id] || []}
              onStartBattle={handleStartBattle}
              onEndBattle={endBattle}
              onMathSubmit={handleSubmit}
              onMicClick={handleMic}
              difficulty={skillData.difficulty || 1}
              setDifficulty={handleDifficulty}
              unlockedDifficulty={Math.min(7, Math.floor(skillData.level / 20) + 1)}
              selectedBorder={selectedBorder}
              borderColor={borderColor}
              bossHealing={bossHealing === item.id}
            />
          </div>
        )
      })}
    </div>
  )
}

export default GameCarousel