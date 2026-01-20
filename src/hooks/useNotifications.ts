// ============================================
// USE NOTIFICATIONS HOOK
// ============================================
// React hook for managing push notifications.
// Handles setup, permissions, and event listeners.

import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  requestNotificationPermissions,
  checkNotificationPermissions,
  getExpoPushToken,
  registerPushToken,
  updateNotificationPreferences,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  clearBadgeCount,
  NotificationData,
  isPhysicalDevice,
} from '../services/notificationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UseNotificationsResult {
  /** Whether notifications are enabled and permissions granted */
  isEnabled: boolean;
  /** Whether we're currently setting up notifications */
  isLoading: boolean;
  /** The push token for this device */
  pushToken: string | null;
  /** Any error that occurred during setup */
  error: string | null;
  /** Request notification permissions */
  requestPermissions: () => Promise<boolean>;
  /** Refresh the push token */
  refreshToken: () => Promise<void>;
}

/**
 * Hook for managing push notifications
 */
export function useNotifications(): UseNotificationsResult {
  const navigation = useNavigation<NavigationProp>();

  // State
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings from store
  const notifications = useSettingsStore((state) => state.notifications);

  // Refs for listeners
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  /**
   * Handle notification tap - navigate to relevant screen
   */
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;

      // Clear badge when user interacts with notification
      clearBadgeCount();

      // Navigate based on notification type
      if (data.setNumber) {
        navigation.navigate('SetDetail', { setNumber: data.setNumber });
      }
    },
    [navigation]
  );

  /**
   * Handle notification received while app is in foreground
   */
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      console.log('Notification received:', notification.request.content.title);
      // Could show an in-app banner here
    },
    []
  );

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isPhysicalDevice()) {
      setError('Push notifications require a physical device');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const granted = await requestNotificationPermissions();
      setIsEnabled(granted);

      if (granted) {
        // Get and register push token
        const token = await getExpoPushToken();
        if (token) {
          setPushToken(token);
          await registerPushToken(token, {
            notificationsEnabled: notifications.enabled,
            minDiscountThreshold: notifications.minDiscountThreshold,
            watchedThemes: notifications.watchedThemes,
            watchedSets: notifications.watchedSets,
          });
        }
      }

      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permissions';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  /**
   * Refresh the push token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    if (!isPhysicalDevice()) return;

    try {
      const token = await getExpoPushToken();
      if (token) {
        setPushToken(token);
        await updateNotificationPreferences(token, {
          notificationsEnabled: notifications.enabled,
          minDiscountThreshold: notifications.minDiscountThreshold,
          watchedThemes: notifications.watchedThemes,
          watchedSets: notifications.watchedSets,
        });
      }
    } catch (err) {
      console.error('Failed to refresh token:', err);
    }
  }, [notifications]);

  // Check initial permission status
  useEffect(() => {
    async function checkStatus() {
      setIsLoading(true);
      try {
        const hasPermission = await checkNotificationPermissions();
        setIsEnabled(hasPermission);

        if (hasPermission && isPhysicalDevice()) {
          const token = await getExpoPushToken();
          setPushToken(token);
        }
      } catch (err) {
        console.error('Failed to check notification status:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkStatus();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications received while app is open
    notificationListener.current = addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listen for notification taps
    responseListener.current = addNotificationResponseListener(
      handleNotificationResponse
    );

    // Check if app was opened from a notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  // Update preferences when settings change
  useEffect(() => {
    if (pushToken && isEnabled) {
      updateNotificationPreferences(pushToken, {
        notificationsEnabled: notifications.enabled,
        minDiscountThreshold: notifications.minDiscountThreshold,
        watchedThemes: notifications.watchedThemes,
        watchedSets: notifications.watchedSets,
      });
    }
  }, [
    pushToken,
    isEnabled,
    notifications.enabled,
    notifications.minDiscountThreshold,
    notifications.watchedThemes,
    notifications.watchedSets,
  ]);

  // Clear badge when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        clearBadgeCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    isEnabled,
    isLoading,
    pushToken,
    error,
    requestPermissions,
    refreshToken,
  };
}

/**
 * Hook to check if notifications are set up (for use in settings)
 */
export function useNotificationStatus(): {
  isEnabled: boolean;
  isPhysicalDevice: boolean;
} {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkNotificationPermissions().then(setIsEnabled);
  }, []);

  return {
    isEnabled,
    isPhysicalDevice: isPhysicalDevice(),
  };
}
