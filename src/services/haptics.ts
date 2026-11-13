import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Triggers a light tactile feedback on quadrant change or UI interaction.
 * Safely falls back to navigator.vibrate or no-op in desktop/mobile browsers.
 */
export async function triggerQuadrantHaptic(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  } catch {
    // Safe fallback if haptics API is unavailable
  }
}

/**
 * Triggers a completion vibration when brushing timer reaches 00:00 or session finishes.
 */
export async function triggerCompletionHaptic(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 50, 120]);
    }
  } catch {
    // Safe fallback if haptics API is unavailable
  }
}

