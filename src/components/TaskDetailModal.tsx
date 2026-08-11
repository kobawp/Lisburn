import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Task } from '../types';
import { TaskIcon } from './TaskIcon';
import { getTimeBreakdown } from '../utils/timeUtils';
import { useOverscrollBounce } from '../hooks/useOverscrollBounce';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddHistoryEntry?: (taskId: string, timestamp: string, note: string) => void;
  onDeleteHistoryEntry?: (taskId: string, entryId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onAddHistoryEntry,
  onDeleteHistoryEntry
}) => {
  const [isPromptingNote, setIsPromptingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const { containerRef } = useOverscrollBounce<HTMLDivElement>();
  


  const handleMarkDone = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddHistoryEntry) {
      onAddHistoryEntry(task.id, new Date().toISOString(), noteInput.trim());
    }
    setNoteInput('');
    setIsPromptingNote(false);
  };

  // Format Date for Display
  const formatLongDate = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(isoString));
    } catch {
      return '-';
    }
  };

  const getRelativeDaysString = (isoString: string | null) => {
    if (!isoString) return '';
    const breakdown = getTimeBreakdown(isoString);
    if (breakdown.totalDays === 1) return '1 day ago';
    if (breakdown.totalDays === 0) return 'Today';
    return `${breakdown.totalDays} days ago`;
  };

  // Calculate Next Due
  let nextDueIso: string | null = null;
  let nextDueStr = '-';
  let nextDueRelative = '';

  if (task.lastCompletedAt && task.reminderIntervalHours) {
    const lastDone = new Date(task.lastCompletedAt).getTime();
    const nextDueMs = lastDone + (task.reminderIntervalHours * 60 * 60 * 1000);
    const nextDueDate = new Date(nextDueMs);
    nextDueIso = nextDueDate.toISOString();
    nextDueStr = formatLongDate(nextDueIso);
    
    const now = new Date().getTime();
    const diffMs = nextDueMs - now;
    const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) {
      nextDueRelative = diffDays === 1 ? '1 day overdue' : `${diffDays} days overdue`;
    } else {
      nextDueRelative = diffDays === 1 ? 'in 1 day' : `in ${diffDays} days`;
    }
  } else if (!task.reminderIntervalHours) {
    nextDueRelative = 'no reminder set';
  }

  // Sort history newest first
  const sortedHistory = [...task.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-hidden"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-2xl mx-auto flex-1 flex flex-col pt-[54px] pb-[74px] px-4 sm:px-6 relative overflow-y-auto overflow-x-hidden no-scrollbar touch-pan-y"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end w-full">
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[#777777] hover:text-white transition-colors focus:outline-none"
          >
            <X className="w-8 h-8 stroke-[3]" />
          </button>
        </div>
        
        {/* Top Icon & Title */}
        <div className="flex flex-col items-center mt-3 mb-4 space-y-2">
          <div className="w-14 h-14 rounded-[16px] bg-[#130F14] flex items-center justify-center text-3xl">
            <TaskIcon name={task.icon} className="w-7 h-7 text-[#AB70D5]" />
          </div>
          <h1 className="text-[2.25rem] leading-none tracking-tight font-bold text-white text-center">
            {task.title}
          </h1>
        </div>

        {/* Mark Done Button / Prompt */}
        <div className="mb-5 w-full max-w-md mx-auto">
          {!isPromptingNote ? (
            <button
              onClick={() => setIsPromptingNote(true)}
              className="w-full py-3.5 px-6 rounded-full font-bold text-base text-black bg-[#d7ae4c] hover:bg-[#c49b3c] transition-colors shadow-lg"
            >
              Mark done today?
            </button>
          ) : (
            <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} onSubmit={handleMarkDone} className="flex flex-col gap-3">
              <input
                type="text"
                autoFocus
                placeholder="Add a note (optional)..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#130F14] rounded-[24px] text-white focus:outline-none border border-[#d7ae4c]/30 focus:border-[#d7ae4c]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPromptingNote(false)}
                  className="flex-1 py-2.5 px-6 rounded-full font-bold text-white bg-[#1C151E] hover:bg-[#261C29] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-6 rounded-full font-bold text-black bg-[#d7ae4c] hover:bg-[#c49b3c] transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full space-y-4">
          
          {/* Notes */}
          {task.description && (
            <div>
              <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Notes</h3>
              <div className="bg-[#130F14] rounded-[24px] px-5 py-4">
                <p className="text-[14px] font-normal text-white whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="bg-[#130F14] rounded-[24px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[14px] font-normal text-white">Last done</span>
              <div className="text-right">
                <div className="text-[14px] font-normal text-white">{formatLongDate(task.lastCompletedAt)}</div>
                <div className="text-[11px] text-[#727272]">{getRelativeDaysString(task.lastCompletedAt)}</div>
              </div>
            </div>
            
            <div className="h-px w-[calc(100%-2.5rem)] ml-5 bg-[#261C29]"></div>
            
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[14px] font-normal text-white">Next due</span>
              <div className="text-right">
                <div className="text-[14px] font-normal text-white">{nextDueStr}</div>
                <div className="text-[11px] text-[#727272]">{nextDueRelative}</div>
              </div>
            </div>
          </div>

          {/* History */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1 border-b border-[#261C29] pb-2">History</h3>
            <div 
              className="pt-2 space-y-3 px-1"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0) 100%)'
              }}
            >
              {sortedHistory.length === 0 ? (
                <p className="text-[14px] text-[#777777] italic">No history entries yet.</p>
              ) : (
                sortedHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-4 text-[14px]">
                    <div className="font-bold text-[#d7ae4c] shrink-0">
                      • {formatLongDate(entry.timestamp)}
                    </div>
                    {entry.note && (
                      <div className="text-[#d7ae4c] font-normal text-right break-words">
                        {entry.note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-14 mb-10 flex items-center justify-between px-2 pt-6 border-t border-[#1C151E]">
          <button
            onClick={() => {
              onClose();
              onEdit(task);
            }}
            className="text-[14px] font-bold text-white hover:text-gray-300 transition-colors px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this task?')) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="text-[14px] font-bold text-[#B91C1C] hover:text-[#9F1818] transition-colors px-2 py-1"
          >
            Delete Task
          </button>
        </div>

      </div>
    </motion.div>
  );
};
