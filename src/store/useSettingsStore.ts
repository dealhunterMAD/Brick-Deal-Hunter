// ============================================
// BRICK DEAL HUNTER - SETTINGS STORE
// ============================================
// Zustand store for app settings and preferences.
// NOTE: API keys are NOT stored here - they use SecureStore
// for encrypted storage. See services/secureStorage.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, NotificationSettings, SortOption } from '../types';

/**
 * State shape for the settings store
 * NOTE: API keys are handled separately via SecureStore
 */
interface SettingsState extends AppSettings {
  // ===== ACTIONS =====
  /** Update notification settings */
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  /** Toggle notifications on/off */
  toggleNotifications: () => void;
  /** Set minimum discount threshold for notifications */
  setNotificationThreshold: (threshold: number) => void;
  /** Add a theme to watched themes */
  addWatchedTheme: (themeId: number) => void;
  /** Remove a theme from watched themes */
  removeWatchedTheme: (themeId: number) => void;
  /** Add a set to watched sets */
  addWatchedSet: (setNumber: string) => void;
  /** Remove a set from watched sets */
  removeWatchedSet: (setNumber: string) => void;
  /** Mark onboarding as complete */
  completeOnboarding: () => void;
  /** Set default sort option */
  setDefaultSort: (sort: SortOption) => void;
  /** Set color scheme preference */
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
  /** Reset all settings to defaults */
  resetSettings: () => void;
}

/**
 * Default settings
 * NOTE: API keys are NOT included - they use SecureStore
 */
const defaultSettings: AppSettings = {
  notifications: {
    enabled: true,
    minDiscountThreshold: 20, // Notify for 20%+ off by default
    watchedThemes: [],
    watchedSets: [],
    quietHoursStart: null,
    quietHoursEnd: null,
  },
  hasCompletedOnboarding: false,
  defaultSort: 'discount_high',
  colorScheme: 'system',
};

/**
 * The settings store with persistence
 *
 * This store is special because it uses `persist` middleware.
 * That means it will automatically save to AsyncStorage
 * and restore when the app reopens.
 *
 * SECURITY NOTE: API keys are NOT stored here.
 * Use the secureStorage service for API keys.
 *
 * Usage:
 * const notifications = useSettingsStore((state) => state.notifications);
 * const toggleNotifications = useSettingsStore((state) => state.toggleNotifications);
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setNotificationSettings: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),

      toggleNotifications: () =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            enabled: !state.notifications.enabled,
          },
        })),

      setNotificationThreshold: (threshold) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            minDiscountThreshold: Math.max(0, Math.min(100, threshold)),
          },
        })),

      addWatchedTheme: (themeId) =>
        set((state) => {
          if (state.notifications.watchedThemes.includes(themeId)) {
            return state;
          }
          return {
            notifications: {
              ...state.notifications,
              watchedThemes: [...state.notifications.watchedThemes, themeId],
            },
          };
        }),

      removeWatchedTheme: (themeId) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            watchedThemes: state.notifications.watchedThemes.filter(
              (id) => id !== themeId
            ),
          },
        })),

      addWatchedSet: (setNumber) =>
        set((state) => {
          if (state.notifications.watchedSets.includes(setNumber)) {
            return state;
          }
          return {
            notifications: {
              ...state.notifications,
              watchedSets: [...state.notifications.watchedSets, setNumber],
            },
          };
        }),

      removeWatchedSet: (setNumber) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            watchedSets: state.notifications.watchedSets.filter(
              (num) => num !== setNumber
            ),
          },
        })),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setDefaultSort: (sort) => set({ defaultSort: sort }),

      setColorScheme: (scheme) => set({ colorScheme: scheme }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'brick-deal-hunter-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist specific fields (NOT API keys - those use SecureStore)
      partialize: (state) => ({
        notifications: state.notifications,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        defaultSort: state.defaultSort,
        colorScheme: state.colorScheme,
      }),
    }
  )
);

// ===== SELECTORS =====
// NOTE: API key checks have been moved to services/secureStorage.ts
// Use hasRebrickableKey() and hasBrickLinkCredentials() from there

/**
 * Check if a specific set is being watched
 */
export function useIsSetWatched(setNumber: string): boolean {
  return useSettingsStore((state) =>
    state.notifications.watchedSets.includes(setNumber)
  );
}

/**
 * Check if a theme is being watched
 */
export function useIsThemeWatched(themeId: number): boolean {
  return useSettingsStore((state) =>
    state.notifications.watchedThemes.includes(themeId)
  );
}
