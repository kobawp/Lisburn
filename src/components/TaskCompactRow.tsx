import React from 'react';
import { ChevronRight, GripVertical } from 'lucide-react';
import { Task } from '../types';
import { TaskIcon } from './TaskIcon';
import { formatShortTimeSince } from '../utils/timeUtils';

interface TaskCompactRowProps {
  task: Task;
  onClickTask: (task: Task) => void;
  showDragHandle?: boolean;
}

export const TaskCompactRow: React.FC<TaskCompactRowProps> = ({
  task,
  onClickTask,
  showDragHandle = false
}) => {
  const shortTime = formatShortTimeSince(task.lastCompletedAt);
  const hasNoDate = task.lastCompletedAt === null;

  return (
    <div 
      onClick={() => onClickTask(task)}
      className="py-1.5 flex items-center justify-between gap-3 cursor-pointer group select-none active:opacity-70 transition-opacity"
    >
      {/* Icon + Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showDragHandle && (
          <div 
            data-drag-handle="true" 
            onClick={(e) => e.stopPropagation()}
            className="p-1 -ml-1 text-[#8E8A93] hover:text-white active:text-purple-400 shrink-0 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
            title="Drag to reorder"
          >
            <GripVertical className="w-4.5 h-4.5" />
          </div>
        )}
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
