// ============================================
// LOADING SKELETON COMPONENT
// ============================================
// Animated placeholder that shows while content loads.
// Creates a "shimmer" effect like many popular apps.

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Props for the LoadingSkeleton component
 */
interface LoadingSkeletonProps {
  /** Width of the skeleton (number or percentage string) */
  width?: number | string;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Custom style */
  style?: object;
}

/**
 * LoadingSkeleton - Animated loading placeholder
 *
 * Usage:
 * <LoadingSkeleton width={200} height={20} />
 * <LoadingSkeleton width="100%" height={100} borderRadius={12} />
 */
export function LoadingSkeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: LoadingSkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create looping shimmer animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  // Interpolate opacity for shimmer effect
  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Pre-built skeleton for a deal card
 */
export function DealCardSkeleton() {
  return (
    <View style={styles.dealCard}>
      {/* Image placeholder */}
      <LoadingSkeleton width={100} height={100} borderRadius={8} />

      {/* Content area */}
      <View style={styles.dealCardContent}>
        {/* Title */}
        <LoadingSkeleton width="80%" height={18} style={styles.marginBottom} />
        {/* Set number */}
        <LoadingSkeleton width="40%" height={14} style={styles.marginBottom} />
        {/* Price row */}
        <View style={styles.priceRow}>
          <LoadingSkeleton width={60} height={24} />
          <LoadingSkeleton width={50} height={16} />
        </View>
        {/* Retailer chip */}
        <LoadingSkeleton width={80} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

/**
 * Pre-built skeleton for a list of deal cards
 */
export function DealListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <DealCardSkeleton key={index} />
      ))}
    </View>
  );
}

/**
 * Pre-built skeleton for the set detail header
 */
export function SetDetailSkeleton() {
  return (
    <View style={styles.setDetail}>
      {/* Hero image */}
      <LoadingSkeleton width="100%" height={250} borderRadius={0} />

      {/* Content */}
      <View style={styles.setDetailContent}>
        {/* Title */}
        <LoadingSkeleton width="90%" height={28} style={styles.marginBottom} />
        {/* Set info row */}
        <View style={styles.infoRow}>
          <LoadingSkeleton width={80} height={16} />
          <LoadingSkeleton width={100} height={16} />
          <LoadingSkeleton width={60} height={16} />
        </View>
        {/* Price section */}
        <LoadingSkeleton width="100%" height={80} borderRadius={12} style={styles.marginTop} />
        {/* Retailer prices */}
        <LoadingSkeleton width="100%" height={60} borderRadius={12} style={styles.marginTop} />
        <LoadingSkeleton width="100%" height={60} borderRadius={12} style={styles.marginTop} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.skeletonBase,
  },
  dealCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealCardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  marginBottom: {
    marginBottom: 8,
  },
  marginTop: {
    marginTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  list: {
    padding: 16,
  },
  setDetail: {
    flex: 1,
  },
  setDetailContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
});

export default LoadingSkeleton;
