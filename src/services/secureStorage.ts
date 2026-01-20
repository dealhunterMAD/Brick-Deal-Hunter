// ============================================
// BRICK DEAL HUNTER - SECURE STORAGE SERVICE
// ============================================
// Uses expo-secure-store to securely store sensitive data
// like API keys with encryption on device.

import * as SecureStore from 'expo-secure-store';

/**
 * Keys for secure storage
 * These are the identifiers used to store/retrieve values
 */
export const SECURE_KEYS = {
  REBRICKABLE_API_KEY: 'rebrickable_api_key',
  BRICKLINK_CONSUMER_KEY: 'bricklink_consumer_key',
  BRICKLINK_CONSUMER_SECRET: 'bricklink_consumer_secret',
  BRICKLINK_TOKEN_VALUE: 'bricklink_token_value',
  BRICKLINK_TOKEN_SECRET: 'bricklink_token_secret',
} as const;

type SecureKey = typeof SECURE_KEYS[keyof typeof SECURE_KEYS];

/**
 * Save a value securely
 * @param key - The key identifier
 * @param value - The value to store
 */
export async function saveSecurely(key: SecureKey, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Failed to save ${key} securely:`, error);
    throw new Error('Failed to save data securely');
  }
}

/**
 * Retrieve a securely stored value
 * @param key - The key identifier
 * @returns The stored value or null if not found
 */
export async function getSecurely(key: SecureKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Failed to retrieve ${key}:`, error);
    return null;
  }
}

/**
 * Delete a securely stored value
 * @param key - The key identifier
 */
export async function deleteSecurely(key: SecureKey): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Failed to delete ${key}:`, error);
  }
}

/**
 * Check if a secure value exists
 * @param key - The key identifier
 * @returns true if the value exists
 */
export async function hasSecureValue(key: SecureKey): Promise<boolean> {
  const value = await getSecurely(key);
  return value !== null && value.length > 0;
}

// ===== API KEY HELPERS =====

/**
 * Save Rebrickable API key
 */
export async function saveRebrickableKey(apiKey: string): Promise<void> {
  await saveSecurely(SECURE_KEYS.REBRICKABLE_API_KEY, apiKey);
}

/**
 * Get Rebrickable API key
 */
export async function getRebrickableKey(): Promise<string | null> {
  return getSecurely(SECURE_KEYS.REBRICKABLE_API_KEY);
}

/**
 * Check if Rebrickable API key is set
 */
export async function hasRebrickableKey(): Promise<boolean> {
  return hasSecureValue(SECURE_KEYS.REBRICKABLE_API_KEY);
}

/**
 * Save all BrickLink API credentials
 */
export async function saveBrickLinkCredentials(credentials: {
  consumerKey: string;
  consumerSecret: string;
  tokenValue: string;
  tokenSecret: string;
}): Promise<void> {
  await Promise.all([
    saveSecurely(SECURE_KEYS.BRICKLINK_CONSUMER_KEY, credentials.consumerKey),
    saveSecurely(SECURE_KEYS.BRICKLINK_CONSUMER_SECRET, credentials.consumerSecret),
    saveSecurely(SECURE_KEYS.BRICKLINK_TOKEN_VALUE, credentials.tokenValue),
    saveSecurely(SECURE_KEYS.BRICKLINK_TOKEN_SECRET, credentials.tokenSecret),
  ]);
}

/**
 * Get all BrickLink API credentials
 */
export async function getBrickLinkCredentials(): Promise<{
  consumerKey: string | null;
  consumerSecret: string | null;
  tokenValue: string | null;
  tokenSecret: string | null;
}> {
  const [consumerKey, consumerSecret, tokenValue, tokenSecret] = await Promise.all([
    getSecurely(SECURE_KEYS.BRICKLINK_CONSUMER_KEY),
    getSecurely(SECURE_KEYS.BRICKLINK_CONSUMER_SECRET),
    getSecurely(SECURE_KEYS.BRICKLINK_TOKEN_VALUE),
    getSecurely(SECURE_KEYS.BRICKLINK_TOKEN_SECRET),
  ]);
  return { consumerKey, consumerSecret, tokenValue, tokenSecret };
}

/**
 * Check if all BrickLink credentials are set
 */
export async function hasBrickLinkCredentials(): Promise<boolean> {
  const creds = await getBrickLinkCredentials();
  return (
    creds.consumerKey !== null &&
    creds.consumerSecret !== null &&
    creds.tokenValue !== null &&
    creds.tokenSecret !== null
  );
}

/**
 * Clear all stored API keys
 */
export async function clearAllApiKeys(): Promise<void> {
  await Promise.all([
    deleteSecurely(SECURE_KEYS.REBRICKABLE_API_KEY),
    deleteSecurely(SECURE_KEYS.BRICKLINK_CONSUMER_KEY),
    deleteSecurely(SECURE_KEYS.BRICKLINK_CONSUMER_SECRET),
    deleteSecurely(SECURE_KEYS.BRICKLINK_TOKEN_VALUE),
    deleteSecurely(SECURE_KEYS.BRICKLINK_TOKEN_SECRET),
  ]);
}
