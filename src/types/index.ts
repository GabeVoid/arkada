export type AppScreen = 'onboarding' | 'home' | 'session' | 'settings';

export type SessionStep = 'floss' | 'brush' | 'mouthwash' | 'completed';

export type BrushingDurationSeconds = 120 | 180 | 240 | 300;

export type QuadrantId =
  | 'upper-right'
  | 'upper-left'
  | 'lower-left'
  | 'lower-right'
  | 'tongue';

export interface QuadrantInfo {
  id: QuadrantId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface BrushingSlotConfig {
  time: string; // e.g., "08:00"
  floss: boolean; // whether to use dental floss in this brushing
  mouthwash: boolean; // whether to use mouthwash in this brushing
}

export interface ArkadaSettings {
  onboardingCompleted: boolean;
  dailyGoal: number; // 1 to 5, default 3
  scheduledTimes: string[]; // kept in sync with scheduledSlots.map(s => s.time)
  scheduledSlots: BrushingSlotConfig[]; // per-brushing configuration (time, floss, mouthwash)
  brushingDuration: BrushingDurationSeconds; // 120 to 300 (2 to 5 min), default 180 (3 min)
  mouthwashEnabled: boolean; // legacy fallback
  notificationsEnabled: boolean; // default true
}

export interface BrushingSessionLog {
  id: string;
  timestamp: string; // ISO string
  dateKey: string; // YYYY-MM-DD in local timezone
  slotIndex?: number; // 0-based index of scheduled slot if applicable
  durationSeconds: number;
  usedFloss?: boolean;
  usedMouthwash: boolean;
  manualCheck?: boolean; // true when marked manually in the daily list
}

export interface DailyProgress {
  dateKey: string; // YYYY-MM-DD
  completedCount: number;
  goalAtTheTime: number;
  goalMet: boolean;
  completedSlots: number[]; // indices of scheduled slots completed today
  sessions: BrushingSessionLog[];
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastGoalMetDate: string | null; // YYYY-MM-DD when 100% daily goal was met
  completedDates: Record<string, boolean>; // YYYY-MM-DD -> true if 100% goal met on that day
}

export interface DayOfWeekStatus {
  dayLabel: string; // Seg, Ter, Qua, Qui, Sex, Sáb, Dom
  dateKey: string; // YYYY-MM-DD
  isToday: boolean;
  isFuture: boolean;
  completed: boolean; // 100% goal met on that day
  partial: boolean; // Some brushings done today, but not 100% yet
}

export interface OralHealthTip {
  id: number;
  category: string;
  title: string;
  content: string;
}
