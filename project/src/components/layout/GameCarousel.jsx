import React, { useState, useMemo, useCallback } from 'react'
import SkillCard from '../skillcard/SkillCard'
import { playActionCardLeft, playActionCardRight } from '../../utils/soundManager'
import { SKILL_DATA } from '../../constants/gameData';

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

  const DragStart = (clientX) => {
    if (battlingSkillId) return
    setIsDragging(true)
    setDragStartX(clientX)
  }

  const handleDragMove = (clientX) => {
    if (!isDragging || battlingSkillId) return
    const diff = dragStartX - clientX

    if (Math.abs(diff) >= 100) {
      if (diff > 0) {
        setSelectedIndex(p => p + 1)
        playActionCardRight()
      } else {
        setSelectedIndex(p => p - 1)
        playActionCardLeft()
      }
      setIsDragging(false)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleCardClick = (offset) => {
    if (battlingSkillId || offset === 0) return

    setSelectedIndex(p => p + offset)

    if (offset > 0) playActionCardRight()
    else playActionCardLeft()
  }

  const handleStartBattle = useCallback((id) => {
    startBattle(id)
  }, [startBattle])

  const handleSubmit = useCallback((id, val) => {
    handleSuccessHit(id, val)
  }, [handleSuccessHit])

  const handleMic = useCallback((id) => {
    toggleMicListener(id)
  }, [toggleMicListener])

  const handleDifficulty = useCallback((id, diff) => {
    setSkillDifficulty(id, diff)
  }, [setSkillDifficulty])

  const visibleItems = useMemo(() => {
    const items = [];

    for (let i = -3; i <= 3; i++) {
      const idx = selectedIndex + i;

      const dataIndex =
        ((idx % SKILL_DATA.length) + SKILL_DATA.length) % SKILL_DATA.length;

      const skill = SKILL_DATA[dataIndex];

      items.push({
        ...skill,
        offset: i,
        key: idx,
      });
    }

    return items;
  }, [selectedIndex]);

  const damageBySkill = useMemo(() => {
    const map = {};
    damageNumbers.forEach(d => {
      if (!map[d.skillId]) map[d.skillId] = [];
      map[d.skillId].push(d);
    });
    return map;
  }, [damageNumbers]);

  return (
    <div
      className={`relative w-full flex items-center justify-center perspective-1000 h-[650px] mb-12 ${battlingSkillId ? 'z-50' : ''}`}
      style={{ cursor: battlingSkillId ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => { e.preventDefault(); handleDragMove(e.touches[0].clientX) }}
      onTouchEnd={handleDragEnd}
    >
      {visibleItems.map((item) => {
        const skillData = skills[item.id];

        if (!skillData)
            return null;
        const isItemBattling = item.offset === 0 && battlingSkillId === item.id

        const getVerticalOffset = (offset) => {
          if (offset === 0) return -55
          if (Math.abs(offset) === 1) return -30
          if (Math.abs(offset) === 2) return 20
          return 75
        }

        const translateY = getVerticalOffset(item.offset)
        const rotateX =
          Math.abs(item.offset) === 3 ? -12 :
          Math.abs(item.offset) === 2 ? -8 :
          Math.abs(item.offset) === 1 ? -4 : 0

        return (
          <div
            key={item.key}
            data-active={item.offset === 0}
            className="absolute transition-all duration-500 ease-out"
            style={{
              transform: `translateX(${item.offset * 320}px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${item.offset === 0 ? 1.1 : 0.85})`,
              opacity: item.offset === 0 ? 1 : (Math.abs(item.offset) === 3 ? 0 : (Math.abs(item.offset) === 2 ? 0.3 : 0.6)),
              zIndex: isItemBattling ? 50 : (item.offset === 0 ? 20 : 10 - Math.abs(item.offset)),
              filter: item.offset === 0 ? 'none' : 'brightness(0.5) blur(1px)',
              cursor: item.offset !== 0 && !battlingSkillId ? 'pointer' : 'default'
            }}
            onClick={() => handleCardClick(item.offset)}
          >
            <SkillCard
              config={item}
              data={skills[item.id]}
              themeData={currentThemeData}
              isCenter={item.offset === 0}
              isBattling={item.offset === 0 && battlingSkillId === item.id}
              mobName={item.id}
              mobAura={getAuraForSkill(item, skills[item.id])}
              challenge={challengeData}
              isListening={isListening}
              spokenText={spokenText}
              damageNumbers={damageBySkill[item.id] || []}
              onStartBattle={handleStartBattle}
              onEndBattle={endBattle}
              onMathSubmit={handleSubmit}
              onMicClick={handleMic}
              difficulty={skills[item.id].difficulty || 1}
              setDifficulty={handleDifficulty}
              unlockedDifficulty={Math.min(7, Math.floor(skills[item.id].level / 20) + 1)}
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