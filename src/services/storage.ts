import { Preferences } from '@capacitor/preferences';
import {
  ArkadaSettings,
  BrushingDurationSeconds,
  BrushingSessionLog,
  BrushingSlotConfig,
  DailyProgress,
  DayOfWeekStatus,
  MouthwashDurationSeconds,
  StreakData
} from '../types';

const KEYS = {
  SETTINGS: 'arkada_settings_v1',
  STREAK: 'arkada_streak_v1',
  DAILY_HISTORY: 'arkada_daily_history_v1'
};

export const DEFAULT_SCHEDULE_BY_COUNT: Record<number, string[]> = {
  1: ['22:00'],
  2: ['08:00', '22:00'],
  3: ['08:00', '13:30', '22:00'],
  4: ['07:30', '12:30', '18:00', '22:30'],
  5: ['07:00', '10:30', '13:30', '18:30', '22:30']
};

export const DEFAULT_SLOTS_THREE: BrushingSlotConfig[] = [
  { time: '08:00', floss: true, mouthwash: false },
  { time: '13:30', floss: false, mouthwash: false },
  { time: '22:00', floss: true, mouthwash: true }
];

export const DEFAULT_SETTINGS: ArkadaSettings = {
  onboardingCompleted: false,
  disclaimerAccepted: false,
  dailyGoal: 3,
  scheduledTimes: ['08:00', '13:30', '22:00'],
  scheduledSlots: DEFAULT_SLOTS_THREE,
  brushingDuration: 180,
  mouthwashDuration: 30,
  mouthwashEnabled: false,
  notificationsEnabled: true
};

export const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  bestStreak: 0,
  lastGoalMetDate: null,
  completedDates: {}
};

/**
 * Formats a Date object as YYYY-MM-DD in local time.
 */
export function toLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the YYYY-MM-DD string for yesterday in local time.
 */
export function getYesterdayDateKey(baseDate: Date = new Date()): string {
  const copy = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  copy.setDate(copy.getDate() - 1);
  return toLocalDateKey(copy);
}

/**
 * Generates default schedule times when changing daily goal count,
 * preserving already customized slots where possible.
 */
export function adjustScheduledTimes(currentTimes: string[], newCount: number): string[] {
  const clamped = Math.max(1, Math.min(5, newCount));
  const defaults = DEFAULT_SCHEDULE_BY_COUNT[clamped] || DEFAULT_SCHEDULE_BY_COUNT[3];
  if (currentTimes.length === clamped) {
    return [...currentTimes];
  }
  if (clamped < currentTimes.length) {
    return currentTimes.slice(0, clamped);
  }
  const result = [...currentTimes];
  for (let i = currentTimes.length; i < clamped; i++) {
    result.push(defaults[i] || '22:00');
  }
  return result;
}

/**
 * Adjusts per-brushing slot configurations (time, floss, mouthwash) when changing dailyGoal count,
 * preserving existing user customizations.
 */
export function adjustScheduledSlots(
  currentSlots: BrushingSlotConfig[],
  newCount: number
): BrushingSlotConfig[] {
  const clamped = Math.max(1, Math.min(5, newCount));
  const defaults = DEFAULT_SCHEDULE_BY_COUNT[clamped] || DEFAULT_SCHEDULE_BY_COUNT[3];

  if (currentSlots.length === clamped) {
    return currentSlots.map((slot) => ({ ...slot }));
  }
  if (clamped < currentSlots.length) {
    return currentSlots.slice(0, clamped).map((slot) => ({ ...slot }));
  }

  const result = currentSlots.map((slot) => ({ ...slot }));
  for (let i = currentSlots.length; i < clamped; i++) {
    const isLastSlot = i === clamped - 1;
    result.push({
      time: defaults[i] || '22:00',
      floss: isLastSlot,
      mouthwash: false
    });
  }
  return result;
}

async function setItem<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
  } catch {
    // Ignore localStorage quota errors
  }
  try {
    await Preferences.set({ key, value: serialized });
  } catch {
    // Fallback if Capacitor Preferences plugin is unavailable
  }
}

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    if (value) {
      localStorage.setItem(key, value);
      return JSON.parse(value) as T;
    }
  } catch {
    // Ignore Capacitor error and fall back to localStorage
  }

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // Ignore JSON parse error
  }

  return fallback;
}

export async function loadSettings(): Promise<ArkadaSettings> {
  const saved = await getItem<Partial<ArkadaSettings>>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  const dailyGoal = Math.max(1, Math.min(5, saved.dailyGoal ?? DEFAULT_SETTINGS.dailyGoal));

  const fallbackTimes = adjustScheduledTimes(
    saved.scheduledTimes ?? DEFAULT_SETTINGS.scheduledTimes,
    dailyGoal
  );

  let scheduledSlots: BrushingSlotConfig[];
  if (Array.isArray(saved.scheduledSlots) && saved.scheduledSlots.length > 0) {
    const normalized = saved.scheduledSlots.map((s, idx) => ({
      time: s?.time || fallbackTimes[idx] || '08:00',
      floss: typeof s?.floss === 'boolean' ? s.floss : true,
      mouthwash:
        typeof s?.mouthwash === 'boolean'
          ? s.mouthwash
          : Boolean(saved.mouthwashEnabled)
    }));
    scheduledSlots = adjustScheduledSlots(normalized, dailyGoal);
  } else {
    scheduledSlots = fallbackTimes.map((time, idx) => ({
      time,
      floss: idx === 0 || idx === fallbackTimes.length - 1,
      mouthwash: Boolean(saved.mouthwashEnabled)
    }));
  }

  const scheduledTimes = scheduledSlots.map((s) => s.time);

  const validDurations: BrushingDurationSeconds[] = [120, 180, 240, 300];
  const brushingDuration: BrushingDurationSeconds = validDurations.includes(
    saved.brushingDuration as BrushingDurationSeconds
  )
    ? (saved.brushingDuration as BrushingDurationSeconds)
    : 180;

  const validMouthwashDurations: MouthwashDurationSeconds[] = [30, 35, 40, 45, 50, 55, 60];
  const mouthwashDuration: MouthwashDurationSeconds = validMouthwashDurations.includes(
    saved.mouthwashDuration as MouthwashDurationSeconds
  )
    ? (saved.mouthwashDuration as MouthwashDurationSeconds)
    : 30;

  return {
    onboardingCompleted: Boolean(saved.onboardingCompleted),
    disclaimerAccepted: Boolean(saved.disclaimerAccepted),
    dailyGoal,
    scheduledTimes,
    scheduledSlots,
    brushingDuration,
    mouthwashDuration,
    mouthwashEnabled: scheduledSlots.some((s) => s.mouthwash),
    notificationsEnabled: saved.notificationsEnabled ?? true
  };
}

export async function saveSettings(settings: ArkadaSettings): Promise<void> {
  const syncedTimes = settings.scheduledSlots.map((s) => s.time);
  await setItem(KEYS.SETTINGS, {
    ...settings,
    scheduledTimes: syncedTimes,
    mouthwashEnabled: settings.scheduledSlots.some((s) => s.mouthwash)
  });
}

export async function loadDailyHistory(): Promise<Record<string, DailyProgress>> {
  return await getItem<Record<string, DailyProgress>>(KEYS.DAILY_HISTORY, {});
}

export async function saveDailyHistory(history: Record<string, DailyProgress>): Promise<void> {
  await setItem(KEYS.DAILY_HISTORY, history);
}

/**
 * Validates and reconciles streak on app initialization or day rollover:
 * "Ao inicializar o app ou virar o dia, verificar a data do último dia em que a meta foi 100% batida:
 *  se não foi hoje nem ontem, o contador de streak é resetado para 0."
 */
export function verifyAndNormalizeStreak(streak: StreakData, now: Date = new Date()): StreakData {
  const todayKey = toLocalDateKey(now);
  const yesterdayKey = getYesterdayDateKey(now);

  const normalized: StreakData = {
    currentStreak: streak.currentStreak ?? 0,
    bestStreak: streak.bestStreak ?? 0,
    lastGoalMetDate: streak.lastGoalMetDate ?? null,
    completedDates: { ...(streak.completedDates ?? {}) }
  };

  if (
    normalized.lastGoalMetDate !== todayKey &&
    normalized.lastGoalMetDate !== yesterdayKey
  ) {
    normalized.currentStreak = 0;
  }

  return normalized;
}

export async function loadAndVerifyStreak(now: Date = new Date()): Promise<StreakData> {
  const raw = await getItem<StreakData>(KEYS.STREAK, DEFAULT_STREAK);
  const verified = verifyAndNormalizeStreak(raw, now);
  if (verified.currentStreak !== raw.currentStreak) {
    await setItem(KEYS.STREAK, verified);
  }
  return verified;
}

export async function saveStreak(streak: StreakData): Promise<void> {
  await setItem(KEYS.STREAK, streak);
}

export function getOrCreateTodayProgress(
  history: Record<string, DailyProgress>,
  dailyGoal: number,
  now: Date = new Date()
): DailyProgress {
  const todayKey = toLocalDateKey(now);
  const existing = history[todayKey];
  if (existing) {
    return {
      ...existing,
      completedSlots: Array.isArray(existing.completedSlots) ? existing.completedSlots : [],
      sessions: Array.isArray(existing.sessions) ? existing.sessions : []
    };
  }
  return {
    dateKey: todayKey,
    completedCount: 0,
    goalAtTheTime: dailyGoal,
    goalMet: false,
    completedSlots: [],
    sessions: []
  };
}

/**
 * Records a completed brushing session and updates streak if 100% of daily goal is met.
 */
export async function recordBrushingSession(params: {
  slotIndex?: number;
  durationSeconds: number;
  usedFloss?: boolean;
  usedMouthwash: boolean;
  manualCheck?: boolean;
  settings: ArkadaSettings;
  now?: Date;
}): Promise<{
  history: Record<string, DailyProgress>;
  todayProgress: DailyProgress;
  streak: StreakData;
  goalJustMet: boolean;
}> {
  const now = params.now ?? new Date();
  const todayKey = toLocalDateKey(now);
  const yesterdayKey = getYesterdayDateKey(now);

  const history = await loadDailyHistory();
  const currentStreakData = await loadAndVerifyStreak(now);
  const todayProgress = getOrCreateTodayProgress(history, params.settings.dailyGoal, now);

  // Determine which slot to mark completed if not explicitly passed
  let targetSlot = params.slotIndex;
  if (targetSlot === undefined) {
    for (let i = 0; i < params.settings.dailyGoal; i++) {
      if (!todayProgress.completedSlots.includes(i)) {
        targetSlot = i;
        break;
      }
    }
  }

  const slotCfg =
    targetSlot !== undefined ? params.settings.scheduledSlots[targetSlot] : undefined;

  const sessionLog: BrushingSessionLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    dateKey: todayKey,
    slotIndex: targetSlot,
    durationSeconds: params.durationSeconds,
    usedFloss: params.usedFloss ?? slotCfg?.floss ?? true,
    usedMouthwash: params.usedMouthwash,
    manualCheck: Boolean(params.manualCheck)
  };

  const updatedSlots =
    targetSlot !== undefined && !todayProgress.completedSlots.includes(targetSlot)
      ? [...todayProgress.completedSlots, targetSlot].sort((a, b) => a - b)
      : [...todayProgress.completedSlots];

  const newCompletedCount = todayProgress.completedCount + 1;
  const goalMetNow = newCompletedCount >= params.settings.dailyGoal;
  const wasAlreadyMetToday =
    Boolean(currentStreakData.completedDates[todayKey]) ||
    currentStreakData.lastGoalMetDate === todayKey;

  let updatedStreak = { ...currentStreakData };
  let goalJustMet = false;

  if (goalMetNow && !wasAlreadyMetToday) {
    const baseStreak =
      currentStreakData.lastGoalMetDate === yesterdayKey ? currentStreakData.currentStreak : 0;
    const nextStreak = baseStreak + 1;
    updatedStreak = {
      currentStreak: nextStreak,
      bestStreak: Math.max(currentStreakData.bestStreak, nextStreak),
      lastGoalMetDate: todayKey,
      completedDates: {
        ...currentStreakData.completedDates,
        [todayKey]: true
      }
    };
    goalJustMet = true;
  }

  const updatedToday: DailyProgress = {
    dateKey: todayKey,
    completedCount: newCompletedCount,
    goalAtTheTime: params.settings.dailyGoal,
    goalMet: goalMetNow || wasAlreadyMetToday,
    completedSlots: updatedSlots,
    sessions: [...todayProgress.sessions, sessionLog]
  };

  const updatedHistory: Record<string, DailyProgress> = {
    ...history,
    [todayKey]: updatedToday
  };

  await saveDailyHistory(updatedHistory);
  await saveStreak(updatedStreak);

  return {
    history: updatedHistory,
    todayProgress: updatedToday,
    streak: updatedStreak,
    goalJustMet
  };
}

/**
 * Allows the user to manually mark or unmark a brushing slot as completed for today
 * (until the end of the day) directly from the Home brushing list.
 */
export async function toggleSlotCompletionToday(
  slotIndex: number,
  settings: ArkadaSettings,
  now: Date = new Date()
): Promise<{
  history: Record<string, DailyProgress>;
  todayProgress: DailyProgress;
  streak: StreakData;
  isNowCompleted: boolean;
  goalJustMet: boolean;
}> {
  const todayKey = toLocalDateKey(now);
  const yesterdayKey = getYesterdayDateKey(now);

  const history = await loadDailyHistory();
  const currentStreakData = await loadAndVerifyStreak(now);
  const todayProgress = getOrCreateTodayProgress(history, settings.dailyGoal, now);

  const alreadyCompleted = todayProgress.completedSlots.includes(slotIndex);

  if (!alreadyCompleted) {
    const slotCfg = settings.scheduledSlots[slotIndex];
    const result = await recordBrushingSession({
      slotIndex,
      durationSeconds: settings.brushingDuration,
      usedFloss: slotCfg?.floss ?? true,
      usedMouthwash: slotCfg?.mouthwash ?? false,
      manualCheck: true,
      settings,
      now
    });
    return {
      ...result,
      isNowCompleted: true
    };
  }

  // Unmark slot if user tapped to undo today's completion
  const updatedSlots = todayProgress.completedSlots.filter((idx) => idx !== slotIndex);

  const remainingSessions = [...todayProgress.sessions];
  for (let i = remainingSessions.length - 1; i >= 0; i--) {
    if (remainingSessions[i].slotIndex === slotIndex) {
      remainingSessions.splice(i, 1);
      break;
    }
  }

  const newCompletedCount = Math.max(updatedSlots.length, remainingSessions.length);
  const goalMetNow = newCompletedCount >= settings.dailyGoal;
  const wasMetToday =
    Boolean(currentStreakData.completedDates[todayKey]) ||
    currentStreakData.lastGoalMetDate === todayKey;

  let updatedStreak = { ...currentStreakData };

  if (!goalMetNow && wasMetToday) {
    const restCompleted = { ...currentStreakData.completedDates };
    delete restCompleted[todayKey];
    const hadYesterday = Boolean(restCompleted[yesterdayKey]);
    updatedStreak = {
      currentStreak: Math.max(0, currentStreakData.currentStreak - 1),
      bestStreak: currentStreakData.bestStreak,
      lastGoalMetDate: hadYesterday ? yesterdayKey : null,
      completedDates: restCompleted
    };
  }

  const updatedToday: DailyProgress = {
    dateKey: todayKey,
    completedCount: newCompletedCount,
    goalAtTheTime: settings.dailyGoal,
    goalMet: goalMetNow,
    completedSlots: updatedSlots,
    sessions: remainingSessions
  };

  const updatedHistory: Record<string, DailyProgress> = {
    ...history,
    [todayKey]: updatedToday
  };

  await saveDailyHistory(updatedHistory);
  await saveStreak(updatedStreak);

  return {
    history: updatedHistory,
    todayProgress: updatedToday,
    streak: updatedStreak,
    isNowCompleted: false,
    goalJustMet: false
  };
}

/**
 * Updates today's dailyGoal in history when changed in Settings, without erasing previous days.
 */
export async function syncTodayGoalWithSettings(
  newDailyGoal: number,
  now: Date = new Date()
): Promise<{
  history: Record<string, DailyProgress>;
  streak: StreakData;
}> {
  const todayKey = toLocalDateKey(now);
  const yesterdayKey = getYesterdayDateKey(now);
  const history = await loadDailyHistory();
  let streak = await loadAndVerifyStreak(now);

  const today = getOrCreateTodayProgress(history, newDailyGoal, now);
  const trimmedSlots = today.completedSlots.filter((idx) => idx < newDailyGoal);
  const goalMetNow = today.completedCount >= newDailyGoal;
  const wasMetToday =
    Boolean(streak.completedDates[todayKey]) || streak.lastGoalMetDate === todayKey;

  if (goalMetNow && !wasMetToday) {
    const baseStreak = streak.lastGoalMetDate === yesterdayKey ? streak.currentStreak : 0;
    const nextStreak = baseStreak + 1;
    streak = {
      currentStreak: nextStreak,
      bestStreak: Math.max(streak.bestStreak, nextStreak),
      lastGoalMetDate: todayKey,
      completedDates: {
        ...streak.completedDates,
        [todayKey]: true
      }
    };
  } else if (!goalMetNow && wasMetToday) {
    const restCompleted = { ...streak.completedDates };
    delete restCompleted[todayKey];
    const hadYesterday = Boolean(restCompleted[yesterdayKey]);
    streak = {
      currentStreak: Math.max(0, streak.currentStreak - 1),
      bestStreak: streak.bestStreak,
      lastGoalMetDate: hadYesterday ? yesterdayKey : null,
      completedDates: restCompleted
    };
  }

  const updatedToday: DailyProgress = {
    ...today,
    goalAtTheTime: newDailyGoal,
    goalMet: goalMetNow,
    completedSlots: trimmedSlots
  };

  const updatedHistory: Record<string, DailyProgress> = {
    ...history,
    [todayKey]: updatedToday
  };

  await saveDailyHistory(updatedHistory);
  await saveStreak(streak);

  return { history: updatedHistory, streak };
}

/**
 * Builds the 7-day status bar (Seg a Dom) for the current week.
 */
export function getWeekDaysStatus(
  history: Record<string, DailyProgress>,
  streak: StreakData,
  dailyGoal: number,
  now: Date = new Date()
): DayOfWeekStatus[] {
  const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const todayKey = toLocalDateKey(now);

  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);

  return labels.map((dayLabel, index) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const dateKey = toLocalDateKey(d);
    const isToday = dateKey === todayKey;
    const isFuture = dateKey > todayKey;
    const dayRecord = history[dateKey];

    const completed =
      Boolean(streak.completedDates[dateKey]) ||
      Boolean(dayRecord && dayRecord.completedCount >= (isToday ? dailyGoal : dayRecord.goalAtTheTime));

    const partial =
      !completed && Boolean(dayRecord && dayRecord.completedCount > 0);

    return {
      dayLabel,
      dateKey,
      isToday,
      isFuture,
      completed,
      partial
    };
  });
}
