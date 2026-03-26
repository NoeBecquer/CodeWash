import React from 'react';
import { BASE_ASSETS } from '../../../constants/gameData';

const CATEGORY_LABELS = {
  tools: '🛠 Tools',
  food: '🍎 Food',
  blocks: '🧱 Blocks',
  special: '✨ Special'
};

const CleaningGame = ({
  items,
  sortedMap,
  categories,
  handleDrop,
  wrongItem,
  flyingItem,
  mistake // optional (can remove later)
}) => {

  const allSorted =
    items.length > 0 &&
    Object.keys(sortedMap).length === items.length;

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ================= INSTRUCTION ================= */}
      <p className="text-white text-center">
        Drag each item into the correct category
      </p>

      {/* ================= ITEMS ================= */}
      <div className="flex flex-wrap gap-3 justify-center">

        {items.map(item => {
          // ❌ remove sorted or flying items
          if (sortedMap[item] || flyingItem?.item === item) return null;

          const isWrong = wrongItem === item;

          return (
            <div
              key={item}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("item", item);
              }}
              className={`
                p-2 border rounded transition

                ${isWrong
                  ? 'border-red-500 bg-red-900 animate-shake'
                  : 'bg-gray-700 cursor-grab hover:scale-110 active:scale-95'}
              `}
            >
              <img
                src={BASE_ASSETS.items[item]}
                className="w-12 h-12 pointer-events-none"
                draggable={false}
              />
            </div>
          );
        })}

      </div>

      {/* ================= CATEGORIES ================= */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        {categories.map(category => {
          const isTarget =
            flyingItem && flyingItem.category === category;

          return (
            <div
              key={category}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const item = e.dataTransfer.getData("item");
                handleDrop(item, category);
              }}
              className={`
                border-2 rounded p-4 text-center transition
                bg-gray-800

                ${isTarget
                  ? 'border-green-400 scale-105'
                  : 'border-gray-600 hover:border-yellow-400 hover:scale-105'}
              `}
            >
              <p className="text-white font-bold">
                {CATEGORY_LABELS[category] || category}
              </p>
            </div>
          );
        })}
      </div>

      {/* ================= FLYING ITEM ANIMATION ================= */}
      {flyingItem && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <img
            src={BASE_ASSETS.items[flyingItem.item]}
            className="w-12 h-12 animate-ping"
          />
        </div>
      )}

      {/* ================= SUCCESS FEEDBACK ================= */}
      {allSorted && (
        <p className="text-green-400 text-center mt-2 animate-pulse">
          ✔ All items sorted!
        </p>
      )}

    </div>
  );
};

export default React.memo(CleaningGame);