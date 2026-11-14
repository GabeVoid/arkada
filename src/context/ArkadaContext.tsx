import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import {
  AppScreen,
  ArkadaSettings,
  BrushingSlotConfig,
  DailyProgress,
  DayOfWeekStatus,
  OralHealthTip,
  StreakData
} from '../types';
import { getRandomTip } from '../data/tips';
import {
  applyThemeToDOM,
  DEFAULT_SETTINGS,
  DEFAULT_STREAK,
  getOrCreateTodayProgress,
  getWeekDaysStatus,
  loadAndVerifyStreak,
  loadDailyHistory,
  loadSettings,
  recordBrushingSession,
  saveSettings,
  syncTodayGoalWithSettings,
  toggleSlotCompletionToday,
  toLocalDateKey
} from '../services/storage';
import {
  getDuePendingBrushingsCount,
  requestNotificationPermission,
  scheduleTestNotification,
  syncAppIconBadge,
  syncDailyReminders
} from '../services/notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { triggerCompletionHaptic, triggerQuadrantHaptic } from '../services/haptics';

export interface ArkadaStoreValue {
  isLoading: boolean;
  screen: AppScreen;
  settings: ArkadaSettings;
  streak: StreakData;
  todayProgress: DailyProgress;
  weekDays: DayOfWeekStatus[];
  currentTip: OralHealthTip;
  activeSessionSlotIndex: number | undefined;
  lastSessionGoalJustMet: boolean;
  toastMessage: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
  navigateTo: (targetScreen: AppScreen) => void;
  refreshTip: () => void;
  acceptDisclaimer: () => Promise<void>;
  completeOnboarding: (dailyGoal: number, scheduledSlots: BrushingSlotConfig[]) => Promise<void>;
  updateSettings: (partial: Partial<ArkadaSettings>) => Promise<void>;
  resetCyclicalReminder: (type: 'toothbrush' | 'dentist', customDateKey?: string) => Promise<void>;
  startBrushingSession: (slotIndex?: number) => void;
  finishBrushingSession: (
    durationSeconds: number,
    usedFloss: boolean,
    usedMouthwash: boolean
  ) => Promise<void>;
  toggleBrushingSlotToday: (slotIndex: number) => Promise<void>;
  triggerTestNotification: () => Promise<void>;
}

export const ArkadaContext = createContext<ArkadaStoreValue | undefined>(undefined);

export const ArkadaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [screen, setScreen] = useState<AppScreen>('home');
  const [settings, setSettings] = useState<ArkadaSettings>(DEFAULT_SETTINGS);
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [history, setHistory] = useState<Record<string, DailyProgress>>({});
  const [currentTip, setCurrentTip] = useState<OralHealthTip>(() => getRandomTip());
  const [activeSessionSlotIndex, setActiveSessionSlotIndex] = useState<number | undefined>(
    undefined
  );
  const [lastSessionGoalJustMet, setLastSessionGoalJustMet] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const refreshTip = useCallback(() => {
    setCurrentTip((prev) => getRandomTip(prev.id));
  }, []);

  const hydrateState = useCallback(async (rotateTip: boolean = false) => {
    const [loadedSettings, loadedHistory, verifiedStreak] = await Promise.all([
      loadSettings(),
      loadDailyHistory(),
      loadAndVerifyStreak()
    ]);

    applyThemeToDOM(loadedSettings.themeMode, loadedSettings.colorTheme);
    setSettings(loadedSettings);
    setHistory(loadedHistory);
    setStreak(verifiedStreak);

    if (rotateTip) {
      setCurrentTip((prev) => getRandomTip(prev.id));
    }

    setIsLoading((prevLoading) => {
      if (prevLoading) {
        setScreen(loadedSettings.onboardingCompleted ? 'home' : 'onboarding');
      }
      return false;
    });
  }, []);

  useEffect(() => {
    void hydrateState(false);
  }, [hydrateState]);

  // Keep DOM theme synced when settings change or system color-scheme media query toggles
  useEffect(() => {
    applyThemeToDOM(settings.themeMode, settings.colorTheme);

    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.themeMode === 'system') {
        applyThemeToDOM('system', settings.colorTheme);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [settings.themeMode, settings.colorTheme]);

  // Listen to Capacitor appStateChange (resume) and browser visibilitychange to refresh streak & tip
  useEffect(() => {
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    const setupAppListener = async () => {
      try {
        listenerHandle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            void hydrateState(true);
          }
        });
      } catch {
        // Fallback when running in pure web browser
      }
    };

    void setupAppListener();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void hydrateState(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (listenerHandle) {
        void listenerHandle.remove();
      }
    };
  }, [hydrateState]);

  const navigateTo = useCallback((targetScreen: AppScreen) => {
    if (targetScreen === 'home') {
      setCurrentTip((prev) => getRandomTip(prev.id));
      void loadAndVerifyStreak().then(setStreak);
    }
    setScreen(targetScreen);
  }, []);

  const completeOnboarding = useCallback(
    async (dailyGoal: number, scheduledSlots: BrushingSlotConfig[]) => {
      const scheduledTimes = scheduledSlots.map((s) => s.time);
      const updatedSettings: ArkadaSettings = {
        ...settings,
        onboardingCompleted: true,
        disclaimerAccepted: true,
        dailyGoal,
        scheduledSlots,
        scheduledTimes,
        mouthwashEnabled: scheduledSlots.some((s) => s.mouthwash),
        notificationsEnabled: true
      };

      await saveSettings(updatedSettings);
      setSettings(updatedSettings);

      await requestNotificationPermission();
      await syncDailyReminders(scheduledTimes, true, updatedSettings.cyclicalReminders);

      setCurrentTip((prev) => getRandomTip(prev.id));
      setScreen('home');
    },
    [settings]
  );

  const acceptDisclaimer = useCallback(async () => {
    const nextSettings: ArkadaSettings = {
      ...settings,
      disclaimerAccepted: true
    };
    await saveSettings(nextSettings);
    setSettings(nextSettings);
  }, [settings]);

  const updateSettings = useCallback(
    async (partial: Partial<ArkadaSettings>) => {
      const nextSlots = partial.scheduledSlots ?? settings.scheduledSlots;
      const nextTimes = nextSlots.map((s) => s.time);

      const nextSettings: ArkadaSettings = {
        ...settings,
        ...partial,
        scheduledSlots: nextSlots,
        scheduledTimes: nextTimes,
        mouthwashEnabled: nextSlots.some((s) => s.mouthwash)
      };

      await saveSettings(nextSettings);
      setSettings(nextSettings);

      const scheduleChanged =
        partial.dailyGoal !== undefined ||
        partial.scheduledSlots !== undefined ||
        partial.scheduledTimes !== undefined ||
        partial.notificationsEnabled !== undefined ||
        partial.cyclicalReminders !== undefined;

      if (scheduleChanged) {
        await syncDailyReminders(
          nextSettings.scheduledTimes,
          nextSettings.notificationsEnabled,
          nextSettings.cyclicalReminders
        );
      }

      if (partial.dailyGoal !== undefined && partial.dailyGoal !== settings.dailyGoal) {
        const synced = await syncTodayGoalWithSettings(nextSettings.dailyGoal);
        setHistory(synced.history);
        setStreak(synced.streak);
      }
    },
    [settings]
  );

  const resetCyclicalReminder = useCallback(
    async (type: 'toothbrush' | 'dentist', customDateKey?: string) => {
      const targetDate = customDateKey ?? toLocalDateKey(new Date());
      const nextCyclical = {
        ...settings.cyclicalReminders,
        [type]: {
          ...settings.cyclicalReminders[type],
          lastDate: targetDate
        }
      };

      const nextSettings: ArkadaSettings = {
        ...settings,
        cyclicalReminders: nextCyclical
      };

      await saveSettings(nextSettings);
      setSettings(nextSettings);
      await syncDailyReminders(
        nextSettings.scheduledTimes,
        nextSettings.notificationsEnabled,
        nextCyclical
      );

      void triggerQuadrantHaptic();
      if (type === 'toothbrush') {
        setToastMessage(
          `Troca de escova registrada! Próximo lembrete em ${nextCyclical.toothbrush.intervalDays} dias.`
        );
      } else {
        setToastMessage(
          `Consulta/limpeza registrada! Próximo lembrete em ${nextCyclical.dentist.intervalMonths} ${
            nextCyclical.dentist.intervalMonths === 1 ? 'mês' : 'meses'
          }.`
        );
      }
    },
    [settings]
  );

  const startBrushingSession = useCallback((slotIndex?: number) => {
    setActiveSessionSlotIndex(slotIndex);
    setLastSessionGoalJustMet(false);
    setScreen('session');
  }, []);

  const finishBrushingSession = useCallback(
    async (durationSeconds: number, usedFloss: boolean, usedMouthwash: boolean) => {
      const result = await recordBrushingSession({
        slotIndex: activeSessionSlotIndex,
        durationSeconds,
        usedFloss,
        usedMouthwash,
        settings
      });

      setHistory(result.history);
      setStreak(result.streak);
      setLastSessionGoalJustMet(result.goalJustMet);
    },
    [activeSessionSlotIndex, settings]
  );

  const toggleBrushingSlotToday = useCallback(
    async (slotIndex: number) => {
      const result = await toggleSlotCompletionToday(slotIndex, settings);
      setHistory(result.history);
      setStreak(result.streak);
      setLastSessionGoalJustMet(result.goalJustMet);

      if (result.isNowCompleted) {
        if (result.goalJustMet) {
          void triggerCompletionHaptic();
          setToastMessage(
            `Escovação ${slotIndex + 1} concluída! Meta diária batida (${result.streak.currentStreak} ${
              result.streak.currentStreak === 1 ? 'dia' : 'dias'
            } de sequência)!`
          );
        } else {
          void triggerQuadrantHaptic();
          setToastMessage(`Escovação ${slotIndex + 1} concluída.`);
        }
      } else {
        void triggerQuadrantHaptic();
        setToastMessage(`Escovação ${slotIndex + 1} desmarcada.`);
      }
    },
    [settings]
  );

  const triggerTestNotification = useCallback(async () => {
    setToastMessage('Notificação agendada! Ela será exibida em 3 segundos...');
    await scheduleTestNotification((fallbackMsg) => {
      setToastMessage(fallbackMsg);
    });
  }, []);

  const todayProgress = useMemo(
    () => getOrCreateTodayProgress(history, settings.dailyGoal),
    [history, settings.dailyGoal]
  );

  const weekDays = useMemo(
    () => getWeekDaysStatus(history, streak, settings.dailyGoal),
    [history, streak, settings.dailyGoal]
  );

  // Sync the app icon badge whenever settings/todayProgress change, on minute ticks, or when a notification arrives
  useEffect(() => {
    if (isLoading) return;

    const updateBadge = () => {
      const dueCount = getDuePendingBrushingsCount(settings, todayProgress);
      void syncAppIconBadge(dueCount);
    };

    updateBadge();

    const intervalId = window.setInterval(updateBadge, 30000);
    let notifHandle: { remove: () => Promise<void> } | null = null;

    void LocalNotifications.addListener('localNotificationReceived', () => {
      updateBadge();
    })
      .then((handle) => {
        notifHandle = handle;
      })
      .catch(() => {
        // Ignore on pure web
      });

    return () => {
      window.clearInterval(intervalId);
      if (notifHandle) {
        void notifHandle.remove();
      }
    };
  }, [isLoading, settings, todayProgress]);

  const value = useMemo<ArkadaStoreValue>(
    () => ({
      isLoading,
      screen,
      settings,
      streak,
      todayProgress,
      weekDays,
      currentTip,
      activeSessionSlotIndex,
      lastSessionGoalJustMet,
      toastMessage,
      showToast,
      clearToast,
      navigateTo,
      refreshTip,
      acceptDisclaimer,
      completeOnboarding,
      updateSettings,
      resetCyclicalReminder,
      startBrushingSession,
      finishBrushingSession,
      toggleBrushingSlotToday,
      triggerTestNotification
    }),
    [
      isLoading,
      screen,
      settings,
      streak,
      todayProgress,
      weekDays,
      currentTip,
      activeSessionSlotIndex,
      lastSessionGoalJustMet,
      toastMessage,
      showToast,
      clearToast,
      navigateTo,
      refreshTip,
      acceptDisclaimer,
      completeOnboarding,
      updateSettings,
      resetCyclicalReminder,
      startBrushingSession,
      finishBrushingSession,
      toggleBrushingSlotToday,
      triggerTestNotification
    ]
  );

  return <ArkadaContext.Provider value={value}>{children}</ArkadaContext.Provider>;
};
