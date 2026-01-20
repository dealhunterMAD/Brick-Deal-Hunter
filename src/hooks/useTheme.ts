// ============================================
// THEME HOOK
// ============================================
// Provides the correct colors based on the user's
// color scheme preference (light, dark, or system).

import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { LIGHT_COLORS, DARK_COLORS, ThemeColors } from '../constants/colors';

/**
 * Hook to get the current theme colors based on user preference
 * @returns The current theme colors object
 */
export function useThemeColors(): ThemeColors {
  const colorScheme = useSettingsStore((state) => state.colorScheme);
  const systemColorScheme = useColorScheme();

  // Determine which theme to use
  if (colorScheme === 'dark') {
    return DARK_COLORS;
  } else if (colorScheme === 'light') {
    return LIGHT_COLORS;
  } else {
    // 'system' - follow device setting
    return systemColorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  }
}

/**
 * Hook to check if dark mode is currently active
 * @returns True if dark mode is active
 */
export function useIsDarkMode(): boolean {
  const colorScheme = useSettingsStore((state) => state.colorScheme);
  const systemColorScheme = useColorScheme();

  if (colorScheme === 'dark') {
    return true;
  } else if (colorScheme === 'light') {
    return false;
  } else {
    return systemColorScheme === 'dark';
  }
}
