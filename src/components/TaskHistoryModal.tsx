import React, { useState } from 'react';
import { X, History, Plus, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Task, CompletionEntry } from '../types';
import { formatDateString } from '../utils/timeUtils';

interface TaskHistoryModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (taskId: string, entryId: string, note: string) => void;
  onDeleteHistoryEntry: (taskId: string, entryId: string) => void;
  onAddManualHistoryEntry: (taskId: string, isoTimestamp: string, note?: string) => void;
}

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({
  task,
  isOpen,
  onClose,
  onAddNote,
  onDeleteHistoryEntry,
  onAddManualHistoryEntry
}) => {
  if (!isOpen || !task) return null;

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showAddPastModal, setShowAddPastModal] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 16));
  const [manualNote, setManualNote] = useState('');

  const handleSaveNote = (entryId: string) => {
    onAddNote(task.id, entryId, noteText);
    setEditingEntryId(null);
    setNoteText('');
  };

  const handleAddManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDate) return;
    onAddManualHistoryEntry(task.id, new Date(manualDate).toISOString(), manualNote.trim());
    setShowAddPastModal(false);
    setManualNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2A26]/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#FDFBF7] border border-[#E8E4DE] rounded-[24px] shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DE] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F4E9FA] text-[#6B3B8A]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D2A26]">Completion History</h2>
              <p className="text-xs text-[#7A746D]">{task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A746D] hover:text-[#2D2A26] rounded-full hover:bg-[#F2EFE9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Top Add Past Entry Button */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E8E4DE]">
            <div>
              <p className="text-xs font-bold text-[#2D2A26]">Logged completions: {task.history.length}</p>
              <p className="text-[11px] text-[#7A746D]">Log past activity or add notes</p>
            </div>
            <button
              onClick={() => setShowAddPastModal(true)}
              className="flex items-center gap-1.5 bg-[#AB70D5] hover:bg-[#9759C4] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Past Entry</span>
            </button>
          </div>

          {/* Add Manual Entry Sub-Form */}
          {showAddPastModal && (
            <form onSubmit={handleAddManualSubmit} className="bg-[#F4E9FA]/60 border border-[#AB70D5]/40 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B3B8A]">Add Historical Entry</span>
                <button 
                  type="button" 
                  onClick={() => setShowAddPastModal(false)}
                  className="text-[#7A746D] hover:text-[#2D2A26] text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#7A746D] mb-1">Date & Time Completed</label>
                <input
                  type="datetime-local"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-white border border-[#E8E4DE] rounded-xl px-3 py-1.5 text-xs text-[#2D2A26]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#7A746D] mb-1">Optional Note</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="e.g. Changed at Valvoline, used synthetic oil"
                  className="w-full bg-white border border-[#E8E4DE] rounded-xl px-3 py-1.5 text-xs text-[#2D2A26]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#AB70D5] hover:bg-[#9759C4] text-white text-xs font-bold rounded-full shadow-2xs"
              >
                Save Past Entry
              </button>
            </form>
          )}

          {/* History Timeline List */}
          {task.history.length === 0 ? (
            <div className="text-center py-8 text-[#9A948D] text-xs font-medium">
              No completion history entries recorded yet. Click "Mark Done Today" to log your first entry!
            </div>
          ) : (
            <div className="relative border-l-2 border-[#AB70D5]/40 ml-3 pl-4 space-y-4">
              {task.history.map((entry, idx) => (
                <div key={entry.id || idx} className="relative group">
                  
                  {/* Timeline Dot */}
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#AB70D5] ring-4 ring-[#FDFBF7]" />

                  <div className="bg-white p-3.5 rounded-2xl border border-[#E8E4DE] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D2A26]">
                        <Calendar className="w-3.5 h-3.5 text-[#6B3B8A]" />
                        <span>{formatDateString(entry.timestamp)}</span>
                      </div>
                      
                      {/* Delete Entry */}
                      <button
                        onClick={() => onDeleteHistoryEntry(task.id, entry.id)}
                        className="text-[#9A948D] hover:text-[#B91C1C] p-1 rounded-full hover:bg-[#FEE2E2]"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Entry Note */}
                    {editingEntryId === entry.id ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add note..."
                          className="w-full bg-[#FDFBF7] border border-[#E8E4DE] rounded-xl px-2.5 py-1 text-xs text-[#2D2A26]"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveNote(entry.id)}
                            className="bg-[#AB70D5] hover:bg-[#9759C4] text-white text-[11px] font-bold px-3 py-1 rounded-full"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingEntryId(null)}
                            className="text-[#7A746D] text-[11px] px-2 py-1 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-[#4A443F] italic">
                          {entry.note ? `"${entry.note}"` : <span className="text-[#9A948D] not-italic">No notes attached</span>}
                        </p>
                        <button
                          onClick={() => {
                            setEditingEntryId(entry.id);
                            setNoteText(entry.note || '');
                          }}
                          className="text-[11px] font-semibold text-[#6B3B8A] hover:underline shrink-0"
                        >
                          {entry.note ? 'Edit note' : '+ Add note'}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

        <div className="px-6 py-3 border-t border-[#E8E4DE] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#F2EFE9] hover:bg-[#E8E4DE] text-[#2D2A26]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
