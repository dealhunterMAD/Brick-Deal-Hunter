// ============================================
// APP NAVIGATOR
// ============================================
// Sets up the navigation structure for the app.
// Uses React Navigation with a stack navigator.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Bell, Settings } from 'lucide-react-native';

import { RootStackParamList, MainTabParamList } from '../types';
import { COLORS } from '../constants/colors';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { SetDetailScreen } from '../screens/SetDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main tab navigator (Home, Alerts, Settings)
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.legoRed,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopColor: COLORS.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Deals',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsPlaceholder}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => (
            <Bell size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Placeholder for Alerts screen
 */
function AlertsPlaceholder() {
  const { View, Text, StyleSheet } = require('react-native');
  const { SafeAreaView } = require('react-native-safe-area-context');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ backgroundColor: COLORS.legoRed, padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF' }}>
          Alerts
        </Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Bell size={64} color={COLORS.textTertiary} />
        <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16 }}>
          No Alerts Yet
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }}>
          Watch sets in the deals list to get notified when prices drop.
        </Text>
      </View>
    </SafeAreaView>
  );
}

/**
 * Root stack navigator
 */
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="SetDetail"
          component={SetDetailScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
