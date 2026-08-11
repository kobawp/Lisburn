import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Task } from '../types';
import { TaskIcon } from './TaskIcon';
import { formatShortTimeSince } from '../utils/timeUtils';

interface TaskCompactRowProps {
  task: Task;
  onClickTask: (task: Task) => void;
}

export const TaskCompactRow: React.FC<TaskCompactRowProps> = ({
  task,
  onClickTask
}) => {
  const shortTime = formatShortTimeSince(task.lastCompletedAt);
  const hasNoDate = task.lastCompletedAt === null;

  const [pointerDownPos, setPointerDownPos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setPointerDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (pointerDownPos) {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        // Ignored, was a drag
        return;
      }
    }
    onClickTask(task);
  };

  return (
    <div 
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className="py-1.5 flex items-center justify-between gap-3 transition-transform active:scale-95 cursor-pointer group"
    >
      {/* Icon + Title */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-[12px] bg-[#1D141F] flex items-center justify-center shrink-0">
          <TaskIcon name={task.icon} className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white truncate leading-none">
              {task.title}
            </h4>
          </div>
          <p className="text-[12px] font-light text-[#777777] truncate mt-1 leading-tight">
            {task.description || '\u00A0'}
          </p>
        </div>
      </div>

      {/* Days Count & Controls */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex flex-col items-end">
          {hasNoDate ? (
             <span className="text-lg font-bold text-white leading-none">-</span>
          ) : (
            <span className="text-lg font-bold text-white leading-none">
              {shortTime}
            </span>
          )}
          <span className="text-[12px] font-light text-[#777777] leading-none mt-1">
            since
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-[#777777]" />
      </div>
    </div>
  );
};
