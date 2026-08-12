import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, X, Calendar, Bell, Smile, Plus, Minus } from 'lucide-react';
import { Task } from '../types';
import { EmojiSelector } from './EmojiSelector';
import { useOverscrollBounce } from '../hooks/useOverscrollBounce';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave
}) => {
  const { containerRef } = useOverscrollBounce<HTMLDivElement>();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [emoji, setEmoji] = useState<string>(task.icon || '📌');

  // Last Done options
  const [doneMode, setDoneMode] = useState<'today' | 'choose' | 'dont-remember'>(
    task.lastCompletedAt === null ? 'dont-remember' : 'choose'
  );
  const [customLastCompletedDate, setCustomLastCompletedDate] = useState<string>(
    task.lastCompletedAt ? new Date(task.lastCompletedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

  // Reminder options
  const [enableReminder, setEnableReminder] = useState<boolean>(task.reminderIntervalHours !== null);
  const [reminderUnit, setReminderUnit] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [reminderAfter, setReminderAfter] = useState<number>(1);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setEmoji(task.icon || '📌');
      setCustomLastCompletedDate(task.lastCompletedAt ? new Date(task.lastCompletedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
      setDoneMode(task.lastCompletedAt === null ? 'dont-remember' : 'choose');
      setEnableReminder(task.reminderIntervalHours !== null);

      if (task.reminderIntervalHours) {
        const hrs = task.reminderIntervalHours;
        if (hrs % 720 === 0) {
          setReminderUnit('months');
          setReminderAfter(hrs / 720);
        } else if (hrs % 168 === 0) {
          setReminderUnit('weeks');
          setReminderAfter(hrs / 168);
        } else {
          setReminderUnit('days');
          setReminderAfter(Math.max(1, Math.round(hrs / 24)));
        }
      }
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let lastCompletedISO = task.lastCompletedAt;
    if (doneMode === 'today') {
      lastCompletedISO = new Date().toISOString();
    } if (doneMode === 'choose' && customLastCompletedDate) {
      lastCompletedISO = new Date(customLastCompletedDate).toISOString();
    } if (doneMode === 'dont-remember') {
      lastCompletedISO = null;
    }

    let finalIntervalHours: number | null = null;
    if (enableReminder) {
      const multiplier =
        reminderUnit === 'days'
          ? 24
          : reminderUnit === 'weeks'
          ? 168
          : 720;
      finalIntervalHours = Math.max(1, reminderAfter) * multiplier;
    }

    const updated: Task = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      category: 'General',
      icon: emoji || '📌',
      lastCompletedAt: lastCompletedISO,
      reminderIntervalHours: finalIntervalHours
    };

    onSave(updated);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-y-auto h-[var(--vv-height,100dvh)] max-h-[var(--vv-height,100dvh)]"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-5xl mx-auto flex-1 flex flex-col overflow-y-auto no-scrollbar touch-pan-y overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-[54px] pb-8 border-[#130F14] bg-transparent">
            <h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">Edit</h2>
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
                id="save-edit-task-btn"
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
              <label className="block text-[#777777] font-light text-[14px] mb-1.5" htmlFor="edit-task-title-input">
                Task <span className="text-[#B91C1C] text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                id="edit-task-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                enterKeyHint="next"
                className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-bold text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5] select-text touch-auto"
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-[#777777] font-light text-[14px] mb-1.5" htmlFor="edit-task-desc-input">
                Notes (Optional)
              </label>
              <textarea
                id="edit-task-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                className="w-full bg-[#130F14] border border-[#130F14] rounded-xl px-4 py-2.5 text-lg font-normal text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5] resize-none select-text touch-auto"
              />
            </div>

            <EmojiSelector emoji={emoji} setEmoji={setEmoji} />

            {/* I last did this */}
            <div className="border-[#130F14] pt-4">
              <label className="flex items-center gap-2 text-[#777777] font-light text-[14px] mb-2">
                I last did this
              </label>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 w-full max-w-full">
                <button
                  type="button"
                  onClick={() => setDoneMode('today')}
                  className={`py-2 px-1 sm:px-2.5 rounded-xl text-xs font-bold border transition-all text-center min-w-0 truncate ${
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
                  className={`py-2 px-1 sm:px-2.5 rounded-xl text-xs font-bold border transition-all text-center min-w-0 truncate ${
                    doneMode === 'choose'
                      ? 'bg-[#AB70D5] border-[#AB70D5] text-white shadow-2xs'
                      : 'bg-[#130F14] border-[#130F14] text-[#7A746D] text-zinc-400 hover:bg-[#1C151E]'
                  }`}
                  title="Choose another date"
                >
                  <span className="hidden sm:inline">Choose another date</span>
                  <span className="sm:hidden">Choose date</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDoneMode('dont-remember')}
                  className={`py-2 px-1 sm:px-2.5 rounded-xl text-xs font-bold border transition-all text-center min-w-0 truncate ${
                    doneMode === 'dont-remember'
                      ? 'bg-[#AB70D5] border-[#AB70D5] text-white shadow-2xs'
                      : 'bg-[#130F14] border-[#130F14] text-[#7A746D] text-zinc-400 hover:bg-[#1C151E]'
                  }`}
                  title="I don't remember"
                >
                  <span className="hidden sm:inline">I don't remember</span>
                  <span className="sm:hidden">Don't remember</span>
                </button>
              </div>

              {doneMode === 'choose' && (
                <input
                  type="datetime-local"
                  value={customLastCompletedDate}
                  onChange={(e) => setCustomLastCompletedDate(e.target.value)}
                  className="w-full max-w-full min-w-0 box-border mt-2 bg-[#130F14] border border-[#130F14] rounded-xl px-3 sm:px-4 py-2.5 font-normal text-base text-white placeholder:text-[#777777] focus:outline-none focus:border-[#AB70D5] [color-scheme:dark] [appearance:none] [-webkit-appearance:none]"
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

              {enableReminder && (
                <div className="space-y-3 bg-[#130F14] p-3 rounded-2xl border border-[#130F14]">
                  <div>
                    <div className="grid grid-cols-3 gap-2 w-full">
                      {(['days', 'weeks', 'months'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setReminderUnit(unit)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all w-full ${
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
                  <div className="flex items-center justify-between border-t border-[#1C151E] pt-2.5">
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
