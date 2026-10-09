import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, Cloud, CloudCheck, CloudOff, RefreshCw, Key, Copy, Shuffle, ArrowRight, User as UserIcon, Globe } from 'lucide-react';
import { AppSettings, Task } from '../types';
import { useOverscrollBounce } from '../hooks/useOverscrollBounce';
import { requestNotificationPermission, registerServiceWorker, sendWebNotification, subscribeToWebPush } from '../utils/notifications';
import { User } from '../lib/firebase';
import { 
  getDeviceTimeZone, 
  getEffectiveTimeZone, 
  getTimeZoneOffset, 
  getTimeZoneName, 
  formatCurrentTimeInZone, 
  POPULAR_TIMEZONES 
} from '../utils/timezone';

import { isSideloadedApp } from '../utils/env';

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
  lastSyncedAt?: Date | null;
  onSyncNow?: () => Promise<{ success: boolean; message: string; count?: number }>;
  onSignOut?: () => void;
  onSignInWithGoogle?: () => void;
  onOpenFaq?: () => void;
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
  lastSyncedAt,
  onSyncNow,
  onSignOut,
  onSignInWithGoogle,
  onOpenFaq
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetState, setResetState] = useState<'idle' | 'confirm1' | 'confirm2' | 'done'>('idle');
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const { containerRef } = useOverscrollBounce<HTMLDivElement>();

  const deviceTz = getDeviceTimeZone();
  const effectiveTz = getEffectiveTimeZone(settings.timeZone);
  const currentTzOffset = getTimeZoneOffset(effectiveTz);
  const currentTzName = getTimeZoneName(effectiveTz);
  const currentLocalTime = formatCurrentTimeInZone(effectiveTz);

  const handleManualSync = async () => {
    if (!onSyncNow || isManualSyncing) return;
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await onSyncNow();
      setSyncFeedback(res.message);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 4000);
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Sync failed.');
      setTimeout(() => {
        setSyncFeedback(null);
      }, 4000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSynced = (date?: Date | null) => {
    if (!date) return 'Not yet synced';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 30) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

          {/* Account & Cloud Sync */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Account & Cloud Sync</h3>
            <div className="bg-[#130F14] rounded-[24px] overflow-hidden p-5 flex flex-col items-center">
              {user && !user.isAnonymous ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-3 bg-[#1C151E] p-4 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-[#AB70D5]/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-[#AB70D5]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[14px] font-bold truncate">
                        {user.displayName || "Google Account"}
                      </p>
                      <p className="text-[#A0A0A0] text-[12px] truncate">
                        {user.email || "Signed in"}
                      </p>
                    </div>
                  </div>

                  {/* Sync Status Banner */}
                  <div className="bg-[#1C151E]/60 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncStatus === 'error' ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${syncStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                      </span>
                      <div>
                        <p className="text-[13px] font-medium text-white">
                          {syncStatus === 'error' ? 'Sync Attention Needed' : isManualSyncing || syncStatus === 'syncing' ? 'Syncing with Cloud...' : 'Cloud Connected'}
                        </p>
                        <p className="text-[11px] text-[#777777]">
                          Last synced: {formatLastSynced(lastSyncedAt)} • {tasks.length} task{tasks.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sync Feedback Message */}
                  {syncFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#261C29] border border-[#AB70D5]/30 text-[#AB70D5] text-[12px] font-medium px-3.5 py-2 rounded-xl text-center flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-[#AB70D5]" />
                      {syncFeedback}
                    </motion.div>
                  )}

                  {/* Sync Now Button */}
                  <button
                    onClick={handleManualSync}
                    disabled={isManualSyncing || syncStatus === 'syncing'}
                    className="w-full py-3.5 bg-[#AB70D5] hover:bg-[#9758C4] active:scale-[0.99] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#AB70D5]/20"
                  >
                    <RefreshCw className={`w-4 h-4 ${isManualSyncing || syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    {isManualSyncing || syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                  </button>

                  <button
                    onClick={onSignOut}
                    className="w-full py-2.5 bg-transparent hover:bg-white/5 text-[#777777] hover:text-white rounded-xl text-[13px] font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <p className="text-[13px] text-[#A0A0A0] text-center leading-relaxed">
                    Sign in with Google to securely back up your tasks and sync them across all your devices in real-time.
                  </p>
                  <button
                    onClick={onSignInWithGoogle}
                    className="w-full py-3.5 bg-white text-[#09050A] hover:bg-[#E4E4E7] rounded-xl text-[14px] font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              )}
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
                        await subscribeToWebPush();
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
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 text-base"
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
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 text-base"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time Zone */}
          <div>
            <h3 className="text-[14px] font-bold text-[#777777] mb-2 px-1">Time Zone</h3>
            <div className="bg-[#130F14] rounded-[24px] overflow-hidden">
              <div className="relative px-5 py-4 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors cursor-pointer group">
                <select
                  title="Select Time Zone"
                  value={settings.timeZone || 'auto'}
                  onChange={(e) => onUpdateSettings({ timeZone: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-base"
                >
                  <option value="auto">Automatic (Detected: {deviceTz.split('/').pop()?.replace(/_/g, ' ')})</option>
                  {POPULAR_TIMEZONES.filter(tz => tz.value !== 'auto').map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({getTimeZoneOffset(tz.value)})
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] font-medium text-white flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-[#AB70D5]" />
                    {settings.timeZone && settings.timeZone !== 'auto' 
                      ? settings.timeZone.split('/').pop()?.replace(/_/g, ' ') 
                      : 'Automatic'}
                  </span>
                  <span className="text-[13px] font-semibold text-[#AB70D5] bg-[#AB70D5]/15 px-2 py-0.5 rounded-lg">
                    {currentLocalTime}
                  </span>
                </div>
                
                <div className="text-[12px] text-[#777777] pl-[26px] flex items-center justify-between">
                  <span>
                    {(!settings.timeZone || settings.timeZone === 'auto') && `${deviceTz.split('/').pop()?.replace(/_/g, ' ')} • `}
                    {currentTzName} • {currentTzOffset}
                  </span>
                  <span className="text-[11px] text-[#555555] group-hover:text-[#777777] transition-colors">Change</span>
                </div>
              </div>

              <div className="h-px w-[calc(100%-2.5rem)] ml-5 bg-[#261C29]"></div>
              
              <div className="px-5 py-3 text-[11px] font-light text-[#555555] leading-relaxed">
                Task histories, due dates, and quiet hours are synced to this zone.
              </div>
            </div>
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
              <button 
                onClick={onOpenFaq}
                className="w-full text-left px-5 py-4 text-[14px] font-normal text-[#d7ae4c] hover:bg-[#1C151E] transition-colors"
              >
                FAQ & Help
              </button>
              
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
              
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-[14px] font-normal text-white">Version</span>
                <span className="text-[14px] font-normal text-[#777777]">0.1.0</span>
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
