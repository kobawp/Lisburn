import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Reorder, AnimatePresence, motion } from 'motion/react';
import { 
  Task, 
  AppSettings, 
  SortOption 
} from './types';
import { registerServiceWorker, requestNotificationPermission } from './utils/notifications';
import { TaskCompactRow } from './components/TaskCompactRow';
import { CustomReorderList } from './components/CustomReorderList';
import { AddTaskModal } from './components/AddTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ArrowUpDown, Search, Clock, Plus, Settings, X, Cloud } from 'lucide-react';
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
    saveTask,
    deleteTask,
    saveSettings,
    reorderTasks,
    handleSignOut,
    activeSyncCode,
    updateSyncCode
  } = useFirebaseSync();
  
  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const { containerRef: mainRef } = useOverscrollBounce<HTMLDivElement>();

  // Register service worker and handle initial notification permission on app launch
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

  const handleSortChange = (newSort: SortOption) => {
    // Autosave current order before switching
    if (!searchQuery.trim()) {
      reorderTasks(filteredTasks);
    }
    saveSettings({ ...settings, sortBy: newSort });
    setIsSortMenuOpen(false);
  };

  // Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

    const newEntry = {
      id: 'hist-' + Date.now(),
      timestamp: isoTimestamp,
      note: note || ''
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
    let newLastCompletedAt = target.lastCompletedAt;
    if (updatedHistory.length > 0) {
      newLastCompletedAt = updatedHistory[0].timestamp;
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
    importedTasks.forEach((t) => saveTask(t));
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

  const isCustomSort = currentSort === 'custom' && !searchQuery.trim();

  const handleReorder = (reordered: Task[]) => {
    // Only allow reordering if there is no active search query and sorting is custom
    if (isCustomSort) {
      reorderTasks(reordered);
    }
  };

  const isAnyModalOpen = isAddTaskOpen || !!editingTask || isSettingsOpen || !!detailTask;

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
                className="p-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
                aria-label="Sort"
              >
                <ArrowUpDown className="w-6 h-6" />
              </button>
              <AnimatePresence>
                {isSortMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -6 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 mt-2 w-44 bg-[#130F14] border border-[#2D2A26] rounded-xl shadow-lg z-50 py-1 origin-top-left overflow-hidden"
                  >
                    <button 
                      onClick={() => handleSortChange('latest')} 
                      className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26] transition-colors"
                    >
                      <span>Latest</span>
                      {currentSort === 'latest' && <span className="text-[#d7ae4c] font-bold text-base leading-none">•</span>}
                    </button>
                    <button 
                      onClick={() => handleSortChange('earliest')} 
                      className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26] transition-colors"
                    >
                      <span>Earliest</span>
                      {currentSort === 'earliest' && <span className="text-[#d7ae4c] font-bold text-base leading-none">•</span>}
                    </button>
                    <button 
                      onClick={() => handleSortChange('name')} 
                      className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26] transition-colors"
                    >
                      <span>Name</span>
                      {currentSort === 'name' && <span className="text-[#d7ae4c] font-bold text-base leading-none">•</span>}
                    </button>
                    <button 
                      onClick={() => handleSortChange('custom')} 
                      className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2D2A26] transition-colors"
                    >
                      <span>Custom Order</span>
                      {currentSort === 'custom' && <span className="text-[#d7ae4c] font-bold text-base leading-none">•</span>}
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
            onUpdateSettings={(newS) => saveSettings({ ...settings, ...newS })}
            tasks={tasks}
            onResetTasks={handleResetTasks}
            onImportTasks={handleImportTasks}
            user={user}
            syncStatus={syncStatus}
        activeSyncCode={activeSyncCode}
        updateSyncCode={updateSyncCode}
            onSignOut={handleSignOut}
          />
        )}
      </AnimatePresence>
    </div>
  );
}