import { Task, AppSettings } from '../types';
import { getInitialTasks } from '../data/initialTasks';

const TASKS_STORAGE_KEY = 'days_since_tracker_tasks_v1';
const SETTINGS_STORAGE_KEY = 'days_since_tracker_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  sortBy: 'days-desc',
  soundEnabled: true,
  allowNotifications: true,
  quietHoursEnabled: false,
  quietHoursFrom: '22:00',
  quietHoursTo: '08:00'
};

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      const defaults = getInitialTasks();
      saveTasksToStorage(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse stored tasks:', err);
  }
  const defaults = getInitialTasks();
  saveTasksToStorage(defaults);
  return defaults;
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function resetTasksToDefault(): Task[] {
  const defaults = getInitialTasks();
  saveTasksToStorage(defaults);
  return defaults;
}
