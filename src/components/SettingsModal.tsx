import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Cloud, CloudCheck, CloudOff, RefreshCw, Key, Copy, Shuffle, ArrowRight } from 'lucide-react';
import { AppSettings, Task } from '../types';
import { useOverscrollBounce } from '../hooks/useOverscrollBounce';
import { requestNotificationPermission, registerServiceWorker, sendWebNotification } from '../utils/notifications';
import { User } from '../lib/firebase';

import { isSideloadedApp } from '../utils/env';
import { generateSyncCode } from '../utils/syncCode';

const formatTimeString = (timeStr: string): string => {
  if (!timeStr) return '10:00 PM';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hourStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hourStr}:${minutes} ${ampm}`;
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  tasks: Task[];
  onResetTasks: () => void;
  onImportTasks: (tasks: Task[]) => void;
  user?: User | null;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  onSignOut?: () => void;
  activeSyncCode?: string;
  updateSyncCode?: (c: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  tasks,
  onResetTasks,
  onImportTasks,
  user,
  syncStatus = 'synced',
  onSignOut,
  activeSyncCode = '',
  updateSyncCode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingSync, setIsEditingSync] = useState(false);
  const [syncInput, setSyncInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [resetState, setResetState] = useState<'idle' | 'confirm1' | 'confirm2' | 'done'>('idle');
  const { containerRef } = useOverscrollBounce<HTMLDivElement>();

  const handleExportJSON = async () => {
    const filename = `days-since-backup-${new Date().toISOString().slice(0, 10)}.json`;
    // Ensure all fields including notes, specific completion notes, and history are included
    const exportTasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      category: t.category || 'General',
      icon: t.icon || '📌',
      color: t.color || 'indigo',
      lastCompletedAt: t.lastCompletedAt || null,
      reminderIntervalHours: t.reminderIntervalHours ?? null,
      createdAt: t.createdAt || new Date().toISOString(),
      history: Array.isArray(t.history)
        ? t.history.map((h) => ({
            id: h.id,
            timestamp: h.timestamp,
            note: h.note || ''
          }))
        : []
    }));

    const jsonStr = JSON.stringify(exportTasks, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });

    // Try Web Share API first for native iOS "Save to Files"
    if (navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Days Since Backup',
          });
          return;
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: Blob URL download anchor
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    setTimeout(() => {
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let rawList: any[] = [];

        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.tasks)) {
            rawList = parsed.tasks;
          } else if (Array.isArray(parsed.data)) {
            rawList = parsed.data;
          }
        }

        if (rawList.length > 0 || (Array.isArray(parsed) && parsed.length === 0)) {
          const sanitizedTasks: Task[] = rawList.map((item, index) => {
            const rawHistory = Array.isArray(item.history) ? item.history : [];
            const history = rawHistory.map((h: any, hIdx: number) => ({
              id: typeof h.id === 'string' && h.id ? h.id : `hist-${Date.now()}-${index}-${hIdx}`,
              timestamp: typeof h.timestamp === 'string' && !isNaN(Date.parse(h.timestamp))
                ? new Date(h.timestamp).toISOString()
                : new Date().toISOString(),
              note: typeof h.note === 'string' ? h.note : (typeof h.notes === 'string' ? h.notes : '')
            }));

            let lastCompletedAt = item.lastCompletedAt ?? null;
            if (lastCompletedAt && typeof lastCompletedAt === 'string' && !isNaN(Date.parse(lastCompletedAt))) {
              lastCompletedAt = new Date(lastCompletedAt).toISOString();
            } else if (history.length > 0) {
              lastCompletedAt = history[0].timestamp;
            } else {
              lastCompletedAt = null;
            }

            return {
              id: typeof item.id === 'string' && item.id ? item.id : `task-${Date.now()}-${index}`,
              title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Untitled Task',
              description: typeof item.description === 'string'
                ? item.description
                : (typeof item.note === 'string' ? item.note : (typeof item.notes === 'string' ? item.notes : '')),
              category: typeof item.category === 'string' ? item.category : 'General',
              icon: typeof item.icon === 'string' ? item.icon : '📌',
              color: typeof item.color === 'string' ? item.color : 'indigo',
              lastCompletedAt,
              reminderIntervalHours: typeof item.reminderIntervalHours === 'number' ? item.reminderIntervalHours : null,
              history,
              createdAt: typeof item.createdAt === 'string' && !isNaN(Date.parse(item.createdAt))
                ? new Date(item.createdAt).toISOString()
                : new Date().toISOString()
            };
          });

          onImportTasks(sanitizedTasks);
          alert(`Successfully imported ${sanitizedTasks.length} task${sanitizedTasks.length === 1 ? '' : 's'}!`);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-y-auto h-[var(--vv-height,100dvh)] max-h-[var(--vv-height,100dvh)]">
      
      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="w-full max-w-2xl mx-auto flex-1 flex flex-col overflow-y-auto no-scrollbar touch-pan-y overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 pt-[54px] pb-24 space-y-8">
          
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">Settings</h2>
            <button onClick={onClose} className="p-2 -mr-2 text-white hover:text-[#777777] transition-colors focus:outline-none">
              <Check className="w-8 h-8 stroke-[3]" />
            </button>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Appearance</h3>
            <div className="bg-[#130F14] rounded-[24px] px-5 py-4">
              <span className="text-[14px] font-normal text-white">
                You already look good twinem ;)
              </span>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Notifications</h3>
            <div className="bg-[#130F14] rounded-[24px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-[14px] font-normal text-white">Allow Notifications</span>
                <button 
                  onClick={async () => {
                    const nextVal = !settings.allowNotifications;
                    if (nextVal) {
                      if (isSideloadedApp()) {
                        alert('Push Notifications are not supported in the sideloaded app. Please use the Web App at lisburn.ai.studio (Add to Home Screen) to enable Web Push.');
                        onUpdateSettings({ allowNotifications: false });
                        return;
                      }
                      
                      await registerServiceWorker();
                      const permission = await requestNotificationPermission();
                      if (permission === 'granted') {
                        onUpdateSettings({ allowNotifications: true });
                        sendWebNotification('Notifications Enabled', {
                          body: 'You will receive notifications for task reminders!',
                          settings
                        });
                      } else if (permission === 'unsupported') {
                        alert('Web Notifications are not supported in this browser mode. On iOS, tap "Share" in Safari and select "Add to Home Screen" to enable Web Push notifications.');
                        onUpdateSettings({ allowNotifications: false });
                      } else {
                        alert('Notification permission was denied. Please allow notifications in your device or browser settings.');
                        onUpdateSettings({ allowNotifications: false });
                      }
                    } else {
                      onUpdateSettings({ allowNotifications: false });
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.allowNotifications ? 'bg-[#AB70D5]' : 'bg-[#261C29]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.allowNotifications ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <p className="text-[11px] text-[#777777] px-5 -mt-2 pb-3 font-light leading-relaxed">
                {isSideloadedApp() 
                  ? "Notifications are not supported in the sideloaded app. Please use the Web App for push notifications."
                  : "On iOS, tap 'Share' in Safari and select 'Add to Home Screen' to enable Web Push."}
              </p>
              
              <div className="h-px w-[calc(100%-2.5rem)] ml-5 bg-[#261C29]"></div>
              
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-normal text-white">Quiet hours</span>
                  <button 
                    onClick={() => onUpdateSettings({ quietHoursEnabled: !settings.quietHoursEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.quietHoursEnabled ? 'bg-[#AB70D5]' : 'bg-[#261C29]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.quietHoursEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                
                {settings.quietHoursEnabled && (
                  <div className="mt-4 pt-4 border-t border-[#261C29] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-normal text-white">From</span>
                      <div className="relative inline-flex items-center gap-2 bg-[#201625] hover:bg-[#281c30] transition-colors px-3.5 py-1.5 rounded-full border border-white/5 cursor-pointer">
                        <span className="text-[14px] font-normal text-white tracking-wide select-none">
                          {formatTimeString(settings.quietHoursFrom)}
                        </span>
                        <Clock className="w-4 h-4 text-white/80 shrink-0" />
                        <input 
                          type="time" 
                          value={settings.quietHoursFrom}
                          onChange={(e) => onUpdateSettings({ quietHoursFrom: e.target.value })}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                      </div>
                    </div>
                    <div className="h-px w-full bg-[#261C29]"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-normal text-white">To</span>
                      <div className="relative inline-flex items-center gap-2 bg-[#201625] hover:bg-[#281c30] transition-colors px-3.5 py-1.5 rounded-full border border-white/5 cursor-pointer">
                        <span className="text-[14px] font-normal text-white tracking-wide select-none">
                          {formatTimeString(settings.quietHoursTo)}
                        </span>
                        <Clock className="w-4 h-4 text-white/80 shrink-0" />
                        <input 
                          type="time" 
                          value={settings.quietHoursTo}
                          onChange={(e) => onUpdateSettings({ quietHoursTo: e.target.value })}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cloud Sync & Account */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Cloud Sync (Multi-Device)</h3>
            <div className="bg-[#130F14] rounded-[24px] overflow-hidden p-5 space-y-5">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#AB70D5]" />
                    <h4 className="text-white text-[14px] font-medium">Your Active Sync Code:</h4>
                  </div>
                  {activeSyncCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeSyncCode);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[#AB70D5] rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between bg-[#1C151E] border border-white/5 rounded-xl p-4">
                  <code className="text-white font-mono font-bold tracking-[0.2em] text-lg">{activeSyncCode || 'Loading...'}</code>
                  <button
                    onClick={() => {
                      if (updateSyncCode) {
                        updateSyncCode(generateSyncCode());
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#777777] hover:text-white rounded-lg text-[12px] font-medium transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    New Code
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-[#A0A0A0] text-[13px]">Connect / Link another device's Sync Code:</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={syncInput}
                    onChange={(e) => setSyncInput(e.target.value.toUpperCase())}
                    placeholder="E.G. LISB-4819"
                    className="flex-1 w-full bg-[#1C151E] border border-white/5 text-white text-[16px] sm:text-[14px] rounded-xl px-4 py-3 outline-none focus:border-[#AB70D5]/50 uppercase tracking-widest font-mono"
                  />
                  <button
                    onClick={() => {
                      if (syncInput.trim().length > 4 && updateSyncCode) {
                        updateSyncCode(syncInput.trim());
                        setSyncInput('');
                      }
                    }}
                    disabled={syncInput.trim().length < 5}
                    className="flex items-center gap-2 px-5 py-3 bg-[#AB70D5]/20 hover:bg-[#AB70D5]/30 text-[#AB70D5] font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Link <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-[12px] text-[#777777] leading-relaxed pt-2">
                Enter the same Sync Code on your iPhone app, iPad, or web browser to automatically synchronize all tasks in real-time across devices.
              </p>
            </div>
          </div>

          {/* Backup and Restore */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Backup and Restore</h3>
            <div className="bg-[#130F14] rounded-[24px] overflow-hidden flex flex-col text-left">
              <button 
                onClick={handleExportJSON}
                className="w-full text-left px-5 py-4 text-[14px] font-normal text-[#d7ae4c] hover:bg-[#1C151E] transition-colors"
              >
                Export JSON (Backup)
              </button>
              
              <div className="h-px w-[calc(100%-2.5rem)] ml-5 bg-[#261C29]"></div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-5 py-4 text-[14px] font-normal text-[#d7ae4c] hover:bg-[#1C151E] transition-colors"
              >
                Import JSON (Restore)
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* Reset */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Reset</h3>
            <div className="bg-[#130F14] rounded-[24px] overflow-hidden">
              {resetState === 'idle' && (
                <button
                  onClick={() => setResetState('confirm1')}
                  className="w-full px-5 py-4 text-[14px] font-normal text-rose-500 hover:bg-[#1C151E] transition-colors text-left"
                >
                  Reset and delete all current tasks
                </button>
              )}
              {resetState === 'confirm1' && (
                <button
                  onClick={() => setResetState('confirm2')}
                  className="w-full px-5 py-4 text-[14px] font-bold text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 transition-colors text-left"
                >
                  Are you sure? Click to confirm
                </button>
              )}
              {resetState === 'confirm2' && (
                <button
                  onClick={() => {
                    onResetTasks();
                    setResetState('done');
                    setTimeout(() => setResetState('idle'), 3000);
                  }}
                  className="w-full px-5 py-4 text-[14px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors animate-pulse text-left"
                >
                  Cannot be undone! Click again to delete
                </button>
              )}
              {resetState === 'done' && (
                <div className="w-full px-5 py-4 text-[14px] font-bold text-emerald-400 bg-[#130F14] text-left">
                  All tasks have been deleted.
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-[14px] mb-2 px-1">
              <span className="font-bold text-[#777777]">About</span> <span className="font-bold text-white">Lisburn</span>
            </h3>
            <div className="bg-[#130F14] rounded-[24px] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-[14px] font-normal text-white">Version</span>
                <span className="text-[14px] font-normal text-white">0.1.0</span>
              </div>
              
              <div className="h-px w-[calc(100%-2.5rem)] ml-5 bg-[#261C29]"></div>
              
              <a 
                href="https://github.com/kobawp" 
                target="_blank" 
                rel="noreferrer"
                className="block w-full text-left px-5 py-4 text-[14px] font-normal text-[#d7ae4c] hover:bg-[#1C151E] transition-colors"
              >
                Support Me!
              </a>
              
              <div className="h-px w-[calc(100%-2.5rem)] ml-5 bg-[#261C29]"></div>
              
              <div className="px-5 py-4 text-[14px] font-normal text-white leading-relaxed">
                <span className="text-[#777777]">Lisburn</span> allows you to remember past, reoccuring tasks when your memory gets fuzzy. Record something after you've done it and forget about it.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pb-4">
            <span className="text-[10px] text-[#777777]">@kobawp</span>
          </div>



        </div>
      </div>



    </motion.div>
  );
};
