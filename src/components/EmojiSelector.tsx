import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

const COMMONLY_USED_EMOJIS = ['📌', '🪴', '🚗', '🧹', '💊', '☕️', '💻', '🐶', '🔧', '💧'];

const CATEGORIES = [
  { name: 'Home', emojis: ['🏠', '🪴', '🧹', '🛁', '🛋️', '🪟', '🔑', '🛏️', '🚽', '🗑️', '🧺', '🍳'] },
  { name: 'Health', emojis: ['💊', '💧', '🍎', '🦷', '🩸', '🏥', '🩺', '🚑', '🤧', '🧼', '🩹', '🏃‍♂️'] },
  { name: 'Self-care', emojis: ['💆', '💅', '🧘‍♀️', '🏃‍♀️', '🏋️', '🛀', '🧴', '💇', '🍵', '😴', '🧖‍♀️', '📖'] },
  { name: 'People', emojis: ['👨‍👩‍👧', '👥', '👶', '👵', '👮', '🧑‍🏫', '👩‍⚕️', '👨‍🍳', '🕺', '🧑‍🤝‍🧑', '👩‍💻', '🙋'] },
  { name: 'Things & Places', emojis: ['🚗', '💻', '📱', '📚', '🛒', '🏢', '🏫', '✈️', '🏦', '⛽', '🏝️', '🏕️'] },
  { name: 'Time & Misc', emojis: ['⏳', '⏰', '📅', '📌', '✨', '❤️', '⚙️', '💡', '💰', '🔔', '✅', '🔥'] }
];

interface EmojiSelectorProps {
  emoji: string;
  setEmoji: (emoji: string) => void;
}

export const EmojiSelector: React.FC<EmojiSelectorProps> = ({ emoji, setEmoji }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempEmoji, setTempEmoji] = useState(emoji || '📌');

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const onMouseLeave = () => {
    isDragging.current = false;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleOpenModal = () => {
    setTempEmoji(emoji || '📌');
    setIsModalOpen(true);
  };

  const handleDone = () => {
    setEmoji(tempEmoji);
    setIsModalOpen(false);
  };

  return (
    <div>
      <label className="block text-[#777777] font-light text-[14px] mb-1.5 flex items-center gap-1.5">
        Icon
      </label>

      <div className="flex items-center w-full overflow-hidden">
        {/* Left Side: Selected Emoji */}
        <div className="flex items-center justify-center w-[52px] h-[52px] rounded-xl bg-[#130F14] border border-[#130F14] shrink-0 text-2xl shadow-2xs">
          {emoji || '📌'}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[#261C29] shrink-0 mx-3"></div>

        {/* Scrollable Commonly used Emojis + MORE button */}
        <div 
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-2 flex-1 min-w-0 scroll-smooth cursor-grab active:cursor-grabbing"
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onWheel={(e) => {
            if (e.deltaY !== 0 && e.deltaX === 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          {COMMONLY_USED_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-colors shrink-0 ${
                emoji === e ? 'bg-[#261C29] border border-[#AB70D5]' : 'bg-[#09050A] border border-[#130F14] hover:bg-[#1C151E]'
              }`}
            >
              {e}
            </button>
          ))}
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 h-11 rounded-xl bg-[#130F14] border border-[#130F14] hover:bg-[#1C151E] flex items-center justify-center text-xs font-bold text-zinc-300 transition-colors shrink-0 ml-1"
          >
            MORE
          </button>
        </div>
      </div>

      {/* Emoji Picker Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-md bg-[#09050A] border border-[#130F14] rounded-[24px] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#130F14] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#130F14] flex items-center justify-center text-2xl">
                  {tempEmoji}
                </div>
                <h3 className="font-bold text-lg text-white">Select Icon</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1C151E] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="px-4 py-2 bg-[#AB70D5] text-white text-sm font-bold rounded-xl hover:bg-[#905BB5] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Categories */}
            <div 
              className="p-4 overflow-y-auto flex-1 min-h-0 space-y-6 touch-pan-y overscroll-contain"
            >
              {CATEGORIES.map(cat => (
                <div key={cat.name}>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{cat.name}</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {cat.emojis.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setTempEmoji(e)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-colors ${
                          tempEmoji === e ? 'bg-[#261C29] border border-[#AB70D5]' : 'bg-[#130F14] hover:bg-[#1C151E]'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
