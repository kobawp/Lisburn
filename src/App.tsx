import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Reorder, AnimatePresence, motion } from 'motion/react';
import { 
  Task, 
  AppSettings, 
  SortOption 
} from './types';
import { registerServiceWorker, requestNotificationPermission, subscribeToWebPush } from './utils/notifications';
import { TaskCompactRow } from './components/TaskCompactRow';
import { formatTimeInZone } from './utils/timezone';
import { CustomReorderList } from './components/CustomReorderList';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { FaqModal } from './components/FaqModal';
import { ArrowUpDown, ArrowDown, ArrowUp, Search, Clock, Plus, Settings, X, Cloud, Check } from 'lucide-react';
import { useOverscrollBounce } from './hooks/useOverscrollBounce';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { useiOSKeyboardFix } from './hooks/useiOSKeyboardFix';

export default function App() {
  useiOSKeyboardFix();

  const {
    user,
    tasks,
    settings,
    syncStatus,
    lastSyncedAt,
    syncNow,
    importTasks,
    saveTask,
    deleteTask,
    saveSettings,
    reorderTasks,
    handleSignInWithGoogle,
    handleSignOut
  } = useFirebaseSync();
  
  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const { containerRef: mainRef } = useOverscrollBounce<HTMLDivElement>();

  // Register service worker and handle initial notification permission on app launch

  // Auto-subscribe to Web Push
  useEffect(() => {
    if (user && settings.allowNotifications) {
      subscribeToWebPush();
    }
  }, [user, settings.allowNotifications]);

  useEffect(() => {
    registerServiceWorker();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted' && !settings.allowNotifications) {
        saveSettings({ ...settings, allowNotifications: true });
      } else if (Notification.permission === 'default') {
        const hasPrompted = localStorage.getItem('lisburn_notifications_prompted');
        if (!hasPrompted) {
          localStorage.setItem('lisburn_notifications_prompted', 'true');
          requestNotificationPermission().then((permission) => {
            if (permission === 'granted') {
              saveSettings({ ...settings, allowNotifications: true });
            }
          });
        }
      }
    }
  }, []);

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

  const handleSortCategoryClick = (category: 'created' | 'name' | 'last_done' | 'custom') => {
    let newSort: SortOption = 'custom';

    if (category === 'created') {
      if (currentSort === 'created_desc' || currentSort === 'latest') {
        newSort = 'created_asc';
      } else {
        newSort = 'created_desc';
      }
    } else if (category === 'name') {
      if (currentSort === 'name_asc' || currentSort === 'name') {
        newSort = 'name_desc';
      } else {
        newSort = 'name_asc';
      }
    } else if (category === 'last_done') {
      if (currentSort === 'last_done_desc') {
        newSort = 'last_done_asc';
      } else {
        newSort = 'last_done_desc';
      }
    } else if (category === 'custom') {
      newSort = 'custom';
    }


    saveSettings({ ...settings, sortBy: newSort });
  };

  // Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

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
  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'history'> & { initialReference?: string }) => {
    const nowISO = new Date().toISOString();
    // Separate out initialReference so it doesn't get spread into Task
    const { initialReference, ...baseTaskData } = taskData as any;
    
    let finalNote = (initialReference || '').trim();
    if (baseTaskData.lastCompletedAt && !finalNote) {
      finalNote = formatTimeInZone(baseTaskData.lastCompletedAt, settings.timeZone);
    }

    const newTask: Task = {
      ...baseTaskData,
      id: 'task-' + Date.now(),
      createdAt: nowISO,
      history: baseTaskData.lastCompletedAt ? [
        {
          id: 'hist-' + Date.now(),
          timestamp: baseTaskData.lastCompletedAt,
          note: finalNote
        }
      ] : [],
      order: tasks.length
    };
    saveTask(newTask);
  };

  // Edit Task
  const handleSaveEditTask = (updatedTask: Task) => {
    saveTask(updatedTask);
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    if (detailTask?.id === taskId) {
      setDetailTask(null);
    }
  };

  // Add Manual History Entry in Task Detail
  const handleAddHistoryEntry = (taskId: string, isoTimestamp: string, note?: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    let finalNote = (note || '').trim();
    if (!finalNote) {
      finalNote = formatTimeInZone(isoTimestamp, settings.timeZone);
    }

    const newEntry = {
      id: 'hist-' + Date.now(),
      timestamp: isoTimestamp,
      note: finalNote
    };

    const combined = [newEntry, ...target.history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const updatedTask: Task = {
      ...target,
      lastCompletedAt: combined[0].timestamp,
      history: combined
    };
    saveTask(updatedTask);
  };

  // Delete History Entry
  const handleDeleteHistoryEntry = (taskId: string, entryId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const updatedHistory = target.history.filter((h) => h.id !== entryId);
    
    // Sort to ensure newest first in case deletion removed the top one
    const sortedHistory = [...updatedHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let newLastCompletedAt = sortedHistory.length > 0 ? sortedHistory[0].timestamp : null;

    const updatedTask: Task = {
      ...target,
      lastCompletedAt: newLastCompletedAt,
      history: sortedHistory
    };
    saveTask(updatedTask);
  };

  // Edit History Entry
  const handleEditHistoryEntry = (taskId: string, entryId: string, isoTimestamp: string, note: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    let finalNote = note.trim();
    if (!finalNote) {
      finalNote = formatTimeInZone(isoTimestamp, settings.timeZone);
    }

    const updatedHistory = target.history.map((h) => 
      h.id === entryId ? { ...h, timestamp: isoTimestamp, note: finalNote } : h
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let newLastCompletedAt = target.lastCompletedAt;
    if (updatedHistory.length > 0) {
      newLastCompletedAt = updatedHistory[0].timestamp;
    } else {
      newLastCompletedAt = null;
    }

    const updatedTask: Task = {
      ...target,
      lastCompletedAt: newLastCompletedAt,
      history: updatedHistory
    };
    saveTask(updatedTask);
  };

  // Reset Data to Defaults
  const handleResetTasks = () => {
    tasks.forEach((t) => deleteTask(t.id));
  };

  // Import Tasks
  const handleImportTasks = (importedTasks: Task[]) => {
    importTasks(importedTasks);
  };

  // Filter tasks
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

    if (currentSort === 'created_desc' || currentSort === 'latest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (currentSort === 'created_asc' || currentSort === 'earliest') {
      result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (currentSort === 'name_asc' || currentSort === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    } else if (currentSort === 'name_desc') {
      result = [...result].sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }));
    } else if (currentSort === 'last_done_desc') {
      result = [...result].sort((a, b) => {
        if (!a.lastCompletedAt && !b.lastCompletedAt) return 0;
        if (!a.lastCompletedAt) return 1;
        if (!b.lastCompletedAt) return -1;
        return new Date(b.lastCompletedAt).getTime() - new Date(a.lastCompletedAt).getTime();
      });
    } else if (currentSort === 'last_done_asc') {
      result = [...result].sort((a, b) => {
        if (!a.lastCompletedAt && !b.lastCompletedAt) return 0;
        if (!a.lastCompletedAt) return 1;
        if (!b.lastCompletedAt) return -1;
        return new Date(a.lastCompletedAt).getTime() - new Date(b.lastCompletedAt).getTime();
      });
    } else if (currentSort === 'custom') {
      result = [...result].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    return result;
  }, [tasks, searchQuery, currentSort]);

  const isCustomSort = currentSort === 'custom' && !searchQuery.trim();

  const handleReorder = (reordered: Task[]) => {
    // Only allow reordering if there is no active search query and sorting is custom
    if (isCustomSort) {
      reorderTasks(reordered);
    }
  };

  const isAnyModalOpen = isAddTaskOpen || !!editingTask || isSettingsOpen || !!detailTask || isFaqOpen;

  return (
    <div 
      className="min-h-screen bg-[#09050A] text-[#4A443F] text-zinc-200 flex flex-col font-sans transition-colors duration-200 overscroll-none"
    >
      {/* Main Content Area */}
      <main 
        ref={mainRef}
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-[54px] pb-12 flex flex-col"
        style={{ display: isAnyModalOpen ? 'none' : 'flex' }}
      >
        
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
                className={`p-2 transition-colors focus:outline-none ${
                  currentSort !== 'custom' ? 'text-[#AB70D5] hover:text-[#9758C4]' : 'text-white hover:text-[#777777]'
                }`}
                aria-label="Sort"
              >
                <ArrowUpDown className="w-6 h-6" />
              </button>
              <AnimatePresence>
                {isSortMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.94, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 mt-2 w-56 bg-[#130F14] border border-[#2D2A26] rounded-2xl shadow-2xl z-50 py-1.5 origin-top-left overflow-hidden divide-y divide-white/5"
                  >
                    {/* Date Created */}
                    <button 
                      onClick={() => handleSortCategoryClick('created')} 
                      className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                        currentSort === 'created_desc' || currentSort === 'created_asc' || currentSort === 'latest' || currentSort === 'earliest'
                          ? 'bg-[#1C151E] text-white font-semibold'
                          : 'text-[#A09B95] hover:text-white hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span>Date Created</span>
                      <div className="flex items-center gap-1">
                        {(currentSort === 'created_desc' || currentSort === 'latest') && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                            <span>Newest</span>
                            <ArrowDown className="w-3 h-3 text-[#AB70D5]" />
                          </span>
                        )}
                        {(currentSort === 'created_asc' || currentSort === 'earliest') && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                            <span>Oldest</span>
                            <ArrowUp className="w-3 h-3 text-[#AB70D5]" />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Name */}
                    <button 
                      onClick={() => handleSortCategoryClick('name')} 
                      className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                        currentSort === 'name_asc' || currentSort === 'name_desc' || currentSort === 'name'
                          ? 'bg-[#1C151E] text-white font-semibold'
                          : 'text-[#A09B95] hover:text-white hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span>Name</span>
                      <div className="flex items-center gap-1">
                        {(currentSort === 'name_asc' || currentSort === 'name') && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                            <span>A → Z</span>
                            <ArrowUp className="w-3 h-3 text-[#AB70D5]" />
                          </span>
                        )}
                        {currentSort === 'name_desc' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                            <span>Z → A</span>
                            <ArrowDown className="w-3 h-3 text-[#AB70D5]" />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Last Done */}
                    <button 
                      onClick={() => handleSortCategoryClick('last_done')} 
                      className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                        currentSort === 'last_done_desc' || currentSort === 'last_done_asc'
                          ? 'bg-[#1C151E] text-white font-semibold'
                          : 'text-[#A09B95] hover:text-white hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span>Last Done</span>
                      <div className="flex items-center gap-1">
                        {currentSort === 'last_done_desc' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                            <span>Recent</span>
                            <ArrowDown className="w-3 h-3 text-[#AB70D5]" />
                          </span>
                        )}
                        {currentSort === 'last_done_asc' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                            <span>Oldest</span>
                            <ArrowUp className="w-3 h-3 text-[#AB70D5]" />
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Custom Order */}
                    <button 
                      onClick={() => handleSortCategoryClick('custom')} 
                      className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                        currentSort === 'custom' || !currentSort
                          ? 'bg-[#1C151E] text-white font-semibold'
                          : 'text-[#A09B95] hover:text-white hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span>Custom Order</span>
                      <div className="flex items-center gap-1">
                        {(currentSort === 'custom' || !currentSort) && (
                          <span className="text-[11px] font-bold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                            Manual
                          </span>
                        )}
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
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
            <motion.span 
              className="font-bold"
              animate={{ color: ['#777777', '#ab70d5', '#777777'] }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity
              }}
            >
              burn.
            </motion.span>
          </h1>
          <p className="text-[#777777] font-light text-[12px] mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Search Bar */}
        <div ref={searchBarRef} className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[#777777]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            enterKeyHint="search"
            className="w-full pl-12 pr-10 py-2.5 bg-[#130F14] rounded-full text-[16px] text-[#2D2A26] text-zinc-100 placeholder-[#777777] focus:outline-none transition-colors select-text touch-auto"
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
              {!searchQuery && (
                <button
                  onClick={() => setIsFaqOpen(true)}
                  className="mt-6 px-5 py-2.5 bg-[#1C151E] hover:bg-[#261C29] text-[#d7ae4c] text-[13px] font-bold rounded-full transition-colors"
                >
                  How does Lisburn work?
                </button>
              )}
            </div>
          </div>
        ) : (
          <CustomReorderList
            tasks={filteredTasks}
            isCustomSort={isCustomSort}
            onReorder={handleReorder}
            onClickTask={(t) => setDetailTask(t)}
            searchBarRef={searchBarRef}
          />
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
            timeZone={settings.timeZone}
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
            onEditHistoryEntry={handleEditHistoryEntry}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!!editingTask && (
          <EditTaskModal
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => {
              // Ensure we restore the task from the current list in case they cancelled
              if (editingTask) {
                setDetailTask(tasks.find(t => t.id === editingTask.id) || null);
              }
              setEditingTask(null);
            }}
            onSave={(updated) => {
              handleSaveEditTask(updated);
              setDetailTask(updated);
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={(newS) => saveSettings({ ...settings, ...newS })}
            tasks={tasks}
            onResetTasks={handleResetTasks}
            onImportTasks={handleImportTasks}
            user={user}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
            onSyncNow={syncNow}
            onSignOut={handleSignOut}
            onSignInWithGoogle={handleSignInWithGoogle}
            onOpenFaq={() => setIsFaqOpen(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFaqOpen && (
          <FaqModal
            isOpen={isFaqOpen}
            onClose={() => setIsFaqOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}