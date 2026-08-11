import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Calendar, Bell, Smile, Plus, Minus, Check, X } from 'lucide-react';
import { Task, TaskColor } from '../types';
import { POPULAR_EMOJIS } from './TaskIcon';
import { EmojiSelector } from './EmojiSelector';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'history'>) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState<string>('📌');
  const [color] = useState<TaskColor>('indigo');

  // Last Done options: 'today' | 'choose' | 'dont-remember'
  const [doneMode, setDoneMode] = useState<'today' | 'choose' | 'dont-remember'>('today');
  const [customLastCompletedDate, setCustomLastCompletedDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  // Reminder options: Switch (on/off), Unit (Day | Week | Month | Year), After (+/- counter)
  const [enableReminder, setEnableReminder] = useState<boolean>(true);
  const [reminderUnit, setReminderUnit] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [reminderAfter, setReminderAfter] = useState<number>(1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY !== null) {
      const currentY = e.changedTouches[0].clientY;
      const diff = currentY - startY;
      if (diff > 100) {
        onClose();
      }
      setStartY(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Determine last completed ISO timestamp
    let lastCompletedISO: string | null = new Date().toISOString();
    if (doneMode === 'choose' && customLastCompletedDate) {
      lastCompletedISO = new Date(customLastCompletedDate).toISOString();
    } else if (doneMode === 'dont-remember') {
      lastCompletedISO = null;
    }

    // Determine reminder hours from Unit & After
    let finalIntervalHours: number | null = null;
    if (enableReminder) {
      const multiplier =
        reminderUnit === 'days'
          ? 24
          : reminderUnit === 'weeks'
          ? 168
          : 720; // Year
      finalIntervalHours = Math.max(1, reminderAfter) * multiplier;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      category: 'General',
      icon: emoji || '📌',
      color,
      lastCompletedAt: lastCompletedISO,
      reminderIntervalHours: finalIntervalHours,
      pinned: false
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setEmoji('📌');
    setDoneMode('today');
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-y-auto">
      <div 
        ref={scrollRef}
        className="w-full max-w-5xl mx-auto flex-1 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-[54px] pb-8 border-[#130F14] bg-transparent">
            <h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">Add Task</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
              >
                <X className="w-8 h-8 stroke-[3]" />
              </button>
              <button
                type="submit"
                id="save-new-task-btn"
                className="p-2 -mr-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
              >
                <Check className="w-8 h-8 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
            
            {/* Task Title */}
            <div>
              <label className="block text-[#777777] font-light text-[14px] mb-1.5">
                Task <span className="text-[#B91C1C] text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Goon"
                id="new-task-title-input"
                className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-bold text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5]"
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-[#777777] font-light text-[14px] mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add a note..."
                id="new-task-desc-input"
                className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-normal text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5] resize-none"
              />
            </div>

            <EmojiSelector emoji={emoji} setEmoji={setEmoji} />

            {/* I last did this */}
            <div className="border-[#130F14] pt-4">
              <label className="flex items-center gap-2 text-[#777777] font-light text-[14px] mb-2">
                I last did this
              </label>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDoneMode('today')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    doneMode === 'today'
                      ? 'bg-[#AB70D5] border-[#AB70D5] text-white shadow-2xs'
                      : 'bg-[#130F14] border-[#130F14] text-[#7A746D] text-zinc-400 hover:bg-[#1C151E]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDoneMode('choose')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    doneMode === 'choose'
                      ? 'bg-[#AB70D5] border-[#AB70D5] text-white shadow-2xs'
                      : 'bg-[#130F14] border-[#130F14] text-[#7A746D] text-zinc-400 hover:bg-[#1C151E]'
                  }`}
                >
                  Choose another date
                </button>
                <button
                  type="button"
                  onClick={() => setDoneMode('dont-remember')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    doneMode === 'dont-remember'
                      ? 'bg-[#AB70D5] border-[#AB70D5] text-white shadow-2xs'
                      : 'bg-[#130F14] border-[#130F14] text-[#7A746D] text-zinc-400 hover:bg-[#1C151E]'
                  }`}
                >
                  I don't remember
                </button>
              </div>

              {doneMode === 'choose' && (
                <input
                  type="datetime-local"
                  value={customLastCompletedDate}
                  onChange={(e) => setCustomLastCompletedDate(e.target.value)}
                  id="custom-done-date-picker"
                  className="w-full mt-2 bg-[#130F14] border border-[#130F14] rounded-xl px-3 py-2 font-bold text-lg text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5]"
                />
              )}
            </div>

            {/* Remind me every (Optional) Section */}
            <div className="border-[#130F14] pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[#777777] font-light text-[14px]">
                  Remind me every (Optional)
                </label>

                {/* Switch button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableReminder}
                  onClick={() => setEnableReminder(!enableReminder)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enableReminder ? 'bg-[#AB70D5]' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      enableReminder ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Opened options when switch is ON */}
              {enableReminder && (
                <div className="space-y-4 pt-2 bg-[#130F14] p-4 rounded-2xl border border-[#130F14]">
                  {/* Order: Unit first */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#7A746D] text-zinc-400 mb-2">
                      Unit
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['days', 'weeks', 'months'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setReminderUnit(unit)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all ${
                            reminderUnit === unit
                              ? 'bg-[#AB70D5] border-[#AB70D5] text-white shadow-2xs'
                              : 'bg-[#09050A] border-[#130F14] text-[#7A746D] text-zinc-300 hover:bg-[#1C151E]'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order: After second (with + and - buttons) */}
                  <div className="flex items-center justify-between border-[#130F14] pt-3">
                    <label className="text-[11px] font-bold text-[#7A746D] text-zinc-400">
                      After
                    </label>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setReminderAfter((prev) => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-full bg-[#1C151E] border border-[#130F14] font-bold text-base text-[#2D2A26] text-zinc-100 flex items-center justify-center hover:bg-[#261C29] active:scale-95 transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="font-bold text-sm min-w-[2rem] text-center text-[#2D2A26] text-zinc-100">
                        {reminderAfter} {reminderUnit}
                      </span>

                      <button
                        type="button"
                        onClick={() => setReminderAfter((prev) => prev + 1)}
                        className="w-8 h-8 rounded-full bg-[#1C151E] border border-[#130F14] font-bold text-base text-[#2D2A26] text-zinc-100 flex items-center justify-center hover:bg-[#261C29] active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </motion.div>
  );
};
