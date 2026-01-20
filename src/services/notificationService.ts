// ============================================
// NOTIFICATION SERVICE
// ============================================
// Handles push notifications for deal alerts.
// Uses Expo Notifications + Firebase Cloud Messaging.
//
// Features:
// - Request notification permissions
// - Register for push notifications
// - Handle incoming notifications
// - Schedule local notifications
// - Send push tokens to backend

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// ============================================
// TYPES
// ============================================

export interface NotificationData {
  type: 'deal_alert' | 'price_drop' | 'back_in_stock' | 'general';
  setNumber?: string;
  setName?: string;
  retailer?: string;
  percentOff?: number;
  currentPrice?: number;
  url?: string;
}

export interface PushTokenData {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
  lastUpdated: Date;
  notificationsEnabled: boolean;
  minDiscountThreshold: number;
  watchedThemes: number[];
  watchedSets: string[];
}

// ============================================
// NOTIFICATION CONFIGURATION
// ============================================

/**
 * Configure how notifications are handled when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// PERMISSION HANDLING
// ============================================

/**
 * Request notification permissions from the user
 * @returns True if permissions were granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Must be a physical device for push notifications
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Android requires notification channel
  if (Platform.OS === 'android') {
    await setupAndroidNotificationChannel();
  }

  return true;
}

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ============================================
// ANDROID NOTIFICATION CHANNEL
// ============================================

/**
 * Set up Android notification channel for deal alerts
 */
async function setupAndroidNotificationChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync('deal-alerts', {
    name: 'Deal Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D91F2A', // LEGO red
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });

  await Notifications.setNotificationChannelAsync('price-drops', {
    name: 'Price Drops',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#22C55E', // Green
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
  });

  await Notifications.setNotificationChannelAsync('back-in-stock', {
    name: 'Back In Stock',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

// ============================================
// PUSH TOKEN MANAGEMENT
// ============================================

/**
 * Get the Expo push token for this device
 * @returns The push token or null if unavailable
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push tokens require a physical device');
    return null;
  }

  try {
    // Get project ID from Expo config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('No EAS project ID found. Push notifications may not work.');
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Register the push token with Firebase
 * This allows the backend to send push notifications to this device
 */
export async function registerPushToken(
  token: string,
  settings: {
    notificationsEnabled: boolean;
    minDiscountThreshold: number;
    watchedThemes: number[];
    watchedSets: string[];
  }
): Promise<void> {
  try {
    const db = getFirestore();
    const deviceId = Constants.sessionId || 'unknown';

    const tokenData: PushTokenData = {
      token,
      platform: Platform.OS as 'ios' | 'android',
      deviceId,
      lastUpdated: new Date(),
      notificationsEnabled: settings.notificationsEnabled,
      minDiscountThreshold: settings.minDiscountThreshold,
      watchedThemes: settings.watchedThemes,
      watchedSets: settings.watchedSets,
    };

    // Store token in Firestore
    await setDoc(doc(db, 'push_tokens', token), {
      ...tokenData,
      lastUpdated: Timestamp.now(),
    });

    console.log('Push token registered successfully');
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}

/**
 * Update notification preferences for this device
 */
export async function updateNotificationPreferences(
  token: string,
  settings: {
    notificationsEnabled: boolean;
    minDiscountThreshold: number;
    watchedThemes: number[];
    watchedSets: string[];
  }
): Promise<void> {
  try {
    const db = getFirestore();

    await setDoc(
      doc(db, 'push_tokens', token),
      {
        notificationsEnabled: settings.notificationsEnabled,
        minDiscountThreshold: settings.minDiscountThreshold,
        watchedThemes: settings.watchedThemes,
        watchedSets: settings.watchedSets,
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );

    console.log('Notification preferences updated');
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
  }
}

// ============================================
// LOCAL NOTIFICATIONS
// ============================================

/**
 * Schedule a local notification for a deal alert
 */
export async function scheduleDealNotification(
  deal: {
    setName: string;
    setNumber: string;
    percentOff: number;
    currentPrice: number;
    retailer: string;
    url: string;
  },
  delaySeconds: number = 0
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 ${deal.percentOff}% Off - ${deal.setName}`,
        body: `Now $${deal.currentPrice.toFixed(2)} at ${formatRetailerName(deal.retailer)}. Tap to view deal!`,
        data: {
          type: 'deal_alert',
          setNumber: deal.setNumber,
          setName: deal.setName,
          retailer: deal.retailer,
          percentOff: deal.percentOff,
          currentPrice: deal.currentPrice,
          url: deal.url,
        } as NotificationData,
        sound: 'default',
        badge: 1,
        ...(Platform.OS === 'android' && {
          channelId: 'deal-alerts',
          color: '#D91F2A',
        }),
      },
      trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

/**
 * Schedule a price drop notification
 */
export async function schedulePriceDropNotification(
  setName: string,
  oldPrice: number,
  newPrice: number,
  retailer: string,
  setNumber: string
): Promise<string | null> {
  try {
    const savings = oldPrice - newPrice;
    const percentOff = Math.round((savings / oldPrice) * 100);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💰 Price Drop Alert!`,
        body: `${setName} dropped from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)} (${percentOff}% off) at ${formatRetailerName(retailer)}`,
        data: {
          type: 'price_drop',
          setNumber,
          setName,
          retailer,
          percentOff,
          currentPrice: newPrice,
        } as NotificationData,
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: 'price-drops',
          color: '#22C55E',
        }),
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule price drop notification:', error);
    return null;
  }
}

/**
 * Schedule a back in stock notification
 */
export async function scheduleBackInStockNotification(
  setName: string,
  retailer: string,
  setNumber: string,
  price: number
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📦 Back In Stock!`,
        body: `${setName} is now available at ${formatRetailerName(retailer)} for $${price.toFixed(2)}`,
        data: {
          type: 'back_in_stock',
          setNumber,
          setName,
          retailer,
          currentPrice: price,
        } as NotificationData,
        sound: 'default',
        ...(Platform.OS === 'android' && {
          channelId: 'back-in-stock',
        }),
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule back in stock notification:', error);
    return null;
  }
}

// ============================================
// NOTIFICATION LISTENERS
// ============================================

/**
 * Add a listener for when notifications are received while app is running
 * @returns Subscription that should be removed on cleanup
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when user taps on a notification
 * @returns Subscription that should be removed on cleanup
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the notification that was used to open the app (if any)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all pending scheduled notifications
 */
export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Clear the notification badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Set the notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format retailer ID to display name
 */
function formatRetailerName(retailerId: string): string {
  const names: Record<string, string> = {
    lego: 'LEGO.com',
    amazon: 'Amazon',
    walmart: 'Walmart',
    target: 'Target',
    best_buy: 'Best Buy',
    kohls: "Kohl's",
    barnes_noble: 'Barnes & Noble',
    sams_club: "Sam's Club",
    walgreens: 'Walgreens',
    gamestop: 'GameStop',
    shop_disney: 'shopDisney',
    macys: "Macy's",
  };

  return names[retailerId] || retailerId;
}

/**
 * Check if the app is running on a physical device
 */
export function isPhysicalDevice(): boolean {
  return Device.isDevice;
}

/**
 * Get device type description
 */
export function getDeviceType(): string {
  if (!Device.isDevice) {
    return 'Simulator/Emulator';
  }
  return `${Device.manufacturer || 'Unknown'} ${Device.modelName || 'Device'}`;
}
