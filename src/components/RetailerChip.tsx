// ============================================
// RETAILER CHIP COMPONENT
// ============================================
// A small chip/tag showing which retailer has the deal.
// Shows the retailer name with their brand color.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RetailerId } from '../types';
import { RETAILERS } from '../constants/retailers';
import { COLORS } from '../constants/colors';

/**
 * Props for the RetailerChip component
 */
interface RetailerChipProps {
  /** The retailer ID */
  retailerId: RetailerId;
  /** Whether the chip is selected (for filters) */
  selected?: boolean;
  /** Callback when chip is pressed */
  onPress?: () => void;
  /** Size variant */
  size?: 'small' | 'medium';
  /** Show as outline style instead of filled */
  outline?: boolean;
}

/**
 * RetailerChip - Shows retailer name with brand color
 *
 * Usage:
 * <RetailerChip retailerId="amazon" />
 * <RetailerChip retailerId="walmart" selected onPress={() => {}} />
 */
export function RetailerChip({
  retailerId,
  selected = false,
  onPress,
  size = 'medium',
  outline = false,
}: RetailerChipProps) {
  const retailer = RETAILERS[retailerId];

  if (!retailer) {
    return null;
  }

  const isSmall = size === 'small';
  const isPressable = !!onPress;

  // Determine styles based on props
  const containerStyle = [
    styles.container,
    isSmall ? styles.containerSmall : styles.containerMedium,
    outline
      ? [styles.outline, { borderColor: retailer.color }]
      : selected
      ? { backgroundColor: retailer.color }
      : styles.default,
    isPressable && styles.pressable,
  ];

  const textStyle = [
    styles.text,
    isSmall ? styles.textSmall : styles.textMedium,
    outline
      ? { color: retailer.color }
      : selected
      ? styles.textSelected
      : styles.textDefault,
  ];

  const content = (
    <>
      {/* Color dot indicator */}
      {!selected && !outline && (
        <View style={[styles.dot, { backgroundColor: retailer.color }]} />
      )}
      <Text style={textStyle}>{retailer.name}</Text>
    </>
  );

  if (isPressable) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...containerStyle,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${retailer.name}${selected ? ', selected' : ''}`}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  containerMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  default: {
    backgroundColor: COLORS.surfaceLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  pressable: {
    // Makes it obvious it's tappable
  },
  pressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontWeight: '500',
  },
  textSmall: {
    fontSize: 11,
  },
  textMedium: {
    fontSize: 13,
  },
  textDefault: {
    color: COLORS.textPrimary,
  },
  textSelected: {
    color: '#FFFFFF',
  },
});

export default RetailerChip;
