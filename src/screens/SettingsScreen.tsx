// ============================================
// SETTINGS SCREEN
// ============================================
// App settings and configuration including:
// - Notification preferences
// - Theme/display settings
// - About/help

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Palette,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';

import { COLORS } from '../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * SettingsScreen - App configuration
 */
export function SettingsScreen() {
  // Settings store
  const {
    notifications,
    colorScheme,
    toggleNotifications,
    setNotificationThreshold,
    setColorScheme,
  } = useSettingsStore();

  /**
   * Open external link
   */
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={COLORS.legoRed} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.card}>
            {/* Enable notifications toggle */}
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Deal Alerts</Text>
                <Text style={styles.settingDescription}>
                  Get notified about new deals
                </Text>
              </View>
              <Switch
                value={notifications.enabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.legoRed }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Threshold slider */}
            {notifications.enabled && (
              <View style={styles.thresholdSection}>
                <Text style={styles.settingLabel}>
                  Minimum Discount: {notifications.minDiscountThreshold}%
                </Text>
                <Text style={styles.settingDescription}>
                  Only notify for deals {notifications.minDiscountThreshold}% off or more
                </Text>
                {/* Note: Slider would go here - using buttons for simplicity */}
                <View style={styles.thresholdButtons}>
                  {[10, 20, 30, 40, 50].map((threshold) => (
                    <Pressable
                      key={threshold}
                      style={[
                        styles.thresholdButton,
                        notifications.minDiscountThreshold === threshold &&
                          styles.thresholdButtonActive,
                      ]}
                      onPress={() => setNotificationThreshold(threshold)}
                    >
                      <Text
                        style={[
                          styles.thresholdButtonText,
                          notifications.minDiscountThreshold === threshold &&
                            styles.thresholdButtonTextActive,
                        ]}
                      >
                        {threshold}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={COLORS.legoRed} />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.settingLabel}>Theme</Text>
            <View style={styles.themeButtons}>
              {(['light', 'dark', 'system'] as const).map((theme) => (
                <Pressable
                  key={theme}
                  style={[
                    styles.themeButton,
                    colorScheme === theme && styles.themeButtonActive,
                  ]}
                  onPress={() => setColorScheme(theme)}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      colorScheme === theme && styles.themeButtonTextActive,
                    ]}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Help & About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={20} color={COLORS.legoRed} />
            <Text style={styles.sectionTitle}>Help & About</Text>
          </View>

          <View style={styles.card}>
            <Pressable
              style={styles.linkRow}
              onPress={() => openLink('https://rebrickable.com/api/')}
            >
              <Text style={styles.linkRowText}>Rebrickable API Docs</Text>
              <ChevronRight size={20} color={COLORS.textTertiary} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.linkRow}
              onPress={() => openLink('https://www.bricklink.com/v3/api.page')}
            >
              <Text style={styles.linkRowText}>BrickLink API Docs</Text>
              <ChevronRight size={20} color={COLORS.textTertiary} />
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Brick Deal Hunter</Text>
          <Text style={styles.footerSubtext}>
            Made with bricks and code
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.legoRed,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  thresholdSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  thresholdButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  thresholdButtonActive: {
    backgroundColor: COLORS.legoRed,
  },
  thresholdButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  thresholdButtonTextActive: {
    color: '#FFFFFF',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  themeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: COLORS.legoRed,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  themeButtonTextActive: {
    color: '#FFFFFF',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  linkRowText: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  aboutLabel: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  aboutValue: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
});

export default SettingsScreen;
