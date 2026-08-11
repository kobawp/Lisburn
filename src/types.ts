export type IconName = 
  | 'Droplets'
  | 'Car'
  | 'Sparkles'
  | 'Smile'
  | 'Filter'
  | 'Wrench'
  | 'Heart'
  | 'Clock'
  | 'Calendar'
  | 'Scissors'
  | 'CheckCircle2'
  | 'Laptop'
  | 'Dog'
  | 'Shield'
  | 'Flame'
  | 'Sun'
  | 'Book'
  | 'Activity';

export type TaskColor = 'emerald' | 'sky' | 'amber' | 'rose' | 'indigo' | 'violet' | 'slate';

export interface CompletionEntry {
  id: string;
  timestamp: string; // ISO String
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon: IconName | string;
  lastCompletedAt: string | null; // ISO String or null for no date recorded
  reminderIntervalHours: number | null; // null means no reminder
  history: CompletionEntry[];
  createdAt: string; // ISO String
  color?: TaskColor;
}

export type SortOption = 'days-desc' | 'days-asc' | 'status' | 'title' | 'recently-reset';

export type StatusFilter = 'all' | 'overdue' | 'due-soon' | 'fresh' | 'no-reminder';

export interface AppSettings {
  sortBy: SortOption;
  soundEnabled: boolean;
  allowNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom: string;
  quietHoursTo: string;
}
