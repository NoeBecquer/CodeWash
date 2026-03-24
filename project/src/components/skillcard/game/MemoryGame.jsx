import React from 'react';
import SafeImage from '../../ui/SafeImage';

const MemoryGame = ({
  memoryCards,
  flippedIndices,
  matchedPairs,
  mismatchShake,
  memoryGridCols,
  handleCardClick,
  themeData,
}) => {
  return (
    <div
      className="flex-1 grid gap-2 bg-black/20 p-2 rounded items-center"
      style={{ gridTemplateColumns: `repeat(${memoryGridCols}, 1fr)` }}
    >
      {memoryCards.map((card, index) => {
        const isFlipped = flippedIndices.includes(index);
        const isMatched = matchedPairs.includes(card.color);

        if (isMatched) {
          return <div key={card.id} className="w-full aspect-[2/3]" />;
        }

        return (
          <div
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`
              w-full aspect-[2/3] cursor-pointer transition-all duration-300
              perspective-1000 relative transform-style-3d
              ${isFlipped ? 'rotate-y-180' : ''}
              ${mismatchShake && isFlipped ? 'animate-shake-flipped border-red-500' : ''}
            `}
          >
            {/* Back */}
            <div
              className="absolute inset-0 backface-hidden w-full h-full"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <SafeImage
                src={themeData.assets.cardBack}
                className="w-full h-full object-cover rounded border border-stone-600"
              />
            </div>

            {/* Front */}
            <div
              className="absolute inset-0 backface-hidden w-full h-full rotate-y-180 bg-slate-800 rounded border border-white/20 flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <SafeImage
                src={card.img}
                className="w-full h-full object-contain p-1"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(MemoryGame);