// ============================================
// BRICK DEAL HUNTER - MAIN APP FILE
// ============================================
// This is the entry point of the application.
// It sets up fonts, splash screen, and navigation.

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';

import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/constants/colors';
import { initializeFirebase, isFirebaseConfigured } from './src/services/firebaseService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Main App Component
 */
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  // Initialize app
  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Firebase if configured
        if (isFirebaseConfigured()) {
          initializeFirebase();
        }

        // Add any other initialization here
        // For example: load cached data, check auth status, etc.

        // Artificial delay to show splash screen (optional)
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn('App initialization error:', error);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Hide splash screen when ready
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  // Show nothing while loading
  if (!appIsReady || !fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.legoRed}
      />
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
