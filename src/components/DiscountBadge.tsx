// ============================================
// DISCOUNT BADGE COMPONENT
// ============================================
// A colorful badge that shows the % off.
// Color changes based on how good the deal is:
// - Green: 20-39% off (good)
// - Darker green: 40-59% off (great)
// - Red: 60%+ off (amazing/clearance)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDiscountBadgeColor } from '../constants/colors';
import { formatPercent } from '../utils/formatters';

/**
 * Props for the DiscountBadge component
 */
interface DiscountBadgeProps {
  /** The discount percentage (0-100) */
  percentOff: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional custom style */
  style?: object;
}

/**
 * DiscountBadge - Shows discount percentage with color coding
 *
 * Usage:
 * <DiscountBadge percentOff={35} />
 * <DiscountBadge percentOff={75} size="large" />
 */
export function DiscountBadge({
  percentOff,
  size = 'medium',
  style,
}: DiscountBadgeProps) {
  // Don't show badge if no discount
  if (percentOff <= 0) {
    return null;
  }

  // Get the appropriate color based on discount level
  const backgroundColor = getDiscountBadgeColor(percentOff);

  // Size-based styles
  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
    },
  };

  return (
    <View
      style={[
        styles.container,
        sizeStyles[size].container,
        { backgroundColor },
        style,
      ]}
    >
      <Text style={[styles.text, sizeStyles[size].text]}>
        {formatPercent(percentOff)} OFF
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    alignSelf: 'flex-start',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  containerMedium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  containerLarge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 16,
  },
});

export default DiscountBadge;
