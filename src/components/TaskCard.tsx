import React from 'react';
import { 
  Pin, 
  PinOff, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  History,
  ChevronRight
} from 'lucide-react';
import { Task } from '../types';
import { TaskIcon } from './TaskIcon';
import { 
  formatDaysCount, 
  formatTimeElapsed, 
  getTaskStatusType, 
  formatIntervalText,
  getProgressPercentage,
  formatShortDate
} from '../utils/timeUtils';

interface TaskCardProps {
  task: Task;
  showExactHours: boolean;
  onClickTask: (task: Task) => void;
  onTogglePin: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showExactHours,
  onClickTask,
  onTogglePin
}) => {
  const daysCount = formatDaysCount(task.lastCompletedAt);
  const formattedElapsed = formatTimeElapsed(task.lastCompletedAt, showExactHours);
  const status = getTaskStatusType(task.lastCompletedAt, task.reminderIntervalHours);
  const progressPct = getProgressPercentage(task.lastCompletedAt, task.reminderIntervalHours);
  const intervalText = formatIntervalText(task.reminderIntervalHours);

  // Status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] bg-rose-950/80 text-[#B91C1C] text-rose-300 border border-[#FCA5A5] border-rose-800">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        );
      case 'due-soon':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FDF5E6] bg-amber-950/80 text-[#D4A373] text-amber-300 border border-[#D4A373]/40 border-amber-800">
            <Clock className="w-3 h-3" /> Due Soon
          </span>
        );
      case 'fresh':
        return (
          <span className="inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full bg-[#3A1E4D] text-[#AB70D5] border border-[#AB70D5]/40">
            <CheckCircle2 className="w-3 h-3" /> Good
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#1C151E] text-[#7A746D] text-zinc-300 border border-[#261C29]">
            Tracked
          </span>
        );
    }
  };

  return (
    <div 
      onClick={() => onClickTask(task)}
      className={`group relative rounded-[22px] bg-[#09050A] border transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between overflow-hidden ${
        task.pinned 
          ? 'border-[#AB70D5] bg-gradient-to-b from-[#09050A] via-[#09050A] to-[#3A1E4D]/20' 
          : 'border-[#261C29] hover:border-[#AB70D5]'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Header: Icon, Category, Title & Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C151E] border border-[#261C29] flex items-center justify-center shrink-0">
              <TaskIcon name={task.icon} className="w-5 h-5 text-[#AB70D5]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[#AB70D5] tracking-wider uppercase">
                  {task.category}
                </span>
                {task.pinned && (
                  <span className="inline-flex items-center text-[10px] bg-[#FDF5E6] bg-amber-950/60 text-[#D4A373] text-amber-300 px-1.5 py-0.2 rounded font-semibold border border-[#D4A373]/30">
                    Pinned
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#2D2A26] text-zinc-100 line-clamp-1 group-hover:text-[#AB70D5] transition-colors">
                {task.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {getStatusBadge()}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(task.id);
              }}
              className={`p-1.5 rounded-full transition-colors text-zinc-400 hover:text-white hover:bg-[#1C151E] ${
                task.pinned ? 'text-[#D4A373]' : 'opacity-0 group-hover:opacity-100'
              }`}
              title={task.pinned ? 'Unpin from top' : 'Pin to top'}
            >
              {task.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-[#7A746D] text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Hero Counter Area: "X Days Ago" */}
        <div className="my-3 py-3 px-4 rounded-2xl bg-[#09050A] border border-[#261C29] flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                status === 'overdue' ? 'text-[#B91C1C] text-rose-400' :
                status === 'due-soon' ? 'text-[#D4A373] text-amber-400' : 'text-[#2D2A26] text-zinc-100'
              }`}>
                {daysCount}
              </span>
              <span className="text-xs font-bold text-[#7A746D] text-zinc-400 uppercase tracking-wider">
                {parseInt(daysCount, 10) === 1 ? 'DAY AGO' : 'DAYS AGO'}
              </span>
            </div>
            <p className="text-[11px] text-[#7A746D] text-zinc-400 font-medium mt-0.5">
              Last done: {formatShortDate(task.lastCompletedAt)} ({formattedElapsed})
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#7A746D] text-zinc-400 bg-[#1C151E] px-2.5 py-1 rounded-full border border-[#261C29]">
            <History className="w-3.5 h-3.5 text-[#AB70D5]" />
            <span>{task.history.length} {task.history.length === 1 ? 'log' : 'logs'}</span>
          </div>
        </div>

        {/* Reminder Progress Bar (if interval exists) */}
        {task.reminderIntervalHours && (
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-[11px] text-[#7A746D] text-zinc-400">
              <span className="font-semibold text-[#AB70D5]">{intervalText}</span>
              <span className="font-semibold">{Math.round(progressPct)}%</span>
            </div>
            <div className="w-full bg-[#261C29] h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  status === 'overdue' ? 'bg-[#B91C1C]' :
                  status === 'due-soon' ? 'bg-[#D4A373]' : 'bg-[#AB70D5]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Click Prompt */}
      <div className="px-4 py-2.5 bg-[#09050A] border-[#261C29] flex items-center justify-between text-xs font-semibold text-[#7A746D] text-zinc-400 group-hover:text-[#2D2A26] group-hover:text-zinc-200 transition-colors">
        <span>Click to view, complete or edit</span>
        <ChevronRight className="w-4 h-4 text-[#AB70D5] transition-transform group-hover:translate-x-0.5" />
      </div>

    </div>
  );
};

