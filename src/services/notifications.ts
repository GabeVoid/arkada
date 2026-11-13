import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { ArkadaSettings, DailyProgress } from '../types';

const DAILY_NOTIFICATION_BASE_ID = 1000;
const TEST_NOTIFICATION_ID = 9999;
const REMINDER_CHANNEL_ID = 'arkada_reminders';

/**
 * Ensures the Android notification channel exists with high importance
 * so launcher notification dots / small badges appear on the app icon.
 */
async function ensureReminderChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Lembretes de Escovação',
      description: 'Alertas nos horários programados da sua rotina de higiene bucal',
      importance: 4,
      visibility: 1,
      vibration: true
    });
  } catch {
    // Ignore if channel creation is unsupported on current platform
  }
}

/**
 * Requests permission for LocalNotifications on Android / Browser.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await ensureReminderChannel();
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        return true;
      }
      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted';
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
  } catch {
    // Safe fallback if running in an environment without notification permissions
  }
  return false;
}

/**
 * Cancels all previously scheduled daily reminders in LocalNotifications.
 */
export async function cancelAllScheduledReminders(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id }))
      });
    }
  } catch {
    // Safe fallback on web if LocalNotifications pending fails
  }
}

/**
 * Cancels old reminders and schedules recurring daily notifications at the exact times configured by the user.
 */
export async function syncDailyReminders(
  scheduledTimes: string[],
  enabled: boolean
): Promise<boolean> {
  await cancelAllScheduledReminders();

  if (!enabled || scheduledTimes.length === 0) {
    return false;
  }

  const hasPermission = await requestNotificationPermission();
  await ensureReminderChannel();

  try {
    const notifications = scheduledTimes.map((timeStr, idx) => {
      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = Number.parseInt(hourStr ?? '8', 10);
      const minute = Number.parseInt(minuteStr ?? '0', 10);

      return {
        id: DAILY_NOTIFICATION_BASE_ID + idx + 1,
        title: `Hora da Escovação ${idx + 1} • Arkada`,
        body: 'Você tem uma escovação pendente! Cuide do seu sorriso para manter sua sequência.',
        channelId: REMINDER_CHANNEL_ID,
        schedule: {
          on: {
            hour: Number.isNaN(hour) ? 8 : hour,
            minute: Number.isNaN(minute) ? 0 : minute
          },
          repeats: true,
          allowWhileIdle: true
        }
      };
    });

    await LocalNotifications.schedule({ notifications });
    return hasPermission;
  } catch {
    return hasPermission;
  }
}

/**
 * Calculates how many scheduled brushings for today have already reached their time
 * (current local HH:MM >= slot.time) and have not yet been completed.
 */
export function getDuePendingBrushingsCount(
  settings: ArkadaSettings,
  todayProgress: DailyProgress,
  now: Date = new Date()
): number {
  if (!settings.onboardingCompleted) return 0;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let duePendingCount = 0;

  settings.scheduledSlots.forEach((slot, index) => {
    const isCompleted = todayProgress.completedSlots.includes(index);
    if (isCompleted) return;

    const [hStr, mStr] = slot.time.split(':');
    const h = Number.parseInt(hStr ?? '0', 10);
    const m = Number.parseInt(mStr ?? '0', 10);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      const slotMinutes = h * 60 + m;
      if (currentMinutes >= slotMinutes) {
        duePendingCount += 1;
      }
    }
  });

  return duePendingCount;
}

/**
 * Updates the small badge on the app icon based on how many due brushings are currently pending.
 * When duePendingCount reaches 0, clears the badge and removes delivered notifications so the
 * Android launcher dot disappears immediately.
 */
export async function syncAppIconBadge(duePendingCount: number): Promise<void> {
  try {
    if (duePendingCount > 0) {
      await Badge.set({ count: duePendingCount });
    } else {
      await Badge.clear();
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.removeAllDeliveredNotifications();
      }
    }
  } catch {
    // Fallback to Web Badging API if available
    try {
      const nav = navigator as Navigator & {
        setAppBadge?: (count?: number) => Promise<void>;
        clearAppBadge?: () => Promise<void>;
      };
      if (duePendingCount > 0 && typeof nav.setAppBadge === 'function') {
        await nav.setAppBadge(duePendingCount);
      } else if (duePendingCount === 0 && typeof nav.clearAppBadge === 'function') {
        await nav.clearAppBadge();
      }
    } catch {
      // Ignore if neither native nor web badging is supported
    }
  }
}

/**
 * Fires a test notification in 3 seconds to validate device delivery.
 * Works both on Android via Capacitor LocalNotifications and in web browsers.
 */
export async function scheduleTestNotification(
  onWebFallback?: (message: string) => void
): Promise<boolean> {
  await requestNotificationPermission();
  await ensureReminderChannel();

  const triggerDate = new Date(Date.now() + 3000);

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TEST_NOTIFICATION_ID,
          title: 'Arkada • Teste de Lembrete',
          body: 'Suas notificações de higiene bucal estão funcionando perfeitamente!',
          channelId: REMINDER_CHANNEL_ID,
          schedule: {
            at: triggerDate,
            allowWhileIdle: true
          }
        }
      ]
    });

    if (!Capacitor.isNativePlatform()) {
      setTimeout(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Arkada • Teste de Lembrete', {
              body: 'Suas notificações de higiene bucal estão funcionando perfeitamente!',
              icon: '/icon.png'
            });
          } catch {
            // Ignore browser Notification constructor errors
          }
        }
        onWebFallback?.('Notificação de teste disparada! ("Arkada • Teste de Lembrete")');
      }, 3000);
    }

    return true;
  } catch {
    setTimeout(() => {
      onWebFallback?.('Notificação de teste disparada! ("Arkada • Teste de Lembrete")');
    }, 3000);
    return true;
  }
}
