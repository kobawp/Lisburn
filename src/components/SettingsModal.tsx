import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { AppSettings, Task } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  tasks: Task[];
  onResetTasks: () => void;
  onImportTasks: (tasks: Task[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  tasks,
  onResetTasks,
  onImportTasks
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetState, setResetState] = useState<'idle' | 'confirm1' | 'confirm2' | 'done'>('idle');
  const [startY, setStartY] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY !== null) {
      const currentY = e.changedTouches[0].clientY;
      const diff = currentY - startY;
      if (diff > 100) {
        onClose();
      }
      setStartY(null);
    }
  };


  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `days-since-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportTasks(parsed);
          alert('Tasks imported successfully!');
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
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[#09050A]">
      
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        className="w-full max-w-2xl mx-auto flex-1 flex flex-col overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
                  onClick={() => onUpdateSettings({ allowNotifications: !settings.allowNotifications })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${settings.allowNotifications ? 'bg-[#AB70D5]' : 'bg-[#261C29]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.allowNotifications ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
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
                      <input 
                        type="time" 
                        value={settings.quietHoursFrom}
                        onChange={(e) => onUpdateSettings({ quietHoursFrom: e.target.value })}
                        className="bg-[#261C29] text-white px-3 py-1.5 rounded-full text-[14px] font-normal focus:outline-none focus:ring-1 focus:ring-[#AB70D5]"
                      />
                    </div>
                    <div className="h-px w-full bg-[#261C29]"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-normal text-white">To</span>
                      <input 
                        type="time" 
                        value={settings.quietHoursTo}
                        onChange={(e) => onUpdateSettings({ quietHoursTo: e.target.value })}
                        className="bg-[#261C29] text-white px-3 py-1.5 rounded-full text-[14px] font-normal focus:outline-none focus:ring-1 focus:ring-[#AB70D5]"
                      />
                    </div>
                  </div>
                )}
              </div>
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
                <span className="text-[#777777]">Lisburn</span> allows you to remember past tasks when your memory gets fuzzy. Record something after you've done it and forget it about.
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
