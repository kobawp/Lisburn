import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Reorder, AnimatePresence } from 'motion/react';
import { 
  Task, 
  AppSettings, 
  SortOption 
} from './types';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadSettingsFromStorage, 
  saveSettingsToStorage, 
  resetTasksToDefault 
} from './utils/storage';
import { TaskCompactRow } from './components/TaskCompactRow';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ArrowUpDown, Search, Clock, Plus, Settings, X, RefreshCw } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettingsFromStorage());
  
  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Ultra-smooth GPU-accelerated Pull to refresh
  const pullIndicatorRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentPullRef = useRef<number>(0);
  const [isReadyToRefresh, setIsReadyToRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 1 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
      currentPullRef.current = 0;
    } else {
      startYRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || isRefreshing) return;
    const y = e.touches[0].clientY;
    const diff = y - startYRef.current;

    if (diff > 0 && window.scrollY <= 1) {
      const damped = Math.min(Math.pow(diff, 0.82), 85);
      currentPullRef.current = damped;

      if (pullIndicatorRef.current) {
        pullIndicatorRef.current.style.height = `${damped}px`;
        pullIndicatorRef.current.style.opacity = `${Math.min(damped / 50, 1)}`;
        pullIndicatorRef.current.style.transition = 'none';
      }

      if (damped > 60 && !isReadyToRefresh) {
        setIsReadyToRefresh(true);
      } else if (damped <= 60 && isReadyToRefresh) {
        setIsReadyToRefresh(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (startYRef.current === null || isRefreshing) return;
    const pulled = currentPullRef.current;
    startYRef.current = null;

    if (pulled > 60) {
      setIsRefreshing(true);
      if (pullIndicatorRef.current) {
        pullIndicatorRef.current.style.transition = 'height 0.25s ease-out, opacity 0.25s ease-out';
        pullIndicatorRef.current.style.height = '60px';
        pullIndicatorRef.current.style.opacity = '1';
      }
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } else {
      setIsReadyToRefresh(false);
      if (pullIndicatorRef.current) {
        pullIndicatorRef.current.style.transition = 'height 0.25s ease-out, opacity 0.25s ease-out';
        pullIndicatorRef.current.style.height = '0px';
        pullIndicatorRef.current.style.opacity = '0';
      }
    }
    currentPullRef.current = 0;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    if (isSortMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortMenuOpen]);
  const currentSort = settings.sortBy || 'custom';

  const handleSortChange = (newSort: SortOption) => {
    // Autosave current order before switching
    if (!searchQuery.trim()) {
      setTasks(filteredTasks);
    }
    setSettings((s) => ({ ...s, sortBy: newSort }));
    setIsSortMenuOpen(false);
  };

  // Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  // Keep detailTask in sync if tasks change while detail modal is open
  useEffect(() => {
    if (detailTask) {
      const updated = tasks.find((t) => t.id === detailTask.id);
      if (updated) {
        setDetailTask(updated);
      }
    }
  }, [tasks, detailTask?.id]);

  // Add Task
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'history'>) => {
    const nowISO = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: 'task-' + Date.now(),
      createdAt: nowISO,
      history: taskData.lastCompletedAt ? [
        {
          id: 'hist-' + Date.now(),
          timestamp: taskData.lastCompletedAt,
          note: 'Task created'
        }
      ] : []
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Edit Task
  const handleSaveEditTask = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (detailTask?.id === taskId) {
      setDetailTask(null);
    }
  };

  // Add Manual History Entry in Task Detail
  const handleAddHistoryEntry = (taskId: string, isoTimestamp: string, note?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newEntry = {
            id: 'hist-' + Date.now(),
            timestamp: isoTimestamp,
            note: note || ''
          };
          const combined = [newEntry, ...t.history].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          return {
            ...t,
            lastCompletedAt: combined[0].timestamp,
            history: combined
          };
        }
        return t;
      })
    );
  };

  // Delete History Entry
  const handleDeleteHistoryEntry = (taskId: string, entryId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedHistory = t.history.filter((h) => h.id !== entryId);
          let newLastCompletedAt = t.lastCompletedAt;
          if (updatedHistory.length > 0) {
            newLastCompletedAt = updatedHistory[0].timestamp;
          }
          return {
            ...t,
            lastCompletedAt: newLastCompletedAt,
            history: updatedHistory
          };
        }
        return t;
      })
    );
  };

  // Reset Data to Defaults
  const handleResetTasks = () => {
    setTasks([]);
  };

  // Import Tasks
  const handleImportTasks = (importedTasks: Task[]) => {
    setTasks(importedTasks);
  };

  // Filter tasks (sorting is now manual via drag and drop)
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });

    if (currentSort === 'latest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (currentSort === 'earliest') {
      result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (currentSort === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [tasks, searchQuery, currentSort]);

  const handleReorder = (reorderedTasks: Task[]) => {
    // Only allow reordering if there is no active search query and sorting is custom
    if (!searchQuery.trim() && currentSort === 'custom') {
      setTasks(reorderedTasks);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#09050A] text-[#4A443F] text-zinc-200 flex flex-col font-sans transition-colors duration-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Pull to refresh indicator */}
      <div 
        ref={pullIndicatorRef}
        className="w-full flex justify-center items-end overflow-hidden h-0 opacity-0 will-change-[height,opacity]"
      >
        <div className="text-[#777777] text-sm mb-3 flex flex-col items-center gap-1.5 select-none">
          <RefreshCw className={`w-5 h-5 transition-transform ${isReadyToRefresh || isRefreshing ? 'animate-spin text-white' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : isReadyToRefresh ? 'Release to refresh' : 'Pull to refresh'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-[54px] pb-12 flex flex-col">
        
        {/* Header Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 -ml-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                className="p-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
                aria-label="Sort"
              >
                <ArrowUpDown className="w-6 h-6" />
              </button>
              {isSortMenuOpen && (
                <div className="absolute left-0 mt-2 w-40 bg-[#130F14] border border-[#2D2A26] rounded-xl shadow-lg z-50 py-1">
                  <button onClick={() => handleSortChange('latest')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26]">Latest</button>
                  <button onClick={() => handleSortChange('earliest')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26]">Earliest</button>
                  <button onClick={() => handleSortChange('name')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26]">Name</button>
                  <button onClick={() => handleSortChange('custom')} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26]">Custom Order</button>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsAddTaskOpen(true)}
            className="p-2 -mr-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
            aria-label="Add Task"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* Title & Date */}
        <div className="flex flex-col mt-6">
          <h1 className="text-[2.5rem] leading-none tracking-tight">
            <span className="font-bold text-white">Lis</span>
            <span className="font-bold text-[#777777]">burn.</span>
          </h1>
          <p className="text-[#777777] font-light text-[12px] mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#777777]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-12 pr-10 py-2.5 bg-[#130F14] rounded-full text-[16px] text-[#2D2A26] text-zinc-100 placeholder-[#777777] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tasks Section */}
        <div className="flex flex-col mt-3">
          {/* Section Title */}
          <div className="pt-3 pb-2 relative">
            <h2 className="text-[12px] font-light text-[#777777]">
              Tasks
            </h2>
            <div 
              className="h-[1px] w-full mt-2" 
              style={{
                background: 'linear-gradient(to right, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0) 100%)'
              }}
            />
          </div>

          {/* Task Compact List */}
          <div className="mt-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-[#130F14] rounded-[24px] p-10 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#130F14] text-[#777777] flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D2A26] text-zinc-100">No tasks found</h3>
              <p className="text-xs text-[#7A746D] text-zinc-400 mt-1">
                {searchQuery
                  ? 'Try clearing your search query.'
                  : 'Start tracking by tapping "+" at the top right.'}
              </p>
            </div>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={filteredTasks} 
            onReorder={handleReorder}
            className="flex flex-col"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <Reorder.Item 
                  key={task.id} 
                  value={task}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <TaskCompactRow
                    task={task}
                    onClickTask={(t) => setDetailTask(t)}
                  />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
          </div>
        </div>

      </main>

      {/* Modals */}
      <AnimatePresence>
        {isAddTaskOpen && (
          <AddTaskModal
            isOpen={isAddTaskOpen}
            onClose={() => setIsAddTaskOpen(false)}
            onSave={handleAddTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!detailTask && (
          <TaskDetailModal
            task={detailTask}
            isOpen={!!detailTask}
            onClose={() => setDetailTask(null)}
            onEdit={(t) => setEditingTask(t)}
            onDelete={handleDeleteTask}
            onAddHistoryEntry={handleAddHistoryEntry}
            onDeleteHistoryEntry={handleDeleteHistoryEntry}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!editingTask && (
          <EditTaskModal
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleSaveEditTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={(newS) => setSettings((s) => ({ ...s, ...newS }))}
            tasks={tasks}
            onResetTasks={handleResetTasks}
            onImportTasks={handleImportTasks}
          />
        )}
      </AnimatePresence>
    </div>
  );
}